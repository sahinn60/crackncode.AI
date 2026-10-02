import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Auth } from '../../common/decorators/auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { BrowserToolsService } from './browser-tools.service';
import {
  CreateBrowserToolDto, UpdateBrowserToolDto,
  ExecuteBrowserToolDto, QueryBrowserToolsDto,
} from './dto/browser-tools.dto';

// ─── Admin routes (/api/v1/admin/browser-tools) ───────────────────────────────

@Auth('admin')
@Controller('admin/browser-tools')
export class AdminBrowserToolsController {
  constructor(private readonly svc: BrowserToolsService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBrowserToolDto) {
    return this.svc.create(dto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryBrowserToolsDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateBrowserToolDto) {
    return this.svc.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.remove(id, user.id);
  }

  @Post(':id/connect')
  connect(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.connect(id, user.id);
  }

  @Post(':id/verify')
  verify(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.verify(id, user.id);
  }

  @Post(':id/reconnect')
  reconnect(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.reconnect(id, user.id);
  }

  @Post(':id/disconnect')
  disconnect(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.disconnect(id, user.id);
  }

  @Get(':id/connection')
  connectionStatus(@Param('id') id: string) {
    return this.svc.getConnectionStatus(id);
  }

  @Get(':id/executions')
  executions(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.getAdminExecutions(id, skip ? +skip : 0, take ? +take : 20);
  }
}

// ─── User routes (/api/v1/browser-tools) ─────────────────────────────────────

@Controller('browser-tools')
export class BrowserToolsController {
  constructor(private readonly svc: BrowserToolsService) {}

  @Public()
  @SkipThrottle()
  @Get()
  findPublic(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.svc.findPublic(skip ? +skip : 0, take ? +take : 50);
  }

  @Public()
  @SkipThrottle()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Auth()
  @Post(':id/execute')
  execute(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ExecuteBrowserToolDto,
  ) {
    return this.svc.execute(id, user.id, dto);
  }

  @Auth()
  @Get('executions')
  myExecutions(
    @CurrentUser() user: User,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.getUserExecutions(user.id, skip ? +skip : 0, take ? +take : 20);
  }

  @Auth()
  @Get('executions/:id')
  getExecution(@CurrentUser() user: User, @Param('id') id: string) {
    return this.svc.getExecution(id, user.id);
  }
}
