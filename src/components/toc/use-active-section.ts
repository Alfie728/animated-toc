"use client";

import { useEffect, useState } from "react";

export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const handleScroll = () => {
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 50;

      if (scrolledToBottom) {
        setActiveId(sectionIds[sectionIds.length - 1]);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const scrolledToBottom =
          window.innerHeight + window.scrollY >= document.body.scrollHeight - 50;
        if (scrolledToBottom) return;

        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          const sorted = visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      },
    );

    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sectionIds]);

  return activeId;
}
