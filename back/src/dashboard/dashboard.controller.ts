import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  @Get()
  getDashboard(@Req() req: any) {
    const user = req.user;
    return { message: `Bienvenue ${user.name}` };
  }
}
