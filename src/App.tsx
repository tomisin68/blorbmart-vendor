import { useState } from 'react';
import { AuthShell } from './components/auth/AuthShell';
import { Toast } from './components/common/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { AddFoodModal } from './components/modals/AddFoodModal';
import { TxDetailModal } from './components/modals/TxDetailModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { BankScreen } from './components/screens/BankScreen';
import { HoursScreen } from './components/screens/HoursScreen';
import { MenuScreen } from './components/screens/MenuScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { OrdersScreen } from './components/screens/OrdersScreen';
import { OverviewScreen } from './components/screens/OverviewScreen';
import { SecurityScreen } from './components/screens/SecurityScreen';
import { TransactionsScreen } from './components/screens/TransactionsScreen';
import { WithdrawalsScreen } from './components/screens/WithdrawalsScreen';
import { CHART, INITIAL_FOOD_ITEMS, INITIAL_ORDERS, NOTIFS, TXNS, WEEK_SCHEDULE, type FoodItem, type Order, type Txn, type WeekScheduleRow } from './data/mock';
import type { PageKey } from './types/ui';

const PAGES: Record<PageKey, string> = {
  overview: 'Overview',
  menu: 'Menu & Food',
  orders: 'Orders',
  hours: 'Hours & Status',
  txns: 'Transactions',
  withdrawals: 'Withdrawals',
  bank: 'Bank Account',
  security: 'Security & PIN',
  notifs: 'Notifications',
};

interface Closure { date: string; reason: string; }

function App() {
  const [page, setPage] = useState<PageKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authHidden, setAuthHidden] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', ok: true });

  const [txns] = useState<Txn[]>(TXNS);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(INITIAL_FOOD_ITEMS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeOrderTab, setActiveOrderTab] = useState<Order['status']>('new');
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [schedule, setSchedule] = useState<WeekScheduleRow[]>(WEEK_SCHEDULE);
  const [closures, setClosures] = useState<Closure[]>([]);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [txDetailId, setTxDetailId] = useState<string | null>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  const showToast = (message: string, ok = true) => {
    setToast({ visible: true, message, ok });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;
  const ordersBadge = orders.filter((o) => o.status === 'new').length;

  const currentTx = txns.find((t) => t.id === txDetailId) || null;
  const editingFood = foodItems.find((f) => f.id === editingFoodId) || null;

  const handleNavigate = (next: PageKey) => {
    setPage(next);
    setSidebarOpen(false);
  };

  const advanceOrder = (id: string) => {
    const flow: Record<Order['status'], Order['status'] | null> = {
      new: 'accepted',
      accepted: 'ready',
      ready: 'picked',
      picked: 'done',
      done: null,
    };
    setOrders((prev) =>
      prev.map((o) => (o.id !== id || !flow[o.status] ? o : { ...o, status: flow[o.status] as Order['status'] }))
    );
    showToast(`${id} — Updated`);
  };

  const rejectOrder = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (!confirm(`Reject order ${id} from ${order.customer}?`)) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
    showToast(`${id} rejected`, false);
  };

  const toggleAvail = (id: string) => {
    setFoodItems((prev) =>
      prev.map((f) => (f.id !== id ? f : { ...f, avail: f.avail === 'available' ? 'soldout' : 'available' }))
    );
  };

  const deleteFood = (id: string) => {
    const item = foodItems.find((f) => f.id === id);
    if (!item) return;
    if (!confirm(`Remove "${item.name}" from your menu?`)) return;
    setFoodItems((prev) => prev.filter((f) => f.id !== id));
    showToast(`${item.name} removed from menu`);
  };

  const saveFood = (item: Omit<FoodItem, 'id' | 'emoji'> & { id?: string; emoji?: string }) => {
    if (item.id) {
      setFoodItems((prev) => prev.map((f) => (f.id === item.id ? { ...f, ...item, emoji: item.emoji || f.emoji } as FoodItem : f)));
      showToast(`${item.name} updated!`);
    } else {
      const id = `f${Date.now()}`;
      setFoodItems((prev) => [{ ...(item as FoodItem), id, emoji: item.emoji || '🍽' }, ...prev]);
      showToast(`${item.name} added to your menu!`);
    }
    setFoodModalOpen(false);
    setEditingFoodId(null);
  };

  const toggleDay = (idx: number) => {
    setSchedule((prev) => prev.map((r, i) => (i === idx ? { ...r, open: !r.open } : r)));
  };

  const updateHour = (idx: number, field: 'from' | 'to', value: string) => {
    setSchedule((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addClosure = (date: string, reason: string) => {
    setClosures((prev) => [...prev, { date, reason }]);
    showToast(`Closure added for ${date}`);
  };

  const removeClosure = (idx: number) => {
    setClosures((prev) => prev.filter((_, i) => i !== idx));
  };

  const markNotifRead = (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      <AuthShell hidden={authHidden} onComplete={() => setAuthHidden(true)} onShowToast={(msg) => showToast(msg)} />

      <div id="app">
        <Sidebar
          page={page}
          onNavigate={handleNavigate}
          ordersBadge={ordersBadge}
          notifBadge={unreadCount}
          open={sidebarOpen}
          onSignOut={() => alert('Signing out…')}
        />

        <div id="content">
          <Topbar
            title={PAGES[page]}
            onHamburger={() => setSidebarOpen((s) => !s)}
            onNotifications={() => handleNavigate('notifs')}
            showBellDot={unreadCount > 0}
          />

          <div id="main">
            {page === 'overview' && (
              <OverviewScreen
                chart={CHART}
                txns={txns}
                onOpenWithdraw={() => setWithdrawOpen(true)}
                onNavigate={handleNavigate}
                onOpenTxDetail={(id) => setTxDetailId(id)}
              />
            )}
            {page === 'menu' && (
              <MenuScreen
                foodItems={foodItems}
                onOpenAdd={() => { setFoodModalOpen(true); setEditingFoodId(null); }}
                onEdit={(id) => { setEditingFoodId(id); setFoodModalOpen(true); }}
                onDelete={deleteFood}
                onToggleAvail={toggleAvail}
              />
            )}
            {page === 'orders' && (
              <OrdersScreen
                orders={orders}
                activeTab={activeOrderTab}
                onTabChange={setActiveOrderTab}
                onAdvance={advanceOrder}
                onReject={rejectOrder}
                kitchenOpen={kitchenOpen}
                onGoHours={() => handleNavigate('hours')}
              />
            )}
            {page === 'hours' && (
              <HoursScreen
                kitchenOpen={kitchenOpen}
                onToggleKitchen={() => setKitchenOpen((o) => !o)}
                schedule={schedule}
                onToggleDay={toggleDay}
                onUpdateHour={updateHour}
                onSaveSettings={() => showToast('Delivery settings saved!')}
                closures={closures}
                onAddClosure={addClosure}
                onRemoveClosure={removeClosure}
              />
            )}
            {page === 'txns' && (
              <TransactionsScreen txns={txns} onOpenTxDetail={(id) => setTxDetailId(id)} />
            )}
            {page === 'withdrawals' && (
              <WithdrawalsScreen onOpenWithdraw={() => setWithdrawOpen(true)} />
            )}
            {page === 'bank' && (
              <BankScreen onShowToast={(msg) => showToast(msg)} />
            )}
            {page === 'security' && (
              <SecurityScreen onShowToast={(msg) => showToast(msg)} />
            )}
            {page === 'notifs' && (
              <NotificationsScreen notifs={notifs} onRead={markNotifRead} onMarkAllRead={markAllRead} />
            )}
          </div>
        </div>
      </div>

      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} onShowToast={(msg) => showToast(msg)} />
      <TxDetailModal open={!!txDetailId} tx={currentTx} onClose={() => setTxDetailId(null)} />
      <AddFoodModal open={foodModalOpen} editingItem={editingFood} onClose={() => { setFoodModalOpen(false); setEditingFoodId(null); }} onSave={saveFood} />

      <div id="sidebar-overlay" className={sidebarOpen ? 'open' : ''} onClick={() => setSidebarOpen(false)}></div>

      <Toast visible={toast.visible} message={toast.message} ok={toast.ok} />
    </>
  );
}

export default App;
