import { Ava, SectionTitle, Pill } from "@/components/common";
import { useStore } from "@/store/AppStore";
import {
  catIcon,
  fmtMoney,
  mdLabel,
  mondayOf,
  todayStr,
  weekdayCN,
} from "@/lib/calc";
import {
  Megaphone,
  PenLine,
  Receipt,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function HomePage({ goTab }: { goTab: (t: string) => void }) {
  const { state, me, setUi } = useStore();
  const today = todayStr();
  const monday = mondayOf(today);
  const weekSlots = state.slots.filter((s) => s.date === monday);
  const myWeekSlot = weekSlots.find((s) => s.memberId === me);

  const myUnpaid = state.bills.flatMap((b) =>
    b.shares
      .filter((sh) => sh.memberId === me && !sh.paid)
      .map((sh) => ({ bill: b, share: sh }))
  );
  const unpaidTotal = myUnpaid.reduce((s, x) => s + x.share.amount, 0);

  const pendingConfirm = state.bills.filter((b) =>
    b.shares.some((sh) => sh.memberId === me && !sh.confirmed)
  );
  const unreadAnnounce = state.announcements.filter((a) => !a.readBy.includes(me));
  const pactPending = !state.pactConfirmedBy.includes(me);

  const hour = new Date().getHours();
  const greet = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 问候 */}
      <div className="mb-1 px-1">
        <div className="text-lg font-bold text-stone-800">
          {greet}，阿哲 👋
        </div>
        <div className="text-xs text-stone-400">
          今天是 {mdLabel(today)} {weekdayCN(today)} · {state.space.name}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          { icon: <PenLine className="h-5 w-5" />, label: "记一笔", onClick: () => setUi({ addBill: true }), cls: "bg-orange-500 text-white" },
          {
            icon: <Sparkles className="h-5 w-5" />,
            label: "值日打卡",
            onClick: () =>
              myWeekSlot && myWeekSlot.status === "pending"
                ? setUi({ checkinSlotId: myWeekSlot.id })
                : goTab("clean"),
            cls: "bg-emerald-500 text-white",
          },
          { icon: <Megaphone className="h-5 w-5" />, label: "发公告", onClick: () => setUi({ announce: true }), cls: "bg-sky-500 text-white" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`flex items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold shadow-sm active:scale-95 ${a.cls}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* 公共物品入口（v1.1） */}
      <ItemsEntry goTab={goTab} />

      {/* 今日卡片：值日 */}
      <SectionTitle extra={<button className="text-[11px] text-orange-500" onClick={() => goTab("clean")}>全部排班 ›</button>}>
        本周值日
      </SectionTitle>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
        <div className="space-y-2">
          {weekSlots.map((s) => {
            const m = state.members.find((x) => x.id === s.memberId)!;
            const area = state.areas.find((a) => a.id === s.areaId)!;
            const mine = s.memberId === me;
            return (
              <div key={s.id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${mine ? "bg-orange-50 ring-1 ring-orange-200" : "bg-stone-50"}`}>
                <Ava name={m.name} color={m.color} size={30} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-stone-700">
                    {area.name}
                    {mine && <span className="ml-1 text-[10px] font-normal text-orange-500">（我）</span>}
                  </div>
                  <div className="text-[11px] text-stone-400">{m.name} 负责</div>
                </div>
                {s.status === "done" ? (
                  <Pill tone="green">已打卡</Pill>
                ) : mine ? (
                  <button
                    onClick={() => setUi({ checkinSlotId: s.id })}
                    className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold text-white active:scale-95"
                  >
                    去打卡
                  </button>
                ) : (
                  <Pill tone="amber">进行中</Pill>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 今日卡片：待付 */}
      <SectionTitle extra={<button className="text-[11px] text-orange-500" onClick={() => goTab("bills")}>去处理 ›</button>}>
        我的待付账单
      </SectionTitle>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
        {myUnpaid.length === 0 ? (
          <div className="py-3 text-center text-xs text-stone-400">🎉 没有待付账单，账目清爽</div>
        ) : (
          <>
            <div className="mb-2 flex items-baseline gap-1 px-1">
              <span className="text-xs text-stone-400">合计待付</span>
              <span className="text-xl font-bold text-red-500">{fmtMoney(unpaidTotal)}</span>
            </div>
            <div className="space-y-1.5">
              {myUnpaid.map(({ bill, share }) => (
                <button
                  key={bill.id}
                  onClick={() => goTab("bills")}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5 text-left active:bg-stone-100"
                >
                  <span className="text-lg">{catIcon(bill.category)}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-stone-700">{bill.title}</div>
                    <div className="text-[11px] text-stone-400">付给 {state.members.find((m) => m.id === bill.payerId)?.name}</div>
                  </div>
                  <span className="text-sm font-bold text-stone-800">{fmtMoney(share.amount)}</span>
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 待办提醒 */}
      {(pendingConfirm.length > 0 || unreadAnnounce.length > 0 || pactPending) && (
        <>
          <SectionTitle>待确认事项</SectionTitle>
          <div className="space-y-2">
            {pendingConfirm.map((b) => (
              <button
                key={b.id}
                onClick={() => goTab("bills")}
                className="flex w-full items-center gap-2.5 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-amber-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Receipt className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-stone-700">「{b.title}」待你确认</div>
                  <div className="text-[11px] text-stone-400">48 小时未确认将默认确认</div>
                </div>
                <Pill tone="amber">待确认</Pill>
              </button>
            ))}
            {unreadAnnounce.map((a) => (
              <button
                key={a.id}
                onClick={() => goTab("pact")}
                className="flex w-full items-center gap-2.5 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-sky-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-stone-700">{a.title}</div>
                  <div className="text-[11px] text-stone-400">新公告，点击查看</div>
                </div>
                <Pill tone="blue">未读</Pill>
              </button>
            ))}
            {pactPending && (
              <button
                onClick={() => goTab("pact")}
                className="flex w-full items-center gap-2.5 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-red-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-500">📜</span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-stone-700">公约 v{state.pactVersion} 待你签署确认</div>
                  <div className="text-[11px] text-stone-400">每次修订后需全员重新确认</div>
                </div>
                <Pill tone="red">待签署</Pill>
              </button>
            )}
          </div>
        </>
      )}

      {/* 本月概览 */}
      <SectionTitle>本月账目概览</SectionTitle>
      <MonthStrip />
    </div>
  );
}

function ItemsEntry({ goTab }: { goTab: (t: string) => void }) {
  const { state } = useStore();
  const low = state.items.filter(
    (i) => i.consumable && (i.stock ?? 0) <= (i.threshold ?? 0)
  );
  return (
    <button
      onClick={() => goTab("items")}
      className="mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-orange-100 active:bg-orange-50/50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg">📦</span>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-stone-700">公共物品</div>
        <div className="text-[11px] text-stone-400">
          {low.length > 0 ? (
            <span className="text-red-500">
              {low.map((i) => i.name).join("、")} 库存告急，点击去补货
            </span>
          ) : (
            "库存充足，暂无待补货"
          )}
        </div>
      </div>
      {low.length > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {low.length}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-stone-300" />
    </button>
  );
}

function MonthStrip() {
  const { state, me } = useStore();
  const key = todayStr().slice(0, 7);
  const monthBills = state.bills.filter((b) => b.date.startsWith(key));
  const total = monthBills.reduce((s, b) => s + b.amount, 0);
  const myPaid = monthBills
    .filter((b) => b.payerId === me)
    .reduce((s, b) => s + b.amount - (b.shares.find((x) => x.memberId === me)?.amount ?? 0), 0);
  const myShare = monthBills.reduce(
    (s, b) => s + (b.shares.find((x) => x.memberId === me)?.amount ?? 0),
    0
  );
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {[
        { label: "本月公共支出", value: total, cls: "text-stone-800" },
        { label: "我垫付", value: myPaid, cls: "text-emerald-600" },
        { label: "我应出", value: myShare, cls: "text-orange-600" },
      ].map((x) => (
        <div key={x.label} className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-orange-100">
          <div className={`text-base font-bold ${x.cls}`}>{fmtMoney(x.value)}</div>
          <div className="mt-0.5 text-[11px] text-stone-400">{x.label}</div>
        </div>
      ))}
    </div>
  );
}
