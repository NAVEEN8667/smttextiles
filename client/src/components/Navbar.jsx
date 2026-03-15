import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const categoriesDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/products');
        const uniqueCategories = [...new Set(
          res.data
            .map((product) => (product.category || '').trim())
            .filter(Boolean)
        )];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Failed to load categories for navbar:', err);
      }
    };

    fetchCategories();
  }, []);

 
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

 
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedOutsideCategories = categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(e.target);
      const clickedOutsideUser = userDropdownRef.current && !userDropdownRef.current.contains(e.target);

      if (clickedOutsideCategories && clickedOutsideUser) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

 
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    navigate('/');
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${isScrolled ? 'shadow-xl py-3' : 'shadow-sm py-4 md:py-5'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center">


            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
              <div className="relative">
                <img src="/logo.png" alt="Logo" className="h-8 sm:h-10 w-auto transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-black font-playfair tracking-tight text-brand-primary leading-none">SM TEXTILES</span>
                <span className="hidden sm:block text-[8px] uppercase tracking-[0.4em] font-bold text-brand-accent mt-1 leading-none">Premium Quality Fabrics</span>
              </div>
            </Link>


            <div className="hidden lg:flex items-center space-x-8 xl:space-x-12">
              

              <div className="relative group" ref={categoriesDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === 'categories' ? null : 'categories');
                  }}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-brand-primary transition-all py-4"
                >
                  Categories
                  <ChevronDownIcon className={`h-3 w-3 transition-transform duration-300 ${activeDropdown === 'categories' ? 'rotate-180 text-brand-primary' : ''}`} />
                  <span className={`absolute bottom-2 left-0 h-[1.5px] bg-brand-accent transition-all duration-300 ${activeDropdown === 'categories' ? 'w-full' : 'w-0'}`}></span>
                </button>
                

                <div
                  className={`absolute top-full left-0 w-48 bg-white border border-gray-100 shadow-2xl rounded-sm py-2 z-50 transition-all duration-200 origin-top-left ${
                    activeDropdown === 'categories'
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <Link 
                    to="/products"
                    className="block px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary border-b border-gray-50 flex justify-between items-center group/all hover:bg-gray-50"
                  >
                    View All Products
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category}
                      to={`/products?category=${encodeURIComponent(category)}`}
                      className="block px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-brand-primary hover:bg-gray-50 transition-all font-medium"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-brand-primary transition-all relative group py-4"
                >
                  {link.name}
                  <span className="absolute bottom-2 left-0 w-0 h-[1.5px] bg-brand-accent transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>


            <div className="flex items-center space-x-3 sm:space-x-6">

              <Link to="/cart" className="relative group p-2">
                <ShoppingCartIcon className="h-5 w-5 text-brand-primary group-hover:text-brand-accent transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>


              {user ? (
                <div className="relative hidden lg:block" ref={userDropdownRef}>
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-full transition-all group"
                  >
                    <UserIcon className="h-5 w-5 text-brand-primary group-hover:text-brand-accent transition-colors" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-primary">{user.name.split(' ')[0]}</span>
                    <ChevronDownIcon className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                  </button>


                  <div
                    className={`absolute right-0 mt-4 w-56 bg-white border border-gray-100 shadow-2xl rounded-sm py-4 z-50 transition-all duration-200 origin-top-right ${
                      activeDropdown === 'user'
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div className="px-6 py-3 border-b border-gray-50 mb-3">
                      <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest mb-1">Logged In</p>
                      <p className="text-xs font-bold text-brand-primary truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-brand-primary hover:bg-gray-50 transition-all">
                      My Profile
                    </Link>
                    <Link to="/my-orders" className="flex items-center px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 hover:text-brand-primary hover:bg-gray-50 transition-all">
                      My Orders
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-accent hover:bg-brand-accent/5 transition-all">
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-50 px-6">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:inline-flex px-6 py-2.5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm shadow-xl shadow-brand-primary/10 hover:shadow-brand-primary/20 hover:-translate-y-0.5 transition-all"
                >
                  Sign In
                </Link>
              )}


              <button
                className="lg:hidden p-2 text-brand-primary rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen
                  ? <XMarkIcon className="h-6 w-6" />
                  : <Bars3Icon className="h-6 w-6" />
                }
              </button>
            </div>
          </div>
        </div>
      </nav>


      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
      />


      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <span className="text-sm font-black font-playfair tracking-wider text-brand-primary uppercase">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-brand-primary hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>


        {user && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest mb-1">Logged In As</p>
            <p className="text-sm font-bold text-brand-primary truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
          </div>
        )}


        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="space-y-1">

            <li>
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'mobileCat' ? null : 'mobileCat')}
                className="w-full flex items-center justify-between py-3.5 px-3 text-sm font-bold font-playfair text-brand-primary hover:text-brand-accent hover:bg-gray-50 rounded-md transition-all"
              >
                Categories
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${activeDropdown === 'mobileCat' ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${activeDropdown === 'mobileCat' ? 'max-h-64' : 'max-h-0'}`}>
                <ul className="bg-gray-50 rounded-md mt-1 mb-2 pl-4 py-2 border border-gray-100">
                  <li>
                    <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 px-3 text-xs font-bold text-brand-primary hover:text-brand-accent transition-colors">
                      View All Products
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category}>
                      <Link to={`/products?category=${encodeURIComponent(category)}`} onClick={() => setIsMobileMenuOpen(false)} className="block py-2.5 px-3 text-xs font-medium text-gray-500 hover:text-brand-primary transition-colors">
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>

            {navLinks.map((link, i) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center py-3.5 px-3 text-sm font-bold font-playfair text-brand-primary hover:text-brand-accent hover:bg-gray-50 rounded-md transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {link.name}
                </Link>
              </li>
            ))}


            {user && (
              <>
                <li><div className="my-4 border-t border-gray-100" /></li>
                <li>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3.5 px-3 text-sm font-bold text-gray-500 hover:text-brand-primary hover:bg-gray-50 rounded-md transition-all">
                    <UserIcon className="h-4 w-4 mr-3 text-brand-accent" />
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3.5 px-3 text-sm font-bold text-gray-500 hover:text-brand-primary hover:bg-gray-50 rounded-md transition-all">
                    <ShoppingCartIcon className="h-4 w-4 mr-3 text-brand-accent" />
                    My Orders
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <li>
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3.5 px-3 text-sm font-bold text-brand-accent hover:bg-brand-accent/5 rounded-md transition-all">
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>


        <div className="px-6 py-6 border-t border-gray-100">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-400 border border-red-200 hover:border-red-400 rounded-sm transition-all"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full py-4 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-sm text-center hover:-translate-y-0.5 transition-all shadow-lg shadow-brand-primary/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
