import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { Auth } from '../../common/decorators/auth.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './billing.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Public()
  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  // ─── Authenticated ─────────────────────────────────────────────────────────

  @Auth()
  @Post('checkout')
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user.id, dto);
  }

  @Auth()
  @Post('portal')
  @HttpCode(HttpStatus.OK)
  createPortal(@CurrentUser() user: User) {
    return this.billingService.createPortalSession(user.id);
  }

  @Auth()
  @Get('invoices')
  getInvoices(@CurrentUser() user: User) {
    return this.billingService.getInvoices(user.id);
  }

  @Auth()
  @Get('payments')
  getPayments(@CurrentUser() user: User) {
    return this.billingService.getPayments(user.id);
  }

  // ─── Stripe webhook — MUST be public, raw body required ───────────────────
  // SkipThrottle: Stripe retries must never be rate-limited
  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.billingService.handleWebhook(req, sig);
  }
}
