import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const API = 'http://localhost:5000/api';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone_number: user.phone_number || '' });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setSaving(true);
    setError('');
    setSaveMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/profile`, form, {
        headers: { 'x-auth-token': token },
      });
     
      if (updateUser) updateUser(res.data.user);
      setSaveMsg('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  };

  const cancelEdit = () => {
    setForm({ name: user.name || '', phone_number: user.phone_number || '' });
    setEditMode(false);
    setError('');
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg font-poppins text-gray-900 px-4">
      <div className="text-center p-10 bg-white rounded-sm shadow-xl border border-gray-100 max-w-md w-full">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserIcon className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Please Sign In</h2>
        <p className="text-gray-500 mb-8 font-medium">You need to sign in to view your profile.</p>
        <button onClick={() => navigate('/login')} className="px-8 py-3 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm">
          Sign In Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-36 pb-20 px-4 sm:px-6 bg-brand-bg font-poppins text-brand-primary flex items-start justify-center">
      <div className="bg-white p-10 md:p-14 rounded-sm shadow-2xl w-full max-w-lg border border-gray-50 relative overflow-hidden animate-fade-in-up">

        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10 space-y-10">

          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 bg-brand-bg rounded-full flex items-center justify-center text-4xl font-playfair font-black text-brand-accent border-4 border-white shadow-xl">
              {user.name.charAt(0)}
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-3xl font-playfair font-black text-brand-primary tracking-tight">
                  {user.name}
                </h2>
              </div>
              <p className="text-brand-accent font-black text-[10px] uppercase tracking-[0.4em]">
                {user.role === 'admin' ? 'Admin' : 'Customer'}
              </p>
            </div>
          </div>


          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                Personal Details
              </h3>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:text-brand-primary transition-colors"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-500 hover:text-green-600 transition-colors disabled:opacity-60"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>


            <div className="group space-y-1.5">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1">
                Full Name
              </span>
              {editMode ? (
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#faf9f6] border border-brand-accent/30 rounded-sm px-5 py-4 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent"
                />
              ) : (
                <div className="bg-[#faf9f6] p-5 rounded-sm flex items-center space-x-4 border border-transparent group-hover:border-brand-accent/20 transition-all">
                  <UserIcon className="h-5 w-5 text-brand-accent/40" />
                  <span className="text-brand-primary font-bold text-sm">{user.name}</span>
                </div>
              )}
            </div>


            <div className="group space-y-1.5">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1">
                Email Address
              </span>
              <div className="bg-[#faf9f6] p-5 rounded-sm flex items-center space-x-4 border border-transparent">
                <EnvelopeIcon className="h-5 w-5 text-brand-accent/40" />
                <span className="text-brand-primary font-bold text-sm">{user.email}</span>
              </div>
            </div>


            <div className="group space-y-1.5">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] ml-1">
                Phone Number
              </span>
              {editMode ? (
                <input
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full bg-[#faf9f6] border border-brand-accent/30 rounded-sm px-5 py-4 text-sm font-medium text-brand-primary focus:outline-none focus:border-brand-accent"
                />
              ) : (
                <div className="bg-[#faf9f6] p-5 rounded-sm flex items-center space-x-4 border border-transparent group-hover:border-brand-accent/20 transition-all">
                  <PhoneIcon className="h-5 w-5 text-brand-accent/40" />
                  <span className="text-brand-primary font-bold text-sm">
                    {user.phone_number || 'Not added yet'}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium text-center">{error}</p>
            )}
            {saveMsg && (
              <p className="text-green-500 text-xs font-medium text-center">{saveMsg}</p>
            )}
          </div>


          <div className="pt-8 border-t border-gray-50">
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white border border-gray-100 text-gray-400 rounded-sm font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all hover:text-red-400 hover:border-red-50 hover:bg-red-50/30"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
