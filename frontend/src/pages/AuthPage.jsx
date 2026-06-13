import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
    const url = `http://localhost:8080${endpoint}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { username: formData.username, password: formData.password } : formData),
      });

      const data = await res.text();
      
      if (!res.ok) {
        throw new Error(data || 'Authentication failed');
      }

      if (isLogin) {
        const parsedData = JSON.parse(data);
        dispatch(setCredentials({
          user: { id: parsedData.id, username: parsedData.username, email: parsedData.email },
          token: parsedData.token
        }));
        navigate('/'); // Redirect to chat page after login
      } else {
        // Automatically switch to login after successful signup
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
        setError('Signup successful! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-[#e3e3e3] p-4 font-sans relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#1a1a1a] p-8 rounded-2xl border border-[#333] shadow-2xl"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 text-[#bdc1c6] hover:text-white transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>

        <div className="flex justify-center mb-6">
           <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4b90ff] to-[#ff5546] text-transparent bg-clip-text">
              Gemini
           </h1>
        </div>
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        
        {error && (
          <div className={`p-3 mb-4 text-sm rounded-lg ${error.includes('successful') ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#bdc1c6] mb-1">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full bg-[#282828] border border-[#444] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
              placeholder={isLogin ? "Enter your username or email" : "Enter your username"}
            />
          </div>

          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-medium text-[#bdc1c6] mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full bg-[#282828] border border-[#444] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
                  placeholder="Enter your email"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#bdc1c6] mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-[#282828] border border-[#444] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8ab4f8] transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#8ab4f8] text-[#1a1a1a] font-semibold rounded-xl px-4 py-3 mt-2 hover:bg-[#9fc3f9] transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#444]"></div>
            <span className="flex-shrink-0 mx-4 text-[#7a7a7a] text-sm">or</span>
            <div className="flex-grow border-t border-[#444]"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGuestLogin}
            className="w-full bg-[#282828] border border-[#444] text-[#e3e3e3] font-semibold rounded-xl px-4 py-3 hover:bg-[#333] transition-colors"
          >
            Continue as Guest
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#bdc1c6]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-[#8ab4f8] hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
