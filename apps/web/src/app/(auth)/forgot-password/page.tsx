'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button, Alert } from '@crackncode/ui';
import { AuthLayout } from '@/components/auth/auth-layout';
import { useAuth, ApiError } from '@/providers/auth-provider';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!email) { setEmailError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email'); return; }
    setEmailError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your email" description="We've sent you a password reset link">
        <div className="flex flex-col items-center text-center py-4">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Mail className="h-7 w-7 text-success" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            We sent a password reset link to
          </p>
          <p className="font-semibold text-foreground mb-6">{email}</p>
          <p className="text-xs text-muted-foreground mb-8">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="text-primary hover:underline font-medium"
            >
              try again
            </button>
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
    >
      {serverError && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!emailError}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          />
          {emailError && <p className="text-xs text-destructive">{emailError}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
