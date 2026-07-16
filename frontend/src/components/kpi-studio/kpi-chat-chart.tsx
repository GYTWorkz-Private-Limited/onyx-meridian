import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import type { KpiChartSpec } from "@/lib/api";

// Fixed categorical order (never cycled/reassigned per render) — blue, aqua, yellow.
const SERIES_COLORS = ["#2a78d6", "#1baf7a", "#eda100"];
const MAX_ROWS = 20;
const MAX_PIE_SLICES = 6;

const AXIS_TICK = { fontSize: 9, fill: "#898781" };
const TOOLTIP_STYLE = { fontSize: 10, borderRadius: 2, border: "1px solid #e1e0d9" };
const TICK_MAX_CHARS = 9;

function truncateTick(value: string): string {
  return value.length > TICK_MAX_CHARS ? `${value.slice(0, TICK_MAX_CHARS - 1)}…` : value;
}

export function KpiChatChart({ spec, data }: { spec: KpiChartSpec; data: Record<string, unknown>[] }) {
  const rows = data.slice(0, spec.type === "pie" ? MAX_PIE_SLICES : MAX_ROWS);
  if (rows.length === 0) return null;

  // The chat bubble is ~330px wide — horizontal x-axis labels always overlap once
  // there's more than a couple of categories, so bar/line always angle + truncate them;
  // the tooltip still shows the untruncated value on hover.

  return (
    <div className="mt-2 bg-white border border-border rounded-sm p-2">
      {spec.title && (
        <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{spec.title}</div>
      )}
      <ResponsiveContainer width="100%" height={190}>
        {spec.type === "pie" ? (
          <PieChart>
            <Pie
              data={rows}
              dataKey={spec.yKeys[0]}
              nameKey={spec.xKey}
              innerRadius={28}
              outerRadius={55}
              strokeWidth={2}
              stroke="#fcfcfb"
            >
              {rows.map((_, i) => <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
          </PieChart>
        ) : spec.type === "line" ? (
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
            <CartesianGrid stroke="#e1e0d9" vertical={false} />
            <XAxis
              dataKey={spec.xKey} tick={AXIS_TICK} axisLine={{ stroke: "#c3c2b7" }} tickLine={false}
              interval={0} angle={-45} textAnchor="end" height={56} tickFormatter={truncateTick}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {spec.yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 9 }} />}
            {spec.yKeys.map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
            <CartesianGrid stroke="#e1e0d9" vertical={false} />
            <XAxis
              dataKey={spec.xKey} tick={AXIS_TICK} axisLine={{ stroke: "#c3c2b7" }} tickLine={false}
              interval={0} angle={-45} textAnchor="end" height={56} tickFormatter={truncateTick}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {spec.yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 9 }} />}
            {spec.yKeys.map((k, i) => (
              <Bar key={k} dataKey={k} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
