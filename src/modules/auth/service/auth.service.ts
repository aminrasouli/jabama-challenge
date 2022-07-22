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
  ConfirmMailInputDto,
  GetNewAccessTokenInputDto,
  GetNewAccessTokenOutputDto,
  LoginUserInputDto,
  LoginUserOutputDto,
} from '../dto/auth.dto';
import { TokensService } from './tokens.service';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { NewUserRegistered } from '../event/auth.events';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashPasswordService: HashPasswordService,
    private readonly tokensService: TokensService,
    private eventEmitter: EventEmitter,
  ) {}

  async register(registerUserDto: Prisma.UserCreateInput): Promise<void> {
    const { name, password, email } = registerUserDto;

    const isUserExist =
      (await this.prismaService.user.count({
        where: { email },
      })) > 0;

    if (isUserExist) throw new BadRequestException('User already exists');

    const user = await this.prismaService.user.create({
      data: {
        name,
        password: await this.hashPasswordService.hash(password),
        email,
      },
    });

    this.eventEmitter.emit(
      'user.registered',
      Object.assign(new NewUserRegistered(), {
        userId: user.id,
        email,
        confirmationTokenEmail:
          await this.tokensService.createEmailVerificationToken(user.id, email),
      }),
    );

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

    const isUserActivated = Boolean(user?.emailVerifiedAt);

    if (!isUserActivated) {
      throw new BadRequestException({
        error: 'pending',
        message:
          'User is still pending. Try to activate your account with confirmation email',
      });
    }

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

  async validateConfirmMailToken(
    confirmMailInputDto: ConfirmMailInputDto,
  ): Promise<void> {
    const { token } = confirmMailInputDto;
    await this.tokensService.validateEmailVerificationToken(token);
  }
}
