import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import type { FoodItem, Notif, Order, Txn } from '../data/mock'
import { db } from '../lib/firebase'
import { apiFetchAuth } from '../lib/api'
import type { VendorProfile, VendorUserProfile } from '../types/firebase'
import type { VendorOrder, WalletOverview, WalletSummary, WithdrawalRecord } from '../types/portal'

const CATEGORY_TO_PRODUCT: Record<FoodItem['cat'], { categoryId: string; categoryName: string; subCategoryId: string; subCategoryName: string }> = {
  rice: { categoryId: 'food_drinks', categoryName: 'Food & Drinks', subCategoryId: 'meals', subCategoryName: 'Meals' },
  soup: { categoryId: 'food_drinks', categoryName: 'Food & Drinks', subCategoryId: 'soups', subCategoryName: 'Soups' },
  protein: { categoryId: 'food_drinks', categoryName: 'Food & Drinks', subCategoryId: 'proteins', subCategoryName: 'Proteins' },
  drinks: { categoryId: 'food_drinks', categoryName: 'Food & Drinks', subCategoryId: 'beverages', subCategoryName: 'Beverages' },
}

const statusToUiStatus = (status: string): Order['status'] => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'placed') return 'new'
  if (normalized === 'confirmed' || normalized === 'preparing' || normalized === 'processing') return 'accepted'
  if (normalized === 'ready') return 'ready'
  if (normalized === 'out_for_delivery' || normalized === 'shipped') return 'picked'
  return 'done'
}

const uiStatusToNextBackendStatus = (status: string) => {
  if (status === 'new' || status === 'placed') return 'confirmed'
  if (status === 'accepted' || status === 'confirmed' || status === 'preparing') return 'ready'
  if (status === 'ready') return 'out_for_delivery'
  if (status === 'picked' || status === 'out_for_delivery') return 'delivered'
  return null
}

const toMillis = (value: unknown) => {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return value.toMillis()
  }
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return Date.now()
}

const toDate = (value: unknown) => new Date(toMillis(value))

const formatTime = (value: unknown) =>
  new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(toDate(value))

const formatShortDay = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)

const formatRelative = (value: unknown) => {
  const date = toDate(value)
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`

  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

  return formatTime(value)
}

const normalizeTxnType = (type: string): Txn['type'] => {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'withdrawal') return 'debit'
  if (normalized === 'reversal') return 'reversal'
  if (normalized === 'adjustment') return 'adjustment'
  return normalized === 'credit' ? 'credit' : 'debit'
}

const categoryFromProduct = (product: Record<string, unknown>): FoodItem['cat'] => {
  const sub = String(product.subCategoryId || product.subCategoryName || '').toLowerCase()
  const cat = String(product.categoryName || '').toLowerCase()

  if (sub.includes('drink') || sub.includes('beverage')) return 'drinks'
  if (sub.includes('protein')) return 'protein'
  if (sub.includes('soup')) return 'soup'
  if (cat.includes('drink')) return 'drinks'
  return 'rice'
}

const emojiForCategory = (cat: FoodItem['cat']) =>
  ({ rice: '🍛', soup: '🥣', protein: '🍗', drinks: '🥤' })[cat]

const productToFoodItem = (id: string, product: Record<string, unknown>): FoodItem => {
  const cat = categoryFromProduct(product)
  const status = String(product.status || 'active').toLowerCase()
  const availability = String(product.availability || '').toLowerCase()
  const stock = Number(product.stockQuantity || 0)
  const mealDetails =
    product.mealDetails && typeof product.mealDetails === 'object'
      ? (product.mealDetails as Record<string, unknown>)
      : null
  const avail: FoodItem['avail'] =
    status !== 'active' ? 'hidden' : availability === 'soldout' || stock <= 0 ? 'soldout' : 'available'

  return {
    id,
    name: String(product.name || 'Untitled product'),
    cat,
    price: Number(product.discountPrice || product.price || 0),
    desc: String(product.description || ''),
    prep: Number(mealDetails?.prepTimeMinutes || product.prepTime || 15),
    avail,
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
    emoji: String(product.emoji || emojiForCategory(cat)),
  }
}

export const fetchWalletOverview = async (): Promise<WalletOverview | null> => {
  const response = await apiFetchAuth('/api/seller-wallet')
  if (!response.ok) throw new Error('Failed to load wallet')
  const payload = await response.json()
  return payload.data as WalletOverview
}

export const fetchWalletSummary = async (): Promise<WalletSummary | null> => {
  const response = await apiFetchAuth('/api/seller-wallet/summary')
  if (!response.ok) throw new Error('Failed to load wallet summary')
  const payload = await response.json()
  return payload.data as WalletSummary
}

export const fetchWalletTransactions = async (): Promise<Txn[]> => {
  const response = await apiFetchAuth('/api/seller-wallet/transactions?limit=50')
  if (!response.ok) throw new Error('Failed to load transactions')
  const payload = await response.json()
  const transactions = payload.data?.transactions || []

  return transactions.map((tx: Record<string, unknown>) => {
    const direction = String(tx.direction || 'out').toLowerCase() === 'in' ? 'in' : 'out'
    const type = normalizeTxnType(String(tx.type || 'debit'))
    return {
      id: String(tx.id),
      type,
      desc: String(tx.description || tx.reference || 'Transaction'),
      amt: Number(tx.amount || 0),
      dir: direction,
      bal: Number(tx.balanceAfter || 0),
      time: formatTime(tx.createdAt),
      order: tx.orderId ? String(tx.orderId) : null,
      createdAtMs: toMillis(tx.createdAt),
    } as Txn
  })
}

export const fetchWithdrawals = async (): Promise<WithdrawalRecord[]> => {
  const response = await apiFetchAuth('/api/seller-wallet/withdrawals?limit=50')
  if (!response.ok) throw new Error('Failed to load withdrawals')
  const payload = await response.json()
  return (payload.data?.withdrawals || []) as WithdrawalRecord[]
}

export const createWithdrawal = async ({ amount, pin }: { amount: number; pin: string }) => {
  const response = await apiFetchAuth('/api/seller-wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify({
      amountKobo: Math.round(amount * 100),
      pin,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Failed to create withdrawal')
  }

  return payload.data as WithdrawalRecord
}

export const fetchVendorStore = async (uid: string) => {
  const snapshot = await getDocs(query(collection(db, 'stores'), where('vendorId', '==', uid), limit(1)))
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...(snapshot.docs[0].data() as Record<string, unknown>) }
  }
  return null
}

export const fetchVendorProducts = async (uid: string): Promise<FoodItem[]> => {
  const snapshot = await getDocs(query(collection(db, 'products'), where('vendorId', '==', uid)))
  return snapshot.docs
    .map((item) => productToFoodItem(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const saveVendorProduct = async ({
  item,
  vendorProfile,
  userProfile,
  uid,
  store,
}: {
  item: Omit<FoodItem, 'id' | 'emoji'> & { id?: string; emoji?: string }
  vendorProfile: VendorProfile | null
  userProfile: VendorUserProfile | null
  uid: string
  store: Record<string, unknown> | null
}) => {
  const refs = item.id ? doc(db, 'products', item.id) : doc(collection(db, 'products'))
  const categoryMeta = CATEGORY_TO_PRODUCT[item.cat]
  const status = item.avail === 'hidden' ? 'archived' : 'active'
  const availability = item.avail === 'hidden' ? 'hidden' : item.avail === 'soldout' ? 'soldout' : 'available'
  const stockQuantity = item.avail === 'soldout' ? 0 : 100
  const vendorName = [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ').trim() || 'Vendor'

  await setDoc(
    refs,
    {
      name: item.name,
      description: item.desc,
      price: item.price,
      discountPrice: item.price,
      status,
      availability,
      stockQuantity,
      tags: item.tags,
      emoji: item.emoji || emojiForCategory(item.cat),
      vendorId: uid,
      vendorName,
      businessName: vendorProfile?.businessName || store?.storeName || 'Blorbmart Vendor',
      storeId: String(store?.storeId || store?.id || ''),
      storeName: String(store?.storeName || vendorProfile?.businessName || 'Blorbmart Vendor'),
      categoryId: categoryMeta.categoryId,
      categoryName: categoryMeta.categoryName,
      subCategoryId: categoryMeta.subCategoryId,
      subCategoryName: categoryMeta.subCategoryName,
      hasVariants: false,
      images: item.image ? [item.image] : [],
      totalReviews: 0,
      totalSold: 0,
      rating: 0,
      mealDetails: {
        prepTimeMinutes: item.prep,
      },
      createdAt: item.id ? undefined : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return refs.id
}

export const setVendorProductAvailability = async (id: string, avail: FoodItem['avail']) => {
  await updateDoc(doc(db, 'products', id), {
    status: avail === 'hidden' ? 'archived' : 'active',
    availability: avail,
    stockQuantity: avail === 'soldout' ? 0 : 100,
    updatedAt: serverTimestamp(),
  })
}

export const archiveVendorProduct = async (id: string) => {
  await updateDoc(doc(db, 'products', id), {
    status: 'archived',
    availability: 'hidden',
    updatedAt: serverTimestamp(),
  })
}

export const fetchVendorOrders = async (uid: string): Promise<VendorOrder[]> => {
  const snapshot = await getDocs(query(collection(db, 'orders'), where('vendorIds', 'array-contains', uid)))

  return snapshot.docs
    .map((orderDoc) => {
      const data = orderDoc.data() as Record<string, unknown>
      const orderStatus = String(data.orderStatus || data.status || 'placed')
      const storeOrders = Array.isArray(data.storeOrders) ? data.storeOrders as Record<string, unknown>[] : []
      const matchingStoreOrders = storeOrders.filter((storeOrder) => String(storeOrder.vendorId || '') === uid)
      const selectedStoreOrder = matchingStoreOrders[0] || storeOrders[0] || {}
      const itemsSource = Array.isArray(selectedStoreOrder.items) ? selectedStoreOrder.items as Record<string, unknown>[] : []
      const deliveryAddress =
        data.deliveryAddress && typeof data.deliveryAddress === 'object'
          ? (data.deliveryAddress as Record<string, unknown>)
          : null

      return {
        id: String(data.orderId || orderDoc.id),
        backendStatus: orderStatus,
        status: statusToUiStatus(orderStatus),
        customer: String(data.userName || 'Customer'),
        addr: String(
          deliveryAddress
            ? [deliveryAddress.street, deliveryAddress.city, deliveryAddress.state].filter(Boolean).join(', ')
            : data.deliveryAddress || data.address || 'Address unavailable',
        ),
        items: itemsSource.map((item) => ({
          name: String(item.productName || item.name || 'Item'),
          qty: Number(item.quantity || item.qty || 1),
          price: Number(item.price || 0),
        })),
        total: Number(selectedStoreOrder.total || data.totalAmount || 0),
        placed: formatRelative(data.createdAt),
        note: String(data.notes || data.note || ''),
        createdAtMs: toMillis(data.createdAt),
      } as VendorOrder
    })
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
}

export const advanceVendorOrderStatus = async (order: VendorOrder) => {
  const nextStatus = uiStatusToNextBackendStatus(order.backendStatus || order.status)
  if (!nextStatus) return

  const response = await apiFetchAuth(`/api/orders/${order.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: nextStatus }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Failed to update order')
  }
}

export const fetchVendorNotifications = async (uid: string): Promise<Notif[]> => {
  const snapshot = await getDocs(query(collection(db, 'notifications'), where('userId', '==', uid)))
  return snapshot.docs
    .map((item) => {
      const data = item.data() as Record<string, unknown>
      return {
        id: item.id,
        title: String(data.title || 'Notification'),
        body: String(data.message || data.body || ''),
        time: formatRelative(data.createdAt || data.updatedAt),
        read: Boolean(data.read),
        icon: 'check' as const,
      }
    })
    .sort((a, b) => Number(!a.read) - Number(!b.read))
}

export const markVendorNotificationRead = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), {
    read: true,
    readAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const markAllVendorNotificationsRead = async (notifications: Notif[]) => {
  await Promise.all(
    notifications
      .filter((item) => !item.read)
      .map((item) => markVendorNotificationRead(item.id)),
  )
}

export const buildChartFromTransactions = (txns: Txn[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      d: formatShortDay(date),
      key: date.toDateString(),
      v: 0,
    }
  })

  txns.forEach((tx) => {
    if (tx.dir !== 'in') return
    const date = new Date((tx as Txn & { createdAtMs?: number }).createdAtMs || Date.now())
    const key = date.toDateString()
    const bucket = days.find((item) => item.key === key)
    if (bucket) {
      bucket.v += Number(tx.amt || 0)
    }
  })

  return days.map(({ d, v }) => ({ d, v }))
}
