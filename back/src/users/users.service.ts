import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, data: UpdateUserDto) {
    const { email, name } = data;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(name !== undefined ? { name } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
