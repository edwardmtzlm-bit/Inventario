import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', sku: 'LIB-001', name: 'Libro Poder Personal', category: 'Libros', stock: 200, amazonStock: 0, amazonEnabled: false, minStock: 20, price: 250 },
  { id: 'p2', sku: 'LIB-002', name: 'Libro Los 10 principios de la lucidez en la toma de decisiones', category: 'Libros', stock: 500, amazonStock: 0, amazonEnabled: false, minStock: 50, price: 300 },
  { id: 'p3', sku: 'LIB-003', name: 'Libro Hipermarketing', category: 'Libros', stock: 100, amazonStock: 0, amazonEnabled: false, minStock: 15, price: 280 },
  { id: 'p4', sku: 'TAZ-001', name: 'Taza Negra Ovejas negras', category: 'Mercancía', stock: 50, amazonStock: 0, amazonEnabled: false, minStock: 10, price: 150 },
  { id: 'p5', sku: 'TAZ-002', name: 'Taza blanca ovejas negras', category: 'Mercancía', stock: 30, amazonStock: 0, amazonEnabled: false, minStock: 5, price: 150 }
];

export const APP_CREDENTIALS = {
  email: 'info@horaciomarchand.com',
  password: 'HMadmin1.'
};

export const AUTHORIZED_USER = {
  id: 'u1',
  name: 'Horacio Marchand - Administrador'
};

export const CATEGORIES = ['Libros', 'Mercancía', 'Papelería', 'Electrónica', 'Otros'];
