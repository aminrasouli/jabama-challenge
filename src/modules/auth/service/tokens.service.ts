import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

type TokenTypeLiteral = 'REFRESH' | 'ACCESS';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getTokenSecret(token: TokenTypeLiteral): Promise<string> {
    const secret = this.configService.get<string>(`${token}_TOKEN_SECRET`);
    if (!secret) throw new InternalServerErrorException('Secret Key Not Found');
    return secret;
  }

  async getTokenExpiration(
    token: 'REFRESH' | 'ACCESS',
  ): Promise<string | number> {
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
    const secret = await this.getTokenSecret(token);
    const expiration = await this.getTokenExpiration(token);
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
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async createRefreshToken(userId: number, email: string): Promise<string> {
    const type: TokenTypeLiteral = 'REFRESH';
    const { secret, expiresIn } = await this.getTokenConfig(type);
    const payload = {
      type,
      userId,
      email,
    };
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
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
    const secret = await this.getTokenSecret('REFRESH');
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret,
      });
      console.log(payload);
      const { userId, email } = payload;
      return this.createAccessToken(userId, email);
    } catch (error) {
      throw new BadRequestException('Invalid Refresh Token');
    }
  }
}
