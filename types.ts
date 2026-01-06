
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
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
  lastSeen?: string; // Track when moderator was last active
}

export interface Product {
  id: string;
  sku: string; // Product Code
  name: string;
  price: number;
  stock?: number;
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

export interface Lead {
  id: string;
  phoneNumber: string;
  moderatorId: string;
  status: 'new' | 'called';
  assignedDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Order {
  id: string;
  moderatorId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
  // Courier Integration Fields
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
