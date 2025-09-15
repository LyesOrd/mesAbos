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
    console.error('=== UpdateMe called ===');
    console.error('userId:', userId);
    console.error('data:', data);
    console.error('avatarPath:', avatarPath);

    const { email, name } = data;

    const updatePayload: {
      email?: string | null;
      name?: string | null;
      avatar?: string | null;
    } = {};

    if (email !== undefined) {
      updatePayload.email = email;
    }

    if (name !== undefined) {
      updatePayload.name = name;
    }

    // Only set avatar if a file was uploaded
    if (avatarPath !== undefined) {
      updatePayload.avatar = avatarPath;
    }

    console.error('Final update payload:', updatePayload);

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

    console.log('Updated user result:', updatedUser);
    return updatedUser;
  }
}
