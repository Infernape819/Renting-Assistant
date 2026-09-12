import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, ScrollText, BadgeCheck, PenSquare } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava, Pill, SectionTitle } from "@/components/common";
import { cn } from "@/lib/utils";
import { mdLabel } from "@/lib/calc";

export default function PactPage() {
  const { state, me, setUi, confirmPact, markAnnounceRead } = useStore();
  const [tab, setTab] = useState<"pact" | "board">("pact");
  const [expanded, setExpanded] = useState<string | null>(null);
  const pactPending = !state.pactConfirmedBy.includes(me);

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 顶部 Tab */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1">
        {(
          [
            ["pact", "室友公约", <ScrollText key="i" className="h-4 w-4" />],
            ["board", "公告栏", <Megaphone key="i" className="h-4 w-4" />],
          ] as const
        ).map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition",
              tab === k ? "bg-white text-orange-600 shadow-sm" : "text-stone-500"
            )}
          >
            {icon}
            {label}
            {k === "board" && state.announcements.some((a) => !a.readBy.includes(me)) && (
              <span className="h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {tab === "pact" ? (
        <>
          {/* 版本与签署状态 */}
          <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-stone-800">公约 v{state.pactVersion}</div>
              <Pill tone={pactPending ? "red" : "green"}>
                {state.pactConfirmedBy.length}/{state.members.length} 已签署
              </Pill>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              {state.members.map((m) => {
                const ok = state.pactConfirmedBy.includes(m.id);
                return (
                  <div key={m.id} className="flex flex-col items-center gap-1">
                    <div className={cn("rounded-full p-0.5", ok ? "ring-2 ring-emerald-400" : "ring-2 ring-stone-200 opacity-60")}>
                      <Ava name={m.name} color={m.color} size={30} />
                    </div>
                    <span className="text-[10px] text-stone-400">{ok ? "已签" : "待签"}</span>
                  </div>
                );
              })}
            </div>
            {pactPending && (
              <Button
                className="mt-3 w-full gap-1.5"
                onClick={() => {
                  confirmPact();
                  toast.success("已签署公约 v" + state.pactVersion, { description: "签署记录已留档，全员可见" });
                }}
              >
                <BadgeCheck className="h-4 w-4" /> 我已阅读并确认公约 v{state.pactVersion}
              </Button>
            )}
          </div>

          {/* 条款列表 */}
          <SectionTitle>条款明细（{state.clauses.length}）</SectionTitle>
          <div className="space-y-2">
            {state.clauses.map((c) => (
              <button
                key={c.id}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-orange-100"
              >
                <div className="flex items-center gap-2">
                  <Pill tone="amber">{c.category}</Pill>
                  <span className="flex-1 text-[13px] font-semibold text-stone-800">{c.title}</span>
                  <span className="text-[10px] text-stone-300">{expanded === c.id ? "收起" : "展开"}</span>
                </div>
                {expanded === c.id && (
                  <p className="mt-2 border-t border-dashed border-stone-100 pt-2 text-xs leading-relaxed text-stone-500">
                    {c.text}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-center text-[11px] leading-relaxed text-stone-400">
            修订公约需全员同意后生效 · 每次修订自动生成新版本并重新签署
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setUi({ announce: true })}>
              <PenSquare className="h-3.5 w-3.5" /> 发公告
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {state.announcements.map((a) => {
              const author = state.members.find((m) => m.id === a.authorId)!;
              const read = a.readBy.includes(me);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    markAnnounceRead(a.id);
                    setExpanded(expanded === a.id ? null : a.id);
                  }}
                  className={cn(
                    "w-full rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1",
                    read ? "ring-orange-100" : "ring-sky-300"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Ava name={author.name} color={author.color} size={26} />
                    <span className="text-[11px] text-stone-400">
                      {author.name} · {mdLabel(a.date)}
                    </span>
                    <span className="flex-1" />
                    {!read && <Pill tone="blue">未读</Pill>}
                  </div>
                  <div className="mt-2 text-[13px] font-semibold text-stone-800">{a.title}</div>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-relaxed text-stone-500",
                      expanded === a.id ? "" : "line-clamp-2"
                    )}
                  >
                    {a.content}
                  </p>
                  <div className="mt-2 flex items-center gap-1 border-t border-dashed border-stone-100 pt-2">
                    <span className="text-[10px] text-stone-400">已读 {a.readBy.length}/{state.members.length}：</span>
                    {state.members.map((m) => (
                      <span key={m.id} className={cn("rounded-full", !a.readBy.includes(m.id) && "opacity-30 grayscale")}>
                        <Ava name={m.name} color={m.color} size={16} />
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
