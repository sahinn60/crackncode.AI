import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { CreatePermissionDto } from './permissions.dto';
import { PermissionsService } from './permissions.service';

@Auth('admin')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
