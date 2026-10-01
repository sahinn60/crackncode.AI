import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsService],
  exports: [ToolsService], // exported for GenerationsModule
})
export class ToolsModule {}
