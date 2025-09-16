import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email?: string;
  name?: string;
}

interface GoogleTokenError {
  error?: string;
  error_description?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get googleClientId(): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    if (!clientId) {
      throw new ServiceUnavailableException('Google client not configured');
    }
    return clientId;
  }

  private async requestGoogleTokenInfo(
    token: string,
  ): Promise<GoogleTokenInfo> {
    const response = await fetch('https://oauth2.googleapis.com/tokeninfo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: token }).toString(),
    });

    const payloadText = await response.text();
    if (!response.ok) {
      let errorDetails: GoogleTokenError | undefined;
      try {
        errorDetails = JSON.parse(payloadText) as GoogleTokenError;
      } catch {
        errorDetails = undefined;
      }
      const reason =
        errorDetails?.error_description ??
        errorDetails?.error ??
        'Invalid Google token';
      throw new UnauthorizedException(reason);
    }

    let tokenInfo: GoogleTokenInfo;
    try {
      tokenInfo = JSON.parse(payloadText) as GoogleTokenInfo;
    } catch {
      throw new UnauthorizedException('Unable to parse Google token response');
    }

    if (!tokenInfo.sub || !tokenInfo.aud) {
      throw new UnauthorizedException('Incomplete Google token information');
    }

    return tokenInfo;
  }

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
    const passwordHash = user?.password;
    if (!passwordHash) return null;
    const isValid = this.verifyPassword(password, passwordHash);
    if (!isValid) return null;
    return user;
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, email: user.email, name: user.name };
    const token = this.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15min',
    });
    return { token };
  }

  async googleLogin(token: string) {
    const payload = await this.requestGoogleTokenInfo(token);
    const clientId = this.googleClientId;
    if (payload.aud !== clientId) {
      throw new UnauthorizedException('Invalid Google client');
    }
    let user = await this.prisma.user.findUnique({
      where: { providerId: payload.sub },
    });
    if (!user) {
      const normalizedEmail = payload.email?.toLowerCase();
      const existing = normalizedEmail
        ? await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
          })
        : null;
      if (!existing) {
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail ?? undefined,
            name: payload.name || normalizedEmail || payload.sub,
            provider: 'GOOGLE',
            providerId: payload.sub,
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: { provider: 'GOOGLE', providerId: payload.sub },
        });
      }
    }
    const jwtPayload = { sub: user.id, email: user.email, name: user.name };
    const jwtToken = this.jwt.sign(jwtPayload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15min',
    });
    return { token: jwtToken };
  }
}
