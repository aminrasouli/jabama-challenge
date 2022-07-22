import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { TokenType } from '@prisma/client';

export type TokenTypeLiteral = 'REFRESH' | 'ACCESS' | 'EMAIL_VERIFICATION';
export type JwtTokenTypeLiteral = Omit<TokenTypeLiteral, 'EMAIL_VERIFICATION'>;

@Injectable()
export class TokensService {
  private logger: Logger = new Logger(TokensService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  getTokenSecret(token: JwtTokenTypeLiteral): string {
    const secret = this.configService.get<string>(`${token}_TOKEN_SECRET`);
    if (!secret) throw new InternalServerErrorException('Secret Key Not Found');
    return secret;
  }

  getTokenExpiration(token: JwtTokenTypeLiteral): string | number {
    const expiration = this.configService.get<number | string>(`${token}_TOKEN_EXPIRATION`);
    if (!expiration) throw new InternalServerErrorException('Token Expiration Not Found');
    return expiration;
  }

  async getTokenConfig(token: JwtTokenTypeLiteral): Promise<{
    secret: string;
    expiresIn: string | number;
  }> {
    const secret = this.getTokenSecret(token);
    const expiration = this.getTokenExpiration(token);
    return { secret, expiresIn: expiration };
  }

  async createAccessToken(userId: number, email: string): Promise<string> {
    const type: JwtTokenTypeLiteral = 'ACCESS';
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
    const type: JwtTokenTypeLiteral = 'REFRESH';
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
        type: type as TokenType,
        token,
        expiresAt: moment()
          .add(expired[0] as moment.DurationInputArg1, expired[1] as moment.unitOfTime.DurationConstructor)
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

  async createAccessTokenFromRefreshToken(refreshToken: string): Promise<string> {
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
      if (isTokenDeactivated) throw new BadRequestException('Refresh Token is Deactivated');
      const { userId, email } = payload;
      this.logger.log(`Refresh Token Validated for user ${email} and Access Token was created`);
      return this.createAccessToken(userId, email);
    } catch (error) {
      throw new BadRequestException('Invalid Refresh Token');
    }
  }

  async createEmailVerificationToken(userId: number, email: string): Promise<string> {
    const token = uuidv4() as string;
    await this.prismaService.token.create({
      data: {
        type: 'EMAIL_VERIFICATION',
        token,
        expiresAt: moment().add('7', 'days').toISOString(),
        user: { connect: { id: userId } },
      },
    });
    this.logger.log(`Email Verification Token Created for user ${email}`);
    return token;
  }

  async validateEmailVerificationToken(token: string): Promise<boolean> {
    const type: TokenTypeLiteral = 'EMAIL_VERIFICATION';
    const tokenRecord = await this.prismaService.token.findFirst({
      where: {
        type,
        token,
      },
      include: { user: true },
    });

    if (!tokenRecord) throw new BadRequestException('Invalid Token');
    if (moment().isAfter(tokenRecord.expiresAt)) throw new BadRequestException('Token Expired');
    if (!tokenRecord.isActive) throw new BadRequestException('Token is Deactivated');
    if (tokenRecord.user.emailVerifiedAt) throw new BadRequestException('Email Already Verified');

    await Promise.all([
      this.prismaService.token.update({
        where: { id: tokenRecord.id },
        data: { isActive: false },
      }),
      this.prismaService.user.update({
        where: { id: tokenRecord.user.id },
        data: { emailVerifiedAt: moment().toISOString() },
      }),
    ]);
    this.logger.log(`Email Verification Token Validated for user ${tokenRecord.user.email}`);
    return true;
  }
}
