import React from 'react';

export default function About() {
  return (
    <div className="bg-brand-bg min-h-screen pt-40 pb-32 px-6 font-poppins text-brand-primary">
      <div className="container mx-auto max-w-4xl space-y-24 animate-fade-in-up">
        <div className="text-center space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent">Est. 2024</p>
          <h1 className="text-6xl md:text-7xl font-playfair font-black text-brand-primary tracking-tight">About SM <span className="italic text-brand-accent">Textiles</span></h1>
          <p className="text-gray-400 font-medium max-w-lg mx-auto italic">High-quality fabrics for your needs.</p>
          <div className="h-px w-20 bg-brand-accent/20 mx-auto mt-8"></div>
        </div>

        <div className="bg-white p-12 md:p-24 rounded-sm shadow-2xl border-l-[1px] border-gray-50 space-y-16 relative">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-brand-accent"><path d="M50 0 L100 50 L50 100 L0 50 Z" /></svg>
          </div>

          <div className="space-y-10">
            <p className="text-2xl md:text-3xl leading-relaxed text-brand-primary font-playfair font-black border-l-4 border-brand-accent pl-10 italic">
              Welcome to SM Textiles, your trusted source for premium fabrics.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-gray-500 font-light">
              Founded in 2024, SM Textiles began with a simple passion for premium cotton and refined weaving techniques. What started as small-scale research has grown into a trusted destination for quality-conscious customers seeking superior fabric solutions.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-gray-500 font-light">
              Today, we serve a growing community across the nation, and we are proud to be at the forefront of the modern textile industry, blending traditional excellence with contemporary design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 pt-16 border-t border-gray-100">
            <div className="text-center space-y-4 group">
              <h4 className="text-4xl font-playfair font-black text-brand-primary group-hover:text-brand-accent transition-colors">100%</h4>
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-gray-300">Pure Cotton</p>
              <div className="h-[2px] w-6 bg-brand-accent/20 mx-auto transition-all group-hover:w-12"></div>
            </div>
            <div className="text-center space-y-4 group">
              <h4 className="text-4xl font-playfair font-black text-brand-primary group-hover:text-brand-accent transition-colors">50+</h4>
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-gray-300">Unique Designs</p>
              <div className="h-[2px] w-6 bg-brand-accent/20 mx-auto transition-all group-hover:w-12"></div>
            </div>
            <div className="text-center space-y-4 group">
              <h4 className="text-4xl font-playfair font-black text-brand-primary group-hover:text-brand-accent transition-colors">Fast</h4>
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-gray-300">Shipping</p>
              <div className="h-[2px] w-6 bg-brand-accent/20 mx-auto transition-all group-hover:w-12"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
