import type { BillShare, SplitMode, Transfer } from "@/types";

export const fmtMoney = (n: number) =>
  "¥" + n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");

export const pad = (n: number) => String(n).padStart(2, "0");

export const dateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => dateStr(new Date());

export const addDays = (base: string, days: number) => {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + days);
  return dateStr(d);
};

export const monthKey = (date: string) => date.slice(0, 7);

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return `${y} 年 ${Number(m)} 月`;
};

export const WEEK_CN = ["日", "一", "二", "三", "四", "五", "六"];

export const weekdayCN = (date: string) =>
  "周" + WEEK_CN[new Date(date + "T00:00:00").getDay()];

export const mdLabel = (date: string) =>
  `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 本周一（以周一为一周起点） */
export const mondayOf = (base: string) => {
  const d = new Date(base + "T00:00:00");
  const wd = (d.getDay() + 6) % 7; // 周一=0
  d.setDate(d.getDate() - wd);
  return dateStr(d);
};

let seq = 0;
export const uid = (p: string) =>
  `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 按分摊方式计算每人金额，结果四舍五入且总和与账单金额一致 */
export function computeShares(
  mode: SplitMode,
  total: number,
  participants: string[],
  ratios: Record<string, number>,
  fixed: Record<string, number>
): BillShare[] {
  if (participants.length === 0 || total <= 0) return [];
  let amounts: number[] = [];
  if (mode === "equal") {
    const each = Math.floor((total / participants.length) * 100) / 100;
    amounts = participants.map(() => each);
    amounts[0] = round2(total - each * (participants.length - 1));
  } else if (mode === "ratio") {
    const sum = participants.reduce((s, id) => s + (ratios[id] || 0), 0);
    if (sum <= 0) return [];
    let acc = 0;
    amounts = participants.map((id, i) => {
      if (i === participants.length - 1) return round2(total - acc);
      const a = round2((total * (ratios[id] || 0)) / sum);
      acc = round2(acc + a);
      return a;
    });
  } else {
    const sum = participants.reduce((s, id) => s + (fixed[id] || 0), 0);
    if (Math.abs(sum - total) > 0.01) return [];
    amounts = participants.map((id) => round2(fixed[id] || 0));
  }
  return participants.map((id, i) => ({
    memberId: id,
    amount: amounts[i],
    confirmed: false,
    paid: false,
  }));
}

/** 债务简化：把互欠合并为最少笔数的转账路径 */
export function simplifyDebts(edges: Transfer[]): Transfer[] {
  const net = new Map<string, number>();
  for (const e of edges) {
    net.set(e.fromId, round2((net.get(e.fromId) || 0) - e.amount));
    net.set(e.toId, round2((net.get(e.toId) || 0) + e.amount));
  }
  const debtors = [...net.entries()]
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, amt: -v }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = [...net.entries()]
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, amt: v }))
    .sort((a, b) => b.amt - a.amt);
  const out: Transfer[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(debtors[i].amt, creditors[j].amt));
    out.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: pay });
    debtors[i].amt = round2(debtors[i].amt - pay);
    creditors[j].amt = round2(creditors[j].amt - pay);
    if (debtors[i].amt < 0.005) i++;
    if (creditors[j].amt < 0.005) j++;
  }
  return out;
}

/** 委婉催款话术模板 */
export const URGE_TEMPLATES = [
  "亲爱的小伙伴，上次「{title}」还差你那边 {amount} 哦～方便的时候转我就好，不着急哈 😊",
  "小小提醒一下：「{title}」的 {amount} 还没到账，最近手头紧的话跟我说一声就行～",
  "哈喽呀，「{title}」麻烦你有空处理一下 {amount}，比心 🫰",
];

export const urgeText = (title: string, amount: string, seed: number) =>
  URGE_TEMPLATES[seed % URGE_TEMPLATES.length]
    .replace("{title}", title)
    .replace("{amount}", amount);

export const BILL_CATEGORIES = [
  { key: "rent", label: "房租", icon: "🏠" },
  { key: "utility", label: "水电燃", icon: "💡" },
  { key: "net", label: "网费", icon: "📶" },
  { key: "daily", label: "日用品", icon: "🧻" },
  { key: "food", label: "食材", icon: "🥬" },
  { key: "other", label: "其他", icon: "📦" },
];

export const catLabel = (key: string) =>
  BILL_CATEGORIES.find((c) => c.key === key)?.label ?? key;

export const catIcon = (key: string) =>
  BILL_CATEGORIES.find((c) => c.key === key)?.icon ?? "📦";
