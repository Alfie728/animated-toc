"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

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

export function AnimatedToc({ items, activeId }: AnimatedTocProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (activeId) {
      const index = items.findIndex((item) => item.id === activeId);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [activeId, items]);

  const minLevel = Math.min(...items.map((item) => item.level));

  // Generate SVG path data and calculate lengths to each item
  const { fullPath, totalHeight, itemLengths } = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const lengths: number[] = [];
    let d = "";
    const height = items.length * ITEM_HEIGHT;

    items.forEach((item, index) => {
      const indent = (item.level - minLevel) * INDENT_STEP;
      const x = PATH_WIDTH - 1 - indent;
      const y = index * ITEM_HEIGHT + ITEM_HEIGHT / 2;

      positions.push({ x, y });

      if (index === 0) {
        d += `M${x} 0 L${x} ${y}`;
      } else {
        const prevPos = positions[index - 1];
        if (prevPos.x !== x) {
          const midY = (prevPos.y + y) / 2;
          d += ` L${prevPos.x} ${midY - 8} Q${prevPos.x} ${midY} ${x} ${midY} L${x} ${y}`;
        } else {
          d += ` L${x} ${y}`;
        }
      }
    });

    // Extend to bottom
    const lastPos = positions[positions.length - 1];
    d += ` L${lastPos.x} ${height}`;

    return {
      fullPath: d,
      totalHeight: height,
      itemLengths: lengths,
    };
  }, [items, minLevel]);

  // Measure path length and lengths to each point after render
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Calculate the length along path to each TOC item
  const itemPathLengths = useMemo(() => {
    if (!pathRef.current || pathLength === 0) return items.map(() => 0);

    const lengths: number[] = [];
    const path = pathRef.current;
    const totalLen = path.getTotalLength();

    items.forEach((item, index) => {
      const indent = (item.level - minLevel) * INDENT_STEP;
      const targetX = PATH_WIDTH - 1 - indent;
      const targetY = index * ITEM_HEIGHT + ITEM_HEIGHT / 2;

      // Binary search to find the length along path closest to target point
      let low = 0;
      let high = totalLen;
      let bestLen = 0;
      let bestDist = Infinity;

      for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const point = path.getPointAtLength(mid);
        const dist = Math.abs(point.y - targetY) + Math.abs(point.x - targetX);

        if (dist < bestDist) {
          bestDist = dist;
          bestLen = mid;
        }

        if (point.y < targetY) {
          low = mid;
        } else {
          high = mid;
        }
      }

      lengths.push(bestLen);
    });

    return lengths;
  }, [items, pathLength, minLevel]);

  // Animated progress value
  const progress = useMotionValue(0);
  const springProgress = useSpring(progress, {
    bounce: 0,
  });

  // Update progress when active index changes
  useEffect(() => {
    if (itemPathLengths.length > 0 && pathLength > 0) {
      const targetLength = itemPathLengths[activeIndex] || 0;
      progress.set(targetLength);
    }
  }, [activeIndex, itemPathLengths, pathLength, progress]);

  // Derive stroke dashoffset from spring progress
  const dashOffset = useTransform(
    springProgress,
    (value) => pathLength - value,
  );

  // Derive dot position from spring progress
  const dotX = useMotionValue(PATH_WIDTH - 1);
  const dotY = useMotionValue(ITEM_HEIGHT / 2);

  useEffect(() => {
    const unsubscribe = springProgress.on("change", (value) => {
      if (pathRef.current && pathLength > 0) {
        const point = pathRef.current.getPointAtLength(value);
        dotX.set(point.x);
        dotY.set(point.y - ITEM_HEIGHT / 2);
      }
    });
    return unsubscribe;
  }, [springProgress, pathLength, dotX, dotY]);

  const handleClick = (id: string, index: number) => {
    setActiveIndex(index);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
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
        {/* SVG Path */}
        <div className="relative flex-shrink-0" style={{ width: PATH_WIDTH }}>
          <svg
            className="absolute top-0 left-0 overflow-visible"
            width={PATH_WIDTH}
            height={totalHeight}
            viewBox={`0 0 ${PATH_WIDTH} ${totalHeight}`}
          >
            {/* Background path (gray) */}
            <path
              ref={pathRef}
              d={fullPath}
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Progress path (dark) - animated with dashoffset */}
            {pathLength > 0 && (
              <motion.path
                d={fullPath}
                stroke="currentColor"
                className="text-zinc-400 dark:text-zinc-500"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                style={{ strokeDashoffset: dashOffset }}
              />
            )}
          </svg>

          {/* Animated dot that follows the path */}
          {pathLength > 0 && (
            <motion.div
              className="absolute w-2 h-2 bg-zinc-900 dark:bg-zinc-100 rounded-full"
              style={{
                x: dotX,
                y: dotY,
                translateX: "-50%",
                translateY: "-50%",
              }}
            />
          )}
        </div>

        {/* TOC Items */}
        <ul className="flex flex-col">
          {items.map((item, index) => {
            const indent = (item.level - minLevel) * INDENT_STEP;

            return (
              <li key={item.id} style={{ height: ITEM_HEIGHT }}>
                <button
                  type="button"
                  onClick={() => handleClick(item.id, index)}
                  className={`flex items-center h-full text-sm transition-colors duration-200 hover:text-zinc-900 dark:hover:text-zinc-100 ${
                    activeIndex === index
                      ? "text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                  style={{ paddingLeft: 12 + indent }}
                >
                  {item.title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
