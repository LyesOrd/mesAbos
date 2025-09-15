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
        avatar: true,
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

  async updateMe(userId: string, data: UpdateUserDto, avatarPath?: string) {
    const { email, name, avatar } = data;

    const updatePayload: { email?: string | null; name?: string | null; avatar?: string | null } = {};

    if (email !== undefined) {
      updatePayload.email = email;
    }

    if (name !== undefined) {
      updatePayload.name = name;
    }

    if (avatar !== undefined) {
      updatePayload.avatar = avatar;
    }

    if (avatarPath !== undefined) {
      updatePayload.avatar = avatarPath;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
