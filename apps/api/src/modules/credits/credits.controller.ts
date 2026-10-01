import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAdjustDto } from './credits.dto';
import { CreditsService } from './credits.service';

@Auth()
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  getAccount(@CurrentUser() user: User) {
    return this.creditsService.getAccount(user.id);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.creditsService.getTransactions(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  // Legacy aliases — kept for backward compat
  @Get('balance')
  getBalance(@CurrentUser() user: User) {
    return this.creditsService.getBalance(user.id);
  }

  @Get('ledger')
  getLedger(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.creditsService.getTransactions(
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  // Admin-only — double-guarded at method level even though class uses @Auth()
  @Auth('admin')
  @Post('admin/adjust')
  adminAdjust(@CurrentUser() actor: User, @Body() dto: AdminAdjustDto) {
    return this.creditsService.adminAdjust(dto, actor.id);
  }
}
