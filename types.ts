
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  ON_HOLD = 'on_hold'
}

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastSeen?: string;
  is_active?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface CourierConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  webhookUrl?: string;
  accountEmail: string;
  accountPassword?: string;
}

export type LeadStatus = 'pending' | 'confirmed' | 'communication' | 'no-response';

export interface Lead {
  id: string;
  phoneNumber: string;
  customerName?: string;
  address?: string;
  moderatorId: string;
  status: LeadStatus;
  assignedDate: string;
  createdAt: string;
}

export interface Order {
  id: string;
  moderatorId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryRegion: 'inside' | 'outside' | 'sub';
  deliveryCharge: number;
  items: OrderItem[];
  totalAmount: number; // Subtotal
  grandTotal: number;  // Subtotal + Delivery
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  steadfastId?: string;
  courierStatus?: string;
}

export interface AppState {
  currentUser: User | null;
  orders: Order[];
  products: Product[];
  moderators: User[];
  courierConfig: CourierConfig;
  leads: Lead[];
}
