import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Auth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findMine(@CurrentUser() user: User) {
    return this.subscriptionsService.findByUser(user.id);
  }

  @Delete('cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: User) {
    return this.subscriptionsService.cancel(user.id);
  }
}
