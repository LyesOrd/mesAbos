import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { ConflictException } from '@nestjs/common';

describe('AuthService - register', () => {
  let service: AuthService;
  let prisma: { user: any };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: '1', email: 'test@example.com' }),
      },
    } as any;
    service = new AuthService(prisma as unknown as PrismaService);
  });

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
