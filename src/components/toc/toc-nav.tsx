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
  depth: number;
}

interface TocNavProps {
  items: TocItem[];
  activeId?: string;
}

const ITEM_HEIGHT = 32;
const PATH_WIDTH = 16;
const INDENT_PER_LEVEL = 12;
const VERTICAL_PADDING = 8;

function flattenItems(items: TocItem[], depth = 0): FlatTocItem[] {
  return items.flatMap((item) => [
    { id: item.id, title: item.title, depth },
    ...(item.children ? flattenItems(item.children, depth + 1) : []),
  ]);
}

interface PathGeometry {
  svgPath: string;
  totalLength: number;
  lengthToItemCenter: number[];
  points: { x: number; y: number; lengthAtPoint: number }[];
}

function computePathGeometry(
  items: FlatTocItem[],
  minDepth: number,
): PathGeometry {
  const pathSegments: string[] = [];
  const points: { x: number; y: number; lengthAtPoint: number }[] = [];
  const lengthToItemCenter: number[] = [];
  let accumulatedLength = 0;
  let prevX = 0;
  let prevY = 0;

  for (let i = 0; i < items.length; i++) {
    const indent = (items[i].depth - minDepth) * INDENT_PER_LEVEL;
    const x = 1 + indent;
    const itemTop = i * ITEM_HEIGHT + VERTICAL_PADDING;
    const itemBottom = (i + 1) * ITEM_HEIGHT - VERTICAL_PADDING;
    const itemCenter = (itemTop + itemBottom) / 2;

    if (i === 0) {
      pathSegments.push(`M${x} ${itemTop}`);
      prevX = x;
      prevY = itemTop;
    } else {
      const deltaX = x - prevX;
      const deltaY = itemTop - prevY;
      const diagonalLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      accumulatedLength += diagonalLength;
      pathSegments.push(`L${x} ${itemTop}`);
    }

    points.push({ x, y: itemTop, lengthAtPoint: accumulatedLength });

    const distanceToCenter = itemCenter - itemTop;
    lengthToItemCenter.push(accumulatedLength + distanceToCenter);

    points.push({
      x,
      y: itemCenter,
      lengthAtPoint: accumulatedLength + distanceToCenter,
    });

    const itemSegmentHeight = itemBottom - itemTop;
    accumulatedLength += itemSegmentHeight;
    pathSegments.push(`L${x} ${itemBottom}`);

    points.push({ x, y: itemBottom, lengthAtPoint: accumulatedLength });

    prevX = x;
    prevY = itemBottom;
  }

  return {
    svgPath: pathSegments.join(" "),
    totalLength: accumulatedLength,
    lengthToItemCenter,
    points,
  };
}

function interpolatePointOnPath(
  points: { x: number; y: number; lengthAtPoint: number }[],
  targetLength: number,
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (targetLength <= 0) return { x: points[0].x, y: points[0].y };

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currPoint = points[i];

    if (targetLength <= currPoint.lengthAtPoint) {
      const segmentLength = currPoint.lengthAtPoint - prevPoint.lengthAtPoint;
      const ratio =
        segmentLength > 0
          ? (targetLength - prevPoint.lengthAtPoint) / segmentLength
          : 0;
      return {
        x: prevPoint.x + (currPoint.x - prevPoint.x) * ratio,
        y: prevPoint.y + (currPoint.y - prevPoint.y) * ratio,
      };
    }
  }

  const lastPoint = points[points.length - 1];
  return { x: lastPoint.x, y: lastPoint.y };
}

export function TocNav({ items, activeId }: TocNavProps) {
  const flatItems = useMemo(() => flattenItems(items), [items]);
  const minDepth = Math.min(...flatItems.map((item) => item.depth));

  const { svgPath, totalLength, lengthToItemCenter, points } = useMemo(
    () => computePathGeometry(flatItems, minDepth),
    [flatItems, minDepth],
  );

  const containerHeight = flatItems.length * ITEM_HEIGHT;

  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const index = flatItems.findIndex((item) => item.id === activeId);
    return index !== -1 ? index : 0;
  }, [activeId, flatItems]);

  const targetLength = useMotionValue(lengthToItemCenter[0] ?? 0);
  const animatedLength = useSpring(targetLength, { bounce: 0 });
  const strokeDashOffset = useTransform(
    animatedLength,
    (length) => totalLength - length,
  );

  const dotX = useMotionValue(points[0]?.x ?? 1);
  const dotY = useMotionValue(points[0]?.y ?? VERTICAL_PADDING);

  const isScrollingFromClick = useRef(false);

  useEffect(() => {
    if (isScrollingFromClick.current) return;
    targetLength.set(lengthToItemCenter[activeIndex] ?? 0);
  }, [activeIndex, lengthToItemCenter, targetLength]);

  useEffect(() => {
    return animatedLength.on("change", (length) => {
      const point = interpolatePointOnPath(points, length);
      dotX.set(point.x);
      dotY.set(point.y - 1); // Adjust for dot center
    });
  }, [animatedLength, points, dotX, dotY]);

  const handleItemClick = (id: string, index: number) => {
    isScrollingFromClick.current = true;
    targetLength.set(lengthToItemCenter[index] ?? 0);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      isScrollingFromClick.current = false;
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
          aria-hidden="true"
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
            height={containerHeight}
            viewBox={`0 0 ${PATH_WIDTH} ${containerHeight}`}
            aria-hidden="true"
          >
            <path
              d={svgPath}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <motion.path
              d={svgPath}
              className="stroke-zinc-400 dark:stroke-zinc-500"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={totalLength}
              style={{ strokeDashoffset: strokeDashOffset }}
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
                onClick={() => handleItemClick(item.id, index)}
                className={`flex items-center h-full text-sm transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 ${
                  activeIndex === index
                    ? "text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                style={{
                  paddingLeft: 12 + (item.depth - minDepth) * INDENT_PER_LEVEL,
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
