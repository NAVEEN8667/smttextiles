import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
        setFilteredProducts(res.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let result = products;

    if (category) {
      result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(result);
  }, [products, location.search]);

  const addToCart = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/orders/cart',
        { productId: product.id, quantity: 1 },
        { headers: { 'x-auth-token': token } }
      );
      fetchCartCount();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-40 text-sm font-bold uppercase tracking-[0.5em] text-brand-primary animate-pulse">Loading Products...</div>;

  return (
    <div className="min-h-screen bg-brand-bg font-poppins pt-40 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">


        <div className="text-center mb-20 animate-fade-in-up space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-2">Our Collection</p>
          <h1 className="text-5xl md:text-7xl font-playfair font-black text-brand-primary leading-tight">Our Products</h1>
          <p className="text-gray-400 font-medium max-w-xl mx-auto text-sm leading-relaxed">
            Beautifully designed fabrics that combine tradition with a modern touch.
          </p>
          <div className="h-px w-24 bg-brand-accent/30 mx-auto mt-10"></div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 px-4 md:px-0">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group animate-fade-in-up relative"
            >

              <div 
                className="space-y-3 text-center cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f3f2ee] rounded-sm mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&q=80&w=800'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  />


                  <div className="absolute inset-x-0 bottom-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full py-4 bg-brand-primary/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center space-x-3 hover:bg-brand-primary transition-all shadow-2xl"
                    >
                      <span>Add to Cart</span>
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>


                  {product.quantity < 5 && product.quantity > 0 && (
                    <span className="absolute top-6 left-6 px-3 py-1 bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-brand-accent">
                      Only a few left
                    </span>
                  )}
                </div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-accent/60">{product.category}</p>
                <h3 className="text-2xl font-playfair font-bold text-brand-primary group-hover:text-brand-accent transition-colors duration-300">{product.name}</h3>
                

                <div className="flex items-center justify-center gap-1 text-gray-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? 'text-brand-accent fill-brand-accent' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  ))}
                  <span className="text-[9px] font-bold ml-1">({product.reviews_count || 0})</span>
                </div>

                <div className="flex items-center justify-center space-x-3">
                  <span className="h-px w-6 bg-gray-100"></span>
                  <span className="text-lg font-playfair italic text-brand-primary/80">₹{product.price}</span>
                  <span className="h-px w-6 bg-gray-100"></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-40 animate-fade-in">
            <h3 className="text-3xl font-playfair font-bold text-gray-300">No products found</h3>
            <p className="text-gray-400 mt-4 text-sm font-medium tracking-widest uppercase">Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
