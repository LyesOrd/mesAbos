import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get()
  getDashboard(@Req() req: any) {
    const user = req.user;
    return { message: `Bienvenue ${user.name}` };
  }

  @Get('upcoming-payments')
  async getUpcoming(@Req() req: any) {
    const userId = req.user.id;
    const payments = await this.prisma.payment.findMany({
      where: { userId, status: 'PENDING' },
      include: { subscription: true },
      orderBy: { paymentDate: 'asc' },
    });
    return payments.map((p) => ({
      id: p.id,
      name: p.subscription.name,
      date: p.paymentDate,
      amount: p.amount,
    }));
  }

  @Get('category-stats')
  async getCategoryStats(@Req() req: any) {
    const userId = req.user.id;
    const subs = await this.prisma.subscription.findMany({
      where: { userId },
      include: { category: true },
    });
    const stats: Record<string, number> = {};
    subs.forEach((s) => {
      const name = s.category?.name || 'Autres';
      stats[name] = (stats[name] || 0) + 1;
    });
    return stats;
  }
}
