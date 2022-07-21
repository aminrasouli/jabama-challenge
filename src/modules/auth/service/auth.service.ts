import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { HashPasswordService } from './hash-password.service';
import {
  GetNewAccessTokenInputDto,
  GetNewAccessTokenOutputDto,
  LoginUserInputDto,
  LoginUserOutputDto,
} from '../auth.dto';
import { TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger('AuthService');

  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashPasswordService: HashPasswordService,
    private readonly tokensService: TokensService,
  ) {}

  async register(registerUserDto: Prisma.UserCreateInput): Promise<void> {
    const { name, password, email } = registerUserDto;

    const isUserExist =
      (await this.prismaService.user.count({
        where: { email },
      })) > 0;

    if (isUserExist) throw new BadRequestException('User already exists');

    await this.prismaService.user.create({
      data: {
        name,
        password: await this.hashPasswordService.hash(password),
        email,
      },
    });

    this.logger.log(`User ${name} with email ${email} registered`);
  }

  async login(loginUserDto: LoginUserInputDto): Promise<LoginUserOutputDto> {
    const { email, password } = loginUserDto;
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user)
      throw new NotFoundException({
        error: 'email',
        message: 'Email Not Found',
      });

    const isPasswordValid = await this.hashPasswordService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid)
      throw new BadRequestException({
        error: 'password',
        message: 'Password is Incorrect',
      });

    // FIXME: check is user activated
    // if (!isUserActivated) {
    //   throw new BadRequestException({
    //     error: 'pending',
    //     message: 'User is still pending. Try to activate your account with confirmation email',
    //   });
    // }

    return this.tokensService.createAccessTokenAndRefreshToken(
      user.id,
      user.email,
    );
  }

  async refresh(
    getNewAccessTokenInputDto: GetNewAccessTokenInputDto,
  ): Promise<GetNewAccessTokenOutputDto> {
    const { refreshToken } = getNewAccessTokenInputDto;
    return {
      accessToken: await this.tokensService.createAccessTokenFromRefreshToken(
        refreshToken,
      ),
    };
  }
}
