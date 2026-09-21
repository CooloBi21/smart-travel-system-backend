import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/auth-user.interface';
import {
  AuthUserRecord,
  UsersRepository,
} from './repositories/users.repository';

@Injectable()
export class AuthService {
  private static readonly PASSWORD_ROUNDS = 12;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const phone = dto.phone?.trim() || null;

    const existingUser =
      await this.usersRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email này đã được sử dụng.',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthService.PASSWORD_ROUNDS,
    );

    let user: AuthUserRecord;

    try {
      user = await this.usersRepository.createCustomer({
        email,
        passwordHash,
        fullName,
        phone,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Email này đã được sử dụng.',
        );
      }

      throw error;
    }

    const accessToken = await this.createAccessToken(user);

    return {
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user =
      await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác.',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác.',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        'Tài khoản hiện không hoạt động.',
      );
    }

    const accessToken = await this.createAccessToken(user);

    return {
      accessToken,
      user: this.toPublicUser(user),
    };
  }

  async getProfile(userId: number) {
    const user =
      await this.usersRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại hoặc không hoạt động.',
      );
    }

    return this.toPublicUser(user);
  }

  private async createAccessToken(
    user: AuthUserRecord,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleCode: user.roleCode,
    };

    return this.jwtService.signAsync(payload);
  }

  private toPublicUser(user: AuthUserRecord) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      roleCode: user.roleCode,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error)
    ) {
      return false;
    }

    return (
      (error as { code?: unknown }).code === '23505'
    );
  }
}
