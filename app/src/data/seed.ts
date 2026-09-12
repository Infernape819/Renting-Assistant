import type { AppState, Bill, DutySlot } from "@/types";
import { addDays, mondayOf, todayStr } from "@/lib/calc";

const today = todayStr();
const thisMonday = mondayOf(today);

const members = [
  { id: "m1", name: "阿哲", color: "#f59e0b", role: "owner" as const, moveIn: "2025-06-15" },
  { id: "m2", name: "小雨", color: "#38bdf8", role: "member" as const, moveIn: "2025-06-15" },
  { id: "m3", name: "老周", color: "#34d399", role: "member" as const, moveIn: "2025-08-01" },
  { id: "m4", name: "琪琪", color: "#f472b6", role: "member" as const, moveIn: "2026-03-20" },
];

const areas = [
  { id: "a1", name: "客厅", standard: "地面无杂物、桌面擦净、垃圾清走" },
  { id: "a2", name: "厨房", standard: "灶台无油污、水槽无积碗、台面擦干" },
  { id: "a3", name: "卫生间", standard: "马桶/地漏清洁、镜面无水渍、换垃圾袋" },
  { id: "a4", name: "倒垃圾", standard: "每晚 21:00 前清运，干湿分离" },
];

const order = ["m1", "m2", "m3", "m4"];

function makeSlots(): DutySlot[] {
  const slots: DutySlot[] = [];
  // 排最近 5 周：前 3 周、本周、下周
  for (let w = -3; w <= 1; w++) {
    const monday = addDays(thisMonday, w * 7);
    areas.forEach((area, i) => {
      const memberId = order[(i + (w + 3)) % 4];
      const id = `s_w${w + 3}_${area.id}`;
      if (w < 0) {
        // 历史周：绝大多数已完成，留 2 条漏打卡
        const missed =
          (w === -1 && area.id === "a3") || (w === -3 && area.id === "a4");
        slots.push({
          id,
          areaId: area.id,
          memberId,
          date: monday,
          status: missed ? "missed" : "done",
          checkinAt: missed ? undefined : `${addDays(monday, 6)} 20:${10 + i * 7}`,
        });
      } else if (w === 0) {
        // 本周：m2 已打卡，其余进行中；m1（我）保持待打卡便于演示
        const done = memberId === "m2";
        slots.push({
          id,
          areaId: area.id,
          memberId,
          date: monday,
          status: done ? "done" : "pending",
          checkinAt: done ? `${today} 09:42` : undefined,
          note: done ? "厨房灶台已去油污 ✅" : undefined,
        });
      } else {
        slots.push({ id, areaId: area.id, memberId, date: monday, status: "pending" });
      }
    });
  }
  return slots;
}

const bills: Bill[] = [
  {
    id: "b1",
    title: "9 月电费",
    amount: 186.4,
    category: "utility",
    payerId: "m1",
    date: addDays(today, -4),
    splitMode: "equal",
    shares: [
      { memberId: "m1", amount: 46.6, confirmed: true, paid: true, paidAt: addDays(today, -4) },
      { memberId: "m2", amount: 46.6, confirmed: true, paid: true, paidAt: addDays(today, -3) },
      { memberId: "m3", amount: 46.6, confirmed: true, paid: false },
      { memberId: "m4", amount: 46.6, confirmed: false, paid: false },
    ],
    note: "电力公司小程序已缴",
  },
  {
    id: "b2",
    title: "9 月宽带网费",
    amount: 99,
    category: "net",
    payerId: "m2",
    date: addDays(today, -11),
    recurring: true,
    splitMode: "equal",
    shares: [
      { memberId: "m1", amount: 24.75, confirmed: true, paid: true, paidAt: addDays(today, -10) },
      { memberId: "m2", amount: 24.75, confirmed: true, paid: true, paidAt: addDays(today, -11) },
      { memberId: "m3", amount: 24.75, confirmed: true, paid: true, paidAt: addDays(today, -9) },
      { memberId: "m4", amount: 24.75, confirmed: true, paid: true, paidAt: addDays(today, -8) },
    ],
  },
  {
    id: "b3",
    title: "超市日用品采购",
    amount: 73.5,
    category: "daily",
    payerId: "m3",
    date: addDays(today, -2),
    splitMode: "equal",
    shares: [
      { memberId: "m1", amount: 24.5, confirmed: true, paid: true, paidAt: addDays(today, -1) },
      { memberId: "m2", amount: 24.5, confirmed: false, paid: false },
      { memberId: "m3", amount: 24.5, confirmed: true, paid: true, paidAt: addDays(today, -2) },
    ],
    note: "琪琪出差两周，本期不参与分摊",
  },
  {
    id: "b4",
    title: "9 月房租",
    amount: 4800,
    category: "rent",
    payerId: "m1",
    date: `${today.slice(0, 7)}-01`,
    recurring: true,
    splitMode: "ratio",
    shares: [
      { memberId: "m1", amount: 1500, confirmed: true, paid: true, paidAt: `${today.slice(0, 7)}-01` },
      { memberId: "m2", amount: 1200, confirmed: true, paid: true, paidAt: addDays(today, -3) },
      { memberId: "m3", amount: 1100, confirmed: true, paid: true, paidAt: addDays(today, -2) },
      { memberId: "m4", amount: 1000, confirmed: true, paid: false },
    ],
    note: "按房间大小约定比例",
  },
  // 8 月历史账单（已结清，供月度结算演示）
  {
    id: "b5",
    title: "8 月电费",
    amount: 168,
    category: "utility",
    payerId: "m2",
    date: "2026-08-08",
    splitMode: "equal",
    shares: [
      { memberId: "m1", amount: 42, confirmed: true, paid: true },
      { memberId: "m2", amount: 42, confirmed: true, paid: true },
      { memberId: "m3", amount: 42, confirmed: true, paid: true },
      { memberId: "m4", amount: 42, confirmed: true, paid: true },
    ],
  },
  {
    id: "b6",
    title: "8 月燃气费",
    amount: 64.8,
    category: "utility",
    payerId: "m3",
    date: "2026-08-15",
    splitMode: "equal",
    shares: [
      { memberId: "m1", amount: 16.2, confirmed: true, paid: true },
      { memberId: "m2", amount: 16.2, confirmed: true, paid: true },
      { memberId: "m3", amount: 16.2, confirmed: true, paid: true },
      { memberId: "m4", amount: 16.2, confirmed: true, paid: true },
    ],
  },
];

export function makeSeed(): AppState {
  return {
    space: {
      name: "阳光里 3 栋 502",
      address: "朝阳区阳光里小区 3 栋 502",
      rooms: 4,
      rent: 4800,
      startDate: "2025-06-15",
      inviteCode: "SUN502",
    },
    members,
    bills,
    areas,
    slots: makeSlots(),
    swaps: [],
    pactVersion: 3,
    pactConfirmedBy: ["m2", "m3"],
    clauses: [
      { id: "c1", category: "作息与噪音", title: "安静时段", text: "23:00 – 次日 8:00 保持安静，不使用洗衣机、吹风机等大噪音电器。" },
      { id: "c2", category: "作息与噪音", title: "深夜归家", text: "晚归轻手轻脚，玄关换鞋，不在客厅打电话。" },
      { id: "c3", category: "访客留宿", title: "访客提前报备", text: "带朋友回家需提前在群里说一声；留宿超过 2 晚需全员同意。" },
      { id: "c4", category: "宠物", title: "暂不养宠", text: "本空间暂不饲养宠物，如有人想养需全员投票通过。" },
      { id: "c5", category: "公共区域", title: "用后复原", text: "厨房、客厅使用后 1 小时内恢复原状，个人物品不长期占用公共空间。" },
      { id: "c6", category: "费用规则", title: "AA 时限", text: "公共账单应在发起后 7 天内完成转账；大额账单（>500）需提前沟通。" },
      { id: "c7", category: "值日规则", title: "值日打卡", text: "当周值日须在周日 22:00 前完成并打卡；临时有事提前发起换班。" },
      { id: "c8", category: "值日规则", title: "未完成处理", text: "无故未完成值日者，补做一次并请大家喝奶茶一杯 🧋。" },
    ],
    announcements: [
      {
        id: "n1",
        title: "本周五晚停水通知",
        content: "物业通知：本周五 22:00 – 周六 6:00 小区管网检修停水，大家提前储水，错峰洗漱。",
        authorId: "m1",
        date: addDays(today, -1),
        readBy: ["m1", "m2"],
      },
      {
        id: "n2",
        title: "周六晚火锅局 🍲",
        content: "入秋第一顿火锅，周六 18:30 客厅集合！食材当天一起买，费用走 AA。",
        authorId: "m2",
        date: addDays(today, -3),
        readBy: ["m1", "m2", "m3", "m4"],
      },
    ],
    messages: [
      { id: "g1", type: "duty", text: "【值日预告】明天轮到小雨打扫厨房，标准：灶台无油污、水槽无积碗。", date: addDays(today, -1), read: false },
      { id: "g2", type: "bill", text: "老周发起了「超市日用品采购」分摊，你应出 ¥24.5，请及时确认。", date: addDays(today, -2), read: true },
      { id: "g3", type: "announce", text: "新公告：本周五晚停水通知，记得查看并标记已读。", date: addDays(today, -1), read: false },
      { id: "g4", type: "system", text: "公约已更新至 v3（新增「深夜归家」条款），请前往公约页确认签署。", date: addDays(today, -5), read: true },
      { id: "g5", type: "system", text: "【补货提醒】抽纸仅剩 2 卷（约可用 2 天），已低于安全库存，请默认采购人及时补货。", date: today, read: false },
    ],
    settings: { dnd: true, billPush: true, dutyPush: true },
    items: [
      { id: "i1", name: "抽纸", icon: "🧻", buyerId: "m3", price: 39.9, ownership: "shared", location: "卫生间", consumable: true, stock: 2, threshold: 6, dailyUse: 0.8 },
      { id: "i2", name: "洗洁精", icon: "🧴", buyerId: "m1", price: 12.5, ownership: "shared", location: "厨房", consumable: true, stock: 1, threshold: 2, dailyUse: 0.08 },
      { id: "i3", name: "垃圾袋", icon: "🗑️", buyerId: "m2", price: 15.9, ownership: "shared", location: "厨房", consumable: true, stock: 45, threshold: 20, dailyUse: 1.5 },
      { id: "i4", name: "洗衣机", icon: "🧺", buyerId: "m1", price: 899, ownership: "shared", location: "阳台", consumable: false },
      { id: "i5", name: "炒锅", icon: "🍳", buyerId: "m2", price: 199, ownership: "personal", location: "厨房", consumable: false },
    ],
    wishes: [
      { id: "w1", name: "落地晾衣架", proposerId: "m2", votes: ["m2", "m1"], bought: false, date: addDays(today, -6) },
      { id: "w2", name: "零食收纳筐", proposerId: "m4", votes: ["m4"], bought: false, date: addDays(today, -2) },
    ],
    borrows: [
      { id: "r1", itemName: "加湿器", ownerId: "m4", borrowerId: "m2", date: addDays(today, -5), returned: false },
      { id: "r2", itemName: "工具箱", ownerId: "m3", borrowerId: "m1", date: addDays(today, -20), returned: true },
    ],
  };
}

export const ME = "m1";
