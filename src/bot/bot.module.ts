import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Reaction } from '../entities/reaction.entity';
import { BotUpdate } from './bot.update';
import { OnboardingService } from './onboarding.service';
import { MatchService } from './match.service';
import { KeyboardService } from './keyboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Reaction])],
  providers: [BotUpdate, OnboardingService, MatchService, KeyboardService],
})
export class BotModule {}
