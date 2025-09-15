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

    const [categories, subscriptions] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.subscription.findMany({
        where: { userId },
        include: { category: true },
      }),
    ]);

    const counts = new Map<string, number>();
    let uncategorized = 0;

    subscriptions.forEach((subscription) => {
      if (subscription.category) {
        const current = counts.get(subscription.category.name) ?? 0;
        counts.set(subscription.category.name, current + 1);
      } else {
        uncategorized += 1;
      }
    });

    const stats = categories.map((category) => ({
      category: category.name,
      count: counts.get(category.name) ?? 0,
    }));

    if (uncategorized > 0) {
      stats.push({ category: 'Autres', count: uncategorized });
    }

    return stats;
  }
}
