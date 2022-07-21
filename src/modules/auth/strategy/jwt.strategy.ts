import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { TokensService } from '../service/tokens.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly tokensService: TokensService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: tokensService.getTokenSecret('ACCESS'),
    });
  }

  async validate(payload: any) {
    const { userId, email } = payload;
    return { userId, email };
  }
}
