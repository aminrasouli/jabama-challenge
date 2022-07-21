import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as moment from 'moment';

export type TokenTypeLiteral = 'REFRESH' | 'ACCESS';

@Injectable()
export class TokensService {
  private logger: Logger = new Logger('TokensService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  getTokenSecret(token: TokenTypeLiteral): string {
    const secret = this.configService.get<string>(`${token}_TOKEN_SECRET`);
    if (!secret) throw new InternalServerErrorException('Secret Key Not Found');
    return secret;
  }

  getTokenExpiration(token: 'REFRESH' | 'ACCESS'): string | number {
    const expiration = this.configService.get<number | string>(
      `${token}_TOKEN_EXPIRATION`,
    );
    if (!expiration)
      throw new InternalServerErrorException('Token Expiration Not Found');
    return expiration;
  }

  async getTokenConfig(token: TokenTypeLiteral): Promise<{
    secret: string;
    expiresIn: string | number;
  }> {
    const secret = this.getTokenSecret(token);
    const expiration = this.getTokenExpiration(token);
    return { secret, expiresIn: expiration };
  }

  async createAccessToken(userId: number, email: string): Promise<string> {
    const type: TokenTypeLiteral = 'ACCESS';
    const { secret, expiresIn } = await this.getTokenConfig(type);
    const payload = {
      type,
      userId,
      email,
    };
    const token = this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
    this.logger.log(`Access Token Created for user ${email}`);
    return token;
  }

  async createRefreshToken(userId: number, email: string): Promise<string> {
    const type: TokenTypeLiteral = 'REFRESH';
    const { secret, expiresIn } = await this.getTokenConfig(type);
    const payload = {
      type,
      userId,
      email,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
    const expired = (expiresIn as string).split('');
    await this.prismaService.token.create({
      data: {
        token,
        type,
        expiresAt: moment()
          .add(
            expired[0] as moment.DurationInputArg1,
            expired[1] as moment.unitOfTime.DurationConstructor,
          )
          .toISOString(),
        user: {
          connect: { id: userId },
        },
      },
    });
    this.logger.log(`Refresh Token Created for user ${email}`);
    return token;
  }

  async createAccessTokenAndRefreshToken(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return {
      accessToken: await this.createAccessToken(userId, email),
      refreshToken: await this.createRefreshToken(userId, email),
    };
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
  ): Promise<string> {
    const type: TokenTypeLiteral = 'REFRESH';
    const secret = this.getTokenSecret(type);
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret,
      });
      const isTokenDeactivated = !(
        await this.prismaService.token.findUnique({
          where: { token: refreshToken },
        })
      ).isActive;
      if (isTokenDeactivated)
        throw new BadRequestException('Refresh Token is Deactivated');
      const { userId, email } = payload;
      return this.createAccessToken(userId, email);
    } catch (error) {
      throw new BadRequestException('Invalid Refresh Token');
    }
  }
}
