import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import type { User, UserStatus } from '@prisma/client';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminAdjustDto } from '../credits/credits.dto';
import { AdminService } from './admin.service';
import {
  AdminChangePlanDto,
  AdminCreatePlanDto,
  AdminCreateToolDto,
  AdminUpdatePlanDto,
  AdminUpdateToolDto,
} from './admin.dto';

@Auth('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() {
    return this.svc.getDashboardStats();
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
  ) {
    return this.svc.getUsers(skip ? +skip : 0, take ? +take : 20, search, status);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.svc.getUser(id);
  }

  @Patch('users/:id/suspend')
  suspendUser(@CurrentUser() actor: User, @Param('id') id: string) {
    if (actor.id === id) throw new BadRequestException('Cannot suspend your own account');
    return this.svc.suspendUser(actor.id, id);
  }

  @Patch('users/:id/activate')
  activateUser(@CurrentUser() actor: User, @Param('id') id: string) {
    return this.svc.activateUser(actor.id, id);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() actor: User, @Param('id') id: string) {
    if (actor.id === id) throw new BadRequestException('Cannot delete your own account');
    return this.svc.deleteUser(actor.id, id);
  }

  @Patch('users/:id/plan')
  changeUserPlan(
    @CurrentUser() actor: User,
    @Param('id') id: string,
    @Body() body: AdminChangePlanDto,
  ) {
    return this.svc.changeUserPlan(actor.id, id, body.planId);
  }

  @Post('credits/adjust')
  adjustCredits(@CurrentUser() actor: User, @Body() dto: AdminAdjustDto) {
    return this.svc.adjustCredits(actor.id, dto);
  }

  // ─── Tools ────────────────────────────────────────────────────────────────

  @Get('tools')
  getTools(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.getAdminTools(skip ? +skip : 0, take ? +take : 20, search);
  }

  @Post('tools')
  createTool(@CurrentUser() actor: User, @Body() body: AdminCreateToolDto) {
    return this.svc.createTool(actor.id, body);
  }

  @Patch('tools/:id')
  updateTool(@CurrentUser() actor: User, @Param('id') id: string, @Body() body: AdminUpdateToolDto) {
    return this.svc.updateTool(actor.id, id, body);
  }

  @Delete('tools/:id')
  deleteTool(@CurrentUser() actor: User, @Param('id') id: string) {
    return this.svc.deleteTool(actor.id, id);
  }

  // ─── Plans ────────────────────────────────────────────────────────────────

  @Get('plans')
  getPlans() {
    return this.svc.getPlans();
  }

  @Post('plans')
  createPlan(@CurrentUser() actor: User, @Body() body: AdminCreatePlanDto) {
    return this.svc.createPlan(actor.id, body);
  }

  @Patch('plans/:id')
  updatePlan(@CurrentUser() actor: User, @Param('id') id: string, @Body() body: AdminUpdatePlanDto) {
    return this.svc.updatePlan(actor.id, id, body);
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  @Get('payments')
  getPayments(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getPayments(skip ? +skip : 0, take ? +take : 20, status);
  }

  @Get('subscriptions')
  getSubscriptions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.getSubscriptions(skip ? +skip : 0, take ? +take : 20, status);
  }

  @Get('invoices')
  getInvoices(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.svc.getInvoices(skip ? +skip : 0, take ? +take : 20);
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  @Get('analytics')
  getAnalytics(@Query('days') days?: string) {
    return this.svc.getAnalytics(days ? +days : 30);
  }

  // ─── Audit log ────────────────────────────────────────────────────────────

  @Get('logs')
  getAuditLogs(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.svc.getAuditLogs(skip ? +skip : 0, take ? +take : 50);
  }
}
