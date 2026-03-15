import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white text-brand-primary py-20 border-t border-gray-50 font-poppins relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent"></div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-brand-bg rounded-sm flex items-center justify-center font-playfair font-black text-brand-primary border border-gray-100">SM</div>
            <span className="text-[10px] font-black text-brand-primary tracking-[0.4em] uppercase">SM Textiles</span>
          </div>

          <p className="text-gray-300 text-[9px] font-black uppercase tracking-[0.3em] text-center italic">
            © {new Date().getFullYear()} SM Textiles • Quality Textiles
          </p>

          <div className="flex space-x-10">
            <Link to="/about" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-accent transition-colors">About Us</Link>
            <Link to="/contact" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-accent transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
