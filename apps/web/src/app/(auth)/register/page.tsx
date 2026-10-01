'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Alert } from '@crackncode/ui';
import { AuthLayout } from '@/components/auth/auth-layout';
import { GoogleButton } from '@/components/auth/google-button';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthDivider } from '@/components/auth/auth-divider';
import { useAuth, ApiError } from '@/providers/auth-provider';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: 'Weak',   color: 'bg-destructive' },
    { label: 'Fair',   color: 'bg-warning' },
    { label: 'Good',   color: 'bg-info' },
    { label: 'Strong', color: 'bg-success' },
  ];
  return { score, ...map[Math.min(score - 1, 3)] ?? { label: 'Weak', color: 'bg-destructive' } };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!form.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!form.agreeToTerms) errors.agreeToTerms = 'You must agree to the terms';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = React.useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '', agreeToTerms: false,
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [serverError, setServerError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: field === 'agreeToTerms' ? e.target.checked : e.target.value }));

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" description="Start your free trial — no credit card required">
      <GoogleButton label="Sign up with Google" />
      <AuthDivider label="or sign up with email" />

      {serverError && (
        <Alert variant="destructive" className="mb-4" onDismiss={() => setServerError('')}>
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            value={form.name}
            onChange={set('name')}
            aria-invalid={!!errors.name}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

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
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          {/* Strength meter */}
          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-muted'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Password strength: <span className="font-medium text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
        />

        {/* Terms */}
        <div className="space-y-1">
          <div className="flex items-start gap-2.5">
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={form.agreeToTerms}
              onChange={set('agreeToTerms')}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-muted-foreground cursor-pointer select-none leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.agreeToTerms && <p className="text-xs text-destructive">{errors.agreeToTerms}</p>}
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Creating account...' : 'Create free account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
