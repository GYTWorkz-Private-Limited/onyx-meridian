import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  RadialBarChart, RadialBar, BarChart, Bar, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { BU_LIST } from "@/data/enterprise-data";
import type { Employee } from "@/data/workforce-intelligence-data";
import { skillsMatrix } from "@/data/workforce-intelligence-data";
import { Award, ShieldCheck } from "lucide-react";

const COLORS = ["hsl(228 71% 54%)", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function CapabilityRadar({ employees }: { employees: Employee[] }) {
  const data = BU_LIST.map((bu: any) => {
    const buEmployees = employees.filter((e) => e.buId === bu.id);
    const avg = buEmployees.length ? buEmployees.reduce((s, e) => s + e.performance, 0) / buEmployees.length : 0;
    return { bu: bu.name.replace(" Intelligence", ""), score: Math.round(avg) };
  });
  return (
    <Panel title="Department Capability Scores (Radar)">
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="bu" tick={{ fontSize: 9, fill: "#6B7280" }} />
          <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
          <Radar dataKey="score" stroke="hsl(228 71% 54%)" fill="hsl(228 71% 54%)" fillOpacity={0.25} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
        </RadarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function TreemapCell(props: any) {
  const { x, y, width, height, name, size, fill } = props;
  if (width < 2 || height < 2) return <g />;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.85} stroke="#fff" />
      {width > 60 && height > 24 && (
        <text x={x + 6} y={y + 16} fontSize={10} fill="#fff" fontWeight={700}>{name}</text>
      )}
      {width > 60 && height > 40 && (
        <text x={x + 6} y={y + 30} fontSize={9} fill="#fff">{size}</text>
      )}
    </g>
  );
}

function HeadcountTreemap({ employees }: { employees: Employee[] }) {
  const data = BU_LIST.map((bu: any, i: number) => ({
    name: bu.name.replace(" Intelligence", ""),
    size: employees.filter((e) => e.buId === bu.id).length,
    fill: COLORS[i % COLORS.length],
  }));
  return (
    <Panel title="Headcount by Business Unit (Treemap)">
      <ResponsiveContainer width="100%" height={200}>
        <Treemap data={data} dataKey="size" stroke="#fff" content={<TreemapCell />} />
      </ResponsiveContainer>
    </Panel>
  );
}

// Concentric-donut approximation of a sunburst: outer ring = BU, inner ring = status.
function OrgSunburst({ employees }: { employees: Employee[] }) {
  const outer = BU_LIST.map((bu: any, i: number) => ({ name: bu.name.replace(" Intelligence", ""), value: employees.filter((e) => e.buId === bu.id).length, fill: COLORS[i % COLORS.length] }));
  const statuses = ["active", "leave", "inactive"];
  const inner = statuses.map((s, i) => ({ name: s, value: employees.filter((e) => e.status === s).length, fill: ["#10b981", "#f59e0b", "#9ca3af"][i] }));
  return (
    <Panel title="Organization Structure (Sunburst approximation)">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={inner} dataKey="value" nameKey="name" innerRadius={0} outerRadius={40} stroke="#fff">
            {inner.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Pie data={outer} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} stroke="#fff">
            {outer.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function SalaryPerformanceScatter({ employees }: { employees: Employee[] }) {
  const sample = employees.filter((_, i) => i % 8 === 0).slice(0, 150);
  const data = sample.map((e) => ({ x: e.performance, y: e.salaryUsd / 1000, z: e.utilization }));
  return (
    <Panel title="Salary vs Performance (Scatter)">
      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" dataKey="x" name="Performance" unit="%" tick={{ fontSize: 9 }} />
          <YAxis type="number" dataKey="y" name="Salary" unit="k" tick={{ fontSize: 9 }} />
          <ZAxis type="number" dataKey="z" range={[20, 120]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 2 }} />
          <Scatter data={data} fill="hsl(228 71% 54%)" fillOpacity={0.6} />
        </ScatterChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function EngagementGauge({ employees }: { employees: Employee[] }) {
  const avg = Math.round(employees.reduce((s, e) => s + e.engagement, 0) / Math.max(1, employees.length));
  const data = [{ name: "Engagement", value: avg, fill: "hsl(228 71% 54%)" }];
  return (
    <Panel title="Engagement Score (Gauge)">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart data={data} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" background cornerRadius={4} max={100} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-14 text-2xl font-bold font-mono text-primary">{avg}%</div>
    </Panel>
  );
}

function CircularProgress({ pct, label }: { pct: number; label: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="#E5E7EB" strokeWidth={8} />
        <circle cx={45} cy={45} r={r} fill="none" stroke="hsl(228 71% 54%)" strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round"
          transform="rotate(-90 45 45)" />
        <text x={45} y={50} textAnchor="middle" fontSize={16} fontWeight={700} fill="hsl(228 71% 54%)">{pct}%</text>
      </svg>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function TrainingCompletion() {
  return (
    <Panel title="Training Completion (Circular Progress)">
      <div className="flex items-center justify-around">
        <CircularProgress pct={82} label="Overall" />
        <CircularProgress pct={94} label="Compliance" />
        <CircularProgress pct={61} label="Skills Dev" />
      </div>
    </Panel>
  );
}

function PerformanceDistribution({ employees }: { employees: Employee[] }) {
  const bins = [0, 0, 0, 0, 0]; // <60,60-70,70-80,80-90,90+
  employees.forEach((e) => {
    if (e.performance < 60) bins[0]++;
    else if (e.performance < 70) bins[1]++;
    else if (e.performance < 80) bins[2]++;
    else if (e.performance < 90) bins[3]++;
    else bins[4]++;
  });
  const data = ["<60", "60-70", "70-80", "80-90", "90+"].map((label, i) => ({ label, count: bins[i] }));
  return (
    <Panel title="Performance Distribution (Violin approximation)">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
          <Bar dataKey="count" fill="hsl(228 71% 54%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function SkillComparison() {
  const data = skillsMatrix().slice(0, 6);
  return (
    <Panel title="Skill Demand vs Availability (Parallel-coordinates approximation)">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9 }} />
          <YAxis type="category" dataKey="skill" tick={{ fontSize: 9 }} width={110} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
          <Bar dataKey="demand" name="Demand" fill="hsl(228 71% 54%)" radius={[0, 3, 3, 0]} />
          <Bar dataKey="availability" name="Availability" fill="#10b981" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

const PROMOTIONS = [
  { name: "Sofia Rossi", from: "Analyst", to: "Senior Analyst", date: "2026-06-14" },
  { name: "Kenji Sato", from: "Engineer", to: "Lead Engineer", date: "2026-05-22" },
  { name: "Priya Anand", from: "Coordinator", to: "Specialist", date: "2026-04-30" },
  { name: "Diego Silva", from: "Associate", to: "Analyst", date: "2026-03-11" },
];

function PromotionTimeline() {
  return (
    <Panel title="Promotion History (Animated Timeline)">
      <div className="space-y-3">
        {PROMOTIONS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-semibold text-foreground">{p.name}</span>
              <span className="text-muted-foreground"> · {p.from} → {p.to}</span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{p.date}</span>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

export function AdvancedVisualizations({ employees }: { employees: Employee[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Award size={14} className="text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Advanced Visualizations</span>
        <ShieldCheck size={11} className="text-muted-foreground ml-1" />
        <span className="text-[9px] text-muted-foreground">approximated with Recharts — no extra chart libraries</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <CapabilityRadar employees={employees} />
        <HeadcountTreemap employees={employees} />
        <OrgSunburst employees={employees} />
        <SalaryPerformanceScatter employees={employees} />
        <EngagementGauge employees={employees} />
        <TrainingCompletion />
        <PerformanceDistribution employees={employees} />
        <SkillComparison />
        <PromotionTimeline />
      </div>
    </div>
  );
}
