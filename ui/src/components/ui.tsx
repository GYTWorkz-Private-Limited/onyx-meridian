import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-xl border border-neutral-800 bg-neutral-900/50 p-5", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-400 uppercase">{children}</h2>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "ghost", className, ...props }: BtnProps) {
  const styles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500",
    ghost: "bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border-neutral-700",
    danger: "bg-red-900/60 hover:bg-red-800 text-red-100 border-red-800",
  }[variant];
  return (
    <button
      className={cx(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        styles,
        className,
      )}
      {...props}
    />
  );
}

const STATUS_COLORS: Record<string, string> = {
  // employee
  draft: "bg-neutral-700 text-neutral-200",
  configured: "bg-sky-900 text-sky-200",
  deployed: "bg-emerald-900 text-emerald-200",
  suspended: "bg-amber-900 text-amber-200",
  retired: "bg-neutral-800 text-neutral-400",
  // unit
  onboarding: "bg-sky-900 text-sky-200",
  active: "bg-emerald-900 text-emerald-200",
  // tasks
  open: "bg-sky-900 text-sky-200",
  in_progress: "bg-indigo-900 text-indigo-200",
  blocked: "bg-amber-900 text-amber-200",
  done: "bg-emerald-900 text-emerald-200",
  missed: "bg-red-900 text-red-200",
  cancelled: "bg-neutral-800 text-neutral-400",
  // autonomy
  shadow: "bg-neutral-700 text-neutral-200",
  assist: "bg-sky-900 text-sky-200",
  supervised: "bg-indigo-900 text-indigo-200",
  autonomous: "bg-emerald-900 text-emerald-200",
  pending: "bg-amber-900 text-amber-200",
};

export function Pill({ value }: { value: string }) {
  return (
    <span className={cx("inline-block rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[value] ?? "bg-neutral-700 text-neutral-200")}>
      {value}
    </span>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
      <div className="text-2xl font-semibold text-neutral-100">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-indigo-500",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-indigo-500",
        props.className,
      )}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">{children}</div>;
}
