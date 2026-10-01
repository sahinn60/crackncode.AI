import { MarketingHeader } from '@/components/marketing/header';
import { MarketingFooter } from '@/components/marketing/footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark bg-[#080808] overflow-x-hidden">
      <MarketingHeader />
      <main className="min-h-screen">{children}</main>
      <MarketingFooter />
    </div>
  );
}
