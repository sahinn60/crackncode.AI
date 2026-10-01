'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Alert } from '@crackncode/ui';
import { PageHeader } from '@/components/layout/page-header';
import { Sun, Moon, Monitor, Trash2, Loader2, Check } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import { apiClient, ApiError } from '@/lib/api-client';
import { PasswordInput } from '@/components/auth/password-input';

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, refreshUser, logout } = useAuth();

  // Profile
  const [name, setName] = React.useState((user as any)?.profile?.name ?? '');
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [pwForm, setPwForm] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Sync name when user loads
  React.useEffect(() => {
    if (user) setName((user as any)?.profile?.name ?? '');
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await apiClient.users.update({ name: name.trim() });
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwSaving(true);
    try {
      await apiClient.users.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'success', text: 'Password changed. You will be signed out.' });
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.users.delete();
      await logout();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      {/* Profile */}
      <Section title="Profile" description="Update your display name.">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="h-9 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
          {profileMsg && (
            <Alert variant={profileMsg.type === 'error' ? 'destructive' : 'default'} onDismiss={() => setProfileMsg(null)}>
              {profileMsg.text}
            </Alert>
          )}
          <Button type="submit" size="sm" disabled={profileSaving} className="gap-1.5">
            {profileSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save changes
          </Button>
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" description="Choose your preferred theme.">
        <div className="flex gap-3">
          {([
            { value: 'light',  label: 'Light',  icon: Sun },
            { value: 'dark',   label: 'Dark',   icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all ${
                theme === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" description="Use a strong password with uppercase, lowercase, numbers, and symbols.">
        <form onSubmit={changePassword} className="space-y-4">
          <PasswordInput
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <PasswordInput
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          />
          {pwMsg && (
            <Alert variant={pwMsg.type === 'error' ? 'destructive' : 'default'} onDismiss={() => setPwMsg(null)}>
              {pwMsg.text}
            </Alert>
          )}
          <Button type="submit" size="sm" disabled={pwSaving} className="gap-1.5">
            {pwSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Change password
          </Button>
        </form>
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-foreground">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm && (
              <Button
                variant="destructive" size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete account
              </Button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="space-y-3 pt-1 border-t border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                Are you absolutely sure? This will permanently delete all your data.
              </p>
              {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="destructive" size="sm"
                  onClick={deleteAccount}
                  disabled={deleting}
                  className="gap-1.5"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Yes, delete my account
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
