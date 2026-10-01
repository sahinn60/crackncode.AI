import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@Auth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.favoritesService.findAll(user.id);
  }

  // POST /favorites  { toolId }
  @Post()
  @HttpCode(HttpStatus.CREATED)
  add(@CurrentUser() user: User, @Body('toolId') toolId: string) {
    return this.favoritesService.add(user.id, toolId);
  }

  // DELETE /favorites/:toolId
  @Delete(':toolId')
  remove(@CurrentUser() user: User, @Param('toolId') toolId: string) {
    return this.favoritesService.remove(user.id, toolId);
  }
}
