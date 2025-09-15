import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Frequency } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  name: string;

  @IsNumber()
  amount: number;

  @IsEnum(Frequency)
  frequency: Frequency;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
