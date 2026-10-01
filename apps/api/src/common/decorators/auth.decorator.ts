import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export const Auth = (...roles: string[]) =>
  applyDecorators(
    ...(roles.length ? [Roles(...roles)] : []),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
