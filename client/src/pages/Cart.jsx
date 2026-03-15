import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

import { useCart } from '../context/CartContext';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/orders/cart', {
        headers: { 'x-auth-token': token }
      });
      setCartItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId, size, color) => {
    try {
      const token = localStorage.getItem('token');

      await axios.delete(`/orders/cart/${productId}?size=${size}&color=${color}`, {
        headers: { 'x-auth-token': token }
      });
      setCartItems(cartItems.filter(item => 
        !(item.product_id === productId && item.size === size && item.color === color)
      ));
      fetchCartCount();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (productId, size, color, newQuantity) => {
    if (newQuantity < 1) {
      if (window.confirm('Remove this item from cart?')) {
        removeItem(productId, size, color);
      }
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/orders/cart/${productId}`,
        { quantity: newQuantity, size, color },
        { headers: { 'x-auth-token': token } }
      );

      setCartItems(cartItems.map(item =>
        (item.product_id === productId && item.size === size && item.color === color) 
          ? { ...item, quantity: newQuantity } 
          : item
      ));
      fetchCartCount();
    } catch (err) {
      console.error(err);
      alert('Failed to update quantity');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) return <div className="text-center py-20 bg-brand-bg min-h-screen text-gray-900">Loading cart...</div>;

  const total = cartItems.reduce((acc, item) => {
    const activePrice = item.discount_price ? item.discount_price : item.price;
    return acc + (activePrice * item.quantity);
  }, 0);

  return (
    <div className="bg-brand-bg min-h-screen pt-40 pb-20 px-6 font-poppins text-brand-primary">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-20 space-y-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent">Your Shopping Cart</p>
          <h2 className="text-5xl md:text-6xl font-playfair font-black text-brand-primary tracking-tight">Checkout</h2>
          <div className="h-px w-20 bg-brand-accent/20 mx-auto mt-6"></div>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-sm border border-gray-50 shadow-2xl space-y-8 max-w-2xl mx-auto">
            <div className="bg-brand-bg w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCartIcon className="w-12 h-12 text-gray-200" />
            </div>
            <p className="text-2xl font-playfair italic text-gray-400">Your cart is empty.</p>
            <button
              onClick={() => navigate('/products')}
              className="px-12 py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-xl"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 items-start">
            <div className="lg:col-span-2 space-y-8">
              {cartItems.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="bg-white p-8 rounded-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-10 group hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center space-x-10 w-full">
                    <div className="h-40 w-32 bg-brand-bg rounded-sm overflow-hidden border border-gray-50 flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover saturate-[0.8] group-hover:saturate-100 transition-all" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] text-gray-300 font-black uppercase tracking-widest leading-none text-center p-4">Image not found</div>
                      )}
                    </div>
                    <div className="flex-grow space-y-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-accent/60 mb-1">{item.category}</p>
                        <h3 className="text-2xl font-playfair font-bold text-brand-primary leading-tight group-hover:text-brand-accent transition-colors">{item.name}</h3>
                        <div className="flex gap-4 mt-2">
                            {item.size !== 'NA' && <span className="text-[9px] font-black uppercase bg-brand-bg px-2 py-1 text-gray-400">Size: {item.size}</span>}
                            {item.color !== 'NA' && <span className="text-[9px] font-black uppercase bg-brand-bg px-2 py-1 text-gray-400">Color: {item.color}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex items-center bg-brand-bg rounded-sm p-1">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all font-bold"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-[10px] font-black text-brand-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-all font-bold"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xl font-playfair font-black text-brand-primary">₹{((item.discount_price || item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id, item.size, item.color)}
                    className="sm:self-start text-gray-200 hover:text-red-400 transition-colors p-2"
                    title="Remove item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-12 rounded-sm shadow-2xl sticky top-40 space-y-10 border-t-4 border-brand-accent">
                <h3 className="text-2xl font-playfair font-black text-brand-primary tracking-tight">Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-brand-primary">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Free Shipping</span>
                    <span className="text-brand-accent">Free</span>
                  </div>
                  <div className="flex justify-between items-center text-3xl font-playfair font-black text-brand-primary pt-10 border-t border-gray-50">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all"
                >
                  Place Order
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] text-gray-300 font-black uppercase tracking-[0.3em] text-center">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  Secure Payment Gateway
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
