import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  PenLine,
  ReceiptText,
  Scale,
  BellRing,
  Repeat,
} from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava, Pill, SectionTitle } from "@/components/common";
import {
  catIcon,
  catLabel,
  fmtMoney,
  mdLabel,
  monthLabel,
  simplifyDebts,
  todayStr,
  urgeText,
} from "@/lib/calc";
import type { Bill, Transfer } from "@/types";

export default function BillsPage() {
  const { state, setUi } = useStore();
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [catFilter, setCatFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [settleOpen, setSettleOpen] = useState(false);

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthBills = state.bills
    .filter((b) => b.date.startsWith(month))
    .filter((b) => catFilter === "all" || b.category === catFilter)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const monthTotal = monthBills.reduce((s, b) => s + b.amount, 0);
  const unsettled = monthBills.reduce(
    (s, b) => s + b.shares.filter((sh) => !sh.paid).reduce((x, sh) => x + sh.amount, 0),
    0
  );
  const cats = [...new Set(state.bills.filter((b) => b.date.startsWith(month)).map((b) => b.category))];
  const detail = state.bills.find((b) => b.id === detailId) || null;

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 月份切换 + 结算 */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="rounded-full p-1.5 text-stone-400 active:bg-stone-100">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-sm font-bold text-stone-700">{monthLabel(month)}</div>
        <button onClick={() => shiftMonth(1)} className="rounded-full p-1.5 text-stone-400 active:bg-stone-100">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
          <div className="text-lg font-bold text-stone-800">{fmtMoney(monthTotal)}</div>
          <div className="text-[11px] text-stone-400">本月公共支出</div>
        </div>
        <button
          onClick={() => setSettleOpen(true)}
          className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-3 text-left text-white shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-1 text-lg font-bold">
            <Scale className="h-4 w-4" /> {fmtMoney(unsettled)}
          </div>
          <div className="text-[11px] opacity-90">未结清 · 点击生成月度结算单</div>
        </button>
      </div>

      {/* 类别筛选 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <FilterChip active={catFilter === "all"} onClick={() => setCatFilter("all")}>全部</FilterChip>
        {cats.map((c) => (
          <FilterChip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
            {catIcon(c)} {catLabel(c)}
          </FilterChip>
        ))}
      </div>

      {/* 账单列表 */}
      <SectionTitle>账单明细（{monthBills.length}）</SectionTitle>
      <div className="space-y-2">
        {monthBills.length === 0 && (
          <div className="rounded-2xl bg-white py-10 text-center text-xs text-stone-400 ring-1 ring-orange-100">
            本月暂无账单
          </div>
        )}
        {monthBills.map((b) => (
          <BillRow key={b.id} bill={b} onClick={() => setDetailId(b.id)} />
        ))}
      </div>

      {/* 悬浮「记一笔」 */}
      <button
        onClick={() => setUi({ addBill: true })}
        className="fixed bottom-20 right-[max(16px,calc(50%-210px+16px))] z-20 flex h-13 w-13 items-center justify-center gap-1 rounded-full bg-orange-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-300 active:scale-95"
        style={{ borderRadius: 999 }}
      >
        <PenLine className="h-4 w-4" /> 记一笔
      </button>

      <BillDetailDialog bill={detail} onClose={() => setDetailId(null)} />
      <SettlementDialog month={month} open={settleOpen} onOpenChange={setSettleOpen} />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-orange-500 text-white" : "bg-white text-stone-500 ring-1 ring-stone-200"
      }`}
    >
      {children}
    </button>
  );
}

function BillRow({ bill, onClick }: { bill: Bill; onClick: () => void }) {
  const { state } = useStore();
  const payer = state.members.find((m) => m.id === bill.payerId)!;
  const unpaid = bill.shares.filter((s) => !s.paid);
  const done = unpaid.length === 0;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-orange-100 active:bg-orange-50/50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl">
        {catIcon(bill.category)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-stone-800">{bill.title}</span>
          {bill.recurring && <Repeat className="h-3 w-3 shrink-0 text-sky-500" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400">
          {mdLabel(bill.date)} · {payer.name} 垫付 ·{" "}
          {done ? <span className="text-emerald-500">已结清</span> : <span className="text-red-400">{unpaid.length} 人未付</span>}
        </div>
      </div>
      <div className="text-sm font-bold text-stone-800">{fmtMoney(bill.amount)}</div>
    </button>
  );
}

/* ───────────── 账单详情：确认 / 标记已付 / 一键催款 ───────────── */

function BillDetailDialog({ bill, onClose }: { bill: Bill | null; onClose: () => void }) {
  const { state, me, markPaid, confirmBill, sendUrge, memberName } = useStore();
  const [urgeSeed, setUrgeSeed] = useState(0);
  const [showUrge, setShowUrge] = useState(false);
  if (!bill) return null;
  const payer = state.members.find((m) => m.id === bill.payerId)!;
  const myShare = bill.shares.find((s) => s.memberId === me);
  const unpaidOthers = bill.shares.filter((s) => !s.paid && s.memberId !== bill.payerId);
  const canUrge = bill.payerId === me && unpaidOthers.length > 0;
  const previewText = urgeText(
    bill.title,
    fmtMoney(unpaidOthers.reduce((s, x) => s + x.amount, 0)),
    urgeSeed
  );

  return (
    <Dialog open={!!bill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{catIcon(bill.category)}</span> {bill.title}
            {bill.recurring && <Pill tone="blue">周期账单</Pill>}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex items-end justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <div className="text-xs text-stone-400">
              {mdLabel(bill.date)} · {payer.name} 垫付 · {catLabel(bill.category)}
              {bill.note && <div className="mt-1 text-stone-500">备注：{bill.note}</div>}
            </div>
            <div className="text-xl font-bold text-stone-800">{fmtMoney(bill.amount)}</div>
          </div>

          {/* 分摊明细 */}
          <div className="space-y-1.5">
            {bill.shares.map((sh) => {
              const m = state.members.find((x) => x.id === sh.memberId)!;
              return (
                <div key={sh.memberId} className="flex items-center gap-2.5 rounded-xl border border-stone-100 px-2.5 py-2">
                  <Ava name={m.name} color={m.color} size={28} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-stone-700">
                      {m.name}
                      {sh.memberId === bill.payerId && <span className="ml-1 text-[10px] text-stone-400">（垫付人）</span>}
                    </div>
                    {sh.paidAt && <div className="text-[10px] text-stone-400">{mdLabel(sh.paidAt)} 已转账</div>}
                  </div>
                  <span className="text-[13px] font-semibold text-stone-800">{fmtMoney(sh.amount)}</span>
                  {sh.paid ? (
                    <Pill tone="green">已付</Pill>
                  ) : sh.confirmed ? (
                    <Pill tone="amber">待付款</Pill>
                  ) : (
                    <Pill tone="gray">待确认</Pill>
                  )}
                </div>
              );
            })}
          </div>

          {/* 我的操作 */}
          {myShare && !myShare.confirmed && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                confirmBill(bill.id, me);
                toast.success("已确认账单");
              }}
            >
              确认账单无误
            </Button>
          )}
          {myShare && !myShare.paid && bill.payerId !== me && (
            <Button
              className="w-full"
              onClick={() => {
                markPaid(bill.id, me);
                toast.success("已标记为已付", { description: "可向垫付人出示转账截图" });
              }}
            >
              我已转账 · 标记已付 {fmtMoney(myShare.amount)}
            </Button>
          )}

          {/* 一键催款 */}
          {canUrge && (
            <div className="rounded-xl bg-orange-50 p-3">
              {!showUrge ? (
                <Button variant="outline" className="w-full gap-1.5 border-orange-300 text-orange-600" onClick={() => setShowUrge(true)}>
                  <BellRing className="h-4 w-4" /> 一键催款（{unpaidOthers.map((s) => memberName(s.memberId)).join("、")}）
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg bg-white p-2.5 text-xs leading-relaxed text-stone-600 ring-1 ring-orange-200">
                    {previewText}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setUrgeSeed((s) => s + 1)}>
                      换一条话术
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        const n = sendUrge(bill.id, previewText);
                        toast.success(`已委婉提醒 ${n} 位室友`, { description: "消息中心可查看送达记录" });
                        setShowUrge(false);
                        onClose();
                      }}
                    >
                      发送催款
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── 月度结算：债务简化 ───────────── */

function SettlementDialog({
  month,
  open,
  onOpenChange,
}: {
  month: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { state, remindTransfers, memberName } = useStore();

  const edges: Transfer[] = useMemo(() => {
    const out: Transfer[] = [];
    for (const b of state.bills.filter((x) => x.date.startsWith(month))) {
      for (const sh of b.shares) {
        if (!sh.paid && sh.memberId !== b.payerId) {
          out.push({ fromId: sh.memberId, toId: b.payerId, amount: sh.amount });
        }
      }
    }
    return out;
  }, [state.bills, month]);

  const transfers = useMemo(() => simplifyDebts(edges), [edges]);

  const nets = state.members.map((m) => {
    const owe = edges.filter((e) => e.fromId === m.id).reduce((s, e) => s + e.amount, 0);
    const recv = edges.filter((e) => e.toId === m.id).reduce((s, e) => s + e.amount, 0);
    return { m, owe, recv };
  });

  const remindAll = () => {
    const texts = transfers.map(
      (t) =>
        `【月度结算提醒】${monthLabel(month)}结算单已生成：${memberName(t.fromId)} 需转给 ${memberName(t.toId)} ${fmtMoney(t.amount)}，多退少补一笔结清～`
    );
    remindTransfers(texts);
    toast.success("结算单已推送给相关成员", { description: "每人最多一笔转账即可结清" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <ReceiptText className="h-4 w-4 text-orange-500" /> {monthLabel(month)}结算单
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            {nets.map(({ m, owe, recv }) => (
              <div key={m.id} className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2">
                <Ava name={m.name} color={m.color} size={26} />
                <span className="flex-1 text-[13px] font-medium text-stone-700">{m.name}</span>
                <span className="text-xs text-stone-400">
                  待付 {fmtMoney(owe)} · 待收 {fmtMoney(recv)}
                </span>
                {recv - owe > 0.005 ? (
                  <Pill tone="green">净收 {fmtMoney(recv - owe)}</Pill>
                ) : owe - recv > 0.005 ? (
                  <Pill tone="red">净付 {fmtMoney(owe - recv)}</Pill>
                ) : (
                  <Pill tone="gray">已平</Pill>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold text-stone-500">
              债务简化 · 最优转账路径（{edges.length} 笔欠账 → {transfers.length} 笔转账）
            </div>
            {transfers.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 py-6 text-center text-xs text-emerald-600">
                🎉 本月账目已全部结清
              </div>
            ) : (
              <div className="space-y-1.5">
                {transfers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2.5">
                    <Ava name={memberName(t.fromId)} color={state.members.find((m) => m.id === t.fromId)?.color ?? "#999"} size={26} />
                    <span className="text-[13px] font-semibold text-stone-700">{memberName(t.fromId)}</span>
                    <span className="flex-1 text-center text-xs text-stone-400">
                      — 转 <span className="font-bold text-orange-600">{fmtMoney(t.amount)}</span> →
                    </span>
                    <Ava name={memberName(t.toId)} color={state.members.find((m) => m.id === t.toId)?.color ?? "#999"} size={26} />
                    <span className="text-[13px] font-semibold text-stone-700">{memberName(t.toId)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {transfers.length > 0 && (
            <Button className="w-full" onClick={remindAll}>
              一键推送结算单
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
