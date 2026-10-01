'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button, Alert } from '@crackncode/ui';
import { AuthLayout } from '@/components/auth/auth-layout';
import { PasswordInput } from '@/components/auth/password-input';
import { useAuth, ApiError } from '@/providers/auth-provider';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs: typeof errors = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    if (!token) {
      setServerError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password reset!" description="Your password has been updated successfully">
        <div className="flex flex-col items-center text-center py-4">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Sign in now</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" description="This password reset link is invalid or has expired">
        <Alert variant="destructive" className="mb-6">
          This reset link is invalid or has expired. Please request a new one.
        </Alert>
        <Button asChild variant="outline" className="w-full gap-2">
          <Link href="/forgot-password">
            <ArrowLeft className="h-4 w-4" /> Request new link
          </Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" description="Choose a strong password for your account">
      {serverError && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          id="password"
          label="New password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
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
