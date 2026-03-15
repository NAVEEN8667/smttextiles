import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, isSignup, toggleMode }) => {
  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-5 relative overflow-hidden ${isSignup ? 'toggled' : ''}`}>
      <div className="auth-background">
        <div className="background-shape"></div>
        <div className="secondary-shape"></div>
      </div>

      <div className={`relative w-full max-w-[800px] h-[500px] border-2 border-brand-cyan shadow-[0_0_25px_rgba(0,212,255,0.5)] overflow-hidden bg-brand-dark flex flex-col md:flex-row transition-all duration-700 ${isSignup ? 'toggled' : ''}`}>
        {children}
      </div>

      <div className="mt-[30px] text-center p-[15px] text-sm text-white">
        <p>Made with ❤️ by <a href="#" target="_blank" className="text-brand-cyan font-semibold hover:underline">CodeZenithAI</a></p>
      </div>
    </div>
  );
};

export default AuthLayout;
