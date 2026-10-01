import * as React from 'react';
import { SectionWrapper, SectionHeading, Container } from './primitives';
import { ToolsGrid } from './tools-grid';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function fetchTools() {
  try {
    const res = await fetch(`${API}/api/v1/landing-page/tools`, { next: { revalidate: 60 } });
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    const raw = json.data ?? json;
    return { data: Array.isArray(raw) ? raw : (raw.data ?? []), total: raw.total ?? 0 };
  } catch {
    return { data: [], total: 0 };
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API}/api/v1/landing-page/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? []);
  } catch {
    return [];
  }
}

export async function ToolsShowcaseSection() {
  const [{ data: tools, total }, categories] = await Promise.all([fetchTools(), fetchCategories()]);

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
        <ToolsGrid tools={tools} categories={categories} total={total} />
      </Container>
    </SectionWrapper>
  );
}
