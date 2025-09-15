import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user.id;
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { startDate: 'desc' },
    });

    return subscriptions.map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
      category: subscription.category?.name ?? null,
    }));
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const userId = req.user.id;
    const {
      name,
      amount,
      frequency,
      startDate,
      endDate,
      category,
    } = body;

    let categoryRecord = null;
    if (category) {
      categoryRecord = await this.prisma.category.upsert({
        where: { name: category },
        update: {},
        create: { name: category },
      });
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        name,
        amount,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        userId,
        categoryId: categoryRecord ? categoryRecord.id : null,
      },
    });

    await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId,
        amount,
        paymentDate: new Date(startDate),
        status: 'PENDING',
      },
    });

    return subscription;
  }
}

