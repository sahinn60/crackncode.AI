'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@crackncode/ui';
import { AuthLayout } from '@/components/auth/auth-layout';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/auth-service';

type VerifyState = 'pending' | 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = React.useState<VerifyState>(token ? 'verifying' : 'pending');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendSent, setResendSent] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;
    apiClient.auth.verifyEmail({ token })
      .then(() => setState('success'))
      .catch((err) => {
        setErrorMessage(err instanceof ApiError ? err.message : 'Verification failed. The link may have expired.');
        setState('error');
      });
  }, [token]);

  const handleResend = async () => {
    setResendLoading(true);
    // Resend endpoint — will be wired when backend is ready
    await new Promise((r) => setTimeout(r, 1000));
    setResendSent(true);
    setResendLoading(false);
  };

  return (
    <AuthLayout title="Verify your email" description="One last step to activate your account">
      <div className="flex flex-col items-center text-center py-4">
        {state === 'verifying' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Verifying your email address...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Email verified!</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Your email has been verified. You can now access all features.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Verification failed</h2>
            <p className="text-sm text-muted-foreground mb-8">{errorMessage}</p>
            <Button variant="outline" className="w-full" onClick={() => setState('pending')}>
              Request new link
            </Button>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              We sent a verification link to your email address. Click the link in the email to activate your account.
            </p>
            <div className="w-full space-y-3">
              {resendSent ? (
                <p className="text-sm text-success font-medium">✓ Verification email resent!</p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  loading={resendLoading}
                  onClick={handleResend}
                >
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </Button>
              )}
              <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
