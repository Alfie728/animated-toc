"use client";

import { useEffect, useState } from "react";

export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible section from the top
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Sort by position in the document and take the topmost
          const sorted = visibleEntries.sort((a, b) => {
            const aRect = a.boundingClientRect;
            const bRect = b.boundingClientRect;
            return aRect.top - bRect.top;
          });

          setActiveId(sorted[0].target.id);
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all sections
    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}
