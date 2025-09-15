import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';
import { ExpenseController } from './expense.controller';

@Module({
  imports: [AuthModule],
  controllers: [ExpenseController],
  providers: [PrismaService],
})
export class ExpenseModule {}
