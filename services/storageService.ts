
import { Product, Order, InventoryLog } from '../types';
import { INITIAL_PRODUCTS as MOCK_PRODUCTS } from '../constants';

const STORAGE_KEYS = {
  PRODUCTS: 'invexpert_products',
  ORDERS: 'invexpert_orders',
  LOGS: 'invexpert_logs',
  USER: 'invexpert_current_user'
};

// Fixed incorrect import of INITIAL_PRODUCTS from types.ts
export const storageService = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : MOCK_PRODUCTS;
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrders: (orders: Order[]) => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },
  getLogs: (): InventoryLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },
  saveLogs: (logs: InventoryLog[]) => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },
  getCurrentUser: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setCurrentUser: (user: any) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};