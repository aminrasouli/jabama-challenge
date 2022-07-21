import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import {
  GetNewAccessTokenInputDto,
  GetNewAccessTokenOutputDto,
  LoginUserInputDto,
  LoginUserOutputDto,
  RegisterUserInputDto,
} from '../dto/auth.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
