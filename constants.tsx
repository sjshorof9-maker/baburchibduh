
import { OrderStatus, UserRole, Product, Order, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'SCP-500', name: '🌶️ মিষ্টি মরিচ (Sweet Chili Powder) - ৫০০ গ্রাম', price: 550 },
  { id: 'p2', sku: 'SCP-1KG', name: '🌶️ মিষ্টি মরিচ (Sweet Chili Powder) - ১ কেজি', price: 950 },
  { id: 'p3', sku: 'SGM-200', name: '👑 শাহী গরম মসলা (Shahi Garam Masala) - ২০০ গ্রাম', price: 650 },
  { id: 'p4', sku: 'SGM-500', name: '👑 শাহী গরম মসলা (Shahi Garam Masala) - ৫০০ গ্রাম', price: 1424 },
  { id: 'p5', sku: 'TUR-500', name: '💛 দেশি হলুদের গুঁড়া (Turmeric Powder) - ৫০০ গ্রাম', price: 290 },
  { id: 'p6', sku: 'COR-500', name: '🌿 দেশি ধনিয়া গুঁড়া (Coriander Powder) - ৫০০ গ্রাম', price: 250 },
  { id: 'p7', sku: 'CUM-500', name: '🌾 দেশি জিরা গুঁড়া (Cumin Powder) - ৫০০ গ্রাম', price: 780 },
  { id: 'p8', sku: 'MEZ-200', name: '🍖 চট্টগ্রামের অরিজিনাল মেজবানি মাংসের মসলা (Mezban Masala) - ২০০ গ্রাম', price: 680 },
  { id: 'p9', sku: 'MEZ-500', name: '🍖 চট্টগ্রামের অরিজিনাল মেজবানি মাংসের মসলা (Mezban Masala) - ৫০০ গ্রাম', price: 1480 },
];

export const INITIAL_MODERATORS: User[] = [];

export const ADMIN_USER: User = {
  id: 'admin-root',
  name: 'Baburchi Admin',
  email: 'baburchiadmin01@gmail.com',
  role: UserRole.ADMIN,
};

export const MOCK_ORDERS: Order[] = [];

export const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
};
