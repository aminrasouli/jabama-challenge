import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import {
  GetNewAccessTokenInputDto,
  GetNewAccessTokenOutputDto,
  LoginUserInputDto,
  LoginUserOutputDto,
  RegisterUserInputDto,
} from '../dto/auth.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getPayload(@Request() req): Promise<any> {
    return req.user;
  }

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserInputDto): Promise<void> {
    return this.authService.register(registerUserDto);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserInputDto,
  ): Promise<LoginUserOutputDto> {
    return this.authService.login(loginUserDto);
  }

  @Post('refresh')
  async refresh(
    @Body() getNewAccessTokenInputDto: GetNewAccessTokenInputDto,
  ): Promise<GetNewAccessTokenOutputDto> {
    console.log(getNewAccessTokenInputDto);
    return this.authService.refresh(getNewAccessTokenInputDto);
  }
}
