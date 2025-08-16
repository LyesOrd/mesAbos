import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(data.password, salt, 64).toString('hex');
    const password = `${salt}:${hash}`;
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password,
        name: data.name,
        provider: 'LOCAL',
      },
    });
    return { id: user.id, email: user.email };
  }

  private verifyPassword(password: string, stored: string): boolean {
    if (!password || !stored) return false;
    const parts = stored.split(':');
    if (parts.length !== 2) return false;

    const [salt, hashHex] = parts;
    if (!salt || !hashHex) return false;
    if (hashHex.length % 2 !== 0 || /[^0-9a-f]/i.test(hashHex)) return false;

    const derived = scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, 'hex');

    if (derived.length !== storedBuf.length) return false;
    return timingSafeEqual(derived, storedBuf);
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const isValid = this.verifyPassword(password, user.password);
    if (!isValid) return null;
    return user;
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, jti };
    const token = await this.jwt.signAsync(payload);
    const { exp } = await this.jwt.verifyAsync(token);
    const expiresAt = new Date(exp * 1000);
    await this.prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });
    return { token };
  }

  async verifyToken(token: string) {
    try {
      await this.jwt.verifyAsync(token);
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });
      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException();
      }
      return session.user;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
