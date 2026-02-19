
export interface User {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl?: string;
  category: string;
  stock: number;
  amazonStock: number;
  amazonEnabled: boolean;
  minStock: number;
  price: number;
}

export interface OrderItem {
  lineId?: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  affectsStock?: boolean;
  isBundleCharge?: boolean;
  bundleId?: string;
  bundleName?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
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
  EXIT = 'EXIT',
  AMAZON_SALE = 'AMAZON_SALE',
  AMAZON_TRANSFER = 'AMAZON_TRANSFER'
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

export interface RawMaterial {
  id: string;
  size: string;
  color: string;
  qty: number;
}
