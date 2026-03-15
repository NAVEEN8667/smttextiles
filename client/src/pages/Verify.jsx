import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function Verify() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/verify-otp', { email, otp });
      setSuccess('Account activated successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-brand-bg font-poppins text-brand-primary">
      <div className="w-full max-w-[480px] bg-white rounded-sm shadow-2xl border border-gray-50 p-10 md:p-16 animate-fade-in-up relative overflow-hidden text-center">

        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl opacity-50"></div>


        <div className="mb-12 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-accent mb-4">Verification</p>
          <h2 className="text-4xl font-playfair font-black text-brand-primary tracking-tight">One Final Step</h2>
          <div className="h-px w-12 bg-brand-accent/20 mx-auto mt-6 mb-8"></div>
          <p className="text-xs text-brand-primary/60 font-medium leading-relaxed">
            We've sent a code to <br />
            <span className="text-brand-primary font-black block mt-2">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50/50 border border-red-50 text-red-500 text-[10px] py-4 px-6 rounded-sm mb-8 text-center font-black uppercase tracking-widest relative z-10">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50/50 border border-green-50 text-green-500 text-[10px] py-4 px-6 rounded-sm mb-8 text-center font-black uppercase tracking-widest relative z-10">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          <div className="field-wrapper !mb-0">
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-6 block">Verification Code</label>
            <input
              type="text"
              placeholder="000000"
              className="!text-center !text-4xl !tracking-[0.6em] !font-playfair !font-black !py-8 !h-auto !bg-[#faf9f6] border-transparent focus:border-brand-accent/20 transition-all"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
          </div>

          <div className="pt-4">
            <button className="w-full py-5 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.4em] rounded-sm shadow-2xl hover:-translate-y-1 transition-all" type="submit">
              Verify
            </button>
          </div>

          <div className="text-center mt-10">
            <p className="text-[10px] text-gray-400 font-medium">
              Didn't get the code?{' '}
              <button type="button" className="text-brand-accent font-black uppercase tracking-widest hover:text-brand-primary transition-colors ml-2">
                Resend Code
              </button>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-12 text-center text-gray-300 text-[9px] font-black uppercase tracking-[0.3em]">
        <p>© {new Date().getFullYear()} SM Textiles • Main Showroom</p>
      </div>
    </div>
  );
}
