import { supabase } from './supabaseClient';
import { InventoryLog, Order, OrderStatus, OrderType, Product, RawMaterial } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const toIsoString = (value?: number) => (value ? new Date(value).toISOString() : null);

const mapProductFromDb = (row: any): Product => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  category: row.category,
  stock: row.stock,
  amazonStock: row.amazon_stock ?? 0,
  amazonEnabled: row.amazon_enabled ?? false,
  minStock: row.min_stock,
  price: Number(row.price)
});

const mapOrderFromDb = (row: any): Order => ({
  id: row.id,
  type: row.type as OrderType,
  items: row.items || [],
  recipientName: row.recipient_name,
  delivererId: row.deliverer_id,
  delivererName: row.deliverer_name,
  createdAt: new Date(row.created_at).getTime(),
  deliveredAt: row.delivered_at ? new Date(row.delivered_at).getTime() : undefined,
  status: row.status as OrderStatus,
  signature: row.signature || undefined,
  shippingProvider: row.shipping_provider || undefined,
  trackingNumber: row.tracking_number || undefined,
  sellerName: row.seller_name || undefined,
  authorizedBy: row.authorized_by || undefined
});

const mapLogFromDb = (row: any): InventoryLog => ({
  id: row.id,
  timestamp: new Date(row.timestamp).getTime(),
  type: row.type,
  productId: row.product_id,
  productName: row.product_name,
  quantity: row.quantity,
  userId: row.user_id,
  userName: row.user_name,
  orderId: row.order_id || undefined
});

const mapRawMaterialFromDb = (row: any): RawMaterial => ({
  id: row.id,
  size: row.size,
  color: row.color,
  qty: row.qty
});

const RAW_SIZES = ['S', 'M', 'L', 'XL'];
const RAW_COLORS = ['Blanco', 'Negro'];

export const supabaseService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProductFromDb);
  },

  async seedProductsIfEmpty(): Promise<void> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    if (count && count > 0) return;

    const rows = INITIAL_PRODUCTS.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: p.stock,
      amazon_stock: p.amazonStock,
      amazon_enabled: p.amazonEnabled,
      min_stock: p.minStock,
      price: p.price
    }));

    const { error: insertError } = await supabase.from('products').insert(rows);
    if (insertError) throw insertError;
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: product.sku,
        name: product.name,
        category: product.category || 'Otros',
        stock: product.stock || 0,
        amazon_stock: product.amazonStock || 0,
        amazon_enabled: product.amazonEnabled ?? false,
        min_stock: product.minStock || 5,
        price: product.price || 0
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapProductFromDb(data);
  },

  async updateProductStock(id: string, newStock: number): Promise<void> {
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (error) throw error;
  },

  async updateProduct(id: string, fields: Partial<Pick<Product, 'stock' | 'price' | 'amazonStock' | 'amazonEnabled'>>): Promise<void> {
    const payload: Record<string, any> = {};
    if (typeof fields.stock === 'number') payload.stock = fields.stock;
    if (typeof fields.price === 'number') payload.price = fields.price;
    if (typeof fields.amazonStock === 'number') payload.amazon_stock = fields.amazonStock;
    if (typeof fields.amazonEnabled === 'boolean') payload.amazon_enabled = fields.amazonEnabled;
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) throw error;
  },

  async updateProductStocks(id: string, stock: number, amazonStock: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ stock, amazon_stock: amazonStock })
      .eq('id', id);
    if (error) throw error;
  },

  async updateAmazonStock(id: string, amazonStock: number): Promise<void> {
    const { error } = await supabase.from('products').update({ amazon_stock: amazonStock }).eq('id', id);
    if (error) throw error;
  },

  async setAmazonEnabled(id: string, amazonEnabled: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ amazon_enabled: amazonEnabled }).eq('id', id);
    if (error) throw error;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapOrderFromDb);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapOrderFromDb(data) : null;
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        type: order.type,
        items: order.items,
        recipient_name: order.recipientName,
        deliverer_id: order.delivererId,
        deliverer_name: order.delivererName,
        created_at: toIsoString(order.createdAt),
        delivered_at: toIsoString(order.deliveredAt),
        status: order.status,
        signature: order.signature || null,
        shipping_provider: order.shippingProvider || null,
        tracking_number: order.trackingNumber || null,
        seller_name: order.sellerName || null,
        authorized_by: order.authorizedBy || null
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapOrderFromDb(data);
  },

  async updateOrderStatus(id: string, status: OrderStatus, deliveredAt?: number, signature?: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        status,
        delivered_at: toIsoString(deliveredAt),
        signature: signature || null
      })
      .eq('id', id);
    if (error) throw error;
  },
 
  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  },

  async getLogs(): Promise<InventoryLog[]> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapLogFromDb);
  },

  async addLog(log: InventoryLog): Promise<void> {
    const { error } = await supabase.from('logs').insert({
      timestamp: new Date(log.timestamp).toISOString(),
      type: log.type,
      product_id: log.productId,
      product_name: log.productName,
      quantity: log.quantity,
      user_id: log.userId,
      user_name: log.userName,
      order_id: log.orderId || null
    });
    if (error) throw error;
  },

  async deleteLogsByOrderId(orderId: string): Promise<void> {
    const { error } = await supabase.from('logs').delete().eq('order_id', orderId);
    if (error) throw error;
  },

  async getRawMaterials(): Promise<RawMaterial[]> {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('*')
      .order('size', { ascending: true })
      .order('color', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRawMaterialFromDb);
  },

  async seedRawMaterialsIfMissing(): Promise<void> {
    const { data, error } = await supabase
      .from('raw_materials')
      .select('size,color');
    if (error) throw error;

    const existing = new Set((data || []).map(row => `${row.size}-${row.color}`));
    const rows = RAW_SIZES.flatMap(size =>
      RAW_COLORS
        .filter(color => !existing.has(`${size}-${color}`))
        .map(color => ({
          size,
          color,
          qty: 0
        }))
    );
    if (rows.length === 0) return;
    const { error: insertError } = await supabase.from('raw_materials').insert(rows);
    if (insertError) throw insertError;
  },

  async updateRawMaterialQty(id: string, qty: number): Promise<void> {
    const { error } = await supabase.from('raw_materials').update({ qty }).eq('id', id);
    if (error) throw error;
  },

  async addRawMaterial(size: string, color: string, qty: number): Promise<RawMaterial> {
    const { data, error } = await supabase
      .from('raw_materials')
      .insert({ size, color, qty })
      .select('*')
      .single();
    if (error) throw error;
    return mapRawMaterialFromDb(data);
  }
};
