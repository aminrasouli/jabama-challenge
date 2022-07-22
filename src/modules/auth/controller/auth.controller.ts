import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import {
  ConfirmMailInputDto,
  GetNewAccessTokenInputDto,
  GetNewAccessTokenOutputDto,
  LoginUserInputDto,
  LoginUserOutputDto,
  RegisterUserInputDto,
} from '../dto/auth.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  @ApiOperation({ summary: 'get user info in payload' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPayload(@Request() req): Promise<any> {
    return req.user;
  }

  @Post('register')
  @ApiOperation({ summary: 'register new user' })
  async register(@Body() registerUserDto: RegisterUserInputDto): Promise<void> {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'login user' })
  async login(@Body() loginUserDto: LoginUserInputDto): Promise<LoginUserOutputDto> {
    return this.authService.login(loginUserDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'get new access token by refresh token' })
  async refresh(@Body() getNewAccessTokenInputDto: GetNewAccessTokenInputDto): Promise<GetNewAccessTokenOutputDto> {
    return this.authService.refresh(getNewAccessTokenInputDto);
  }

  @Get('confirm-mail/:token')
  @ApiOperation({ summary: 'confirm mail with token' })
  async confirmMail(@Param() confirmMailInputDto: ConfirmMailInputDto): Promise<void> {
    await this.authService.validateConfirmMailToken(confirmMailInputDto);
  }
}
