import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/orders/my-orders', {
        headers: { 'x-auth-token': token }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'packed': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
      alert('Failed to fetch order details');
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order? Item stock will be restored immediately.')) return;
    setCancellingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/orders/${id}/cancel`, {}, {
        headers: { 'x-auth-token': token }
      });
      await fetchOrders();
      if (selectedOrder?.id === id) {
        await fetchOrderDetails(id);
      }
      alert('Order cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32 bg-brand-bg min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-accent border-t-transparent"></div>
    </div>
  );

  return (
    <div className="bg-brand-bg min-h-screen pt-40 pb-20 px-6 font-poppins text-brand-primary">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-20 space-y-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">My History</p>
          <h1 className="text-5xl md:text-6xl font-playfair font-black text-brand-primary tracking-tight">My Orders</h1>
          <div className="h-px w-20 bg-brand-accent/20 mx-auto mt-6"></div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-50 rounded-sm p-32 text-center space-y-10 shadow-2xl max-w-3xl mx-auto">
            <div className="bg-brand-bg w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <h2 className="text-3xl font-playfair italic text-gray-400">You have no orders yet.</h2>
            <Link to="/products" className="px-12 py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-xl inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-10">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-sm shadow-sm overflow-hidden border border-gray-50 group hover:shadow-2xl transition-all duration-700">
                  <div className="bg-[#faf9f6]/50 px-8 py-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex gap-8 md:gap-12 items-center">
                      <div>
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Order ID</p>
                        <p className="font-playfair font-black text-brand-primary text-lg">#{order.id}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Placed on</p>
                        <p className="font-bold text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Total</p>
                        <p className="font-black text-brand-primary text-sm">₹{order.total_amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                      <button 
                        onClick={() => fetchOrderDetails(order.id)}
                        className="px-6 py-2 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm shadow-lg hover:bg-brand-accent transition-all"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="px-8 py-6 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">

                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">
                            {order.status === 'delivered' ? '✓ Received by Customer' : order.status === 'cancelled' ? '✕ Order Cancelled' : '→ In processing'}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                      {(order.status === 'pending' || order.status === 'packed') && (
                          <button 
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-[9px] font-black uppercase tracking-widest text-red-300 hover:text-red-500 transition-colors disabled:opacity-30"
                          >
                              {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>


            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end animate-fade-in">
                  <div className="absolute inset-0 bg-brand-primary/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                  <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto animate-slide-left p-10 md:p-16">
                    <button onClick={() => setSelectedOrder(null)} className="absolute top-10 right-10 text-gray-300 hover:text-brand-primary transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    
                    <div className="space-y-12">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Items in Order</p>
                        <h2 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">Order #{selectedOrder.id}</h2>
                        <div className="h-px w-12 bg-brand-accent/20 my-6"></div>
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${getStatusBadgeStyle(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <section className="space-y-8">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/40 border-b border-gray-50 pb-2">Delivery Address</h4>
                        <div className="bg-[#faf9f6]/50 p-6 rounded-sm border border-gray-50 italic text-[11px] font-bold text-gray-500 leading-relaxed">
                            {typeof selectedOrder.delivery_address === 'string' 
                                ? selectedOrder.delivery_address 
                                : `${selectedOrder.delivery_address?.street}, ${selectedOrder.delivery_address?.city}, ${selectedOrder.delivery_address?.state}, ${selectedOrder.delivery_address?.pincode}`}
                        </div>
                      </section>

                      <section className="space-y-8">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-primary/40 border-b border-gray-50 pb-2">Order Content</h4>
                        <div className="space-y-8">
                            {selectedOrder.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-6">
                                    <div className="w-20 h-24 bg-gray-50 rounded-sm overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow pt-1">
                                        <h5 className="font-extrabold text-brand-primary text-sm mb-1">{item.name}</h5>
                                        <div className="flex gap-4 mb-3">
                                            {item.size !== 'NA' && <span className="text-[9px] font-black uppercase text-gray-400">Size: {item.size}</span>}
                                            {item.color !== 'NA' && <span className="text-[9px] font-black uppercase text-gray-400">Color: {item.color}</span>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-brand-accent">₹{item.price_at_purchase} <span className="text-gray-300 ml-2">× {item.quantity}</span></p>
                                            <p className="text-xs font-black text-brand-primary">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </section>

                      <section className="bg-brand-primary p-8 rounded-sm space-y-6">
                          <div className="flex justify-between items-center text-white/50 text-[9px] font-black uppercase tracking-widest">
                              <span>Method: {selectedOrder.payment_method}</span>
                              <span className="text-brand-accent italic">{selectedOrder.payment_status}</span>
                          </div>
                          <div className="flex justify-between items-end">
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Amount</p>
                              <p className="text-3xl font-playfair font-black text-white leading-none">₹{selectedOrder.total_amount}</p>
                          </div>
                      </section>

                      {(selectedOrder.status === 'pending' || selectedOrder.status === 'packed') && (
                          <div className="pt-6">
                              <button 
                                  disabled={cancellingId === selectedOrder.id}
                                  onClick={() => handleCancelOrder(selectedOrder.id)}
                                  className="w-full py-4 border-2 border-red-50 text-red-300 hover:border-red-100 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest rounded-sm"
                              >
                                  {cancellingId === selectedOrder.id ? 'Processing...' : 'Cancel This Order'}
                              </button>
                              <p className="text-[8px] text-gray-400 text-center mt-4 uppercase tracking-widest font-bold">Cancellation is only available for orders in processing.</p>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
