import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateGenerationDto } from './generations.dto';
import { GenerationsService } from './generations.service';

@Auth()
@Controller('generations')
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  /**
   * POST /api/v1/generations
   * Validates user, tool, input, credits → runs AI pipeline → returns result.
   * Pass `async: true` in body to enqueue as background job.
   */
  // Tighter limit on generation — it's expensive (AI + credits)
  @Throttle({ medium: { ttl: 60_000, limit: 30 } })
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateGenerationDto) {
    return this.generationsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.generationsService.findAllByUser(
      user.id,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.generationsService.findOne(id, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.generationsService.remove(id, user.id);
  }
}
