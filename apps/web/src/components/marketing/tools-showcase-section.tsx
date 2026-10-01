import * as React from 'react';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { ToolsGrid } from './tools-grid';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getToolsData() {
  try {
    const [toolsRes, catsRes] = await Promise.all([
      fetch(`${API}/api/v1/landing-page/tools`, { next: { revalidate: 60 } }),
      fetch(`${API}/api/v1/landing-page/categories`, { next: { revalidate: 60 } }),
    ]);

    const toolsJson = toolsRes.ok ? await toolsRes.json() : {};
    const catsJson  = catsRes.ok  ? await catsRes.json()  : {};

    // ResponseInterceptor: { success, data: { data: [...], total } }
    const toolsInner = toolsJson.data ?? toolsJson;
    const tools: any[]  = toolsInner.data ?? (Array.isArray(toolsInner) ? toolsInner : []);
    const total: number = toolsInner.total ?? tools.length;

    const catsInner  = catsJson.data ?? catsJson;
    const categories: any[] = Array.isArray(catsInner) ? catsInner : [];

    return { tools, total, categories };
  } catch {
    return { tools: [], total: 0, categories: [] };
  }
}

async function ToolsContent() {
  const { tools, total, categories } = await getToolsData();
  return <ToolsGrid tools={tools} categories={categories} total={total} />;
}

function ToolsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-xl border border-white/[0.07] bg-white/[0.02]" />
      ))}
    </div>
  );
}

export function ToolsShowcaseSection() {
  return (
    <SectionWrapper subtle id="tools">
      <Container>
        <SectionHeading
          label="AI Tools"
          title={
            <>
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                create faster
              </span>
            </>
          }
          description="100+ AI-powered tools across every category. From writing to coding, marketing to SEO — we have you covered."
        />
        <React.Suspense fallback={<ToolsSkeleton />}>
          <ToolsContent />
        </React.Suspense>
      </Container>
    </SectionWrapper>
  );
}
