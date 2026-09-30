import type { ReactNode } from "react";

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-col gap-4 px-6 py-8 text-[15px] leading-relaxed text-body">
      <a href="/" className="text-sm">‹ Back to the quiz</a>
      <h1 className="font-serif text-[28px] font-medium text-ink">{title}</h1>
      {children}
    </main>
  );
}
