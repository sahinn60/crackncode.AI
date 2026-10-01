import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Auth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.findAll(user.id, skip ? +skip : 0, take ? +take : 20);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: User) {
    return this.svc.countUnread(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.markRead(id, user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: User) {
    return this.svc.markAllRead(user.id);
  }
}
