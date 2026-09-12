import { useState } from "react";
import { Toaster } from "sonner";
import { Home, ReceiptText, Sparkles, ScrollText, User } from "lucide-react";
import { AppStoreProvider, useStore } from "@/store/AppStore";
import { TopBar } from "@/components/common";
import { MessagesSheet } from "@/components/MessagesSheet";
import { AddBillDialog, AnnounceDialog, CheckinDialog } from "@/components/dialogs";
import HomePage from "@/pages/HomePage";
import BillsPage from "@/pages/BillsPage";
import CleaningPage from "@/pages/CleaningPage";
import PactPage from "@/pages/PactPage";
import MinePage from "@/pages/MinePage";
import ItemsPage from "@/pages/ItemsPage";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "home", label: "首页", icon: Home },
  { key: "bills", label: "账单", icon: ReceiptText },
  { key: "clean", label: "清洁", icon: Sparkles },
  { key: "pact", label: "公约", icon: ScrollText },
  { key: "mine", label: "我的", icon: User },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type PageKey = TabKey | "items";

const TAB_TITLE: Record<PageKey, string> = {
  home: "合租生活管家",
  bills: "消费管家",
  clean: "清洁工作",
  pact: "公约与公告",
  mine: "个人中心",
  items: "公共物品",
};

function Shell() {
  const { state } = useStore();
  const [tab, setTab] = useState<PageKey>("home");
  const [msgOpen, setMsgOpen] = useState(false);
  const unread = state.messages.filter((m) => !m.read).length;
  const goTab = (t: string) => setTab(t as PageKey);

  return (
    <div className="flex min-h-screen justify-center bg-orange-50/60">
      {/* 手机壳：移动端全宽，桌面端居中 420px */}
      <div className="relative flex min-h-screen w-full max-w-[420px] flex-col bg-[#fffaf3] shadow-xl ring-1 ring-orange-100">
        <TopBar
          title={TAB_TITLE[tab]}
          subtitle={state.space.name}
          unread={unread}
          onBell={() => setMsgOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {tab === "home" && <HomePage goTab={goTab} />}
          {tab === "bills" && <BillsPage />}
          {tab === "clean" && <CleaningPage />}
          {tab === "pact" && <PactPage />}
          {tab === "mine" && <MinePage goTab={goTab} />}
          {tab === "items" && <ItemsPage />}
        </main>

        {/* 底部 Tab 栏 */}
        <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-orange-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex flex-col items-center gap-0.5 py-2 active:scale-95"
            >
              <Icon
                className={cn("h-5 w-5", tab === key ? "text-orange-500" : "text-stone-300")}
                strokeWidth={tab === key ? 2.4 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px]",
                  tab === key ? "font-bold text-orange-500" : "text-stone-400"
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* 全局弹层 */}
        <MessagesSheet open={msgOpen} onOpenChange={setMsgOpen} />
        <AddBillDialog />
        <CheckinDialog />
        <AnnounceDialog />
        <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <Shell />
    </AppStoreProvider>
  );
}
