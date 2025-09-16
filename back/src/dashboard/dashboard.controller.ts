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

  @Get('calendar-events')
  async getCalendarEvents(@Req() req: any) {
    const userId = req.user.id;
    const { month, year } = req.query;

    // Utiliser le mois/année fourni ou prendre le mois/année courant
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth(); // -1 car les mois JS commencent à 0
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: { subscription: true },
      orderBy: { paymentDate: 'asc' },
    });

    return payments.map((p) => ({
      id: p.id,
      name: p.subscription.name,
      date: p.paymentDate,
      amount: p.amount,
      status: p.status,
    }));
  }

  @Get('monthly-summary')
  async getMonthlySummary(@Req() req: any) {
    const userId = req.user.id;
    const now = new Date();

    // Créer les dates de début et fin de journée avec gestion du fuseau horaire
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    console.log('Date calculations:', {
      now: now.toISOString(),
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
      userTimezone: now.getTimezoneOffset(),
    });

    // Paiements du jour - utiliser une plage complète de 24h
    const todaysPayments = await this.prisma.payment.findMany({
      where: {
        userId,
        paymentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: { subscription: true },
    });

    console.log(
      'Todays payments found:',
      todaysPayments.length,
      todaysPayments.map((p) => ({
        name: p.subscription.name,
        date: p.paymentDate.toISOString(),
        amount: p.amount,
      })),
    );

    // Paiements du mois
    const monthlyPayments = await this.prisma.payment.findMany({
      where: {
        userId,
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: { subscription: true },
    });

    // Prochain paiement après aujourd'hui
    const nextPayment = await this.prisma.payment.findFirst({
      where: {
        userId,
        paymentDate: {
          gt: todayEnd,
        },
      },
      include: { subscription: true },
      orderBy: { paymentDate: 'asc' },
    });

    const todaysTotal = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    const result = {
      todaysTotal,
      monthlyTotal,
      todaysCount: todaysPayments.length,
      monthlyCount: monthlyPayments.length,
      nextPayment: nextPayment
        ? {
            name: nextPayment.subscription.name,
            amount: nextPayment.amount,
            date: nextPayment.paymentDate,
            daysUntil: Math.ceil(
              (nextPayment.paymentDate.getTime() - todayEnd.getTime()) /
                (24 * 60 * 60 * 1000),
            ),
          }
        : null,
    };

    console.log('Monthly summary result:', result);
    return result;
  }

  @Get('debug-payments')
  async getDebugPayments(@Req() req: any) {
    const userId = req.user.id;
    const allPayments = await this.prisma.payment.findMany({
      where: { userId },
      include: { subscription: true },
      orderBy: { paymentDate: 'asc' },
    });

    const now = new Date();
    return {
      serverTime: now.toISOString(),
      serverTimezone: now.getTimezoneOffset(),
      allPayments: allPayments.map((p) => ({
        id: p.id,
        name: p.subscription.name,
        paymentDate: p.paymentDate.toISOString(),
        paymentDateLocal: p.paymentDate.toLocaleString('fr-FR', {
          timeZone: 'Europe/Paris',
        }),
        amount: p.amount,
        status: p.status,
      })),
    };
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

  @Get('monthly-expenses')
  async getMonthlyExpenses(@Req() req: any) {
    const userId = req.user.id;
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      include: { category: true },
    });

    // Calculer les dépenses mensuelles normalisées
    const monthlyTotal = subscriptions.reduce((total, sub) => {
      const monthlyAmount =
        sub.frequency === 'YEARLY' ? sub.amount / 12 : sub.amount;
      return total + monthlyAmount;
    }, 0);

    // Grouper par catégorie avec montants mensuels
    const categoryExpenses: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const categoryName = sub.category?.name || 'Autres';
      const monthlyAmount =
        sub.frequency === 'YEARLY' ? sub.amount / 12 : sub.amount;
      categoryExpenses[categoryName] =
        (categoryExpenses[categoryName] || 0) + monthlyAmount;
    });

    return {
      total: monthlyTotal,
      byCategory: categoryExpenses,
    };
  }

  @Get('frequency-distribution')
  async getFrequencyDistribution(@Req() req: any) {
    const userId = req.user.id;
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
    });

    const distribution = subscriptions.reduce(
      (acc, sub) => {
        acc[sub.frequency] = (acc[sub.frequency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return distribution;
  }

  @Get('payment-timeline')
  async getPaymentTimeline(@Req() req: any) {
    const userId = req.user.id;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, 1);

    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        paymentDate: {
          gte: sixMonthsAgo,
          lte: sixMonthsFromNow,
        },
      },
      include: { subscription: true },
      orderBy: { paymentDate: 'asc' },
    });

    // Grouper par mois
    const monthlyData: Record<string, number> = {};
    payments.forEach((payment) => {
      const monthKey = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.amount;
    });

    return monthlyData;
  }

  @Get('subscription-trends')
  async getSubscriptionTrends(@Req() req: any) {
    const userId = req.user.id;
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Grouper par mois de création
    const trends: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const monthKey = sub.createdAt.toISOString().substring(0, 7); // YYYY-MM
      trends[monthKey] = (trends[monthKey] || 0) + 1;
    });

    return trends;
  }
}
