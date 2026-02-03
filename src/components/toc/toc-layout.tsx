"use client";

import { useMemo } from "react";
import { TocNav, type TocItem } from "./toc-nav";
import { useActiveSection } from "./use-active-section";

export interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
  children?: Section[];
}

interface TocLayoutProps {
  sections: Section[];
}

function flattenSections(sections: Section[], level = 0): (Section & { level: number })[] {
  return sections.flatMap((section) => [
    { ...section, level },
    ...(section.children ? flattenSections(section.children, level + 1) : []),
  ]);
}

function flattenIds(sections: Section[]): string[] {
  return sections.flatMap((section) => [
    section.id,
    ...(section.children ? flattenIds(section.children) : []),
  ]);
}

function sectionToTocItem(section: Section): TocItem {
  return {
    id: section.id,
    title: section.title,
    ...(section.children && { children: section.children.map(sectionToTocItem) }),
  };
}

export function TocLayout({ sections }: TocLayoutProps) {
  const tocItems = useMemo(() => sections.map(sectionToTocItem), [sections]);
  const flatSections = useMemo(() => flattenSections(sections), [sections]);
  const sectionIds = useMemo(() => flattenIds(sections), [sections]);
  const activeId = useActiveSection(sectionIds);

  return (
    <div className="relative flex gap-16">
      <main className="flex-1 max-w-2xl">
        {flatSections.map((section) => {
          const Tag = section.level === 0 ? "h2" : section.level === 1 ? "h3" : "h4";
          const titleClass = {
            0: "text-2xl font-bold mb-4",
            1: "text-xl font-semibold mb-3",
            2: "text-lg font-medium mb-2",
          }[section.level] ?? "text-lg font-medium mb-2";

          return (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-16">
              <Tag className={`${titleClass} text-zinc-900 dark:text-zinc-100`}>
                {section.title}
              </Tag>
              <div className="space-y-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {section.content}
              </div>
            </section>
          );
        })}
      </main>

      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-16">
          <TocNav items={tocItems} activeId={activeId} />
        </div>
      </aside>
    </div>
  );
}
