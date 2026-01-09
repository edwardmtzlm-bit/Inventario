
export interface User {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  SHIPPED = 'SHIPPED',
  COMPLETED_SALE = 'COMPLETED_SALE'
}

export type OrderType = 'PICKUP' | 'SHIPPING' | 'DIRECT_SALE' | 'GIFT';

export interface Order {
  id: string;
  type: OrderType;
  items: OrderItem[];
  recipientName: string;
  delivererId: string;
  delivererName: string;
  createdAt: number;
  deliveredAt?: number;
  status: OrderStatus;
  signature?: string;
  // Campos de envío
  shippingProvider?: string;
  trackingNumber?: string;
  // Campos de venta física
  sellerName?: string;
  // Campos de regalo/obsequio
  authorizedBy?: string;
}

export enum LogType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT'
}

export interface InventoryLog {
  id: string;
  timestamp: number;
  type: LogType;
  productId: string;
  productName: string;
  quantity: number;
  userId: string;
  userName: string;
  orderId?: string;
}
