import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  MapPinIcon,
  PlusIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ShoppingBagIcon,
  XMarkIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const API = 'http://localhost:5000/api';

const emptyForm = {
  label: 'Home',
  street: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();

  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);

 
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentLoading, setPaymentLoading] = useState(false);

 
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const token = localStorage.getItem('token');
  const headers = { 'x-auth-token': token };

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddresses()]).finally(() => setLoading(false));
  }, []);

  const fetchCart = async () => {
    const res = await axios.get(`${API}/orders/cart`, { headers });
    setCartItems(res.data);
  };

  const fetchAddresses = async () => {
    const res = await axios.get(`${API}/addresses`, { headers });
    setAddresses(res.data);
    const def = res.data.find((a) => a.is_default);
    if (def) setSelectedAddressId(def.id);
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => {
        const activePrice = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
        return acc + (activePrice * item.quantity);
    },
    0
  );

 
  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.street || !form.city || !form.state || !form.pincode) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API}/addresses/${editingId}`, form, { headers });
      } else {
        await axios.post(`${API}/addresses`, form, { headers });
      }
      await fetchAddresses();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await axios.delete(`${API}/addresses/${id}`, { headers });
      await fetchAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.put(`${API}/addresses/${id}/default`, {}, { headers });
      await fetchAddresses();
      setSelectedAddressId(id);
    } catch (err) {
      alert('Failed to set default');
    }
  };

 
  const handleCOD = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address.');
      return;
    }
    setPaymentLoading(true);
    try {
      await axios.post(
        `${API}/payment/place-order-cod`,
        { address_id: selectedAddressId },
        { headers }
      );
      fetchCartCount();
      navigate('/my-orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place COD order');
    } finally {
      setPaymentLoading(false);
    }
  };

 
  const handlePayment = async () => {
    if (paymentMethod === 'cod') {
      handleCOD();
      return;
    }

    if (!selectedAddressId) {
      alert('Please select a delivery address.');
      return;
    }
    setPaymentLoading(true);
    try {
     
      const { data } = await axios.post(
        `${API}/payment/create-order`,
        {},
        { headers }
      );

     
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'SM Textiles',
        description: 'Order Payment',
        order_id: data.razorpay_order_id,
        handler: async (response) => {
          try {
           
            await axios.post(
              `${API}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                address_id: selectedAddressId,
              },
              { headers }
            );
            fetchCartCount();
            navigate('/my-orders');
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#8B6914' },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentLoading(false);
      alert(err.response?.data?.message || 'Failed to initiate payment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-brand-primary font-playfair text-2xl animate-pulse">
          Loading checkout...
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-8 px-6">
        <ShoppingBagIcon className="h-20 w-20 text-gray-200" />
        <h2 className="text-3xl font-playfair font-black text-brand-primary">
          Your cart is empty
        </h2>
        <button
          onClick={() => navigate('/products')}
          className="px-10 py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen pt-36 pb-20 px-4 sm:px-6 font-poppins text-brand-primary">
      <div className="container mx-auto max-w-6xl">

          <div className="mb-14 text-center space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">
              Secure Checkout
            </p>
            <h1 className="text-4xl md:text-5xl font-playfair font-black tracking-tight">
              Complete Your Order
            </h1>
            <div className="h-px w-16 bg-brand-accent/20 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

            <div className="lg:col-span-2 space-y-12">
              

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-playfair font-bold text-brand-primary flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black">1</span>
                    Delivery Address
                  </h2>
                  <button
                    onClick={openAddForm}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent hover:text-brand-primary transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add New
                  </button>
                </div>


                {showForm && (
                  <div className="bg-white border border-brand-accent/20 rounded-sm p-8 shadow-xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary">
                        {editingId ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-300 hover:text-gray-500 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            Label
                          </label>
                          <select
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                          >
                            <option>Home</option>
                            <option>Work</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            Country
                          </label>
                          <input
                            value={form.country}
                            onChange={(e) => setForm({ ...form, country: e.target.value })}
                            className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                          Street / House No. *
                        </label>
                        <input
                          value={form.street}
                          onChange={(e) => setForm({ ...form, street: e.target.value })}
                          placeholder="123, Main Street, Apt 4B"
                          className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            City *
                          </label>
                          <input
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                            State *
                          </label>
                          <input
                            value={form.state}
                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                            className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                          Pincode *
                        </label>
                        <input
                          value={form.pincode}
                          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                          className="w-full bg-[#faf9f6] border border-gray-100 rounded-sm px-4 py-3 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent/40"
                        />
                      </div>

                      {formError && (
                        <p className="text-red-400 text-xs font-medium">{formError}</p>
                      )}

                      <div className="flex gap-4 pt-2">
                        <button
                          type="submit"
                          disabled={formLoading}
                          className="flex-1 py-3 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm hover:-translate-y-0.5 transition-all disabled:opacity-60"
                        >
                          {formLoading ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="px-6 py-3 border border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm hover:text-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}


                <div className="space-y-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`bg-white p-6 rounded-sm border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-brand-accent shadow-lg shadow-brand-accent/10'
                            : 'border-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">

                            <div
                              className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-brand-accent bg-brand-accent'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-sm">
                                  {addr.label}
                                </span>
                                {addr.is_default && (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-brand-primary leading-relaxed">
                                {addr.street}
                              </p>
                              <p className="text-xs text-gray-400 font-medium mt-1">
                                {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                {addr.country}
                              </p>
                            </div>
                          </div>


                          <div
                            className="flex items-center gap-3 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!addr.is_default && (
                              <button
                                onClick={() => handleSetDefault(addr.id)}
                                className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-accent transition-colors underline"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => openEditForm(addr)}
                              className="p-1.5 text-gray-300 hover:text-brand-primary transition-colors"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-playfair font-bold text-brand-primary flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-black">2</span>
                    Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setPaymentMethod('online')}
                    className={`bg-white p-6 rounded-sm border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-50 hover:border-gray-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <ShoppingBagIcon className={`h-6 w-6 ${paymentMethod === 'online' ? 'text-brand-accent' : 'text-gray-300'}`} />
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-brand-primary">Online Payment</h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-widest">Cards, UPI, NetBanking (via Razorpay)</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('cod')}
                    className={`bg-white p-6 rounded-sm border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-brand-accent bg-brand-accent/5' : 'border-gray-50 hover:border-gray-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <BoltIcon className={`h-6 w-6 ${paymentMethod === 'cod' ? 'text-brand-accent' : 'text-gray-300'}`} />
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-brand-primary">Cash on Delivery</h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-widest">Pay when you receive the product</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="lg:hidden mt-8">
                <OrderSummary cartItems={cartItems} totalAmount={totalAmount} />
              </div>
            </div>


            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-36">
                <OrderSummary cartItems={cartItems} totalAmount={totalAmount} />

                <div className="mt-6 bg-white p-8 rounded-sm shadow-2xl border-t-4 border-brand-accent space-y-6">
                  <div className="flex justify-between items-center text-2xl font-playfair font-black text-brand-primary">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading || !selectedAddressId}
                    className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {paymentLoading ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Pay with Razorpay'}
                  </button>

                  {!selectedAddressId && (
                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest text-center">
                      Please select a delivery address
                    </p>
                  )}

                  <div className="flex items-center justify-center gap-2 text-[8px] text-gray-300 font-black uppercase tracking-[0.3em] text-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Secured Payment System
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="lg:hidden mt-8 bg-white p-8 rounded-sm shadow-2xl border-t-4 border-brand-accent space-y-5">
            <div className="flex justify-between items-center text-2xl font-playfair font-black text-brand-primary">
              <span>Total</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={handlePayment}
              disabled={paymentLoading || !selectedAddressId}
              className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paymentLoading ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Pay with Razorpay'}
            </button>
            {!selectedAddressId && (
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest text-center">
                Please select a delivery address
              </p>
            )}
          </div>
        </div>
      </div>
  );
}

function OrderSummary({ cartItems, totalAmount }) {
  return (
    <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-50 space-y-6">
      <h3 className="text-sm font-playfair font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
        <ShoppingBagIcon className="h-4 w-4 text-brand-accent" />
        Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
      </h3>
      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
        {cartItems.map((item) => (
          <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex items-center gap-4">
            <div className="h-14 w-12 bg-brand-bg rounded-sm overflow-hidden flex-shrink-0 border border-gray-50">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[8px] text-gray-300 text-center p-1">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-grow">
              <p className="text-xs font-bold text-brand-primary leading-tight line-clamp-1">
                {item.name}
              </p>
              <div className="flex gap-2 mt-0.5">
                  <span className="text-[8px] text-gray-400 font-medium">Qty: {item.quantity}</span>
                  {item.size !== 'NA' && <span className="text-[8px] text-brand-accent font-black uppercase tracking-tighter">Size: {item.size}</span>}
              </div>
            </div>
            <p className="text-sm font-playfair font-black text-brand-primary flex-shrink-0">
              ₹{((item.discount_price || item.price) * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-50 pt-4 space-y-2">
        <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          <span>Subtotal</span>
          <span className="text-brand-primary">₹{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          <span>Shipping</span>
          <span className="text-brand-accent">Free</span>
        </div>
      </div>
    </div>
  );
}
