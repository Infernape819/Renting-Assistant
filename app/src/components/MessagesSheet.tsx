import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Megaphone, Receipt, Sparkles, Info, CheckCheck } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { cn } from "@/lib/utils";
import { mdLabel } from "@/lib/calc";
import type { MsgType } from "@/types";

const TYPE_META: Record<MsgType, { label: string; icon: React.ReactNode; cls: string }> = {
  bill: { label: "账单", icon: <Receipt className="h-4 w-4" />, cls: "bg-orange-100 text-orange-600" },
  duty: { label: "值日", icon: <Sparkles className="h-4 w-4" />, cls: "bg-emerald-100 text-emerald-600" },
  announce: { label: "公告", icon: <Megaphone className="h-4 w-4" />, cls: "bg-sky-100 text-sky-600" },
  system: { label: "系统", icon: <Info className="h-4 w-4" />, cls: "bg-stone-100 text-stone-500" },
};

export function MessagesSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { state, markAllMessagesRead } = useStore();
  const [filter, setFilter] = useState<"all" | MsgType>("all");
  const list = state.messages.filter((m) => filter === "all" || m.type === filter);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[360px] flex-col p-0 sm:max-w-[360px]">
        <SheetHeader className="border-b border-stone-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-1.5 text-base">
              <Bell className="h-4 w-4 text-orange-500" /> 消息中心
            </SheetTitle>
            <button
              onClick={() => markAllMessagesRead()}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-orange-500"
            >
              <CheckCheck className="h-3.5 w-3.5" /> 全部已读
            </button>
          </div>
        </SheetHeader>

        <div className="flex gap-1.5 px-4 py-2.5">
          {(["all", "bill", "duty", "announce", "system"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                filter === k ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-500"
              )}
            >
              {k === "all" ? "全部" : TYPE_META[k].label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
          {list.length === 0 && (
            <div className="py-16 text-center text-xs text-stone-400">暂无消息</div>
          )}
          {list.map((m) => {
            const meta = TYPE_META[m.type];
            return (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5 rounded-xl border p-3",
                  m.read ? "border-stone-100 bg-white" : "border-orange-200 bg-orange-50/50"
                )}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.cls)}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-stone-500">{meta.label}</span>
                    <span className="text-[10px] text-stone-400">{mdLabel(m.date)}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-700">{m.text}</p>
                </div>
                {!m.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
