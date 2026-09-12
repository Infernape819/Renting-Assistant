import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Camera, Repeat } from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava } from "@/components/common";
import {
  BILL_CATEGORIES,
  catLabel,
  computeShares,
  fmtMoney,
  todayStr,
} from "@/lib/calc";
import type { SplitMode } from "@/types";

/* ───────────────────────── 记一笔 ───────────────────────── */

export function AddBillDialog() {
  const { state, me, ui, setUi, addBill, memberName } = useStore();
  const [cat, setCat] = useState("utility");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(me);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [parts, setParts] = useState<string[]>(state.members.map((m) => m.id));
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [fixed, setFixed] = useState<Record<string, number>>({});
  const [recurring, setRecurring] = useState(false);
  const [note, setNote] = useState("");

  const total = parseFloat(amount) || 0;
  const shares = useMemo(
    () => computeShares(mode, total, parts, ratios, fixed),
    [mode, total, parts, ratios, fixed]
  );
  const valid = shares.length > 0 && total > 0;

  const close = () => setUi({ addBill: false });

  const submit = () => {
    if (!valid) {
      toast.error("请完善金额与分摊信息", {
        description:
          mode === "fixed"
            ? "指定金额之和需等于账单总额"
            : mode === "ratio"
              ? "比例之和需大于 0"
              : "请选择参与成员",
      });
      return;
    }
    const d = new Date();
    addBill({
      title: `${d.getMonth() + 1} 月${catLabel(cat)}`,
      amount: total,
      category: cat,
      payerId,
      date: todayStr(),
      splitMode: mode,
      shares,
      recurring,
      note: note || undefined,
    });
    toast.success("已记账并通知相关室友", {
      description: `共 ${fmtMoney(total)}，${parts.length} 人分摊`,
    });
    setAmount("");
    setNote("");
    setRecurring(false);
    close();
  };

  const togglePart = (id: string) =>
    setParts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Dialog open={ui.addBill} onOpenChange={(o) => setUi({ addBill: o })}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>记一笔</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* 类别 */}
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">类别</div>
            <div className="grid grid-cols-3 gap-2">
              {BILL_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={`rounded-xl border px-2 py-2 text-center text-xs transition ${
                    cat === c.key
                      ? "border-orange-400 bg-orange-50 font-semibold text-orange-600"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <div className="text-base">{c.icon}</div>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 金额 */}
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">金额</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-stone-700">¥</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1 text-stone-500"
                onClick={() => toast.info("Demo：票据拍照已模拟", { description: "正式版将调起相机并留档" })}
              >
                <Camera className="h-4 w-4" /> 票据
              </Button>
            </div>
          </div>

          {/* 付款人 */}
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">付款人（垫付）</div>
            <div className="flex gap-2">
              {state.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayerId(m.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs ${
                    payerId === m.id
                      ? "border-orange-400 bg-orange-50 font-semibold text-orange-600"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  <Ava name={m.name} color={m.color} size={26} />
                  {m.name}
                  {m.id === me && "（我）"}
                </button>
              ))}
            </div>
          </div>

          {/* 分摊方式 */}
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">分摊方式</div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1">
              {(
                [
                  ["equal", "全员均分"],
                  ["ratio", "按比例"],
                  ["fixed", "指定金额"],
                ] as [SplitMode, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setMode(k)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition ${
                    mode === k ? "bg-white text-orange-600 shadow-sm" : "text-stone-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 参与成员 */}
            <div className="mt-2 space-y-1.5">
              {state.members.map((m) => {
                const on = parts.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                      on ? "border-orange-200 bg-orange-50/50" : "border-stone-200 opacity-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => togglePart(m.id)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <Ava name={m.name} color={m.color} size={24} />
                    <span className="flex-1 text-xs font-medium text-stone-700">
                      {memberName(m.id)}
                      {m.id === me && "（我）"}
                    </span>
                    {on && mode === "equal" && total > 0 && (
                      <span className="text-xs text-orange-600">
                        {fmtMoney(shares.find((s) => s.memberId === m.id)?.amount ?? 0)}
                      </span>
                    )}
                    {on && mode === "ratio" && (
                      <span className="flex items-center gap-1 text-xs text-stone-500">
                        <Input
                          type="number"
                          min="0"
                          className="h-7 w-16 px-1.5 text-right text-xs"
                          placeholder="比例"
                          value={ratios[m.id] ?? ""}
                          onChange={(e) =>
                            setRatios((r) => ({ ...r, [m.id]: parseFloat(e.target.value) || 0 }))
                          }
                        />
                        份
                      </span>
                    )}
                    {on && mode === "fixed" && (
                      <span className="flex items-center gap-1 text-xs text-stone-500">
                        ¥
                        <Input
                          type="number"
                          min="0"
                          className="h-7 w-20 px-1.5 text-right text-xs"
                          placeholder="金额"
                          value={fixed[m.id] ?? ""}
                          onChange={(e) =>
                            setFixed((r) => ({ ...r, [m.id]: parseFloat(e.target.value) || 0 }))
                          }
                        />
                      </span>
                    )}
                  </div>
                );
              })}
              {mode !== "equal" && total > 0 && shares.length > 0 && (
                <div className="text-right text-xs text-stone-400">
                  校验：{fmtMoney(shares.reduce((s, x) => s + x.amount, 0))} / {fmtMoney(total)}
                </div>
              )}
            </div>
          </div>

          {/* 周期账单 */}
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
              <Repeat className="h-3.5 w-3.5 text-orange-500" /> 每月自动记账（周期账单）
            </span>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          <Textarea
            placeholder="备注（可选）：如某人本月出差不参与分摊…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[56px] text-xs"
          />

          <Button className="w-full" onClick={submit} disabled={!valid}>
            生成账单并通知室友
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── 值日打卡 ───────────────────────── */

export function CheckinDialog() {
  const { state, ui, setUi, checkIn } = useStore();
  const slot = state.slots.find((s) => s.id === ui.checkinSlotId);
  const [note, setNote] = useState("");
  if (!slot) return null;
  const area = state.areas.find((a) => a.id === slot.areaId);

  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && setUi({ checkinSlotId: null })}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>值日打卡 · {area?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-orange-50 p-3 text-xs leading-relaxed text-stone-600">
            <span className="font-semibold text-orange-600">清洁标准：</span>
            {area?.standard}
          </div>
          <button
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/60 text-orange-500 active:scale-[0.99]"
            onClick={() => toast.info("Demo：拍照已模拟", { description: "正式版将调起相机，照片全员可见" })}
          >
            <Camera className="h-7 w-7" />
            <span className="text-xs font-medium">拍照留痕（点击模拟）</span>
          </button>
          <Textarea
            placeholder="补充说明（可选）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[56px] text-xs"
          />
          <Button
            className="w-full"
            onClick={() => {
              checkIn(slot.id, note || "已完成清洁 ✅");
              toast.success("打卡成功，全员可见", { description: "已计入完成率统计" });
              setUi({ checkinSlotId: null });
              setNote("");
            }}
          >
            确认打卡
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── 发公告 ───────────────────────── */

export function AnnounceDialog() {
  const { ui, setUi, publishAnnouncement } = useStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <Dialog open={ui.announce} onOpenChange={(o) => setUi({ announce: o })}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>发布公告</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Input
            placeholder="标题：如 周三晚停水通知"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="正文…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[96px]"
          />
          <Button
            className="w-full"
            disabled={!title.trim() || !content.trim()}
            onClick={() => {
              publishAnnouncement(title.trim(), content.trim());
              toast.success("公告已发布，全员推送", { description: "可查看每位成员的已读状态" });
              setTitle("");
              setContent("");
              setUi({ announce: false });
            }}
          >
            发布并推送
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
