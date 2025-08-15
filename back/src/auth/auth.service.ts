import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(data: RegisterDto) {
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
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await this.prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });
    return { token };
  }

  async verifyToken(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }
    return session.user;
  }
}
