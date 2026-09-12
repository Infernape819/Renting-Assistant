export type Role = "owner" | "member";

export interface Member {
  id: string;
  name: string;
  color: string; // avatar 底色
  role: Role;
  moveIn: string; // 入住日期 YYYY-MM-DD
}

export interface SpaceInfo {
  name: string;
  address: string;
  rooms: number;
  rent: number;
  startDate: string;
  inviteCode: string;
}

export type SplitMode = "equal" | "ratio" | "fixed";

export interface BillShare {
  memberId: string;
  amount: number;
  confirmed: boolean;
  paid: boolean;
  paidAt?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: string;
  payerId: string;
  date: string; // YYYY-MM-DD
  recurring?: boolean;
  splitMode: SplitMode;
  shares: BillShare[];
  note?: string;
}

export interface DutyArea {
  id: string;
  name: string;
  standard: string;
}

export type DutyStatus = "pending" | "done" | "missed";

export interface DutySlot {
  id: string;
  areaId: string;
  memberId: string;
  date: string; // YYYY-MM-DD，每周一排
  status: DutyStatus;
  checkinAt?: string;
  note?: string;
}

export interface SwapRequest {
  id: string;
  slotId: string;
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
  date: string;
}

export interface PactClause {
  id: string;
  category: string;
  title: string;
  text: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  date: string;
  readBy: string[];
}

export type MsgType = "bill" | "duty" | "announce" | "system";

export interface Message {
  id: string;
  type: MsgType;
  text: string;
  date: string;
  read: boolean;
}

export interface Settings {
  dnd: boolean; // 免打扰 23:00-8:00
  billPush: boolean;
  dutyPush: boolean;
}

/* ───────────── 公共物品模块 ───────────── */

export type Ownership = "shared" | "personal";

export interface Item {
  id: string;
  name: string;
  icon: string; // emoji
  buyerId: string;
  price: number;
  ownership: Ownership;
  location: string;
  consumable: boolean;
  stock?: number; // 消耗品：当前库存
  threshold?: number; // 消耗品：安全库存，低于则提醒
  dailyUse?: number; // 消耗品：日均消耗，用于估算可用天数
}

export interface WishItem {
  id: string;
  name: string;
  proposerId: string;
  votes: string[];
  bought: boolean;
  date: string;
}

export interface BorrowRecord {
  id: string;
  itemName: string;
  ownerId: string;
  borrowerId: string;
  date: string;
  returned: boolean;
}

export interface AppState {
  space: SpaceInfo;
  members: Member[];
  bills: Bill[];
  areas: DutyArea[];
  slots: DutySlot[];
  swaps: SwapRequest[];
  clauses: PactClause[];
  pactVersion: number;
  pactConfirmedBy: string[];
  announcements: Announcement[];
  messages: Message[];
  settings: Settings;
  items: Item[];
  wishes: WishItem[];
  borrows: BorrowRecord[];
}

export interface Transfer {
  fromId: string;
  toId: string;
  amount: number;
}
