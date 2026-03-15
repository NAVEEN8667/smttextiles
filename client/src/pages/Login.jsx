import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/auth/login', formData);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-brand-bg font-poppins text-brand-primary">
      <div className="w-full max-w-[480px] bg-white rounded-sm shadow-2xl border border-gray-50 p-10 md:p-16 animate-fade-in-up relative overflow-hidden">

        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl opacity-50"></div>


        <div className="text-center mb-12 relative z-10">
          <Link to="/" className="inline-block mb-8 transition-all hover:scale-105">
            <h1 className="text-3xl font-playfair font-black tracking-tighter text-brand-primary">SM <span className="text-brand-accent">T</span></h1>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Login</p>
          <h2 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">Welcome Back</h2>
          <div className="h-px w-12 bg-brand-accent/20 mx-auto mt-6"></div>
        </div>

        {error && (
          <div className="bg-red-50/50 border border-red-50 text-red-500 text-[10px] py-4 px-6 rounded-sm mb-8 text-center font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="field-wrapper">
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1 mb-2 block">Email Address</label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              className="!bg-[#faf9f6]"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="field-wrapper">
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1 mb-2 block">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="!bg-[#faf9f6]"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="pt-8">
            <button className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all" type="submit">
              Login
            </button>
          </div>

          <div className="text-center mt-10">
            <p className="text-[11px] text-gray-400 font-medium">
              New here?{' '}
              <Link to="/register" className="text-brand-accent font-black uppercase tracking-widest hover:text-brand-primary transition-colors ml-2">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-12 text-center text-gray-300 text-[9px] font-black uppercase tracking-[0.3em] space-y-4">
        <p>© {new Date().getFullYear()} SM Textiles • Main Showroom</p>
        <div className="flex items-center justify-center gap-6 opacity-60">
          <Link to="/about" className="hover:text-brand-accent transition-colors">Archive</Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-brand-accent transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
