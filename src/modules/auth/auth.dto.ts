import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterUserInputDto {
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'the last name must only contain english characters',
  })
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;
}

export class LoginUserInputDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class GetNewAccessTokenInputDto {
  @IsString()
  refreshToken: string;
}

export class LoginUserOutputDto {
  accessToken: string;
  refreshToken: string;
}

export class GetNewAccessTokenOutputDto {
  accessToken: string;
}
