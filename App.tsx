
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Product, Order, InventoryLog, User, OrderStatus, LogType, OrderItem, OrderType 
} from './types';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';
import { AUTHORIZED_USER, CATEGORIES, APP_CREDENTIALS } from './constants';
import { QRGenerator } from './components/QRGenerator';
import { SignaturePad } from './components/SignaturePad';

const DELETE_PASSWORD = import.meta.env.VITE_DELETE_PASSWORD as string | undefined;

// --- Components ---

const Layout: React.FC<{ children: React.ReactNode, user: User | null, onLogout: () => void }> = ({ children, user, onLogout }) => {
  const location = useLocation();

  const NavItem = ({ to, icon, label, exact = false }: { to: string, icon: string, label: string, exact?: boolean }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
          isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <i className={`fas ${icon} text-lg`}></i>
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </Link>
    );
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-boxes-stacked text-white text-sm"></i>
          </div>
          <h1 className="font-bold text-lg text-slate-800 tracking-tight">InvExpert</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">Tienda</p>
            <p className="text-[10px] text-indigo-400 uppercase tracking-tighter">Sesión Activa</p>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 shadow-lg">
        <NavItem to="/" icon="fa-chart-pie" label="Panel" exact />
        <NavItem to="/inventory" icon="fa-box" label="Stock" />
        <NavItem to="/orders" icon="fa-file-invoice" label="Órdenes" />
        <NavItem to="/scan" icon="fa-qrcode" label="Escanear" />
        <NavItem to="/logs" icon="fa-history" label="Logs" />
        <NavItem to="/reports" icon="fa-chart-line" label="Reporte" />
        <NavItem to="/amazon" icon="fa-boxes" label="Amazon" />
      </nav>
    </div>
  );
};

// --- Views ---

const LoginView: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email.toLowerCase() === APP_CREDENTIALS.email.toLowerCase() && password === APP_CREDENTIALS.password) {
        onLogin(AUTHORIZED_USER);
      } else {
        setError('Correo o contraseña incorrectos.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-indigo-900 text-white">
      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
        <i className="fas fa-boxes-stacked text-4xl text-white"></i>
      </div>
      <h1 className="text-3xl font-black mb-1 text-center tracking-tight">InvExpert</h1>
      <p className="text-indigo-200 mb-10 text-center max-w-xs font-medium text-sm">Acceso Privado - Inventario</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-indigo-200 uppercase ml-1 tracking-widest">Correo Electrónico</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400"></i>
            <input 
              type="email" 
              required
              className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:bg-white focus:text-indigo-900 focus:outline-none transition-all placeholder:text-indigo-300/50"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-indigo-200 uppercase ml-1 tracking-widest">Contraseña</label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400"></i>
            <input 
              type="password" 
              required
              className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:bg-white focus:text-indigo-900 focus:outline-none transition-all placeholder:text-indigo-300/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="text-rose-400 text-[10px] font-black text-center bg-rose-400/10 py-3 rounded-xl border border-rose-400/20 uppercase tracking-wider animate-in fade-in zoom-in-95 duration-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-5 px-6 bg-white text-indigo-900 font-black rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
        >
          {loading ? (
            <i className="fas fa-circle-notch fa-spin"></i>
          ) : (
            <>
              <i className="fas fa-sign-in-alt"></i>
              <span>INGRESAR</span>
            </>
          )}
        </button>
      </form>
      
      <p className="mt-12 text-[9px] text-indigo-300/60 uppercase tracking-[0.2em] font-bold">Protección Interna InvExpert</p>
    </div>
  );
};

const Dashboard: React.FC<{ products: Product[], orders: Order[], logs: InventoryLog[] }> = ({ products, orders, logs }) => {
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const lowAmazonItems = products.filter(p => p.amazonEnabled && p.amazonStock <= AMAZON_LOW_STOCK);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const completedToday = orders.filter(o => (o.status !== OrderStatus.PENDING) && new Date(o.deliveredAt || o.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-3xl font-black text-indigo-600">{products.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-3xl font-black text-amber-500">{lowStockItems.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bajo Stock</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-3xl font-black text-blue-500">{pendingOrders.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pendientes</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-3xl font-black text-emerald-500">{completedToday.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salidas Hoy</span>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Alertas Stock</h2>
          <Link to="/inventory" className="text-xs text-indigo-600 font-bold">Ver todo</Link>
        </div>
        {lowStockItems.length > 0 ? (
          <div className="space-y-2">
            {lowStockItems.slice(0, 3).map(p => (
              <div key={p.id} className="bg-red-50 p-3 rounded-xl border border-red-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">{p.name}</span>
                <span className="text-xs font-black text-red-600">{p.stock} unid.</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">Sin alertas</p>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Alertas Amazon</h2>
          <Link to="/amazon" className="text-xs text-indigo-600 font-bold">Ver todo</Link>
        </div>
        {lowAmazonItems.length > 0 ? (
          <div className="space-y-2">
            {lowAmazonItems.slice(0, 3).map(p => (
              <div key={p.id} className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900">{p.name}</span>
                <span className="text-xs font-black text-amber-600">{p.amazonStock} unid.</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">Sin alertas</p>
        )}
      </section>
    </div>
  );
};

const ProductFormModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: (p: Partial<Product>) => void }> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ sku: '', name: '', category: CATEGORIES[0], stock: 0, minStock: 5, price: 0 });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-4">
        <h3 className="text-lg font-black text-slate-800">Nuevo Producto</h3>
        <div className="space-y-3">
          <input placeholder="SKU (ej: TAZ-123)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
          <input placeholder="Nombre del Artículo" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <div className="flex space-x-2">
            <div className="w-1/2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Stock</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
            </div>
            <div className="w-1/2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Precio</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
        </div>
        <div className="flex space-x-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400">Cancelar</button>
          <button onClick={() => { if(formData.name && formData.sku) { onSave(formData); onClose(); } else alert("Faltan datos"); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Guardar</button>
        </div>
      </div>
    </div>
  );
};

const InventoryListView: React.FC<{ 
  products: Product[], 
  onAddStock: (pid: string, qty: number) => void, 
  onDeleteProduct: (pid: string) => void,
  onAddProduct: (p: Partial<Product>) => void 
}> = ({ products, onAddStock, onDeleteProduct, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={onAddProduct} />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Stock Físico</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg flex items-center space-x-2 px-4">
          <i className="fas fa-plus text-xs"></i>
          <span className="text-xs font-bold">Nuevo</span>
        </button>
      </div>
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-3 pb-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div className="flex-1">
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{p.sku}</span>
              <h3 className="text-sm font-bold text-slate-800 mt-1">{p.name}</h3>
              <p className="text-xs text-indigo-500 font-bold">${p.price}</p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-black ${p.stock <= p.minStock ? 'text-red-500' : 'text-slate-800'}`}>{p.stock}</span>
              <div className="mt-2 flex space-x-1">
                <button onClick={() => {const q = prompt(`Añadir stock a ${p.name}:`); if(q) onAddStock(p.id, parseInt(q));}} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><i className="fas fa-plus text-xs"></i></button>
                <button onClick={() => confirm(`¿Borrar ${p.name}?`) && onDeleteProduct(p.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><i className="fas fa-trash-alt text-xs"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateOrderView: React.FC<{ products: Product[], onCreate: (recipient: string, items: OrderItem[], type: OrderType, extra: any) => void }> = ({ products, onCreate }) => {
  const [recipient, setRecipient] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>('PICKUP');
  const [shippingProvider, setShippingProvider] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!recipient || cart.length === 0) return alert("Faltan datos obligatorios (Cliente y Productos)");
    if (orderType === 'GIFT' && !authorizedBy) return alert("Debes indicar quién autoriza el regalo");
    
    onCreate(recipient, cart, orderType, { 
      shippingProvider, 
      trackingNumber, 
      sellerName,
      authorizedBy 
    });
    navigate('/orders');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">Salida de Mercancía</h2>
      
      <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm overflow-x-auto no-scrollbar">
        {(['PICKUP', 'SHIPPING', 'DIRECT_SALE', 'GIFT'] as OrderType[]).map(t => (
          <button 
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 min-w-[80px] py-3 text-[10px] font-bold rounded-xl transition-all whitespace-nowrap ${orderType === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t === 'PICKUP' ? 'RECOGER' : t === 'SHIPPING' ? 'ENVÍO' : t === 'DIRECT_SALE' ? 'VENTA' : 'REGALO'}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
            {orderType === 'GIFT' ? 'A QUIÉN SE LE OBSEQUIÓ' : 'CLIENTE / DESTINATARIO'}
          </label>
          <input placeholder="Nombre completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={recipient} onChange={e => setRecipient(e.target.value)} />
        </div>

        {orderType === 'GIFT' && (
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-bold text-indigo-600 uppercase ml-1">AUTORIZADO POR</label>
            <input placeholder="Nombre de quien autoriza" className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)} />
          </div>
        )}

        {orderType === 'SHIPPING' && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <input placeholder="Paquetería (ej: DHL, FedEx)" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={shippingProvider} onChange={e => setShippingProvider(e.target.value)} />
            <input placeholder="Número de Guía" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />
          </div>
        )}
        
        {orderType === 'DIRECT_SALE' && (
          <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">VENDEDOR</label>
            <input placeholder="Nombre del vendedor" className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold" value={sellerName} onChange={e => setSellerName(e.target.value)} />
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">AÑADIR PRODUCTOS</label>
        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
          <option value="">Seleccionar Artículo...</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Disp: {p.stock})</option>)}
        </select>
        <div className="flex space-x-2">
          <div className="w-24">
             <input type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
          </div>
          <button onClick={() => {
            const p = products.find(prod => prod.id === selectedProduct);
            if(p) { 
              const existing = cart.find(c => c.productId === p.id);
              if (existing) {
                setCart(cart.map(c => c.productId === p.id ? {...c, quantity: c.quantity + quantity} : c));
              } else {
                setCart([...cart, { productId: p.id, name: p.name, quantity }]); 
              }
              setSelectedProduct(''); 
              setQuantity(1);
            }
          }} className="flex-1 bg-slate-800 text-white rounded-xl font-bold transition-transform active:scale-95">Añadir</button>
        </div>
      </div>

      <div className="space-y-2">
        {cart.length > 0 && <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">LISTA DE SALIDA</label>}
        {cart.map(item => (
          <div key={item.productId} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center animate-in fade-in slide-in-from-left-2">
            <div>
              <p className="text-sm font-bold text-slate-800">{item.name}</p>
              <p className="text-xs text-indigo-600 font-medium">Cantidad: {item.quantity}</p>
            </div>
            <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="text-rose-400 p-2 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-alt"></i></button>
          </div>
        ))}
      </div>

      <button onClick={handleCreate} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 hover:bg-indigo-700">
        {orderType === 'GIFT' ? 'REGISTRAR OBSEQUIO' : 'GENERAR MOVIMIENTO'}
      </button>
    </div>
  );
};

const OrdersListView: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Órdenes de Salida</h2>
        <button onClick={() => navigate('/orders/new')} className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg px-4 flex items-center space-x-2">
          <i className="fas fa-plus text-xs"></i>
          <span className="text-xs font-bold uppercase">Nueva</span>
        </button>
      </div>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <i className="fas fa-file-invoice text-4xl text-slate-200 mb-3"></i>
            <p className="text-slate-400 text-sm">No hay órdenes registradas</p>
          </div>
        ) : (
          orders.map(o => (
            <Link key={o.id} to={`/orders/${o.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">#{o.id.slice(0,6)}</span>
                <div className="flex space-x-2">
                   {o.type === 'GIFT' && <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-700">Regalo</span>}
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${o.status === OrderStatus.PENDING ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {o.status === OrderStatus.PENDING ? 'Pendiente' : 'Entregado'}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 line-clamp-1">{o.recipientName}</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-slate-400 font-medium uppercase">{new Date(o.createdAt).toLocaleDateString()}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase">
                  {o.items.length} {o.items.length === 1 ? 'ítem' : 'ítems'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const OrderDetailView: React.FC<{ order: Order, onComplete: (signature: string) => void, onDelete: (orderId: string) => Promise<boolean> }> = ({ order, onComplete, onDelete }) => {
  const [showFulfillment, setShowFulfillment] = useState(false);
  const navigate = useNavigate();
  if (!order) return null;

  const handleDelete = async () => {
    const ok = await onDelete(order.id);
    if (ok) {
      navigate('/orders');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center space-x-2">
        <button onClick={() => navigate('/orders')} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><i className="fas fa-arrow-left"></i></button>
        <h2 className="text-xl font-black text-slate-800">Detalle de Salida</h2>
      </div>

      {order.type === 'PICKUP' && order.status === OrderStatus.PENDING && (
        <div className="bg-white p-6 rounded-3xl shadow-lg text-center border border-slate-100">
          <QRGenerator value={order.id} />
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">CÓDIGO DE RECOLECCIÓN</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border border-slate-100">
        <div className="flex justify-between items-start">
           <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
              {order.type === 'GIFT' ? 'Beneficiario' : 'Cliente'}
            </p>
            <p className="text-lg font-bold text-slate-900 leading-tight">{order.recipientName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${order.type === 'GIFT' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
              {order.type === 'PICKUP' ? 'Recolección' : order.type === 'SHIPPING' ? 'Envío' : order.type === 'DIRECT_SALE' ? 'Venta' : 'Regalo'}
            </span>
          </div>
        </div>

        {order.type === 'GIFT' && order.authorizedBy && (
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase">Autorizado por</p>
            <p className="text-sm font-bold text-indigo-900">{order.authorizedBy}</p>
          </div>
        )}

        {order.shippingProvider && (
           <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Paquetería</p>
                <p className="text-xs font-bold text-slate-700">{order.shippingProvider}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Guía</p>
                <p className="text-xs font-bold text-slate-700">{order.trackingNumber}</p>
              </div>
           </div>
        )}

        <div className="pt-4 border-t border-slate-50">
          <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Resumen de Artículos</p>
          <div className="space-y-2">
            {order.items.map(i => (
              <div key={i.productId} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">{i.name}</span>
                <span className="font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded">x{i.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {order.status === OrderStatus.PENDING && (
        <div className="space-y-4">
          {!showFulfillment ? (
            <button onClick={() => setShowFulfillment(true)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl animate-in fade-in duration-300">FIRMAR ENTREGA</button>
          ) : (
            <div className="bg-white p-6 rounded-3xl shadow-xl space-y-4 border border-emerald-100 animate-in zoom-in-95 duration-300">
              <h3 className="font-black text-center text-slate-800">Confirmación de Recibido</h3>
              <p className="text-xs text-center text-slate-400 px-4">Por favor, firme en el recuadro para confirmar la entrega física.</p>
              <SignaturePad onSave={onComplete} />
              <button onClick={() => setShowFulfillment(false)} className="w-full text-slate-400 text-xs py-2 font-bold uppercase tracking-widest">Cancelar proceso</button>
            </div>
          )}
        </div>
      )}

      {order.status !== OrderStatus.PENDING && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-emerald-600">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <i className="fas fa-check"></i>
            </div>
            <div>
              <p className="font-black uppercase text-sm tracking-tight">Movimiento Completado</p>
              <p className="text-[10px] text-slate-400 font-medium">{new Date(order.deliveredAt!).toLocaleString()}</p>
            </div>
          </div>
          {order.signature && (
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Firma Digital</p>
              <img src={order.signature} alt="Firma" className="max-h-32 mx-auto bg-slate-50 rounded-xl" />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleDelete}
        className="w-full py-3 text-rose-600 font-bold rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition"
      >
        Eliminar orden
      </button>
    </div>
  );
};

const LogsView: React.FC<{ logs: InventoryLog[] }> = ({ logs }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-black text-slate-800">Historial de Movimientos</h2>
    <div className="space-y-3">
      {logs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
           <p className="text-slate-400 text-sm italic">Sin historial de entradas o salidas</p>
        </div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${log.type === LogType.ENTRY ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                <i className={`fas ${log.type === LogType.ENTRY ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 line-clamp-1">{log.productName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-sm font-black ${log.type === LogType.ENTRY ? 'text-emerald-500' : 'text-rose-500'}`}>
                {log.type === LogType.ENTRY ? '+' : '-'}{log.quantity}
              </span>
              <p className="text-[9px] text-slate-300 font-bold uppercase">{log.userName}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const getMonthKey = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

type ReportRow = { id: string; name: string; units: number; sales: number };

const ReportsView: React.FC<{ logs: InventoryLog[], products: Product[] }> = ({ logs, products }) => {
  const productPriceMap = new Map<string, number>(products.map(p => [p.id, p.price]));
  const exitLogs = logs.filter(l => l.type === LogType.EXIT || l.type === LogType.AMAZON_SALE);
  const monthKeys = Array.from(new Set(exitLogs.map(l => getMonthKey(l.timestamp)))).sort().reverse();
  const [selectedMonth, setSelectedMonth] = useState(monthKeys[0] || getMonthKey(Date.now()));

  const monthLogs = exitLogs.filter(l => getMonthKey(l.timestamp) === selectedMonth);
  const productTotals: Map<string, ReportRow> = new Map();
  for (const log of monthLogs) {
    const existing = productTotals.get(log.productId);
    const entry = existing || { id: log.productId, name: log.productName, units: 0, sales: 0 };
    const price = productPriceMap.get(log.productId) ?? 0;
    entry.units += log.quantity;
    entry.sales += log.quantity * price;
    productTotals.set(log.productId, entry);
  }

  const rows: ReportRow[] = Array.from(productTotals.values()).sort((a, b) => b.sales - a.sales);
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const totalSales = rows.reduce((sum, r) => sum + r.sales, 0);

  const downloadCsv = () => {
    if (rows.length === 0) {
      alert('No hay movimientos para este mes');
      return;
    }
    const header = ['Producto', 'Unidades', 'Ventas'];
    const body = rows.map(r => [r.name, r.units.toString(), r.sales.toFixed(2)]);
    const lines = [header, ...body].map(cols => cols.map(v => `"${v.replace(/"/g, '""')}"`).join(','));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Reporte Mensual</h2>
        <button
          onClick={downloadCsv}
          className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-900 text-white"
        >
          Descargar CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Mes</label>
        <select
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        >
          {monthKeys.length === 0 ? (
            <option value={selectedMonth}>{selectedMonth}</option>
          ) : (
            monthKeys.map(m => (
              <option key={m} value={m}>{m}</option>
            ))
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Unidades</p>
          <p className="text-2xl font-black text-slate-800">{totalUnits}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Ventas</p>
          <p className="text-2xl font-black text-emerald-600">${totalSales.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Detalle por producto</h3>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">Sin movimientos para este mes.</p>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.name} className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.name}</p>
                  <p className="text-[10px] text-slate-400">Unidades: {r.units}</p>
                </div>
                <p className="text-sm font-black text-emerald-600">${r.sales.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AMAZON_LOW_STOCK = 100;

const AmazonView: React.FC<{
  products: Product[];
  onTransfer: (productId: string, qty: number) => Promise<void>;
  onSale: (productId: string, qty: number) => Promise<void>;
  onEnable: (productId: string) => Promise<void>;
  onCreate: (product: Partial<Product>) => Promise<void>;
}> = ({ products, onTransfer, onSale, onEnable, onCreate }) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [enableProduct, setEnableProduct] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [saleQty, setSaleQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [newAmazon, setNewAmazon] = useState({ sku: '', name: '', category: CATEGORIES[0], amazonStock: 0, price: 0 });

  const amazonProducts = products.filter(p => p.amazonEnabled);
  const nonAmazonProducts = products.filter(p => !p.amazonEnabled);

  const handleTransfer = async () => {
    if (!selectedProduct) return alert('Selecciona un producto');
    if (!Number.isFinite(transferQty) || transferQty <= 0) return alert('Cantidad inválida');
    setBusy(true);
    try {
      await onTransfer(selectedProduct, transferQty);
      setTransferQty(1);
    } finally {
      setBusy(false);
    }
  };

  const handleSale = async () => {
    if (!selectedProduct) return alert('Selecciona un producto');
    if (!Number.isFinite(saleQty) || saleQty <= 0) return alert('Cantidad inválida');
    setBusy(true);
    try {
      await onSale(selectedProduct, saleQty);
      setSaleQty(1);
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    if (!enableProduct) return alert('Selecciona un producto');
    setBusy(true);
    try {
      await onEnable(enableProduct);
      setEnableProduct('');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAmazon = async () => {
    if (!newAmazon.name || !newAmazon.sku) return alert('Faltan datos');
    setBusy(true);
    try {
      await onCreate({
        sku: newAmazon.sku,
        name: newAmazon.name,
        category: newAmazon.category,
        stock: 0,
        amazonStock: newAmazon.amazonStock || 0,
        amazonEnabled: true,
        minStock: 5,
        price: newAmazon.price || 0
      });
      setNewAmazon({ sku: '', name: '', category: CATEGORIES[0], amazonStock: 0, price: 0 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">Amazon</h2>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Habilitar producto existente</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="w-full sm:flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
            value={enableProduct}
            onChange={e => setEnableProduct(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {nonAmazonProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Local: {p.stock})
              </option>
            ))}
          </select>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-3 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-60"
          >
            Habilitar
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Crear producto Amazon</label>
        <div className="space-y-2">
          <input
            placeholder="SKU"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl"
            value={newAmazon.sku}
            onChange={e => setNewAmazon(prev => ({ ...prev, sku: e.target.value }))}
          />
          <input
            placeholder="Nombre"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl"
            value={newAmazon.name}
            onChange={e => setNewAmazon(prev => ({ ...prev, name: e.target.value }))}
          />
          <div className="flex space-x-2">
            <select
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
              value={newAmazon.category}
              onChange={e => setNewAmazon(prev => ({ ...prev, category: e.target.value }))}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Precio"
              className="w-28 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
              value={newAmazon.price}
              onChange={e => setNewAmazon(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <input
            type="number"
            placeholder="Stock Amazon"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
            value={newAmazon.amazonStock}
            onChange={e => setNewAmazon(prev => ({ ...prev, amazonStock: parseInt(e.target.value) || 0 }))}
          />
          <button
            onClick={handleCreateAmazon}
            disabled={busy}
            className="w-full bg-indigo-600 text-white rounded-xl font-bold py-3 disabled:opacity-60"
          >
            Crear en Amazon
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Producto</label>
        <select
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
          value={selectedProduct}
          onChange={e => setSelectedProduct(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {amazonProducts.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Local: {p.stock}, Amazon: {p.amazonStock})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Enviar a Amazon</label>
        <div className="flex space-x-2">
          <input
            type="number"
            min="1"
            className="w-24 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
            value={transferQty}
            onChange={e => setTransferQty(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={handleTransfer}
            disabled={busy}
            className="flex-1 bg-indigo-600 text-white rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-60"
          >
            Enviar
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Registrar venta Amazon</label>
        <div className="flex space-x-2">
          <input
            type="number"
            min="1"
            className="w-24 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
            value={saleQty}
            onChange={e => setSaleQty(parseInt(e.target.value) || 1)}
          />
          <button
            onClick={handleSale}
            disabled={busy}
            className="flex-1 bg-emerald-600 text-white rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-60"
          >
            Registrar
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Inventario Amazon</h3>
        <div className="space-y-3">
          {amazonProducts.map(p => (
            <div key={p.id} className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div>
                <p className="text-sm font-bold text-slate-800">{p.name}</p>
                <p className="text-[10px] text-slate-400">
                  Amazon: {p.amazonStock} · Local: {p.stock}
                </p>
              </div>
              {p.amazonStock <= AMAZON_LOW_STOCK ? (
                <span className="text-[10px] font-black px-2 py-1 rounded uppercase bg-rose-100 text-rose-700">
                  Bajo stock
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-1 rounded uppercase bg-emerald-100 text-emerald-700">
                  OK
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(storageService.getCurrentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      await supabaseService.seedProductsIfEmpty();
      const [loadedProducts, loadedOrders, loadedLogs] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getOrders(),
        supabaseService.getLogs()
      ]);
      setProducts(loadedProducts);
      setOrders(loadedOrders);
      setLogs(loadedLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando datos';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    storageService.setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    void loadData();
  }, []);

  const addStock = async (pid: string, qty: number) => {
    if (!Number.isFinite(qty) || qty <= 0) {
      alert('Cantidad invalida');
      return;
    }
    const p = products.find(prod => prod.id === pid);
    if (!p) return;
    const newStock = p.stock + qty;
    const log: InventoryLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      type: LogType.ENTRY,
      productId: pid,
      productName: p.name,
      quantity: qty,
      userId: user?.id || 'sys',
      userName: user?.name || 'Sistema'
    };

    try {
      await supabaseService.updateProductStock(pid, newStock);
      await supabaseService.addLog(log);
      setProducts(prev => prev.map(pr => pr.id === pid ? { ...pr, stock: newStock } : pr));
      setLogs(prev => [log, ...prev]);
    } catch (err) {
      alert('No se pudo actualizar el stock');
    }
  };

  const createOrder = async (recipient: string, items: OrderItem[], type: OrderType, extra: any) => {
    // Tipos de órdenes que descuentan stock de inmediato (no requieren escaneo/firma posterior obligatoria para descontar)
    const isInstant = type === 'DIRECT_SALE' || type === 'GIFT' || type === 'SHIPPING';
    
    const newOrder: Omit<Order, 'id'> = {
      type, 
      items, 
      recipientName: recipient, 
      delivererId: user?.id || 'u1', 
      delivererName: user?.name || 'Administrador',
      createdAt: Date.now(), 
      status: isInstant ? OrderStatus.DELIVERED : OrderStatus.PENDING, 
      deliveredAt: isInstant ? Date.now() : undefined, 
      ...extra
    };

    if (isInstant) {
      for (const item of items) {
        const p = products.find(prod => prod.id === item.productId);
        if (!p) {
          alert(`Producto no encontrado: ${item.name}`);
          return;
        }
        if (p.stock < item.quantity) {
          alert(`Stock insuficiente para ${item.name}`);
          return;
        }
      }
    }

    try {
      const createdOrder = await supabaseService.createOrder(newOrder);
      const newLogs: InventoryLog[] = [];

      if (isInstant) {
        for (const item of items) {
          const p = products.find(prod => prod.id === item.productId);
          if (!p) continue;
          const updatedStock = p.stock - item.quantity;
          await supabaseService.updateProductStock(item.productId, updatedStock);

          const log: InventoryLog = {
            id: Math.random().toString(36).slice(2, 9),
            timestamp: Date.now(),
            type: LogType.EXIT,
            productId: item.productId,
            productName: `${item.name} (${type === 'GIFT' ? 'Regalo' : 'Salida'})`,
            quantity: item.quantity,
            userId: user?.id || 'u1',
            userName: user?.name || 'Admin',
            orderId: createdOrder.id
          };
          await supabaseService.addLog(log);
          newLogs.push(log);
        }

        const itemMap = new Map(items.map(item => [item.productId, item.quantity]));
        setProducts(prev =>
          prev.map(prod =>
            itemMap.has(prod.id)
              ? { ...prod, stock: prod.stock - (itemMap.get(prod.id) || 0) }
              : prod
          )
        );
        setLogs(prev => [...newLogs, ...prev]);
      }

      setOrders(prev => [createdOrder, ...prev]);
    } catch (err) {
      alert('No se pudo crear la orden');
    }
  };

  const fulfillOrder = async (orderId: string, signature: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    for (const item of order.items) {
      const p = products.find(prod => prod.id === item.productId);
      if (!p) {
        alert(`Producto no encontrado: ${item.name}`);
        return;
      }
      if (p.stock < item.quantity) {
        alert(`Stock insuficiente para ${item.name}`);
        return;
      }
    }

    try {
      await supabaseService.updateOrderStatus(orderId, OrderStatus.DELIVERED, Date.now(), signature);
      const newLogs: InventoryLog[] = [];

      for (const item of order.items) {
        const p = products.find(prod => prod.id === item.productId);
        if (!p) continue;
        const updatedStock = p.stock - item.quantity;
        await supabaseService.updateProductStock(item.productId, updatedStock);

        const log: InventoryLog = {
          id: Math.random().toString(36).slice(2, 9),
          timestamp: Date.now(),
          type: LogType.EXIT,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          userId: user?.id || 'u1',
          userName: user?.name || 'Admin',
          orderId: orderId
        };
        await supabaseService.addLog(log);
        newLogs.push(log);
      }

      const itemMap = new Map<string, number>(
        order.items.map(item => [item.productId, item.quantity])
      );
      setProducts(prev =>
        prev.map(prod =>
          itemMap.has(prod.id)
            ? { ...prod, stock: prod.stock - (itemMap.get(prod.id) || 0) }
            : prod
        )
      );
      setLogs(prev => [...newLogs, ...prev]);
      setOrders(prev =>
        prev.map(o => o.id === orderId ? {
          ...o,
          status: OrderStatus.DELIVERED,
          deliveredAt: Date.now(),
          signature
        } : o)
      );
    } catch (err) {
      alert('No se pudo completar la orden');
    }
  };

  const deleteOrder = async (orderId: string): Promise<boolean> => {
    if (!DELETE_PASSWORD) {
      alert('Configura VITE_DELETE_PASSWORD en .env.local');
      return false;
    }
    const input = prompt('Contraseña para eliminar');
    if (!input) return false;
    if (input !== DELETE_PASSWORD) {
      alert('Contraseña incorrecta');
      return false;
    }
    const confirmed = confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.');
    if (!confirmed) return false;

    try {
      await supabaseService.deleteOrder(orderId);
      await supabaseService.deleteLogsByOrderId(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setLogs(prev => prev.filter(l => l.orderId !== orderId));
      return true;
    } catch (err) {
      alert('No se pudo eliminar la orden');
      return false;
    }
  };

  const transferToAmazon = async (productId: string, qty: number): Promise<void> => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!product.amazonEnabled) {
      alert(`El producto ${product.name} no está habilitado para Amazon`);
      return;
    }
    if (product.stock < qty) {
      alert(`Stock insuficiente para ${product.name}`);
      return;
    }
    const newLocalStock = product.stock - qty;
    const newAmazonStock = product.amazonStock + qty;
    const log: InventoryLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      type: LogType.AMAZON_TRANSFER,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      userId: user?.id || 'u1',
      userName: user?.name || 'Admin'
    };

    try {
      await supabaseService.updateProductStocks(product.id, newLocalStock, newAmazonStock);
      await supabaseService.addLog(log);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newLocalStock, amazonStock: newAmazonStock } : p));
      setLogs(prev => [log, ...prev]);
    } catch (err) {
      alert('No se pudo transferir a Amazon');
    }
  };

  const recordAmazonSale = async (productId: string, qty: number): Promise<void> => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (!product.amazonEnabled) {
      alert(`El producto ${product.name} no está habilitado para Amazon`);
      return;
    }
    if (product.amazonStock < qty) {
      alert(`Stock Amazon insuficiente para ${product.name}`);
      return;
    }
    const newAmazonStock = product.amazonStock - qty;
    const log: InventoryLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      type: LogType.AMAZON_SALE,
      productId: product.id,
      productName: product.name,
      quantity: qty,
      userId: user?.id || 'u1',
      userName: user?.name || 'Admin'
    };

    try {
      await supabaseService.updateAmazonStock(product.id, newAmazonStock);
      await supabaseService.addLog(log);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, amazonStock: newAmazonStock } : p));
      setLogs(prev => [log, ...prev]);
    } catch (err) {
      alert('No se pudo registrar la venta Amazon');
    }
  };

  const enableAmazon = async (productId: string): Promise<void> => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    try {
      await supabaseService.setAmazonEnabled(product.id, true);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, amazonEnabled: true } : p));
    } catch (err) {
      alert('No se pudo habilitar para Amazon');
    }
  };

  const createAmazonProduct = async (product: Partial<Product>): Promise<void> => {
    try {
      const created = await supabaseService.addProduct(product);
      setProducts(prev => [...prev, created]);
    } catch (err) {
      alert('No se pudo crear el producto Amazon');
    }
  };

  if (!user) return <LoginView onLogin={setUser} />;

  return (
    <HashRouter>
      <Layout user={user} onLogout={() => setUser(null)}>
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Cargando datos...</div>
        ) : loadError ? (
          <div className="bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3">
            <p className="text-sm font-bold text-rose-600">Error al cargar datos</p>
            <p className="text-xs text-slate-500">{loadError}</p>
            <button onClick={loadData} className="px-4 py-2 bg-slate-900 text-white text-xs rounded-lg">Reintentar</button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard products={products} orders={orders} logs={logs} />} />
          <Route
            path="/inventory"
            element={
              <InventoryListView
                products={products}
                onAddStock={addStock}
                onAddProduct={p => {
                  const payload: Partial<Product> = {
                    sku: p.sku || '?',
                    name: p.name || '?',
                    category: p.category || 'Otros',
                    stock: p.stock || 0,
                    amazonStock: 0,
                    amazonEnabled: false,
                    minStock: p.minStock || 5,
                    price: p.price || 0
                  };
                  void supabaseService.addProduct(payload)
                    .then(newProduct => setProducts(prev => [...prev, newProduct]))
                      .catch(() => alert('No se pudo crear el producto'));
                  }}
                  onDeleteProduct={id => {
                    void supabaseService.deleteProduct(id)
                      .then(() => setProducts(prev => prev.filter(p => p.id !== id)))
                      .catch(() => alert('No se pudo borrar el producto'));
                  }}
                />
              }
            />
            <Route path="/orders" element={<OrdersListView orders={orders} />} />
            <Route path="/orders/new" element={<CreateOrderView products={products} onCreate={createOrder} />} />
            <Route path="/orders/:id" element={<OrderRouteWrapper orders={orders} onFulfill={fulfillOrder} onDelete={deleteOrder} />} />
            <Route path="/scan" element={<ScannerWrapper />} />
            <Route path="/logs" element={<LogsView logs={logs} />} />
            <Route path="/reports" element={<ReportsView logs={logs} products={products} />} />
            <Route path="/amazon" element={<AmazonRouteWrapper products={products} onTransfer={transferToAmazon} onSale={recordAmazonSale} onEnable={enableAmazon} onCreate={createAmazonProduct} />} />
          </Routes>
        )}
      </Layout>
    </HashRouter>
  );
}

const OrderRouteWrapper = ({ orders, onFulfill, onDelete }: { orders: Order[], onFulfill: (id: string, s: string) => void, onDelete: (id: string) => Promise<boolean> }) => {
  const location = useLocation();
  const parts = location.pathname.split('/');
  const id = parts[parts.length - 1];
  const order = orders.find(o => o.id === id);
  const navigate = useNavigate();
  if (!order) return <div className="p-4 text-center text-slate-400">Orden no encontrada</div>;
  return <OrderDetailView order={order} onComplete={s => { onFulfill(order.id, s); navigate('/orders'); }} onDelete={onDelete} />;
};

const AmazonRouteWrapper = ({
  products,
  onTransfer,
  onSale,
  onEnable,
  onCreate
}: {
  products: Product[];
  onTransfer: (id: string, qty: number) => Promise<void>;
  onSale: (id: string, qty: number) => Promise<void>;
  onEnable: (id: string) => Promise<void>;
  onCreate: (product: Partial<Product>) => Promise<void>;
}) => (
  <AmazonView products={products} onTransfer={onTransfer} onSale={onSale} onEnable={onEnable} onCreate={onCreate} />
);

const ScannerWrapper = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let sc = new (window as any).Html5Qrcode("reader");
    sc.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt: string) => { 
      sc.stop(); 
      navigate(`/orders/${txt}`); 
    }, () => {});
    return () => { 
      try { sc.stop(); } catch(e){} 
    };
  }, [navigate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-xl font-black text-slate-800">Escáner de Salidas</h2>
      <div id="reader" className="overflow-hidden rounded-3xl bg-slate-900 aspect-square border-4 border-white shadow-2xl relative">
        <div className="absolute inset-0 border-2 border-indigo-500/30 animate-pulse pointer-events-none"></div>
      </div>
      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center space-x-3">
        <i className="fas fa-info-circle text-indigo-500"></i>
        <p className="text-xs text-indigo-700 font-medium">Escanea el código QR que se generó en la orden de recolección para procesar la entrega.</p>
      </div>
    </div>
  );
};
