import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  @Get()
  getDashboard(@Req() req: any) {
    const user = req.user;
    return { message: `Bienvenue ${user.name}` };
  }
}
