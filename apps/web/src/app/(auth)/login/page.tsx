'use client';

import * as React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Button, Alert } from '@crackncode/ui';
import { AuthLayout } from '@/components/auth/auth-layout';
import { GoogleButton } from '@/components/auth/google-button';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthDivider } from '@/components/auth/auth-divider';
import { useAuth, ApiError } from '@/providers/auth-provider';

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = React.useState<FormState>({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: field === 'rememberMe' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password, rememberMe: form.rememberMe });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to your CracknCode AI account">
      <GoogleButton label="Continue with Google" />
      <AuthDivider label="or continue with email" />

      {serverError && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            aria-invalid={!!errors.email}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <input
            id="rememberMe"
            type="checkbox"
            checked={form.rememberMe}
            onChange={set('rememberMe')}
            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
            Remember me for 30 days
          </label>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
}
