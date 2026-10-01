import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChangePasswordDto, UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';

@Auth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto, @Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.usersService.changePassword(user.id, dto, token);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: User) {
    return this.usersService.delete(user.id);
  }
}
