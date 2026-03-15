import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phoneNumber: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      return setError('Password must be at least 6 characters with letters, numbers, and special characters.');
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await axios.post('/auth/register', dataToSend);
      navigate('/verify', { state: { email: formData.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-brand-bg font-poppins text-brand-primary">
      <div className="w-full max-w-[550px] bg-white rounded-sm shadow-2xl border border-gray-50 p-10 md:p-16 animate-fade-in-up relative overflow-hidden">

        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl opacity-50"></div>


        <div className="text-center mb-10 relative z-10">
          <Link to="/" className="inline-block mb-8 transition-all hover:scale-105">
            <h1 className="text-3xl font-playfair font-black tracking-tighter text-brand-primary">SM <span className="text-brand-accent">T</span></h1>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Register</p>
          <h2 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">Join Us</h2>
          <div className="h-px w-12 bg-brand-accent/20 mx-auto mt-6"></div>
        </div>

        {error && (
          <div className="bg-red-50/50 border border-red-50 text-red-500 text-[10px] py-4 px-6 rounded-sm mb-8 text-center font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="field-wrapper !mb-0">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1 mb-2 block">Full Name</label>
              <input
                type="text"
                required
                placeholder="Name"
                className="!bg-[#faf9f6]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="field-wrapper !mb-0">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1 mb-2 block">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="+91"
                className="!bg-[#faf9f6]"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="field-wrapper !mb-0">
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
            <div className="field-wrapper !mb-0">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1 mb-2 block">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="!bg-[#faf9f6]"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-8">
            <button className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all" type="submit">
              Register
            </button>
          </div>

          <div className="text-center mt-10">
            <p className="text-[11px] text-gray-400 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-accent font-black uppercase tracking-widest hover:text-brand-primary transition-colors ml-2">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-12 text-center text-gray-300 text-[9px] font-black uppercase tracking-[0.3em] space-y-4">
        <p>© {new Date().getFullYear()} SM Textiles • Main Showroom</p>
      </div>
    </div>
  );
}
