import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback, type Profile } from 'passport-google-oauth20';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | undefined;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('google.clientId') ?? 'GOOGLE_CLIENT_ID_NOT_SET',
      clientSecret: config.get<string>('google.clientSecret') ?? 'GOOGLE_CLIENT_SECRET_NOT_SET',
      callbackURL: config.get<string>('google.callbackUrl') ?? 'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email returned from Google'), undefined);
      return;
    }

    const googleProfile: GoogleProfile = {
      googleId: profile.id,
      email,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    this.logger.debug(`Google OAuth: ${email}`);
    done(null, googleProfile);
  }
}
