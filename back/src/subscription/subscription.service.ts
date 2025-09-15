import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    const {
      name,
      amount,
      frequency,
      startDate,
      endDate,
      category,
      currency = 'EUR',
      notes,
    } = createSubscriptionDto;

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
        currency,
        notes,
        userId,
        categoryId: categoryRecord ? categoryRecord.id : null,
      },
      include: {
        category: true,
      },
    });

    // Créer le premier paiement
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

  async findAll(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: {
        category: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1,
        },
        _count: {
          select: { payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        category: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Abonnement non trouvé');
    }

    return subscription;
  }

  async update(
    userId: string,
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    // Vérifier que l'abonnement existe et appartient à l'utilisateur
    await this.findOne(userId, id);

    const {
      name,
      amount,
      frequency,
      startDate,
      endDate,
      category,
      currency,
      notes,
    } = updateSubscriptionDto;

    let categoryRecord = null;
    if (category) {
      categoryRecord = await this.prisma.category.upsert({
        where: { name: category },
        update: {},
        create: { name: category },
      });
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (currency !== undefined) updateData.currency = currency;
    if (notes !== undefined) updateData.notes = notes;
    if (categoryRecord) updateData.categoryId = categoryRecord.id;

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1,
        },
        _count: {
          select: { payments: true },
        },
      },
    });

    // Si la fréquence ou le montant a changé, créer un nouveau paiement
    if (frequency !== undefined || amount !== undefined) {
      const nextPaymentDate = this.calculateNextPaymentDate(
        updatedSubscription.startDate,
        updatedSubscription.frequency,
      );

      await this.prisma.payment.create({
        data: {
          subscriptionId: updatedSubscription.id,
          userId,
          amount: updatedSubscription.amount,
          paymentDate: nextPaymentDate,
          status: 'PENDING',
        },
      });
    }

    return updatedSubscription;
  }

  async delete(userId: string, id: string) {
    // Vérifier que l'abonnement existe et appartient à l'utilisateur
    await this.findOne(userId, id);

    // Supprimer d'abord les paiements associés
    await this.prisma.payment.deleteMany({
      where: { subscriptionId: id },
    });

    // Puis supprimer l'abonnement
    await this.prisma.subscription.delete({
      where: { id },
    });

    return { message: 'Abonnement supprimé avec succès' };
  }

  private calculateNextPaymentDate(startDate: Date, frequency: string): Date {
    const nextDate = new Date(startDate);
    const now = new Date();

    if (frequency === 'MONTHLY') {
      // Calculer le prochain paiement mensuel
      while (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (frequency === 'YEARLY') {
      // Calculer le prochain paiement annuel
      while (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    return nextDate;
  }
}
