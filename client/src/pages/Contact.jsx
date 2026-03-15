import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.post('http://localhost:5000/api/contact', formData);
      setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-brand-bg min-h-screen pt-40 pb-32 px-6 font-poppins text-brand-primary">
      <div className="container mx-auto max-w-6xl space-y-32 animate-fade-in-up">
        <div className="text-center space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-accent">Contact Center</p>
          <h1 className="text-6xl md:text-7xl font-playfair font-black text-brand-primary tracking-tight">Contact <span className="italic text-brand-accent">Us</span></h1>
          <p className="text-gray-400 font-medium max-w-lg mx-auto">We are here to help you with your orders and questions.</p>
          <div className="h-px w-20 bg-brand-accent/20 mx-auto mt-8"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

          <div className="bg-white p-12 md:p-16 rounded-sm shadow-2xl border-t-8 border-brand-primary relative">
            <h2 className="text-3xl font-playfair font-black text-brand-primary mb-10 pb-6 border-b border-gray-50">Send a Message</h2>
            
            {status.message && (
              <div className={`p-4 mb-6 rounded-sm text-sm font-medium ${
                status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {status.message}
              </div>
            )}

            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="field-wrapper !mb-0">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Your Name" 
                    className="!bg-[#faf9f6]" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="field-wrapper !mb-0">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="email@example.com" 
                    className="!bg-[#faf9f6]" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="field-wrapper !mb-0">
                <label>Message</label>
                <textarea 
                  rows="6" 
                  name="message"
                  placeholder="Type your message here..." 
                  className="!bg-[#faf9f6]"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>


          <div className="space-y-12">
            <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-50 flex items-start space-x-8 hover:shadow-xl transition-all duration-500 group">
              <div className="bg-brand-bg p-5 rounded-sm group-hover:bg-brand-accent/5 transition-colors">
                <EnvelopeIcon className="h-6 w-6 text-brand-accent" />
              </div>
              <div>
                <h3 className="font-playfair font-black text-brand-primary text-2xl tracking-tight">Email Us</h3>
                <p className="text-gray-400 font-medium mt-2">smtextiles.export@gmail.com</p>
                <p className="text-[8px] text-brand-accent uppercase tracking-[0.3em] font-black mt-4">Fast Response</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-50 flex items-start space-x-8 hover:shadow-xl transition-all duration-500 group">
              <div className="bg-brand-bg p-5 rounded-sm group-hover:bg-brand-accent/5 transition-colors">
                <PhoneIcon className="h-6 w-6 text-brand-accent" />
              </div>
              <div>
                <h3 className="font-playfair font-black text-brand-primary text-2xl tracking-tight">Call Us</h3>
                <p className="text-gray-400 font-medium mt-2">+91 98765 43210</p>
                <p className="text-[8px] text-brand-accent uppercase tracking-[0.3em] font-black mt-4">Mon - Sat, 09:00 - 19:00</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-100 flex items-start space-x-8 hover:shadow-xl transition-all duration-500 group">
              <div className="bg-brand-bg p-5 rounded-sm group-hover:bg-brand-accent/5 transition-colors">
                <MapPinIcon className="h-6 w-6 text-brand-accent" />
              </div>
              <div>
                <h3 className="font-playfair font-black text-brand-primary text-2xl tracking-tight">Visit Our Store</h3>
                <p className="text-gray-400 font-medium mt-2 leading-relaxed">
                  Erode, Tamil Nadu, 638060
                </p>
                <p className="text-[8px] text-brand-accent uppercase tracking-[0.3em] font-black mt-4">Main Showroom</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
