import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [SubscriptionController],
  providers: [PrismaService],
})
export class SubscriptionModule {}

