import { useState, useRef } from 'react';
import { useGemini } from '../../context/GeminiContext';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, updateAvatar } from '../../redux/authSlice';
import { ChevronDown, Camera, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditProfileModal from './EditProfileModal';
import LogoutModal from './LogoutModal';


// ─── Framer Motion animation for the dropdown ────────────────────────────────
// Animates the model picker dropdown from slightly above and invisible
// to fully visible and in position.
const dropdownVariants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

/**
 * TopBar
 *
 * The fixed header bar at the top of the page.
 * Layout:
 *   Left  → "Gemini" text logo
 *   Right → User avatar
 */
export default function TopBar() {
  const { selectedModel, setSelectedModel } = useGemini();
  const [modelOpen, setModelOpen] = useState(false); // controls the dropdown visibility
  const [profileOpen, setProfileOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleProfileClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      setProfileOpen((prev) => !prev);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(updateAvatar(reader.result));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="flex items-center justify-between shrink-0 bg-black pr-1">

      {/* ── Left: "Gemini" text logo ── */}
      <span className="text-lg font-medium text-[#e3e3e3] tracking-wide px-4 py-2">
        Gemini
      </span>

      {/* ── Right: User avatar ── */}
      <div className="flex items-center gap-3 px-3 py-3">


        {/* User avatar and dropdown container */}
        <div className="relative">
          <motion.button
            onClick={handleProfileClick}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title={user ? `Logged in as ${user.username}` : "Sign in"}
            className="w-8 h-8 rounded-full border-2 border-[#444] flex items-center justify-center cursor-pointer shrink-0 overflow-hidden"
            style={{ background: user && !user.avatar ? 'linear-gradient(135deg, #1a73e8, #7c3aed)' : '#333' }}
          >
            {user ? (
              user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-medium text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white"/>
              </svg>
            )}
          </motion.button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {profileOpen && user && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: 'top right' }}
                  className="absolute right-0 top-full mt-2 w-[240px] z-20 bg-[#262626] border border-[#333] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2 flex flex-col"
                >
                  <div className="px-3 py-2 border-b border-[#333] mb-1">
                    <p className="text-[14px] text-[#e3e3e3] font-medium truncate">{user.username}</p>
                    <p className="text-[12px] text-[#9aa0a6] truncate">{user.email}</p>
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  
                  <button
                    onClick={() => {
                      setEditProfileOpen(true);
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[13.5px] text-[#e3e3e3] font-medium cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                  >
                    <Edit2 size={16} className="text-[#bdc1c6]" />
                    Edit profile
                  </button>
                  
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setProfileOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[13.5px] text-[#e3e3e3] font-medium cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                  >
                    <Camera size={16} className="text-[#bdc1c6]" />
                    Change picture
                  </button>

                  <button
                    onClick={() => {
                      setLogoutModalOpen(true);
                      setProfileOpen(false);
                    }}
                    className="flex items-center justify-start w-full px-3 py-2.5 rounded-xl border-none bg-transparent text-[13.5px] text-[#ff5546] font-medium cursor-pointer transition-colors duration-200 hover:bg-[#333]"
                  >
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <EditProfileModal 
        isOpen={editProfileOpen} 
        onClose={() => setEditProfileOpen(false)} 
      />
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirm={() => dispatch(logoutUser())} />
    </header>
  );
}
