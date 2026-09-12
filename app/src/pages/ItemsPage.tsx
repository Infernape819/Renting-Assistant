import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  BellRing,
  Check,
  Package,
  PackagePlus,
  Plus,
  ShoppingCart,
  ThumbsUp,
  Undo2,
} from "lucide-react";
import { useStore } from "@/store/AppStore";
import { Ava, Pill, SectionTitle } from "@/components/common";
import { cn } from "@/lib/utils";
import { fmtMoney, mdLabel } from "@/lib/calc";
import type { Item } from "@/types";

const ICON_CHOICES = ["🧻", "🧴", "🗑️", "🧺", "🍳", "🪣", "🧽", "💡", "🥤", "📦"];

export default function ItemsPage() {
  const { state, me, urgeRestock, toggleVote, markBought, markReturned } = useStore();
  const consumables = state.items.filter((i) => i.consumable);
  const lowItems = consumables.filter((i) => (i.stock ?? 0) <= (i.threshold ?? 0));
  const [restockItem, setRestockItem] = useState<Item | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [wishText, setWishText] = useState("");
  const [borrowOpen, setBorrowOpen] = useState(false);

  return (
    <div className="px-4 pb-24 pt-3">
      {/* 低库存提醒 */}
      {lowItems.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 p-3.5 text-white shadow-sm">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <BellRing className="h-4 w-4" /> {lowItems.length} 件物品库存告急
          </div>
          <div className="mt-1 text-[11px] opacity-90">
            {lowItems.map((i) => `${i.name}（剩 ${i.stock}）`).join("、")} · 已通知默认采购人
          </div>
        </div>
      )}

      {/* 消耗品库存 */}
      <SectionTitle>消耗品库存</SectionTitle>
      <div className="space-y-2">
        {consumables.map((item) => {
          const low = (item.stock ?? 0) <= (item.threshold ?? 0);
          const days =
            item.dailyUse && item.dailyUse > 0
              ? Math.floor((item.stock ?? 0) / item.dailyUse)
              : null;
          const ratio = Math.min(1, (item.stock ?? 0) / ((item.threshold ?? 1) * 2));
          const buyer = state.members.find((m) => m.id === item.buyerId)!;
          return (
            <div key={item.id} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-stone-800">{item.name}</span>
                    {low ? <Pill tone="red">库存告急</Pill> : <Pill tone="green">充足</Pill>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-400">
                    剩 {item.stock} · 安全库存 {item.threshold}
                    {days !== null && ` · 约可用 ${days} 天`} · 默认采购人 {buyer.name}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {low && (
                    <button
                      onClick={() => {
                        urgeRestock(item.id);
                        toast.success(`已提醒 ${buyer.name} 补货`, { description: "委婉话术已发送到消息中心" });
                      }}
                      className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600 active:scale-95"
                    >
                      提醒
                    </button>
                  )}
                  <button
                    onClick={() => setRestockItem(item)}
                    className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-semibold text-white active:scale-95"
                  >
                    补货
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn("h-full rounded-full", low ? "bg-red-400" : "bg-emerald-500")}
                  style={{ width: `${Math.max(6, ratio * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 物品登记 */}
      <SectionTitle
        extra={
          <button
            className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-500"
            onClick={() => setAddOpen(true)}
          >
            <PackagePlus className="h-3.5 w-3.5" /> 登记物品
          </button>
        }
      >
        物品清单（{state.items.length}）
      </SectionTitle>
      <div className="space-y-2">
        {state.items.map((item) => {
          const buyer = state.members.find((m) => m.id === item.buyerId)!;
          return (
            <div key={item.id} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
              <span className="text-xl">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-stone-800">{item.name}</span>
                  <Pill tone={item.ownership === "shared" ? "blue" : "gray"}>
                    {item.ownership === "shared" ? "公共" : `${buyer.name}的`}
                  </Pill>
                </div>
                <div className="mt-0.5 text-[11px] text-stone-400">
                  {buyer.name} 购入 · {fmtMoney(item.price)} · 存放于{item.location}
                </div>
              </div>
              {item.consumable && (
                <span className="text-[11px] text-stone-400">库存 {item.stock}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 公共采购清单 */}
      <SectionTitle>公共采购清单（投票决定）</SectionTitle>
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
        <div className="flex gap-2">
          <Input
            placeholder="想买什么？写进清单大家一起投票"
            value={wishText}
            onChange={(e) => setWishText(e.target.value)}
            className="h-9 text-xs"
          />
          <WishAddButton text={wishText} clear={() => setWishText("")} />
        </div>
        <div className="mt-2 space-y-1.5">
          {state.wishes.map((w) => {
            const proposer = state.members.find((m) => m.id === w.proposerId)!;
            const voted = w.votes.includes(me);
            return (
              <div key={w.id} className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] font-semibold", w.bought ? "text-stone-400 line-through" : "text-stone-700")}>
                    {w.name}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {proposer.name} 提议 · {mdLabel(w.date)}
                  </div>
                </div>
                {w.bought ? (
                  <Pill tone="green">已购入</Pill>
                ) : (
                  <>
                    <button
                      onClick={() => toggleVote(w.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold active:scale-95",
                        voted ? "bg-orange-500 text-white" : "bg-white text-stone-500 ring-1 ring-stone-200"
                      )}
                    >
                      <ThumbsUp className="h-3 w-3" /> {w.votes.length}
                    </button>
                    <button
                      onClick={() => {
                        markBought(w.id);
                        toast.success("已标记购入", { description: "记得去「账单」记一笔走 AA 哦" });
                      }}
                      className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white active:scale-95"
                    >
                      已购
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 私人物品借用 */}
      <SectionTitle
        extra={
          <button
            className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-500"
            onClick={() => setBorrowOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> 登记借用
          </button>
        }
      >
        私人物品借用
      </SectionTitle>
      <div className="space-y-2">
        {state.borrows.map((r) => (
          <div key={r.id} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-base">
              {r.returned ? "✅" : "🤝"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-stone-700">
                {state.members.find((m) => m.id === r.borrowerId)?.name} 借了{" "}
                {state.members.find((m) => m.id === r.ownerId)?.name} 的「{r.itemName}」
              </div>
              <div className="text-[11px] text-stone-400">{mdLabel(r.date)} 登记</div>
            </div>
            {r.returned ? (
              <Pill tone="green">已归还</Pill>
            ) : (
              <button
                onClick={() => {
                  markReturned(r.id);
                  toast.success("归还已确认，记录完结");
                }}
                className="flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-1 text-[11px] font-semibold text-white active:scale-95"
              >
                <Undo2 className="h-3 w-3" /> 归还确认
              </button>
            )}
          </div>
        ))}
      </div>

      <RestockDialog item={restockItem} onClose={() => setRestockItem(null)} />
      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
      <BorrowDialog open={borrowOpen} onOpenChange={setBorrowOpen} />
    </div>
  );
}

/* 小组件 */
function WishAddButton({ text, clear }: { text: string; clear: () => void }) {
  const { addWish } = useStore();
  return (
    <Button
      size="sm"
      className="h-9 shrink-0 gap-1"
      disabled={!text.trim()}
      onClick={() => {
        addWish(text.trim());
        toast.success("已加入采购清单", { description: "室友可以开始投票了" });
        clear();
      }}
    >
      <Plus className="h-3.5 w-3.5" /> 提议
    </Button>
  );
}

/* ───────────── 补货 → 一键 AA ───────────── */

function RestockDialog({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { me, restock } = useStore();
  const [qty, setQty] = useState("6");
  const [price, setPrice] = useState("");
  const [genBill, setGenBill] = useState(true);
  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {item.icon} 补货 · {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs font-medium text-stone-500">补货数量</div>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-stone-500">花费金额（¥）</div>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
              <ShoppingCart className="h-3.5 w-3.5 text-orange-500" /> 一键生成 AA 账单（全员均分）
            </span>
            <Switch checked={genBill} onCheckedChange={setGenBill} />
          </div>
          <Button
            className="w-full"
            disabled={(parseInt(qty) || 0) <= 0}
            onClick={() => {
              const p = parseFloat(price) || 0;
              restock(item.id, parseInt(qty) || 0, genBill ? p : 0, me);
              toast.success("补货完成，库存已更新", {
                description: genBill && p > 0 ? `已生成 ${fmtMoney(p)} 的 AA 账单` : undefined,
              });
              setQty("6");
              setPrice("");
              onClose();
            }}
          >
            确认补货
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── 登记物品 ───────────── */

function AddItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, me, addItem } = useStore();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [price, setPrice] = useState("");
  const [ownership, setOwnership] = useState<"shared" | "personal">("shared");
  const [location, setLocation] = useState("客厅");
  const [consumable, setConsumable] = useState(false);
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [dailyUse, setDailyUse] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-orange-500" /> 登记物品
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <button
              className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl ring-1 ring-orange-200"
              onClick={() => {
                const i = ICON_CHOICES.indexOf(icon);
                setIcon(ICON_CHOICES[(i + 1) % ICON_CHOICES.length]);
              }}
              title="点击切换图标"
            >
              {icon}
            </button>
            <Input placeholder="物品名称" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs font-medium text-stone-500">购买金额（¥）</div>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-stone-500">存放位置</div>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-stone-500">归属</div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
              {(
                [
                  ["shared", "公共物品"],
                  ["personal", "个人物品"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setOwnership(k)}
                  className={cn(
                    "rounded-lg py-1.5 text-xs font-medium",
                    ownership === k ? "bg-white text-orange-600 shadow-sm" : "text-stone-500"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5">
            <span className="text-xs font-medium text-stone-600">这是消耗品（跟踪库存）</span>
            <Switch checked={consumable} onCheckedChange={setConsumable} />
          </div>
          {consumable && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="mb-1 text-xs font-medium text-stone-500">当前库存</div>
                <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-stone-500">安全库存</div>
                <Input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-stone-500">日均消耗</div>
                <Input type="number" min="0" step="0.1" value={dailyUse} onChange={(e) => setDailyUse(e.target.value)} />
              </div>
            </div>
          )}
          <div className="text-[11px] text-stone-400">
            购买人默认为「我」（{state.members.find((m) => m.id === me)?.name}）
          </div>
          <Button
            className="w-full gap-1"
            disabled={!name.trim()}
            onClick={() => {
              addItem({
                name: name.trim(),
                icon,
                buyerId: me,
                price: parseFloat(price) || 0,
                ownership,
                location: location || "客厅",
                consumable,
                stock: consumable ? parseInt(stock) || 0 : undefined,
                threshold: consumable ? parseInt(threshold) || 0 : undefined,
                dailyUse: consumable ? parseFloat(dailyUse) || 0 : undefined,
              });
              toast.success("物品已登记", { description: "退租结算时可据此处置归属" });
              setName("");
              onOpenChange(false);
            }}
          >
            <Check className="h-4 w-4" /> 完成登记
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────── 登记借用 ───────────── */

function BorrowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, me, addBorrow, memberName } = useStore();
  const [itemName, setItemName] = useState("");
  const [ownerId, setOwnerId] = useState("m2");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>登记借用</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <Input
            placeholder="借了什么？如 螺丝刀、瑜伽垫"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">向谁借的</div>
            <div className="flex gap-2">
              {state.members
                .filter((m) => m.id !== me)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setOwnerId(m.id)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs",
                      ownerId === m.id
                        ? "border-orange-400 bg-orange-50 font-semibold text-orange-600"
                        : "border-stone-200 text-stone-600"
                    )}
                  >
                    <Ava name={m.name} color={m.color} size={24} />
                    {memberName(m.id)}
                  </button>
                ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!itemName.trim()}
            onClick={() => {
              addBorrow({ itemName: itemName.trim(), ownerId, borrowerId: me });
              toast.success("借用已登记", { description: "归还后对方确认即完结" });
              setItemName("");
              onOpenChange(false);
            }}
          >
            登记借用
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
