"use client";

import { useId } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Bucket } from "@/server/modules/admin/reports/report-period";
import type { SeriesPoint } from "@/server/modules/admin/reports/reports-admin.service";

import { axisTick, bucketLabel, bucketTick, formatValue, type ValueKind } from "./report-format";

export interface ChartSeries {
  key: string;
  label: string;
  /** `bar` for per-bucket amounts, `line` for levels/trends (drawn with a 10% wash). */
  mark: "bar" | "line";
  /** Fixed categorical slot: identity never changes with what else is shown. */
  slot: 1 | 2 | 3;
}

const color = (slot: 1 | 2 | 3) => `var(--viz-${slot})`;

function Swatch({ mark, slot }: { mark: ChartSeries["mark"]; slot: ChartSeries["slot"] }) {
  return mark === "line" ? (
    <span aria-hidden className="inline-block h-0.5 w-3.5 rounded-full" style={{ background: color(slot) }} />
  ) : (
    <span aria-hidden className="inline-block size-2.5 rounded-[3px]" style={{ background: color(slot) }} />
  );
}

/**
 * One time series chart: one y-axis, one unit. Time runs right-to-left like
 * the page. A legend appears only for two or more series; a table view sits
 * under every chart.
 */
export function TrendChart({
  ariaLabel,
  bucket,
  height = 260,
  kind,
  points,
  series,
}: {
  ariaLabel: string;
  bucket: Bucket;
  height?: number;
  kind: ValueKind;
  points: SeriesPoint[];
  series: ChartSeries[];
}) {
  const tableId = useId();
  const data = points.map((point) => ({ key: point.key, last: point.last, ...point.values }));
  const empty = points.every((point) => series.every((item) => (point.values[item.key] ?? 0) === 0));

  return (
    <div className="reports-viz">
      {series.length > 1 ? (
        <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          {series.map((item) => (
            <li className="inline-flex items-center gap-1.5" key={item.key}>
              <Swatch mark={item.mark} slot={item.slot} />
              {item.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div aria-describedby={tableId} aria-label={ariaLabel} className="relative" role="img" style={{ height }}>
        {empty ? (
          <p className="absolute inset-0 z-10 flex items-center justify-center text-[12.5px] text-muted-foreground">
            در این بازه داده‌ای ثبت نشده است.
          </p>
        ) : null}
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart barCategoryGap="22%" barGap={2} data={data} margin={{ bottom: 0, left: 4, right: 0, top: 8 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="key"
              interval="preserveStartEnd"
              minTickGap={18}
              reversed
              tick={{ fill: "var(--viz-axis)", fontSize: 11 }}
              tickFormatter={(value: string) => bucketTick(value, bucket)}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={kind !== "count"}
              axisLine={false}
              orientation="right"
              tick={{ fill: "var(--viz-axis)", fontSize: 11 }}
              tickFormatter={(value: number) => axisTick(value)}
              tickLine={false}
              tickMargin={6}
              width={kind === "money" ? 56 : 40}
            />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as { key: string; last: string } | undefined;
                if (!active || !row) return null;
                return (
                  <div className="min-w-44 rounded-xl border border-border bg-popover px-3 py-2.5 text-[12px] text-popover-foreground shadow-[var(--a-shadow-pop)]" dir="rtl">
                    <p className="mb-1.5 font-bold">{bucketLabel(row.key, row.last, bucket)}</p>
                    <ul className="grid gap-1">
                      {series.map((item) => (
                        <li className="flex items-center justify-between gap-4" key={item.key}>
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Swatch mark={item.mark} slot={item.slot} />
                            {item.label}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatValue(kind, Number((row as Record<string, unknown>)[item.key] ?? 0))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }}
              cursor={series.some((item) => item.mark === "bar") ? { fill: "var(--viz-grid)", opacity: 0.6 } : { stroke: "var(--viz-axis)", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            {series.map((item) =>
              item.mark === "bar" ? (
                <Bar
                  dataKey={item.key}
                  fill={color(item.slot)}
                  isAnimationActive={false}
                  key={item.key}
                  maxBarSize={24}
                  name={item.label}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                <Area
                  activeDot={{ fill: color(item.slot), r: 4, stroke: "var(--viz-surface)", strokeWidth: 2 }}
                  dataKey={item.key}
                  dot={false}
                  fill={color(item.slot)}
                  fillOpacity={series.length > 1 ? 0 : 0.1}
                  isAnimationActive={false}
                  key={item.key}
                  name={item.label}
                  stroke={color(item.slot)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <details className="group mt-2" id={tableId}>
        <summary className="w-fit cursor-pointer list-none rounded text-[11.5px] font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <span className="group-open:hidden">نمایش جدول داده‌ها</span>
          <span className="hidden group-open:inline">پنهان کردن جدول</span>
        </summary>
        <div className="admin-scroll mt-2 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-raised">
              <tr className="text-right text-muted-foreground">
                <th className="px-3 py-2 font-semibold" scope="col">بازه</th>
                {series.map((item) => (
                  <th className="px-3 py-2 font-semibold" key={item.key} scope="col">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr className="border-t border-line" key={point.key}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{bucketLabel(point.key, point.last, bucket)}</td>
                  {series.map((item) => (
                    <td className="px-3 py-1.5 tabular-nums" key={item.key}>
                      {formatValue(kind, point.values[item.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
