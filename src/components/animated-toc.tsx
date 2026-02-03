"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef } from "react";

export interface TocItem {
  id: string;
  title: string;
  children?: TocItem[];
}

interface FlatTocItem {
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
const PADDING = 8;

function flattenItems(items: TocItem[], level = 0): FlatTocItem[] {
  return items.flatMap((item) => [
    { id: item.id, title: item.title, level },
    ...(item.children ? flattenItems(item.children, level + 1) : []),
  ]);
}

interface PathData {
  d: string;
  length: number;
  itemLengths: number[];
  points: { x: number; y: number; length: number }[];
}

function generatePath(items: FlatTocItem[], minLevel: number): PathData {
  const segments: string[] = [];
  const points: { x: number; y: number; length: number }[] = [];
  const itemLengths: number[] = [];
  let length = 0;
  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i < items.length; i++) {
    const indent = (items[i].level - minLevel) * INDENT_STEP;
    const x = 1 + indent;
    const top = i * ITEM_HEIGHT + PADDING;
    const bottom = (i + 1) * ITEM_HEIGHT - PADDING;
    const center = (top + bottom) / 2;

    if (i === 0) {
      segments.push(`M${x} ${top}`);
      prevX = x;
      prevY = top;
    } else {
      // Diagonal from previous bottom to this top
      const dx = x - prevX;
      const dy = top - prevY;
      length += Math.sqrt(dx * dx + dy * dy);
      segments.push(`L${x} ${top}`);
    }

    // Store point at top of item
    points.push({ x, y: top, length });

    // Vertical line to center (where item length is measured)
    const toCenter = center - top;
    itemLengths.push(length + toCenter);

    // Store point at center
    points.push({ x, y: center, length: length + toCenter });

    // Vertical line to bottom
    const toBottom = bottom - top;
    length += toBottom;
    segments.push(`L${x} ${bottom}`);

    // Store point at bottom
    points.push({ x, y: bottom, length });

    prevX = x;
    prevY = bottom;
  }

  return { d: segments.join(" "), length, itemLengths, points };
}

function getPointAtLength(
  points: { x: number; y: number; length: number }[],
  targetLength: number,
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (targetLength <= 0) return { x: points[0].x, y: points[0].y };

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    if (targetLength <= curr.length) {
      const segmentLength = curr.length - prev.length;
      const t = segmentLength > 0 ? (targetLength - prev.length) / segmentLength : 0;
      return {
        x: prev.x + (curr.x - prev.x) * t,
        y: prev.y + (curr.y - prev.y) * t,
      };
    }
  }

  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

export function AnimatedToc({ items, activeId }: AnimatedTocProps) {
  const flatItems = useMemo(() => flattenItems(items), [items]);
  const minLevel = Math.min(...flatItems.map((item) => item.level));

  const { d: pathD, length: pathLength, itemLengths, points } = useMemo(
    () => generatePath(flatItems, minLevel),
    [flatItems, minLevel],
  );

  const totalHeight = flatItems.length * ITEM_HEIGHT;

  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const idx = flatItems.findIndex((item) => item.id === activeId);
    return idx !== -1 ? idx : 0;
  }, [activeId, flatItems]);

  const currentLength = useMotionValue(itemLengths[0] ?? 0);
  const smoothLength = useSpring(currentLength, { bounce: 0 });
  const dashOffset = useTransform(smoothLength, (length) => pathLength - length);

  const dotX = useMotionValue(points[0]?.x ?? 1);
  const dotY = useMotionValue(points[0]?.y ?? PADDING);

  // Track click-initiated scrolling to avoid conflicts with scroll-based updates
  const isClickScrolling = useRef(false);

  useEffect(() => {
    if (isClickScrolling.current) return;
    currentLength.set(itemLengths[activeIndex] ?? 0);
  }, [activeIndex, itemLengths, currentLength]);

  useEffect(() => {
    return smoothLength.on("change", (length) => {
      const point = getPointAtLength(points, length);
      dotX.set(point.x);
      dotY.set(point.y);
    });
  }, [smoothLength, points, dotX, dotY]);

  const handleClick = (id: string, index: number) => {
    isClickScrolling.current = true;
    currentLength.set(itemLengths[index] ?? 0);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    // Reset after scroll animation completes
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 1000);
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
              d={pathD}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
          </svg>

          <motion.div
            className="absolute w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ left: dotX, top: dotY }}
          />
        </div>

        <ul className="flex flex-col">
          {flatItems.map((item, index) => (
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
