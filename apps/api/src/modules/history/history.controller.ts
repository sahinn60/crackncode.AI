import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HistoryService } from './history.service';

@Auth()
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.historyService.findAll(user.id, {
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
      search,
      categorySlug,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.historyService.findOne(id, user.id);
  }

  @Patch(':id/pin')
  @HttpCode(HttpStatus.OK)
  togglePin(@CurrentUser() user: User, @Param('id') id: string) {
    return this.historyService.togglePin(id, user.id);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  clear(@CurrentUser() user: User) {
    return this.historyService.clear(user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.historyService.remove(id, user.id);
  }
}
