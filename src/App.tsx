import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
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
import { INITIAL_FOOD_ITEMS, INITIAL_ORDERS, NOTIFS, TXNS, WEEK_SCHEDULE, type FoodItem, type Order, type Txn, type WeekScheduleRow } from './data/mock';
import { auth } from './lib/firebase';
import { getVendorProfile, getVendorUserProfile, signOutVendor } from './services/vendorAuth';
import {
  advanceVendorOrderStatus,
  archiveVendorProduct,
  buildChartFromTransactions,
  createWithdrawal,
  fetchVendorNotifications,
  fetchVendorOrders,
  fetchVendorProducts,
  fetchVendorStore,
  fetchWalletOverview,
  fetchWalletSummary,
  fetchWalletTransactions,
  fetchWithdrawals,
  markAllVendorNotificationsRead,
  markVendorNotificationRead,
  saveVendorProduct,
  setVendorProductAvailability,
} from './services/vendorPortal';
import type { VendorProfile, VendorUserProfile } from './types/firebase';
import type { BankAccount, VendorOrder, WalletOverview, WalletSummary, WithdrawalRecord } from './types/portal';
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
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [userProfile, setUserProfile] = useState<VendorUserProfile | null>(null);
  const [store, setStore] = useState<Record<string, unknown> | null>(null);

  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [txns, setTxns] = useState<Txn[]>(TXNS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(INITIAL_FOOD_ITEMS);
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_ORDERS as VendorOrder[]);
  const [chart, setChart] = useState<{ d: string; v: number }[]>([]);
  const [activeOrderTab, setActiveOrderTab] = useState<Order['status']>('new');
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [schedule, setSchedule] = useState<WeekScheduleRow[]>(WEEK_SCHEDULE);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [withdrawProcessing, setWithdrawProcessing] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', ok: true });

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [txDetailId, setTxDetailId] = useState<string | null>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);

  const initializedAuth = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!initializedAuth.current) {
        setAuthHidden(Boolean(user));
        initializedAuth.current = true;
      }

      if (!user) {
        setVendorProfile(null);
        setUserProfile(null);
        setStore(null);
        setWallet(null);
        setSummary(null);
        setWithdrawals([]);
        setAuthReady(true);
        return;
      }

      try {
        const [vendorData, userData, storeData] = await Promise.all([
          getVendorProfile(user.uid),
          getVendorUserProfile(user.uid),
          fetchVendorStore(user.uid),
        ]);
        setVendorProfile(vendorData);
        setUserProfile(userData);
        setStore(storeData);
      } catch (error) {
        console.error('Failed to load vendor profile:', error);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const showToast = (message: string, ok = true) => {
    setToast({ visible: true, message, ok });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  const loadDashboard = async () => {
    if (!currentUser) return;

    setDashboardLoading(true);
    try {
      const [walletData, summaryData, txnData, withdrawalData, orderData, productData, notifData, storeData] = await Promise.all([
        fetchWalletOverview().catch(() => null),
        fetchWalletSummary().catch(() => null),
        fetchWalletTransactions().catch(() => []),
        fetchWithdrawals().catch(() => []),
        fetchVendorOrders(currentUser.uid).catch(() => []),
        fetchVendorProducts(currentUser.uid).catch(() => []),
        fetchVendorNotifications(currentUser.uid).catch(() => []),
        store ? Promise.resolve(store) : fetchVendorStore(currentUser.uid).catch(() => null),
      ]);

      setWallet(walletData);
      setSummary(summaryData);
      setTxns(txnData);
      setWithdrawals(withdrawalData);
      setOrders(orderData);
      setFoodItems(productData.length ? productData : []);
      setNotifs(notifData);
      setChart(buildChartFromTransactions(txnData));
      setStore(storeData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      showToast('Some live data could not be loaded.', false);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboard();
    }
  }, [currentUser]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const ordersBadge = orders.filter((o) => o.status === 'new').length;

  const currentTx = txns.find((t) => t.id === txDetailId) || null;
  const editingFood = foodItems.find((f) => f.id === editingFoodId) || null;

  const kitchenName = vendorProfile?.businessName || "Mama's Kitchen";
  const locationLabel = [vendorProfile?.lga, vendorProfile?.state].filter(Boolean).join(', ') || vendorProfile?.address || 'Set your kitchen location';
  const initials = `${userProfile?.firstName?.[0] || kitchenName[0] || currentUser?.email?.[0] || 'V'}${userProfile?.lastName?.[0] || kitchenName[1] || ''}`.toUpperCase();
  const vendorStatus = vendorProfile?.vendorStatus || vendorProfile?.status || 'pending';
  const availableBalance = wallet?.availableBalance || 0;
  const bankAccount: BankAccount | null = wallet?.bankAccount || null;

  const handleNavigate = (next: PageKey) => {
    setPage(next);
    setSidebarOpen(false);
  };

  const advanceOrder = async (id: string) => {
    const target = orders.find((order) => order.id === id);
    if (!target) return;

    try {
      await advanceVendorOrderStatus(target);
      showToast(`${id} updated`);
      await loadDashboard();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update order', false);
    }
  };

  const rejectOrder = async () => {
    showToast(`Order rejection is not wired yet on the backend.`, false);
  };

  const toggleAvail = async (id: string) => {
    const item = foodItems.find((food) => food.id === id);
    if (!item) return;

    const nextAvail = item.avail === 'hidden' ? 'available' : item.avail === 'available' ? 'soldout' : 'available';
    try {
      await setVendorProductAvailability(id, nextAvail);
      setFoodItems((prev) => prev.map((food) => (food.id !== id ? food : { ...food, avail: nextAvail })));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update product availability', false);
    }
  };

  const deleteFood = async (id: string) => {
    const item = foodItems.find((f) => f.id === id);
    if (!item) return;
    if (!confirm(`Remove "${item.name}" from your menu?`)) return;

    try {
      await archiveVendorProduct(id);
      setFoodItems((prev) => prev.filter((f) => f.id !== id));
      showToast(`${item.name} removed from menu`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove menu item', false);
    }
  };

  const saveFood = async (item: Omit<FoodItem, 'id' | 'emoji'> & { id?: string; emoji?: string }) => {
    if (!currentUser) {
      showToast('Please sign in again.', false);
      return;
    }

    try {
      const id = await saveVendorProduct({
        item,
        vendorProfile,
        userProfile,
        uid: currentUser.uid,
        store,
      });

      const nextItem: FoodItem = {
        id,
        name: item.name,
        cat: item.cat,
        price: item.price,
        desc: item.desc,
        prep: item.prep,
        avail: item.avail,
        tags: item.tags,
        emoji: item.emoji || (item.cat === 'rice' ? '🍛' : item.cat === 'soup' ? '🥣' : item.cat === 'protein' ? '🍗' : '🥤'),
      };

      setFoodItems((prev) => {
        const exists = prev.some((food) => food.id === id);
        return exists ? prev.map((food) => (food.id === id ? nextItem : food)) : [nextItem, ...prev];
      });
      showToast(item.id ? `${item.name} updated!` : `${item.name} added to your menu!`);
      setFoodModalOpen(false);
      setEditingFoodId(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save food item', false);
    }
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

  const markNotifRead = async (id: string) => {
    try {
      await markVendorNotificationRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      showToast('Failed to mark notification as read', false);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllVendorNotificationsRead(notifs);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      showToast('Failed to update notifications', false);
    }
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--t2)', padding: '24px' }}>
        <div style={{ width: 'min(360px, 90vw)' }}>
          <div style={{ marginBottom: '10px', fontWeight: 600, letterSpacing: '0.01em' }}>Loading vendor portal...</div>
          <div className="vendor-loading-track" aria-live="polite" aria-label="Loading">
            <div className="vendor-loading-fill" />
          </div>
        </div>
      </div>
    );
  }

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
          kitchenName={kitchenName}
          locationLabel={locationLabel}
          initials={initials}
          vendorStatus={vendorStatus}
          availableBalance={availableBalance}
          onSignOut={async () => {
            try {
              await signOutVendor();
              setAuthHidden(false);
              showToast('Signed out successfully.');
            } catch (error) {
              console.error('Sign-out failed:', error);
              showToast('Unable to sign out right now.', false);
            }
          }}
        />

        <div id="content">
          <Topbar
            title={dashboardLoading ? `${PAGES[page]} · Syncing` : PAGES[page]}
            onHamburger={() => setSidebarOpen((s) => !s)}
            onNotifications={() => handleNavigate('notifs')}
            showBellDot={unreadCount > 0}
            initials={initials}
          />

          <div id="main">
            {page === 'overview' && (
              <OverviewScreen
                chart={chart}
                txns={txns}
                wallet={wallet}
                summary={summary}
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
              <WithdrawalsScreen withdrawals={withdrawals} onOpenWithdraw={() => setWithdrawOpen(true)} />
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

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onShowToast={(msg) => showToast(msg)}
        availableBalance={availableBalance}
        bankAccount={bankAccount}
        processing={withdrawProcessing}
        onSubmit={async ({ amount, pin }) => {
          try {
            setWithdrawProcessing(true);
            await createWithdrawal({ amount, pin });
            await loadDashboard();
          } finally {
            setWithdrawProcessing(false);
          }
        }}
      />
      <TxDetailModal open={!!txDetailId} tx={currentTx} onClose={() => setTxDetailId(null)} />
      <AddFoodModal open={foodModalOpen} editingItem={editingFood} onClose={() => { setFoodModalOpen(false); setEditingFoodId(null); }} onSave={saveFood} />

      <div id="sidebar-overlay" className={sidebarOpen ? 'open' : ''} onClick={() => setSidebarOpen(false)}></div>

      <Toast visible={toast.visible} message={toast.message} ok={toast.ok} />
    </>
  );
}

export default App;
