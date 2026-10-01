import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { SupportChatWidget } from '@/components/layout/support-chat-widget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
      <SupportChatWidget />
    </ProtectedRoute>
  );
}
