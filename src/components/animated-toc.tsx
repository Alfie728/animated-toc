"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface AnimatedTocProps {
  items: TocItem[];
  activeId?: string;
}

const ITEM_HEIGHT = 32;
const PATH_WIDTH = 16;
const INDENT_STEP = 12;

function generatePath(items: TocItem[], minLevel: number) {
  const positions: { x: number; y: number }[] = [];
  const segments: string[] = [];
  const PADDING = 8; // Vertical padding to create room for diagonal transitions

  for (let i = 0; i < items.length; i++) {
    const indent = (items[i].level - minLevel) * INDENT_STEP;
    const x = 1 + indent;
    const top = i * ITEM_HEIGHT + PADDING;
    const bottom = (i + 1) * ITEM_HEIGHT - PADDING;

    positions.push({ x, y: (top + bottom) / 2 });

    if (i === 0) {
      segments.push(`M${x} ${top}`);
    } else {
      // Diagonal from previous item's bottom to this item's top
      segments.push(`L${x} ${top}`);
    }
    // Vertical line for this item
    segments.push(`L${x} ${bottom}`);
  }

  return { d: segments.join(" "), positions };
}

function findLengthAtPoint(
  path: SVGPathElement,
  targetY: number,
  totalLength: number,
) {
  let low = 0;
  let high = totalLength;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const point = path.getPointAtLength(mid);
    if (point.y < targetY) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

export function AnimatedToc({ items, activeId }: AnimatedTocProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const minLevel = Math.min(...items.map((item) => item.level));
  const { d: pathD, positions } = useMemo(
    () => generatePath(items, minLevel),
    [items, minLevel],
  );
  const totalHeight = items.length * ITEM_HEIGHT;

  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const idx = items.findIndex((item) => item.id === activeId);
    return idx !== -1 ? idx : 0;
  }, [activeId, items]);

  useLayoutEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const itemLengths = useMemo(() => {
    const path = pathRef.current;
    if (!path || pathLength === 0) return [];
    return positions.map((pos) => findLengthAtPoint(path, pos.y, pathLength));
  }, [positions, pathLength]);

  const progress = useMotionValue(0);
  const smoothProgress = useSpring(progress, { bounce: 0 });
  const dashOffset = useTransform(smoothProgress, (v) => pathLength - v);

  const dotX = useMotionValue(positions[0]?.x ?? PATH_WIDTH - 1);
  const dotY = useMotionValue(positions[0]?.y ?? ITEM_HEIGHT / 2);

  useEffect(() => {
    if (itemLengths.length > 0) {
      progress.set(itemLengths[activeIndex] ?? 0);
    }
  }, [activeIndex, itemLengths, progress]);

  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      const path = pathRef.current;
      if (path && pathLength > 0) {
        const point = path.getPointAtLength(v);
        dotX.set(point.x);
        dotY.set(point.y);
      }
    });
  }, [smoothProgress, pathLength, dotX, dotY]);

  const handleClick = (id: string, index: number) => {
    progress.set(itemLengths[index] ?? 0);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="relative select-none">
      <div className="flex items-center gap-2 mb-4 text-sm font-medium text-zinc-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        ON THIS PAGE
      </div>

      <div className="relative flex">
        <div className="relative flex-shrink-0" style={{ width: PATH_WIDTH }}>
          <svg
            className="absolute inset-0 overflow-visible"
            width={PATH_WIDTH}
            height={totalHeight}
            viewBox={`0 0 ${PATH_WIDTH} ${totalHeight}`}
          >
            <path
              ref={pathRef}
              d={pathD}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pathLength > 0 && (
              <motion.path
                d={pathD}
                className="stroke-zinc-400 dark:stroke-zinc-500"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                style={{ strokeDashoffset: dashOffset }}
              />
            )}
          </svg>

          {pathLength > 0 && (
            <motion.div
              className="absolute w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ left: dotX, top: dotY }}
            />
          )}
        </div>

        <ul className="flex flex-col">
          {items.map((item, index) => (
            <li key={item.id} style={{ height: ITEM_HEIGHT }}>
              <button
                type="button"
                onClick={() => handleClick(item.id, index)}
                className={`flex items-center h-full text-sm transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${
                  activeIndex === index
                    ? "text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                style={{
                  paddingLeft: 12 + (item.level - minLevel) * INDENT_STEP,
                }}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
