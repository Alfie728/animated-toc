"use client";

import { type Section, TocLayout } from "~/components/toc";

const sections: Section[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p>
          Welcome to our comprehensive documentation. This guide will walk you
          through everything you need to know to get started with our platform.
        </p>
        <p>
          Whether you&apos;re a beginner or an experienced developer,
          you&apos;ll find valuable information here to help you build amazing
          applications.
        </p>
      </>
    ),
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    content: (
      <>
        <p>
          Before diving into the implementation details, it&apos;s important to
          understand the core concepts that power our platform.
        </p>
        <p>
          These foundational principles will help you make better architectural
          decisions and write more maintainable code.
        </p>
      </>
    ),
    children: [
      {
        id: "architecture",
        title: "Architecture",
        content: (
          <>
            <p>
              Our architecture follows a modular design pattern that promotes
              separation of concerns and makes testing easier.
            </p>
            <p>
              Each module is self-contained and communicates with others through
              well-defined interfaces.
            </p>
          </>
        ),
      },
      {
        id: "data-flow",
        title: "Data Flow",
        content: (
          <>
            <p>
              Understanding how data flows through the application is crucial
              for debugging and optimization.
            </p>
            <p>
              We use a unidirectional data flow pattern that makes state changes
              predictable and easy to trace.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "components",
    title: "Components",
    content: (
      <>
        <p>
          Our component library provides a set of reusable UI elements that
          follow accessibility best practices.
        </p>
        <p>
          Each component is designed to be composable and customizable to fit
          your specific needs.
        </p>
      </>
    ),
    children: [
      {
        id: "button",
        title: "Button",
        content: (
          <>
            <p>
              The Button component is one of the most commonly used elements. It
              supports multiple variants including primary, secondary, and ghost
              styles.
            </p>
            <p>
              Buttons can include icons, loading states, and are fully keyboard
              accessible.
            </p>
          </>
        ),
      },
      {
        id: "card",
        title: "Card",
        content: (
          <>
            <p>
              Cards are versatile containers that group related content
              together. They can include headers, footers, and various content
              types.
            </p>
            <p>
              Use cards to create visual hierarchy and organize information in a
              scannable way.
            </p>
          </>
        ),
      },
      {
        id: "input",
        title: "Input",
        content: (
          <>
            <p>
              Input components handle user text entry with built-in validation
              and error handling.
            </p>
            <p>
              They support various types including text, email, password, and
              number inputs.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "utilities",
    title: "Utilities",
    content: (
      <>
        <p>
          Our utility functions help you perform common operations without
          reinventing the wheel.
        </p>
        <p>
          From date formatting to string manipulation, these utilities are
          tree-shakeable and TypeScript-ready.
        </p>
      </>
    ),
  },
  {
    id: "deployment",
    title: "Deployment",
    content: (
      <>
        <p>
          Deploying your application is straightforward with our CLI tools. We
          support multiple deployment targets including Vercel, AWS, and
          self-hosted options.
        </p>
        <p>
          Follow our deployment checklist to ensure a smooth production release.
        </p>
      </>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <TocLayout sections={sections} />
      </div>
    </div>
  );
}
