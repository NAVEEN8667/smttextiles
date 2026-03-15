import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const heroRef = useRef(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('/products/recommendations', { headers });
        setRecommendations(res.data);
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
      }
    };
    fetchRecommendations();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-poppins bg-brand-bg min-h-screen overflow-x-hidden">


      <section className="relative min-h-screen flex items-end overflow-hidden">

        <div className="absolute inset-0 z-0">
          <img
            src="/towel_hero.png"
            alt="Luxury Towels Collection"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/40 via-brand-primary/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/30 via-transparent to-transparent" />
        </div>


        <div className="absolute top-1/4 right-1/4 w-96 h-96 border border-white/10 rounded-full animate-[spin_40s_linear_infinite] hidden lg:block" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 border border-brand-accent/20 rounded-full animate-[spin_25s_linear_infinite_reverse] hidden lg:block" />


        <div className="relative z-10 container mx-auto px-6 lg:px-16 pb-28 pt-40">
          <div className="max-w-3xl animate-fade-in-up">

            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent mb-6">Premium Bath Linens</p>




            <h1 className="text-6xl md:text-8xl font-playfair font-black text-white leading-[1] tracking-tight mb-8">
              Luxurious <br />
              <span className="italic text-brand-accent">Softness.</span>
            </h1>


            <p className="text-white/70 font-medium text-lg leading-relaxed max-w-xl mb-14">
              Indulge in the finest 100% combed cotton towels. Ultra-absorbent, exceptionally soft, and designed to bring spa-level luxury to your daily routine.
            </p>


            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Link
                to="/products"
                className="inline-block px-14 py-5 bg-brand-accent text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm shadow-[0_20px_50px_rgba(180,83,9,0.4)] hover:shadow-[0_25px_60px_rgba(180,83,9,0.5)] hover:-translate-y-1 transition-all duration-300"
              >
                Shop Collection
              </Link>
              <Link
                to="/about"
                className="inline-block px-10 py-4 border border-white/50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-white hover:text-brand-primary transition-all duration-300"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container mx-auto px-6 lg:px-16">
            <div className="bg-white/10 backdrop-blur-md border-t border-white/10 grid grid-cols-3 divide-x divide-white/10">
              {[
                { value: '100%', label: 'Pure Cotton' },
                { value: '50k+', label: 'Customers' },
                { value: '40yr', label: 'Experience' },
              ].map((s) => (
                <div key={s.label} className="px-8 py-6 text-center">
                  <p className="text-2xl md:text-3xl font-playfair font-black text-white leading-none">{s.value}</p>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.25em] mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      <section className="relative h-[60vh] flex items-center overflow-hidden scroll-reveal opacity-0 transition-all duration-1000 mt-24">
        <img
          src="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=85&w=2000"
          alt="Premium Cotton Towels"
          className="absolute inset-0 w-full h-full object-cover saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-brand-primary/60" />
        <div className="relative z-10 container mx-auto px-6 lg:px-16 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent mb-6">New Arrivals</p>
          <h2 className="text-5xl md:text-7xl font-playfair font-black text-white tracking-tight mb-10">
            Fresh From the Loom
          </h2>
          <Link
            to="/products"
            className="inline-block px-16 py-5 border border-white/40 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-sm hover:bg-white hover:text-brand-primary transition-all duration-300"
          >
            Explore All
          </Link>
        </div>
      </section>


      {recommendations.length > 0 && (
        <section className="py-24 container mx-auto px-6 lg:px-16 visible opacity-100">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent mb-4">Curated For You</p>
            <h2 className="text-4xl md:text-5xl font-playfair font-black text-brand-primary">Recommended Products</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-brand-neutral mb-6 rounded-sm">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/400x500'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {product.discount_price && (
                    <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
                      Sale
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-playfair font-bold text-brand-primary mb-2 group-hover:text-brand-accent transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex justify-center items-center gap-3">
                    {product.discount_price ? (
                      <>
                        <span className="text-gray-400 line-through text-sm">₹{parseFloat(product.price).toFixed(2)}</span>
                        <span className="text-brand-accent font-medium">₹{parseFloat(product.discount_price).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-brand-primary font-medium">₹{parseFloat(product.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section className="py-32 container mx-auto px-6 lg:px-16">
        <div className="text-center mb-20 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent mb-4">Our Promise</p>
          <h2 className="text-4xl md:text-5xl font-playfair font-black text-brand-primary">Why SM Textiles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            {
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Ethical Sourcing',
              text: 'We work directly with local weavers, ensuring fair trade and supporting traditional craftsmanship in every fabric.',
              delay: '0ms',
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h1.5" />
                </svg>
              ),
              title: 'Artisan Designs',
              text: 'Every piece carries beautiful patterns passed down through generations of India\'s most skilled weavers.',
              delay: '150ms',
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ),
              title: 'Quality Assured',
              text: 'Our fabrics are rigorously checked to ensure you receive only products that meet our highest standards and last a lifetime.',
              delay: '300ms',
            },
          ].map((p) => (
            <div
              key={p.title}
              className="group scroll-reveal opacity-0 translate-y-8 transition-all duration-700"
              style={{ transitionDelay: p.delay }}
            >
              <div className="w-16 h-16 rounded-sm bg-brand-primary text-brand-accent flex items-center justify-center mb-8 group-hover:bg-brand-accent group-hover:text-white transition-all duration-500 shadow-lg">
                {p.icon}
              </div>
              <h3 className="text-2xl font-playfair font-black text-brand-primary mb-4">{p.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">{p.text}</p>
            </div>
          ))}
        </div>
      </section>


      <style>{`
        .scroll-reveal.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}
