import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

type CreateExpenseDto = {
  name: unknown;
  amount: unknown;
  date: unknown;
};

@Controller('expenses')
@UseGuards(AuthGuard('jwt'))
export class ExpenseController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() body: CreateExpenseDto, @Req() req: any) {
    const userId: string = req.user.id;
    if (!userId) {
      throw new BadRequestException('Utilisateur manquant');
    }

    const name = this.validateName(body.name);
    const amount = this.validateAmount(body.amount);
    const date = this.validateDate(body.date);

    const expense = await this.prisma.expense.create({
      data: {
        name,
        amount,
        date,
        userId,
      },
    });

    return {
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
    };
  }

  private validateName(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('Le nom de la dépense est requis.');
    }

    return value.trim();
  }

  private validateAmount(value: unknown): number {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      throw new BadRequestException(
        'Le montant de la dépense doit être un nombre positif.',
      );
    }

    return value;
  }

  private validateDate(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new BadRequestException('La date de la dépense est invalide.');
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('La date de la dépense est invalide.');
    }

    return parsed;
  }
}
