import { useId, useMemo, useState } from 'react';

import { formatDuration } from '@/utils/format-duration';

type ExamUsageSeriesItem = {
  weekStart: string;
  averageTimeSeconds: number;
};

type ExamUsage = {
  averageTimeSeconds: number;
  series: ExamUsageSeriesItem[];
};

type ExamUsageCardProps = {
  examUsage: ExamUsage;
};

function formatWeekDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function createSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

type ChartPoint = {
  x: number;
  y: number;
  label: string;
  value: number;
};

export function ExamUsageCard({ examUsage }: ExamUsageCardProps) {
  const gradientId = useId();
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  const chartData = useMemo(() => {
    return [...examUsage.series].sort(
      (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    );
  }, [examUsage.series]);

  const points = useMemo(() => {
    const width = 420;
    const height = 120;
    const paddingX = 4;
    const paddingY = 12;

    if (chartData.length === 0) return [];

    const values = chartData.map((item) => item.averageTimeSeconds);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const range = maxValue - minValue || 1;

    return chartData.map((item, index) => {
      const x =
        chartData.length === 1
          ? width / 2
          : paddingX + (index * (width - paddingX * 2)) / (chartData.length - 1);

      const normalized = (item.averageTimeSeconds - minValue) / range;

      const y = height - paddingY - normalized * (height - paddingY * 2);

      return {
        x,
        y,
        label: item.weekStart,
        value: item.averageTimeSeconds,
      };
    });
  }, [chartData]);

  const linePath = createSmoothPath(points);

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`
      : '';

  return (
    <section className="w-full rounded-[24px] bg-white px-7 py-7">
      <div>
        <strong className="text-[28px] font-bold leading-none text-black">
          {formatDuration(examUsage.averageTimeSeconds)}
        </strong>

        <p className="mt-2 text-lg font-medium text-[#4F4F4F]">Tempo médio em simulados</p>
      </div>

      <div className="relative mt-6 h-[130px] w-full">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#777]">
            Sem dados para exibir
          </div>
        ) : (
          <>
            <svg viewBox="0 0 420 120" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563FF" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563FF" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d={areaPath} fill={`url(#${gradientId})`} />

              <path
                d={linePath}
                fill="none"
                stroke="#2563FF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {points.map((point) => {
                const isHovered = hoveredPoint?.label === point.label;

                return (
                  <g key={point.label}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      className="cursor-pointer fill-transparent"
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />

                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isHovered ? 5 : 3}
                      className="pointer-events-none fill-[#2563FF] transition-[r] duration-150"
                    />
                  </g>
                );
              })}
            </svg>

            {hoveredPoint && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[#1F1F1F] px-3 py-2 text-xs text-white shadow-lg"
                style={{
                  left: `${(hoveredPoint.x / 420) * 100}%`,
                  top: `${(hoveredPoint.y / 120) * 100}%`,
                  marginTop: -10,
                }}
              >
                <p className="font-semibold">{formatWeekDate(hoveredPoint.label)}</p>
                <p className="mt-0.5 text-[#CFCFCF]">{formatDuration(hoveredPoint.value)}</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
