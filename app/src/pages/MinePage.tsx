import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  Copy,
  LogOut,
  MapPin,
  MessageSquareWarning,
  RotateCcw,
  Settings2,
  Users,
} from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava, Pill, SectionTitle } from "@/components/common";
import { fmtMoney, todayStr } from "@/lib/calc";

export default function MinePage({ goTab }: { goTab: (t: string) => void }) {
  const { state, me, setSetting, resetDemo } = useStore();
  const meInfo = state.members.find((m) => m.id === me)!;
  const key = todayStr().slice(0, 7);

  const myOwe = state.bills
    .flatMap((b) => b.shares)
    .filter((s) => s.memberId === me && !s.paid)
    .reduce((s, x) => s + x.amount, 0);
  const myRecv = state.bills
    .filter((b) => b.payerId === me)
    .flatMap((b) => b.shares)
    .filter((s) => s.memberId !== me && !s.paid)
    .reduce((s, x) => s + x.amount, 0);
  const myMonthPaid = state.bills
    .filter((b) => b.date.startsWith(key))
    .flatMap((b) => b.shares)
    .filter((s) => s.memberId === me && s.paid)
    .reduce((s, x) => s + x.amount, 0);

  const mySlots = state.slots.filter((s) => s.memberId === me && s.date <= todayStr());
  const myRate = mySlots.length
    ? Math.round((mySlots.filter((s) => s.status === "done").length / mySlots.length) * 100)
    : 100;

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 个人资料 */}
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white shadow-sm">
        <Ava name={meInfo.name} color="#ffffff33" size={52} className="ring-2 ring-white/60" />
        <div className="flex-1">
          <div className="text-base font-bold">
            {meInfo.name}
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">户主</span>
          </div>
          <div className="mt-0.5 text-[11px] opacity-85">入住于 {meInfo.moveIn} · 微信登录</div>
        </div>
      </div>

      {/* 我的账单 */}
      <SectionTitle extra={<button className="text-[11px] text-orange-500" onClick={() => goTab("bills")}>明细 ›</button>}>
        我的账单
      </SectionTitle>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "待付", value: myOwe, cls: "text-red-500" },
          { label: "待收", value: myRecv, cls: "text-emerald-600" },
          { label: "本月已付", value: myMonthPaid, cls: "text-stone-700" },
        ].map((x) => (
          <button
            key={x.label}
            onClick={() => goTab("bills")}
            className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-orange-100 active:bg-orange-50"
          >
            <div className={`text-base font-bold ${x.cls}`}>{fmtMoney(x.value)}</div>
            <div className="mt-0.5 text-[11px] text-stone-400">{x.label}</div>
          </button>
        ))}
      </div>

      {/* 我的值日 */}
      <SectionTitle extra={<button className="text-[11px] text-orange-500" onClick={() => goTab("clean")}>排班 ›</button>}>
        我的值日
      </SectionTitle>
      <button
        onClick={() => goTab("clean")}
        className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-orange-100"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">🧹</span>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-stone-700">完成率 {myRate}%</div>
          <div className="text-[11px] text-stone-400">
            共 {mySlots.length} 次值日 · 漏打卡 {mySlots.filter((s) => s.status === "missed").length} 次
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-stone-300" />
      </button>

      {/* 空间管理 */}
      <SectionTitle>空间管理</SectionTitle>
      <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-orange-100">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-stone-800">
          <MapPin className="h-4 w-4 text-orange-500" />
          {state.space.name}
        </div>
        <div className="mt-1 text-[11px] text-stone-400">
          {state.space.address} · {state.space.rooms} 室 · 月租 {fmtMoney(state.space.rent)} · {state.space.startDate} 起租
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-dashed border-stone-100 pt-3">
          <Users className="h-4 w-4 text-stone-400" />
          <div className="flex flex-1 -space-x-1.5">
            {state.members.map((m) => (
              <Ava key={m.id} name={m.name} color={m.color} size={26} className="ring-2 ring-white" />
            ))}
          </div>
          <button
            className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600 active:scale-95"
            onClick={() => {
              navigator.clipboard?.writeText(state.space.inviteCode).catch(() => {});
              toast.success("邀请码已复制", { description: `邀请码 ${state.space.inviteCode}，室友输入即可加入` });
            }}
          >
            <Copy className="h-3 w-3" /> 邀请室友
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {state.members.map((m) => (
            <Pill key={m.id} tone={m.role === "owner" ? "amber" : "gray"}>
              {m.name}
              {m.role === "owner" && " · 户主"}
            </Pill>
          ))}
        </div>
      </div>

      {/* 设置 */}
      <SectionTitle>设置</SectionTitle>
      <div className="space-y-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-orange-100">
        {(
          [
            ["billPush", "账单提醒", "新账单 / 催款 / 结算通知"],
            ["dutyPush", "值日提醒", "前一日预告 + 当天提醒 + 超时升级"],
            ["dnd", "免打扰时段", "23:00 – 8:00 不推送"],
          ] as const
        ).map(([k, label, desc]) => (
          <div key={k} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
            <Settings2 className="h-4 w-4 text-stone-300" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-stone-700">{label}</div>
              <div className="text-[11px] text-stone-400">{desc}</div>
            </div>
            <Switch checked={state.settings[k]} onCheckedChange={(v) => setSetting(k, v)} />
          </div>
        ))}
      </div>

      {/* 其他 */}
      <div className="mt-4 space-y-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-orange-100">
        <button
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left active:bg-stone-50"
          onClick={() => toast.info("Demo：意见反馈", { description: "正式版将打开反馈表单" })}
        >
          <MessageSquareWarning className="h-4 w-4 text-stone-300" />
          <span className="flex-1 text-[13px] text-stone-700">意见反馈</span>
          <ChevronRight className="h-4 w-4 text-stone-300" />
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left active:bg-stone-50"
          onClick={() => {
            resetDemo();
            toast.success("已重置演示数据");
          }}
        >
          <RotateCcw className="h-4 w-4 text-stone-300" />
          <span className="flex-1 text-[13px] text-stone-700">重置演示数据</span>
          <ChevronRight className="h-4 w-4 text-stone-300" />
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left active:bg-stone-50"
          onClick={() =>
            toast.info("Demo：退租结算流程", {
              description: "正式版：结清未付账单 → 值日移交 → 物品处置 → 管理员转让 → 移出空间",
            })
          }
        >
          <LogOut className="h-4 w-4 text-red-300" />
          <span className="flex-1 text-[13px] text-red-500">发起退租结算</span>
          <ChevronRight className="h-4 w-4 text-stone-300" />
        </button>
      </div>

      <div className="mt-6 text-center text-[10px] text-stone-300">合租生活管家 v1.0 · Demo</div>
    </div>
  );
}
