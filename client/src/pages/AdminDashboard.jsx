import { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [newProduct, setNewProduct] = useState({
    name: '', 
    description: '', 
    price: '', 
    discount_price: '',
    category: '', 
    image_url: '', 
    is_active: true, 
    images_raw: '',
    variants: [],
    rating: 4.5,
    reviews_count: 0
  });
  const [variantInput, setVariantInput] = useState({ size: '', color: '', stock: 0 });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (activeTab === 'inventory') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');


      const res = await axios.get('/products/admin', {
        headers: { 'x-auth-token': token }
      });



      const invRes = await axios.get('/inventory', {
        headers: { 'x-auth-token': token }
      });


      const inventoryMap = {};
      invRes.data.forEach(item => {
        inventoryMap[item.product_id] = item.quantity_available;
      });

      const merged = res.data.map(p => ({
        ...p,
        quantity: inventoryMap[p.id] || 0
      }));

      setProducts(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/products/${id}`,
        { is_active: !currentStatus },
        { headers: { 'x-auth-token': token } }
      );

      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      console.error('Error toggling visibility', err);
    }
  };

  const updateStock = async (id, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/inventory/${id}`,
        { quantity: newQuantity },
        { headers: { 'x-auth-token': token } }
      );
      alert('Stock updated');

      setProducts(products.map(p => p.id === id ? { ...p, quantity: newQuantity } : p));
    } catch (err) {
      console.error(err);
      alert('Failed to update stock');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      

      const imagesArr = newProduct.images_raw.split(',').map(s => s.trim()).filter(s => s !== '');


      const payload = {
        ...newProduct,
        images: imagesArr.length > 0 ? imagesArr : [newProduct.image_url],
        price: parseFloat(newProduct.price),
        discount_price: newProduct.discount_price ? parseFloat(newProduct.discount_price) : null,
        rating: parseFloat(newProduct.rating) || 0,
        reviews_count: parseInt(newProduct.reviews_count) || 0
      };

      await axios.post('/products', payload, {
        headers: { 'x-auth-token': token }
      });
      alert('Product added successfully');
      setNewProduct({ 
        name: '', description: '', price: '', discount_price: '', category: '', image_url: '', is_active: true, 
        images_raw: '', variants: [], rating: 4.5, reviews_count: 0
      });
      fetchProducts();
      setActiveTab('inventory');
    } catch (err) {
      console.error(err);
      alert('Failed to add product');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/orders/admin', {
        headers: { 'x-auth-token': token }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (selectedOrder?.status === newStatus) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/orders/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setSelectedOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addVariant = () => {
    if (!variantInput.size && !variantInput.color) return;
    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, { ...variantInput }]
    });
    setVariantInput({ size: '', color: '', stock: 0 });
  };

  const removeVariant = (index) => {
    setNewProduct({
      ...newProduct,
      variants: newProduct.variants.filter((_, i) => i !== index)
    });
  };




  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'packed': return 'bg-gray-50 text-gray-900 border-gray-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const getAllowedAdminStatuses = (currentStatus) => {
    const normalized = (currentStatus || '').toLowerCase();
    const returnFlow = ['return_requested', 'quality_check', 'refund_initiated', 'refunded'];
    const exchangeFlow = ['exchange_requested', 'exchange_approved', 'exchange_shipped', 'exchange_delivered'];

    if (returnFlow.includes(normalized)) return returnFlow;
    if (exchangeFlow.includes(normalized)) return exchangeFlow;
    return ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
  };

  return (
    <div className="min-h-screen bg-brand-bg py-20 px-6 font-poppins text-brand-primary">
      <div className="max-w-7xl mx-auto space-y-12">


        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 bg-white p-12 rounded-sm shadow-2xl border-t-8 border-brand-primary relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Admin Management</p>
            <h1 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 font-medium italic mt-2">Manage your products and orders.</p>
          </div>

          <div className="flex bg-[#faf9f6] p-2 rounded-sm relative z-10 border border-gray-50">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-8 py-3 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'inventory' ? 'bg-brand-primary text-white shadow-xl' : 'text-gray-400 hover:text-brand-primary'}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-8 py-3 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'orders' ? 'bg-brand-primary text-white shadow-xl' : 'text-gray-400 hover:text-brand-primary'}`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-8 py-3 rounded-sm font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'add' ? 'bg-brand-primary text-white shadow-xl' : 'text-gray-400 hover:text-brand-primary'}`}
            >
              Add Product
            </button>
          </div>

          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-accent/5 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[60vh] animate-fade-in-up">
          {activeTab === 'inventory' && (
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Available Products</h3>
                <span className="bg-gray-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">
                  {products.length} Items Listed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-300 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                      <th className="pb-6 pl-2">Product Details</th>
                      <th className="pb-6">Price</th>
                      <th className="pb-6">Visibility</th>
                      <th className="pb-6">Stock Status</th>
                      <th className="pb-6 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(product => (
                      <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-6 pl-2">
                          <div className="font-extrabold text-gray-900 group-hover:text-brand-accent transition-colors">{product.name}</div>
                          <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">{product.category}</div>
                        </td>
                        <td className="py-6 font-bold text-gray-600 italic">₹{product.price}</td>
                        <td className="py-6">
                          {product.is_active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-500 border border-green-100">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 border border-gray-200">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-6">
                          <input
                            type="number"
                            className="w-20 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-black text-gray-900 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all outline-none"
                            defaultValue={product.quantity}
                            onBlur={(e) => updateStock(product.id, e.target.value)}
                          />
                        </td>
                        <td className="py-6 text-right pr-2">
                          <button
                            onClick={() => toggleVisibility(product.id, product.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${product.is_active ? 'text-red-400 bg-red-50/50 hover:bg-red-50 border border-red-100' : 'text-brand-accent bg-blue-50/50 hover:bg-blue-50 border border-blue-100'}`}
                          >
                            {product.is_active ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">Active Orders</h3>
                <span className="bg-gray-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">
                  {orders.length} Orders Pending
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-300 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                      <th className="pb-6 pl-2 text-center">ID</th>
                      <th className="pb-6">Recipient</th>
                      <th className="pb-6">Placed At</th>
                      <th className="pb-6">Amount</th>
                      <th className="pb-6">Payment</th>
                      <th className="pb-6 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => (
                      <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="py-6 pl-2 font-black text-gray-400 text-center text-[10px]">#{order.id}</td>
                        <td className="py-6">
                          <div className="font-extrabold text-gray-900 truncate max-w-[150px]">{order.user_name || order.customer_name}</div>
                          <div className="text-[10px] font-bold text-gray-300 mt-0.5 truncate max-w-[150px]">{order.user_email || order.customer_email}</div>
                        </td>
                        <td className="py-6 text-[10px] font-black text-gray-400 uppercase tracking-tighter">{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-6">
                            <div className="font-black text-brand-primary">₹{order.total_amount}</div>
                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${order.status === 'cancelled' ? 'text-red-400' : 'text-brand-accent'}`}>{order.status}</div>
                        </td>
                        <td className="py-6">
                           <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">{order.payment_method}</div>
                           <div className="text-[8px] font-bold text-gray-300 uppercase italic">{order.payment_status}</div>
                        </td>
                        <td className="py-6 text-right pr-2">
                          <button 
                            onClick={() => fetchOrderDetails(order.id)}
                            className="px-4 py-2 bg-[#faf9f6] text-[10px] font-black uppercase tracking-widest text-brand-primary rounded-sm border border-gray-100 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                          >
                            View Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end animate-fade-in">
                  <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                  <div className="relative w-full max-w-2xl h-full bg-white shadow-[-10px_0_50px_rgba(0,0,0,0.1)] overflow-y-auto animate-slide-left p-10 md:p-16">
                    <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 text-gray-300 hover:text-brand-primary transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    
                    <div className="space-y-12">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Order Summary</p>
                        <h2 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">Order #{selectedOrder.id}</h2>
                        <div className="h-px w-12 bg-brand-accent/20 my-6"></div>
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusBadgeStyle(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/40 border-b border-gray-50 pb-2">Customer Details</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-1">Name</p>
                                    <p className="text-sm font-extrabold text-brand-primary">{selectedOrder.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-gray-300 tracking-widest mb-1">Email</p>
                                    <p className="text-sm font-extrabold text-brand-primary">{selectedOrder.customer_email}</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/40 border-b border-gray-50 pb-2">Delivery Address</h4>
                            <div className="bg-[#faf9f6] p-6 rounded-sm border border-gray-50 shadow-inner">
                                <p className="text-[11px] font-bold text-brand-primary/70 leading-relaxed italic">
                                    {typeof selectedOrder.delivery_address === 'string' 
                                        ? selectedOrder.delivery_address 
                                        : `${selectedOrder.delivery_address?.street}, ${selectedOrder.delivery_address?.city}, ${selectedOrder.delivery_address?.state} - ${selectedOrder.delivery_address?.pincode}`}
                                </p>
                            </div>
                        </section>
                      </div>

                      <section className="space-y-8">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/40 border-b border-gray-50 pb-2">Items Ordered</h4>
                        <div className="space-y-8">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-8 group">
                                    <div className="w-24 h-32 bg-gray-50 rounded-sm overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow pt-2">
                                        <h5 className="font-extrabold text-brand-primary text-base mb-2">{item.name}</h5>
                                        <div className="flex gap-4 mb-4">
                                            {item.size !== 'NA' && <span className="text-[10px] font-black uppercase bg-[#faf9f6] px-2 py-1 border border-gray-100 text-gray-400">Size: {item.size}</span>}
                                            {item.color !== 'NA' && <span className="text-[10px] font-black uppercase bg-[#faf9f6] px-2 py-1 border border-gray-100 text-gray-400">Color: {item.color}</span>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-brand-accent">₹{item.price_at_purchase} <span className="text-gray-300 ml-2 font-medium">× {item.quantity}</span></p>
                                            <p className="text-sm font-black text-brand-primary">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </section>

                      <section className="bg-brand-primary p-10 rounded-sm shadow-2xl space-y-8">
                          <div className="flex justify-between items-center text-white/50 text-[10px] font-black uppercase tracking-[0.4em]">
                              <span>Payment: {selectedOrder.payment_method}</span>
                              <span className="text-brand-accent italic">{selectedOrder.payment_status}</span>
                          </div>
                          <div className="flex justify-between items-end">
                              <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Total Amount</p>
                              <p className="text-4xl font-playfair font-black text-white leading-none">₹{selectedOrder.total_amount}</p>
                          </div>
                      </section>

                      <section className="pt-10 border-t border-gray-50 flex flex-col items-center">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-6">Change Order Status</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                            {getAllowedAdminStatuses(selectedOrder.status).map(status => (
                                    <button
                                        key={status}
                                        disabled={selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                        className={`py-3 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all ${selectedOrder.status === status ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105' : 'bg-white text-gray-400 border-gray-100 hover:border-brand-accent hover:text-brand-accent disabled:opacity-30 disabled:hover:border-gray-100 disabled:hover:text-gray-400'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                          </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="p-8 md:p-16 flex items-center justify-center animate-fade-in relative overflow-hidden bg-gray-50/30">
              <div className="max-w-2xl w-full space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-widest">New Listing</h2>
                  <p className="text-gray-400 font-medium text-sm">Add a new premium product to your marketplace.</p>
                </div>

                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="field-wrapper !mb-0">
                      <label>Product Name</label>
                      <input required type="text" placeholder="Silk Weave Saree" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                    </div>
                    <div className="field-wrapper !mb-0">
                      <label>Category</label>
                      <input required type="text" placeholder="Classic Collection" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                    </div>
                  </div>

                  <div className="field-wrapper !mb-0">
                    <label>Description</label>
                    <textarea rows="4" placeholder="Describe the texture, feel, and quality..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="field-wrapper !mb-0">
                      <label>Price (₹)</label>
                      <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                    </div>
                    <div className="field-wrapper !mb-0">
                      <label>Discount Price (₹, optional)</label>
                      <input type="number" step="0.01" value={newProduct.discount_price} onChange={e => setNewProduct({ ...newProduct, discount_price: e.target.value })} />
                    </div>
                    <div className="field-wrapper !mb-0">
                        <label>Initial Rating</label>
                        <input type="number" step="0.1" min="0" max="5" value={newProduct.rating} onChange={e => setNewProduct({ ...newProduct, rating: e.target.value })} />
                    </div>
                  </div>

                  <div className="field-wrapper !mb-0">
                    <label>Main Image URL</label>
                    <input required type="url" placeholder="https://..." value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} />
                  </div>

                  <div className="field-wrapper !mb-0">
                    <label>Gallery Images (paste URLs separated by commas)</label>
                    <textarea rows="2" placeholder="url1, url2, url3..." value={newProduct.images_raw} onChange={e => setNewProduct({ ...newProduct, images_raw: e.target.value })}></textarea>
                  </div>

                  <div className="bg-[#faf9f6] p-8 rounded-sm border border-gray-100 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary">Stock Variants</h4>
                        <span className="text-[9px] font-bold text-gray-300 italic uppercase">Size & Color selection</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="field-wrapper !mb-0 pointer-events-auto">
                            <label className="!text-[8px]">Size</label>
                            <input type="text" placeholder="S, M, XL..." className="!py-3" value={variantInput.size} onChange={e => setVariantInput({...variantInput, size: e.target.value})} />
                        </div>
                        <div className="field-wrapper !mb-0">
                            <label className="!text-[8px]">Color</label>
                            <input type="text" placeholder="Red, Blue..." className="!py-3" value={variantInput.color} onChange={e => setVariantInput({...variantInput, color: e.target.value})} />
                        </div>
                        <div className="field-wrapper !mb-0">
                            <label className="!text-[8px]">Stock</label>
                            <input type="number" className="!py-3" value={variantInput.stock} onChange={e => setVariantInput({...variantInput, stock: parseInt(e.target.value)})} />
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={addVariant} className="w-full h-[46px] bg-brand-accent text-white font-black text-[9px] uppercase tracking-widest rounded-sm shadow-lg hover:-translate-y-0.5 transition-all">
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {newProduct.variants.map((v, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-6 py-4 border border-gray-50 rounded-sm shadow-sm group">
                                <div className="flex items-center gap-6">
                                    <span className="text-[10px] font-black text-brand-primary/30">0{i+1}</span>
                                    <span className="text-xs font-black uppercase text-brand-primary">{v.size || 'No Size'}</span>
                                    <span className="text-xs font-extrabold text-gray-400 capitalize">{v.color || 'No Color'}</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="text-[10px] font-black text-brand-accent">STOCK: {v.stock}</span>
                                    <button type="button" onClick={() => removeVariant(i)} className="text-gray-200 hover:text-red-400 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="field-wrapper !mb-0">
                      <label>Review Count (Simulated)</label>
                      <input type="number" min="0" value={newProduct.reviews_count} onChange={e => setNewProduct({ ...newProduct, reviews_count: e.target.value })} />
                    </div>
                    <div className="flex items-center space-x-4 bg-white p-6 rounded-sm border border-gray-100 shadow-sm mt-4">
                      <input type="checkbox" id="isActive" className="h-5 w-5 text-brand-accent bg-gray-50 border-gray-200 rounded focus:ring-brand-accent/20" checked={newProduct.is_active} onChange={e => setNewProduct({ ...newProduct, is_active: e.target.checked })} />
                      <label htmlFor="isActive" className="font-bold text-gray-500 text-[10px] uppercase tracking-widest cursor-pointer select-none">Show for customers</label>
                    </div>
                  </div>

                  <button type="submit" className="w-full h-16 bg-brand-primary text-white font-black text-[11px] uppercase tracking-[0.5em] rounded-sm shadow-2xl hover:bg-brand-accent transition-all duration-500 mt-10">
                    Create Professional Listing
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
