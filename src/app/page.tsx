"use client";

import { AnimatedToc, type TocItem } from "~/components/animated-toc";
import { useActiveSection } from "~/hooks/use-active-section";

const tocItems: TocItem[] = [
  { id: "introduction", title: "Introduction" },
  {
    id: "core-concepts",
    title: "Core Concepts",
    children: [
      { id: "architecture", title: "Architecture" },
      { id: "data-flow", title: "Data Flow" },
    ],
  },
  {
    id: "components",
    title: "Components",
    children: [
      { id: "button", title: "Button" },
      { id: "card", title: "Card" },
      { id: "input", title: "Input" },
    ],
  },
  { id: "utilities", title: "Utilities" },
  { id: "deployment", title: "Deployment" },
];

function flattenIds(items: TocItem[]): string[] {
  return items.flatMap((item) => [
    item.id,
    ...(item.children ? flattenIds(item.children) : []),
  ]);
}

export default function Home() {
  const activeId = useActiveSection(flattenIds(tocItems));

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex gap-16">
          {/* Main Content */}
          <main className="flex-1 max-w-2xl">
            <Section id="introduction" title="Introduction">
              <p>
                Welcome to our comprehensive documentation. This guide will walk
                you through everything you need to know to get started with our
                platform.
              </p>
              <p>
                Whether you&apos;re a beginner or an experienced developer,
                you&apos;ll find valuable information here to help you build
                amazing applications.
              </p>
            </Section>

            <Section id="core-concepts" title="Core Concepts">
              <p>
                Before diving into the implementation details, it&apos;s
                important to understand the core concepts that power our
                platform.
              </p>
              <p>
                These foundational principles will help you make better
                architectural decisions and write more maintainable code.
              </p>
            </Section>

            <Section id="architecture" title="Architecture" level={2}>
              <p>
                Our architecture follows a modular design pattern that promotes
                separation of concerns and makes testing easier.
              </p>
              <p>
                Each module is self-contained and communicates with others
                through well-defined interfaces.
              </p>
            </Section>

            <Section id="data-flow" title="Data Flow" level={2}>
              <p>
                Understanding how data flows through the application is crucial
                for debugging and optimization.
              </p>
              <p>
                We use a unidirectional data flow pattern that makes state
                changes predictable and easy to trace.
              </p>
            </Section>

            <Section id="components" title="Components">
              <p>
                Our component library provides a set of reusable UI elements
                that follow accessibility best practices.
              </p>
              <p>
                Each component is designed to be composable and customizable to
                fit your specific needs.
              </p>
            </Section>

            <Section id="button" title="Button" level={2}>
              <p>
                The Button component is one of the most commonly used elements.
                It supports multiple variants including primary, secondary, and
                ghost styles.
              </p>
              <p>
                Buttons can include icons, loading states, and are fully
                keyboard accessible.
              </p>
            </Section>

            <Section id="card" title="Card" level={2}>
              <p>
                Cards are versatile containers that group related content
                together. They can include headers, footers, and various content
                types.
              </p>
              <p>
                Use cards to create visual hierarchy and organize information in
                a scannable way.
              </p>
            </Section>

            <Section id="input" title="Input" level={2}>
              <p>
                Input components handle user text entry with built-in validation
                and error handling.
              </p>
              <p>
                They support various types including text, email, password, and
                number inputs.
              </p>
            </Section>

            <Section id="utilities" title="Utilities">
              <p>
                Our utility functions help you perform common operations without
                reinventing the wheel.
              </p>
              <p>
                From date formatting to string manipulation, these utilities are
                tree-shakeable and TypeScript-ready.
              </p>
            </Section>

            <Section id="deployment" title="Deployment">
              <p>
                Deploying your application is straightforward with our CLI
                tools. We support multiple deployment targets including Vercel,
                AWS, and self-hosted options.
              </p>
              <p>
                Follow our deployment checklist to ensure a smooth production
                release.
              </p>
            </Section>
          </main>

          {/* Sticky TOC Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-16">
              <AnimatedToc items={tocItems} activeId={activeId} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  level = 1,
  children,
}: {
  id: string;
  title: string;
  level?: number;
  children: React.ReactNode;
}) {
  const Tag = level === 1 ? "h2" : "h3";
  const titleClass =
    level === 1
      ? "text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100"
      : "text-xl font-semibold mb-3 text-zinc-800 dark:text-zinc-200";

  return (
    <section id={id} className="mb-16 scroll-mt-16">
      <Tag className={titleClass}>{title}</Tag>
      <div className="space-y-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
