import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { HashPasswordService } from './service/hash-password.service';
import { TokensService } from './service/tokens.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthService, HashPasswordService, TokensService],
  controllers: [AuthController],
})
export class AuthModule {}
