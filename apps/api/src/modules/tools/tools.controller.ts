import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Auth } from '../../common/decorators/auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateToolDto, UpdateToolDto, QueryToolsDto } from './tools.dto';
import { ToolsService } from './tools.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Auth('admin')
  @Post()
  create(@Body() dto: CreateToolDto) {
    return this.toolsService.create(dto);
  }

  @Public()
  @SkipThrottle()
  @Get()
  findAll(@Query() query: QueryToolsDto) {
    return this.toolsService.findAll(query);
  }

  @Public()
  @SkipThrottle()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.toolsService.findBySlug(slug);
  }

  @Public()
  @SkipThrottle()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Auth('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateToolDto) {
    return this.toolsService.update(id, dto);
  }

  @Auth('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolsService.remove(id);
  }
}
