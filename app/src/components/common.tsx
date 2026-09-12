import React from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/** 圆形昵称头像 */
export function Ava({
  name,
  color,
  size = 32,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className
      )}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 页面顶部栏：空间名 + 消息铃铛 */
export function TopBar({
  title,
  subtitle,
  unread,
  onBell,
}: {
  title: string;
  subtitle?: string;
  unread: number;
  onBell: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-orange-100 bg-[#fffaf3]/95 px-4 py-3 backdrop-blur">
      <div>
        <div className="text-[15px] font-bold text-stone-800">{title}</div>
        {subtitle && <div className="text-[11px] text-stone-400">{subtitle}</div>}
      </div>
      <button
        onClick={onBell}
        className="relative rounded-full bg-white p-2 shadow-sm ring-1 ring-orange-100 active:scale-95"
        aria-label="消息中心"
      >
        <Bell className="h-5 w-5 text-stone-600" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </header>
  );
}

/** 区块标题 */
export function SectionTitle({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-700">
        <span className="inline-block h-3.5 w-1 rounded-full bg-orange-400" />
        {children}
      </div>
      {extra}
    </div>
  );
}

/** 状态小徽章 */
export function Pill({
  tone = "gray",
  children,
}: {
  tone?: "green" | "red" | "amber" | "gray" | "blue";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    red: "bg-red-50 text-red-500 ring-red-200",
    amber: "bg-amber-50 text-amber-600 ring-amber-200",
    blue: "bg-sky-50 text-sky-600 ring-sky-200",
    gray: "bg-stone-100 text-stone-500 ring-stone-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", map[tone])}>
      {children}
    </span>
  );
}
