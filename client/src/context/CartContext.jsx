import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/orders/cart', {
        headers: { 'x-auth-token': token }
      });

      const count = res.data.length; 







      setCartCount(count);
    } catch (err) {
      console.error('Error fetching cart count:', err);

    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
