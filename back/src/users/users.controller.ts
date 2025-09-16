import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

interface UploadedAvatarFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename: string;
  path?: string;
  buffer?: Buffer;
}

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'avatars');
    mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${fileExtension}`);
  },
});

function imageFileFilter(
  _req: Request,
  file: UploadedAvatarFile,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Only image files are allowed'), false);
    return;
  }

  cb(null, true);
}

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      fileFilter: imageFileFilter,
    }),
  )
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: UploadedAvatarFile,
  ) {
    console.error('=== Controller updateMe called ===');
    console.error('user:', req.user);
    console.error('dto:', dto);
    console.error('file:', file);
    const avatarPath = file ? `/uploads/avatars/${file.filename}` : undefined;
    console.error('avatarPath:', avatarPath);
    return this.usersService.updateMe(req.user.id, dto, avatarPath);
  }
}
