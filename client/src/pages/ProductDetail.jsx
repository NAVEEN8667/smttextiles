import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  StarIcon,
  ShoppingBagIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const API = 'http://localhost:5000/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCartCount } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/products/${id}`);
        setProduct(res.data);
        if (res.data.variants && res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = async (isBuyNow = false) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert('Please select a size/color');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/orders/cart`,
        { 
          productId: product.id, 
          quantity,
          size: selectedVariant?.size || 'NA',
          color: selectedVariant?.color || 'NA'
        },
        { headers: { 'x-auth-token': token } }
      );
      fetchCartCount();
      if (isBuyNow) {
        navigate('/cart');
      } else {
        alert('Added to cart!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add to cart');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-brand-primary font-playfair text-2xl animate-pulse uppercase tracking-widest">Loading...</div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-10">
      <h2 className="text-3xl font-playfair font-black text-brand-primary mb-6">{error || 'Product Not Found'}</h2>
      <button onClick={() => navigate('/products')} className="px-10 py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest">Return to Shop</button>
    </div>
  );

  const productPrice = Number(product.price) || 0;
  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  
 
  const displayDiscount = product.discount_price 
    ? Math.round(((productPrice - discountPrice) / productPrice) * 100)
    : 0;

  const currentStock = selectedVariant ? selectedVariant.stock : (Number(product.quantity) || 0);

  return (
    <div className="min-h-screen bg-brand-bg font-poppins pt-36 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent hover:text-brand-primary transition-colors mb-12"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Collection
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24">
          

          <div className="space-y-6">
            <div className="relative aspect-[4/5] bg-white rounded-sm overflow-hidden shadow-2xl group border border-gray-50">
              <img 
                src={images[activeImageIndex]} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-lg"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setActiveImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-lg"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </>
              )}

              {displayDiscount > 0 && (
                <div className="absolute top-8 left-8 px-5 py-2 bg-brand-accent text-white text-[10px] font-black uppercase tracking-widest rounded-sm shadow-xl">
                  {displayDiscount}% OFF
                </div>
              )}
            </div>


            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-24 aspect-[4/5] rounded-sm overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx ? 'border-brand-accent shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`${product.name} thumb ${idx}`} />
                  </button>
                ))}
              </div>
            )}
          </div>


          <div className="space-y-10">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-accent">
                {product.category}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-black text-brand-primary leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(product.rating || 0) 
                      ? <StarIcon key={i} className="h-4 w-4 text-brand-accent" />
                      : <StarOutline key={i} className="h-4 w-4 text-gray-300" />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {product.reviews_count || 0} Verified Reviews
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-6">
                <span className="text-4xl font-playfair font-black text-brand-primary italic">
                  ₹{discountPrice ? discountPrice.toFixed(2) : productPrice.toFixed(2)}
                </span>
                {discountPrice && (
                  <span className="text-xl font-playfair text-gray-300 line-through">
                    ₹{productPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                Inclusive of all taxes
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                Product Description
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                {product.description || 'No description available for this luxury textile piece.'}
              </p>
            </div>


            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                  Available Variants (Size & Color)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((v, i) => (
                    <button
                      key={i}
                      disabled={v.stock <= 0}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative px-4 py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all flex flex-col items-center gap-1 ${
                        selectedVariant === v 
                          ? 'bg-brand-primary text-white border-brand-primary shadow-xl scale-105 z-10' 
                          : 'bg-white text-brand-primary border-gray-100 hover:border-brand-accent'
                      } ${v.stock <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                    >
                      <span className="block">{v.size || 'Standard'}</span>
                      {v.color && <span className={`text-[8px] font-normal ${selectedVariant === v ? 'text-white/60' : 'text-gray-400'}`}>{v.color}</span>}
                      {v.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-red-500/80 uppercase rotate-12">Sold Out</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}


            <div className="space-y-6 pt-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                Quantity
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-gray-100 rounded-sm bg-white overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-4 hover:bg-brand-bg transition-colors"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-brand-primary">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-4 hover:bg-brand-bg transition-colors"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
                
                <p className={`text-[10px] font-black uppercase tracking-widest ${currentStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {currentStock > 0 ? `${currentStock} Units in Stock` : 'Out of Stock'}
                </p>
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10">
              <button
                disabled={currentStock <= 0}
                onClick={() => addToCart(false)}
                className="py-5 bg-white border-2 border-brand-primary text-brand-primary text-[11px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-brand-bg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <ShoppingBagIcon className="h-4 w-4" />
                Add to Cart
              </button>
              <button
                disabled={currentStock <= 0}
                onClick={() => addToCart(true)}
                className="py-5 bg-brand-primary text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-sm hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <BoltIcon className="h-4 w-4" />
                Buy Now
              </button>
            </div>


            <div className="pt-12 grid grid-cols-3 gap-8">
              <div className="text-center space-y-2">
                <div className="h-px w-8 bg-brand-accent/20 mx-auto mb-4" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">Pure Fabric</p>
              </div>
              <div className="text-center space-y-2">
                <div className="h-px w-8 bg-brand-accent/20 mx-auto mb-4" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">Hand Crafted</p>
              </div>
              <div className="text-center space-y-2">
                <div className="h-px w-8 bg-brand-accent/20 mx-auto mb-4" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">Eco-Friendly</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
