import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, RefreshCcw, ClipboardCheck } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava, Pill, SectionTitle } from "@/components/common";
import { addDays, mdLabel, mondayOf, todayStr } from "@/lib/calc";
import type { DutySlot } from "@/types";

export default function CleaningPage() {
  const { state, me, setUi } = useStore();
  const [weekOffset, setWeekOffset] = useState(0); // 0=本周
  const monday = addDays(mondayOf(todayStr()), weekOffset * 7);
  const weekSlots = state.slots.filter((s) => s.date === monday);
  const [swapSlot, setSwapSlot] = useState<DutySlot | null>(null);

  const mySlots = state.slots.filter((s) => s.memberId === me);
  const myDone = mySlots.filter((s) => s.status === "done").length;
  const myRate = mySlots.length ? Math.round((myDone / mySlots.length) * 100) : 0;

  const pendingToMe = state.swaps.filter((r) => r.toId === me && r.status === "pending");
  const pendingMine = state.swaps.filter((r) => r.fromId === me && r.status === "pending");

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 周切换 */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="rounded-full p-1.5 text-stone-400 active:bg-stone-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-bold text-stone-700">
          {weekOffset === 0 ? "本周" : weekOffset === 1 ? "下周" : weekOffset === -1 ? "上周" : `${mdLabel(monday)} 起一周`}
          <span className="ml-1.5 text-[11px] font-normal text-stone-400">{mdLabel(monday)} – {mdLabel(addDays(monday, 6))}</span>
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="rounded-full p-1.5 text-stone-400 active:bg-stone-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 值日日历（周视图） */}
      <div className="mt-3 space-y-2">
        {weekSlots.map((s) => (
          <SlotCard key={s.id} slot={s} weekOffset={weekOffset} onSwap={() => setSwapSlot(s)} />
        ))}
      </div>

      {/* 换班请求 */}
      {(pendingToMe.length > 0 || pendingMine.length > 0) && (
        <>
          <SectionTitle>换班请求</SectionTitle>
          <div className="space-y-2">
            {pendingToMe.map((r) => (
              <SwapCard key={r.id} req={r} responder />
            ))}
            {pendingMine.map((r) => (
              <SwapCard key={r.id} req={r} />
            ))}
          </div>
        </>
      )}

      {/* 排班规则 */}
      <SectionTitle>排班规则</SectionTitle>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
        <div className="mb-2 flex items-center gap-1.5 text-xs text-stone-500">
          <RefreshCcw className="h-3.5 w-3.5 text-orange-500" />
          每周一轮换 · 顺序：阿哲 → 小雨 → 老周 → 琪琪
        </div>
        <div className="space-y-1.5">
          {state.areas.map((a) => (
            <div key={a.id} className="rounded-xl bg-stone-50 px-3 py-2">
              <div className="text-[13px] font-semibold text-stone-700">{a.name}</div>
              <div className="text-[11px] text-stone-400">标准：{a.standard}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 我的值日统计 */}
      <SectionTitle>我的值日</SectionTitle>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" /> 完成率
          </span>
          <span className="font-bold text-stone-700">{myDone}/{mySlots.length} 次 · {myRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${myRate}%` }} />
        </div>
        <div className="mt-2 text-[11px] text-stone-400">
          漏打卡 {mySlots.filter((s) => s.status === "missed").length} 次（留档可查，按公约处理）
        </div>
      </div>

      {/* 全员完成率 */}
      <SectionTitle>全员完成率</SectionTitle>
      <div className="space-y-2">
        {state.members.map((m) => {
          const ms = state.slots.filter((s) => s.memberId === m.id && s.date <= todayStr());
          const done = ms.filter((s) => s.status === "done").length;
          const rate = ms.length ? Math.round((done / ms.length) * 100) : 100;
          return (
            <div key={m.id} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
              <Ava name={m.name} color={m.color} size={28} />
              <span className="w-12 text-[13px] font-medium text-stone-700">{m.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-stone-600">{rate}%</span>
            </div>
          );
        })}
      </div>

      {/* 打卡（本周我的待办） */}
      {(() => {
        const mine = state.slots.find(
          (s) => s.memberId === me && s.status === "pending" && s.date === mondayOf(todayStr())
        );
        return mine && weekOffset === 0 ? (
          <Button className="mt-4 w-full gap-1.5" onClick={() => setUi({ checkinSlotId: mine.id })}>
            <ClipboardCheck className="h-4 w-4" /> 本周我负责「{state.areas.find((a) => a.id === mine.areaId)?.name}」· 去打卡
          </Button>
        ) : null;
      })()}

      <SwapDialog slot={swapSlot} onClose={() => setSwapSlot(null)} />
    </div>
  );
}

function SlotCard({ slot, weekOffset, onSwap }: { slot: DutySlot; weekOffset: number; onSwap: () => void }) {
  const { state, me, setUi } = useStore();
  const m = state.members.find((x) => x.id === slot.memberId)!;
  const area = state.areas.find((a) => a.id === slot.areaId)!;
  const mine = slot.memberId === me;
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ${mine ? "ring-orange-300" : "ring-orange-100"}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
        {slot.status === "done" ? "✅" : slot.status === "missed" ? "⚠️" : "🧹"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-stone-800">{area.name}</span>
          {mine && <span className="text-[10px] text-orange-500">（我）</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400">
          <Ava name={m.name} color={m.color} size={16} />
          {m.name}
          {slot.status === "done" && slot.checkinAt && <span>· {slot.checkinAt.slice(5)} 打卡</span>}
          {slot.note && <span className="truncate">· {slot.note}</span>}
        </div>
      </div>
      {slot.status === "done" ? (
        <Pill tone="green">已完成</Pill>
      ) : slot.status === "missed" ? (
        <Pill tone="red">未完成</Pill>
      ) : (
        <div className="flex gap-1.5">
          {mine && weekOffset === 0 && (
            <button
              onClick={() => setUi({ checkinSlotId: slot.id })}
              className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white active:scale-95"
            >
              打卡
            </button>
          )}
          {mine && weekOffset >= 0 && (
            <button
              onClick={onSwap}
              className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold text-stone-600 active:scale-95"
            >
              换班
            </button>
          )}
          {!mine && <Pill tone="amber">进行中</Pill>}
        </div>
      )}
    </div>
  );
}

function SwapCard({ req, responder }: { req: import("@/types").SwapRequest; responder?: boolean }) {
  const { state, respondSwap, memberName } = useStore();
  const slot = state.slots.find((s) => s.id === req.slotId);
  const area = slot ? state.areas.find((a) => a.id === slot.areaId) : null;
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
      <div className="text-[13px] text-stone-700">
        <span className="font-semibold">{memberName(req.fromId)}</span> 想和{" "}
        <span className="font-semibold">{memberName(req.toId)}</span> 调换「{area?.name}」值日
      </div>
      {responder ? (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              respondSwap(req.id, true);
              toast.success("已同意换班，排班自动互换");
            }}
          >
            同意换班
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              respondSwap(req.id, false);
              toast.info("已拒绝换班请求");
            }}
          >
            拒绝
          </Button>
        </div>
      ) : (
        <div className="mt-1 text-[11px] text-stone-400">等待对方确认中…</div>
      )}
    </div>
  );
}

function SwapDialog({ slot, onClose }: { slot: DutySlot | null; onClose: () => void }) {
  const { state, me, requestSwap } = useStore();
  if (!slot) return null;
  const area = state.areas.find((a) => a.id === slot.areaId);
  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>发起换班 · {area?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <div className="mb-2 text-xs text-stone-400">选择想与之换班的室友，对方确认后排班自动互换：</div>
          {state.members
            .filter((m) => m.id !== me)
            .map((m) => {
              const theirSlot = state.slots.find((s) => s.date === slot.date && s.memberId === m.id);
              const theirArea = theirSlot ? state.areas.find((a) => a.id === theirSlot.areaId) : null;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    requestSwap(slot.id, m.id);
                    toast.success(`换班请求已发送给 ${m.name}`, { description: "对方确认后本周排班自动互换" });
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-stone-100 px-3 py-2.5 text-left active:bg-orange-50"
                >
                  <Ava name={m.name} color={m.color} size={28} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-stone-700">{m.name}</div>
                    <div className="text-[11px] text-stone-400">TA 本周：{theirArea?.name ?? "无排班"}</div>
                  </div>
                  <RefreshCcw className="h-4 w-4 text-stone-300" />
                </button>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
