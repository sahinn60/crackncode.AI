import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { SecurityEventService } from './security-event.service';
import { SessionStrategy } from './session.strategy';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, SecurityEventService, SessionStrategy],
  exports: [AuthService, SessionService, SecurityEventService],
})
export class AuthModule {}
