import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { CreateRoleDto, UpdateRoleDto } from './roles.dto';
import { RolesService } from './roles.service';

@Auth('admin')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions/:permissionId')
  assignPermission(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.assignPermission(id, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  removePermission(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.removePermission(id, permissionId);
  }
}
