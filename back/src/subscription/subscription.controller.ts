import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'))
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.subscriptionService.create(userId, createSubscriptionDto);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.findOne(userId, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.subscriptionService.update(userId, id, updateSubscriptionDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.delete(userId, id);
  }
}

