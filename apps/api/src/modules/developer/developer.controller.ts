import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeveloperService } from './developer.service';
import { CreateApiKeyDto } from './developer.dto';

@Auth()
@Controller('developer/keys')
export class DeveloperController {
  constructor(private service: DeveloperService) {}

  @Throttle({ medium: { ttl: 3_600_000, limit: 10 } })
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateApiKeyDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.id);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.revoke(user.id, id);
  }

  @Get(':id/usage')
  usage(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('skip') skip = '0',
    @Query('take') take = '50',
  ) {
    return this.service.getUsage(user.id, id, +skip, +take);
  }
}
