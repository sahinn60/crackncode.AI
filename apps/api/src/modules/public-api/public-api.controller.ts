import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiKeyGuard } from './api-key.guard';
import { ApiUsageInterceptor } from './api-usage.interceptor';
import { GenerationsService } from '../generations/generations.service';
import { ToolsService } from '../tools/tools.service';
import { IsObject, IsString } from 'class-validator';

class PublicGenerateDto {
  @IsString()
  toolSlug: string;

  @IsObject()
  input: Record<string, unknown>;
}

@Public()
@UseGuards(ApiKeyGuard)
@UseInterceptors(ApiUsageInterceptor)
@Controller('public')
export class PublicApiController {
  constructor(
    private generations: GenerationsService,
    private tools: ToolsService,
  ) {}

  /** GET /api/v1/public/tools — list available tools */
  @Get('tools')
  listTools() {
    return this.tools.findAll({ skip: 0, take: 100 });
  }

  /** GET /api/v1/public/tools/:slug — tool details */
  @Get('tools/:slug')
  getTool(@Param('slug') slug: string) {
    return this.tools.findBySlug(slug);
  }

  /** POST /api/v1/public/generate — run a tool generation */
  @Post('generate')
  async generate(@Request() req: any, @Body() dto: PublicGenerateDto) {
    const tool = await this.tools.findBySlug(dto.toolSlug);
    return this.generations.create(req.user.id, {
      toolId: tool.id,
      input: dto.input,
      async: false,
    });
  }
}
