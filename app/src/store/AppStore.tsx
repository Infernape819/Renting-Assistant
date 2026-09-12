import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppState, Bill, BorrowRecord, DutySlot, Item, Message, MsgType, Settings, WishItem } from "@/types";
import { makeSeed, ME } from "@/data/seed";
import { computeShares, todayStr, uid } from "@/lib/calc";

const LS_KEY = "hezu-life-manager-v1";

interface UiState {
  addBill: boolean;
  announce: boolean;
  checkinSlotId: string | null;
}

interface Store {
  state: AppState;
  me: string;
  ui: UiState;
  setUi: (patch: Partial<UiState>) => void;
  memberName: (id: string) => string;
  // 账单
  addBill: (bill: Omit<Bill, "id">) => void;
  markPaid: (billId: string, memberId: string) => void;
  confirmBill: (billId: string, memberId: string) => void;
  sendUrge: (billId: string, text: string) => number;
  remindTransfers: (texts: string[]) => void;
  // 清洁
  checkIn: (slotId: string, note: string) => void;
  requestSwap: (slotId: string, toId: string) => void;
  respondSwap: (reqId: string, accept: boolean) => void;
  // 公约公告
  confirmPact: () => void;
  publishAnnouncement: (title: string, content: string) => void;
  markAnnounceRead: (id: string) => void;
  // 公共物品
  addItem: (item: Omit<Item, "id">) => void;
  restock: (itemId: string, qty: number, price: number, buyerId: string) => void;
  urgeRestock: (itemId: string) => void;
  addWish: (name: string) => void;
  toggleVote: (wishId: string) => void;
  markBought: (wishId: string) => void;
  addBorrow: (rec: Omit<BorrowRecord, "id" | "date" | "returned">) => void;
  markReturned: (id: string) => void;
  // 消息 & 设置
  markAllMessagesRead: () => void;
  setSetting: (key: keyof Settings, value: boolean) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

function load(): AppState {
  const seed = makeSeed();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<AppState>;
      // 旧版本数据缺少新模块字段时，用种子数据补齐
      return { ...seed, ...s };
    }
  } catch {
    /* ignore */
  }
  return seed;
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [ui, setUiRaw] = useState<UiState>({ addBill: false, announce: false, checkinSlotId: null });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setUi = (patch: Partial<UiState>) => setUiRaw((u) => ({ ...u, ...patch }));

  const pushMsg = (type: MsgType, text: string, s: AppState): Message[] => [
    { id: uid("msg"), type, text, date: todayStr(), read: false },
    ...s.messages,
  ];

  const memberName = (id: string) => state.members.find((m) => m.id === id)?.name ?? id;

  const store: Store = useMemo(
    () => ({
      state,
      me: ME,
      ui,
      setUi,
      memberName,

      addBill: (bill) => {
        const b: Bill = {
          ...bill,
          id: uid("b"),
          // 垫付人自己那份视为已付已确认
          shares: bill.shares.map((sh) =>
            sh.memberId === bill.payerId
              ? { ...sh, paid: true, confirmed: true, paidAt: bill.date }
              : sh
          ),
        };
        setState((s) => {
          const payer = s.members.find((m) => m.id === bill.payerId)?.name ?? "";
          let messages = s.messages;
          for (const sh of bill.shares) {
            if (sh.memberId !== bill.payerId) {
              messages = [
                {
                  id: uid("msg"),
                  type: "bill",
                  text: `${payer}发起了「${bill.title}」分摊，你应出 ¥${sh.amount}，请及时确认。`,
                  date: todayStr(),
                  read: false,
                },
                ...messages,
              ];
            }
          }
          return { ...s, bills: [b, ...s.bills], messages };
        });
      },

      markPaid: (billId, memberId) =>
        setState((s) => ({
          ...s,
          bills: s.bills.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  shares: b.shares.map((sh) =>
                    sh.memberId === memberId
                      ? { ...sh, paid: true, confirmed: true, paidAt: todayStr() }
                      : sh
                  ),
                }
              : b
          ),
        })),

      confirmBill: (billId, memberId) =>
        setState((s) => ({
          ...s,
          bills: s.bills.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  shares: b.shares.map((sh) =>
                    sh.memberId === memberId ? { ...sh, confirmed: true } : sh
                  ),
                }
              : b
          ),
        })),

      sendUrge: (billId, text) => {
        const bill = state.bills.find((b) => b.id === billId);
        if (!bill) return 0;
        const targets = bill.shares.filter((sh) => !sh.paid && sh.memberId !== bill.payerId);
        setState((s) => {
          let messages = s.messages;
          for (const t of targets) {
            messages = [
              {
                id: uid("msg"),
                type: "bill",
                text: `【催款 · 已发给${memberName(t.memberId)}】${text}`,
                date: todayStr(),
                read: false,
              },
              ...messages,
            ];
          }
          return { ...s, messages };
        });
        return targets.length;
      },

      remindTransfers: (texts) =>
        setState((s) => {
          let messages = s.messages;
          for (const text of texts) {
            messages = [
              { id: uid("msg"), type: "bill", text, date: todayStr(), read: false },
              ...messages,
            ];
          }
          return { ...s, messages };
        }),

      checkIn: (slotId, note) =>
        setState((s) => ({
          ...s,
          slots: s.slots.map((sl) =>
            sl.id === slotId
              ? { ...sl, status: "done", checkinAt: todayStr() + " 现在", note }
              : sl
          ),
          messages: pushMsg("duty", "阿哲完成了本周值日打卡，全员可见 ✅", s),
        })),

      requestSwap: (slotId, toId) =>
        setState((s) => {
          const slot = s.slots.find((x) => x.id === slotId);
          if (!slot) return s;
          const req = {
            id: uid("sw"),
            slotId,
            fromId: slot.memberId,
            toId,
            status: "pending" as const,
            date: todayStr(),
          };
          return {
            ...s,
            swaps: [req, ...s.swaps],
            messages: pushMsg(
              "duty",
              `${memberName(slot.memberId)} 想和 ${memberName(toId)} 调换「${s.areas.find((a) => a.id === slot.areaId)?.name}」值日，等待对方确认。`,
              s
            ),
          };
        }),

      respondSwap: (reqId, accept) =>
        setState((s) => {
          const req = s.swaps.find((r) => r.id === reqId);
          if (!req || req.status !== "pending") return s;
          let slots: DutySlot[] = s.slots;
          if (accept) {
            const fromSlot = s.slots.find((x) => x.id === req.slotId);
            const toSlot = s.slots.find(
              (x) => x.date === fromSlot?.date && x.memberId === req.toId
            );
            if (fromSlot && toSlot) {
              slots = s.slots.map((x) => {
                if (x.id === fromSlot.id) return { ...x, memberId: req.toId };
                if (x.id === toSlot.id) return { ...x, memberId: req.fromId };
                return x;
              });
            }
          }
          return {
            ...s,
            slots,
            swaps: s.swaps.map((r) =>
              r.id === reqId ? { ...r, status: accept ? "accepted" : "rejected" } : r
            ),
            messages: pushMsg(
              "duty",
              accept
                ? `${memberName(req.toId)} 同意了换班请求，排班已自动互换。`
                : `${memberName(req.toId)} 拒绝了换班请求。`,
              s
            ),
          };
        }),

      confirmPact: () =>
        setState((s) => ({
          ...s,
          pactConfirmedBy: s.pactConfirmedBy.includes(ME)
            ? s.pactConfirmedBy
            : [...s.pactConfirmedBy, ME],
        })),

      publishAnnouncement: (title, content) =>
        setState((s) => ({
          ...s,
          announcements: [
            { id: uid("n"), title, content, authorId: ME, date: todayStr(), readBy: [ME] },
            ...s.announcements,
          ],
          messages: pushMsg("announce", `新公告：${title}`, s),
        })),

      markAnnounceRead: (id) =>
        setState((s) => ({
          ...s,
          announcements: s.announcements.map((a) =>
            a.id === id && !a.readBy.includes(ME)
              ? { ...a, readBy: [...a.readBy, ME] }
              : a
          ),
        })),

      markAllMessagesRead: () =>
        setState((s) => ({ ...s, messages: s.messages.map((m) => ({ ...m, read: true })) })),

      /* ───────────── 公共物品 ───────────── */

      addItem: (item) =>
        setState((s) => ({
          ...s,
          items: [{ ...item, id: uid("i") }, ...s.items],
          messages: pushMsg(
            "system",
            `${memberName(item.buyerId)} 登记了${item.ownership === "shared" ? "公共" : "个人"}物品「${item.name}」（${item.location}）。`,
            s
          ),
        })),

      restock: (itemId, qty, price, buyerId) =>
        setState((s) => {
          const item = s.items.find((x) => x.id === itemId);
          if (!item) return s;
          const items: Item[] = s.items.map((x) =>
            x.id === itemId ? { ...x, stock: (x.stock ?? 0) + qty } : x
          );
          let bills = s.bills;
          let messages = pushMsg(
            "system",
            `${memberName(buyerId)} 补货「${item.name}」×${qty}，库存已更新。`,
            s
          );
          // 联动消费管家：一键生成 AA 账单
          if (price > 0) {
            const shares = computeShares(
              "equal",
              price,
              s.members.map((m) => m.id),
              {},
              {}
            ).map((sh) =>
              sh.memberId === buyerId
                ? { ...sh, paid: true, confirmed: true, paidAt: todayStr() }
                : sh
            );
            const bill: Bill = {
              id: uid("b"),
              title: `补货 · ${item.name}`,
              amount: price,
              category: "daily",
              payerId: buyerId,
              date: todayStr(),
              splitMode: "equal",
              shares,
              note: "公共物品补货自动生成",
            };
            bills = [bill, ...bills];
            messages = [
              {
                id: uid("msg"),
                type: "bill",
                text: `补货「${item.name}」已自动生成 AA 账单（¥${price}），请及时确认。`,
                date: todayStr(),
                read: false,
              },
              ...messages,
            ];
          }
          return { ...s, items, bills, messages };
        }),

      urgeRestock: (itemId) =>
        setState((s) => {
          const item = s.items.find((x) => x.id === itemId);
          if (!item) return s;
          return {
            ...s,
            messages: pushMsg(
              "system",
              `【补货提醒 · 已发给${memberName(item.buyerId)}】「${item.name}」库存告急（剩 ${item.stock}），上次是您采购的，方便时再带一份哈～`,
              s
            ),
          };
        }),

      addWish: (name) =>
        setState((s) => ({
          ...s,
          wishes: [
            { id: uid("w"), name, proposerId: ME, votes: [ME], bought: false, date: todayStr() },
            ...s.wishes,
          ] as WishItem[],
          messages: pushMsg("announce", `阿哲提议购买「${name}」，去公共采购清单投一票吧。`, s),
        })),

      toggleVote: (wishId) =>
        setState((s) => ({
          ...s,
          wishes: s.wishes.map((w) =>
            w.id === wishId
              ? {
                  ...w,
                  votes: w.votes.includes(ME)
                    ? w.votes.filter((v) => v !== ME)
                    : [...w.votes, ME],
                }
              : w
          ),
        })),

      markBought: (wishId) =>
        setState((s) => {
          const w = s.wishes.find((x) => x.id === wishId);
          if (!w) return s;
          return {
            ...s,
            wishes: s.wishes.map((x) => (x.id === wishId ? { ...x, bought: true } : x)),
            messages: pushMsg("announce", `采购清单更新：「${w.name}」已购入 🎉`, s),
          };
        }),

      addBorrow: (rec) =>
        setState((s) => ({
          ...s,
          borrows: [
            { ...rec, id: uid("r"), date: todayStr(), returned: false },
            ...s.borrows,
          ],
          messages: pushMsg(
            "system",
            `${memberName(rec.borrowerId)} 借用了 ${memberName(rec.ownerId)} 的「${rec.itemName}」，已登记留痕。`,
            s
          ),
        })),

      markReturned: (id) =>
        setState((s) => {
          const r = s.borrows.find((x) => x.id === id);
          if (!r) return s;
          return {
            ...s,
            borrows: s.borrows.map((x) => (x.id === id ? { ...x, returned: true } : x)),
            messages: pushMsg(
              "system",
              `${memberName(r.ownerId)} 确认：「${r.itemName}」已归还，借用记录完结。`,
              s
            ),
          };
        }),

      setSetting: (key, value) =>
        setState((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),

      resetDemo: () => {
        localStorage.removeItem(LS_KEY);
        setState(makeSeed());
      },
    }),
    [state, ui]
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used within AppStoreProvider");
  return s;
}
