import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileSuccess } from '../../redux/authSlice';

export default function EditProfileModal({ isOpen, onClose }) {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ 
    username: user?.username || '', 
    email: user?.email || '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await res.text();

      if (!res.ok) {
        throw new Error(data || 'Failed to update profile');
      }

      const updatedUser = JSON.parse(data);
      dispatch(updateProfileSuccess({
        username: updatedUser.username,
        email: updatedUser.email
      }));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-[#1e1f20] border border-[#333] rounded-2xl shadow-2xl p-6 overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-[#bdc1c6] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold text-[#e3e3e3] mb-4">
              Edit Profile
            </h3>

            {error && (
              <div className="p-3 mb-4 text-sm rounded-lg bg-red-900/50 text-red-400 border border-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 text-sm rounded-lg bg-green-900/50 text-green-400 border border-green-800">
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#bdc1c6] mb-1">Username</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#282828] border border-[#444] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors text-[#e3e3e3]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#bdc1c6] mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#282828] border border-[#444] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors text-[#e3e3e3]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8ab4f8] text-[#1a1a1a] font-medium py-2.5 rounded-xl hover:bg-[#9fc3f9] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
