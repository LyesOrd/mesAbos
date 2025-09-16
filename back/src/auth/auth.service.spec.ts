import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test' }),
        update: jest.fn(),
      },
    } as any;
    jwt = { sign: jest.fn().mockReturnValue('jwt-token') } as any;
    config = {
      get: jest.fn((key: string) => (key === 'GOOGLE_CLIENT_ID' ? 'google-client-id' : undefined)),
    } as any;
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('hashes password and returns user info', async () => {
      const result = await service.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'secret123',
      });
      expect(result).toEqual({ id: '1', email: 'test@example.com' });
      const createCall = prisma.user.create.mock.calls[0][0].data;
      expect(createCall.password).not.toBe('secret123');
      expect(createCall.password).toMatch(/^[^:]+:[0-9a-f]+$/);
      expect(createCall.provider).toBe('LOCAL');
    });

    it('throws on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'secret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('googleLogin', () => {
    const tokenInfo = {
      aud: 'google-client-id',
      sub: 'sub-id',
      email: 'User@Example.com',
      name: 'Test User',
    };

    let requestSpy: jest.SpyInstance;

    beforeEach(() => {
      requestSpy = jest
        .spyOn(service as unknown as { requestGoogleTokenInfo: () => Promise<typeof tokenInfo> }, 'requestGoogleTokenInfo')
        .mockResolvedValue(tokenInfo);
    });

    afterEach(() => {
      requestSpy.mockRestore();
    });

    it('creates a new Google user when none exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValue({
        id: 'new-user',
        email: 'user@example.com',
        name: 'Test User',
      });

      const result = await service.googleLogin('token');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'user@example.com',
          name: 'Test User',
          provider: 'GOOGLE',
          providerId: 'sub-id',
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'new-user', email: 'user@example.com', name: 'Test User' },
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(result).toEqual({ token: 'jwt-token' });
    });

    it('reuses an existing Google-linked account', async () => {
      const existingUser = { id: 'existing', email: 'existing@example.com', name: 'Existing User' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.googleLogin('token');

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result).toEqual({ token: 'jwt-token' });
    });

    it('links an existing email account to Google', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'email-user', email: 'user@example.com', name: 'Local User' });
      prisma.user.update.mockResolvedValue({
        id: 'email-user',
        email: 'user@example.com',
        name: 'Local User',
      });

      await service.googleLogin('token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'email-user' },
        data: { provider: 'GOOGLE', providerId: 'sub-id' },
      });
    });

    it('throws when Google client does not match configuration', async () => {
      requestSpy.mockResolvedValueOnce({ ...tokenInfo, aud: 'different-client' });

      await expect(service.googleLogin('token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when Google client id is missing from configuration', async () => {
      config.get.mockImplementationOnce(() => undefined);

      await expect(service.googleLogin('token')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
