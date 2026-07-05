import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGemini } from '../../context/GeminiContext';
import { Menu, SquarePen, Settings, MessageSquare, X, LogOut, LogIn, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import LogoutModal from './LogoutModal';
import DeleteChatModal from './DeleteChatModal';

// ─── Tailwind class strings ───────────────────────────────────────────────────
// Defined here so the JSX stays clean. Each button in the sidebar uses the same
// "icon button" style: a circular, hoverable button with a grey icon.
const iconBtnClasses =
  'w-10 h-10 flex items-center justify-center rounded-full text-[#bdc1c6] ' +
  'transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] ' +
  'hover:text-[#e3e3e3] active:bg-[rgba(255,255,255,0.12)] shrink-0';

// ─── Framer Motion animation variants ────────────────────────────────────────
// These describe how elements animate between their "hidden" and "visible" states.

// Backdrop (semi-transparent black overlay behind the drawer)
const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.2  } },
};

// Drawer panel — slides in from the left edge of the screen
const drawerVariants = {
  hidden:  { x: '-100%', opacity: 0.5 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { type: 'spring', stiffness: 400, damping: 38, mass: 0.7 },
  },
};

// Container for the chat history list — staggers each item's entrance
const listContainerVariants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.055,  // each item animates in 55ms after the previous
      delayChildren: 0.12,     // start after 120ms
    },
  },
};

// Each chat history item — slides in from the left
const listItemVariants = {
  hidden:  { x: -16, opacity: 0 },
  visible: { x: 0,   opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sidebar
 *
 * Renders a narrow 56px icon rail on the left edge of the screen with:
 *   • Hamburger icon  — opens the chat history drawer
 *   • Pencil icon     — starts a new chat
 *   • Settings icon   — (bottom) placeholder for settings
 *
 * When the hamburger is clicked, an animated full-height drawer slides in from
 * the left and shows recent chat sessions.
 */
export default function Sidebar() {
  // chatSessions: array of past chats; activeChat: the currently open chat
  // openChat: switch to a specific chat by ID; startNewChat: create a new one
  const { chatSessions, activeChat, openChat, startNewChat, renameChat, deleteChat } = useGemini();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  // Controls whether the slide-in drawer is open or closed
  const [open, setOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  // State for the styled delete confirmation modal
  const [deletingChat, setDeletingChat] = useState(null); // holds { id, title } of chat to delete

  const close = () => setOpen(false);

  // Automatically hide the inline menu when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = () => setMenuOpenForId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <>
      {/* ── Narrow icon rail (always visible on the left) ──────────────────── */}
      <aside className="flex flex-col items-center pt-2 pb-3 gap-1 shrink-0 z-20 w-[56px] bg-[#1e1f20]">

        {/* Hamburger — opens the drawer */}
        <button
          className={iconBtnClasses}
          onClick={() => setOpen(true)}
          title="Main menu"
        >
          <Menu size={20} />
        </button>

        {/* New chat button */}
        <button
          className={iconBtnClasses}
          onClick={startNewChat}
          title="New chat"
        >
          <SquarePen size={18} />
        </button>

        {/* Spacer pushes Settings to the bottom */}
        <div className="flex-1" />

        {/* Settings button (at bottom) */}
        <button className={iconBtnClasses} title="Settings">
          <Settings size={18} />
        </button>

        {/* Login/Logout button */}
        {user ? (
          <button className={iconBtnClasses} title="Logout" onClick={() => setLogoutModalOpen(true)}>
            <LogOut size={18} />
          </button>
        ) : (
          <button className={iconBtnClasses} title="Login" onClick={() => navigate('/login')}>
            <LogIn size={18} />
          </button>
        )}
      </aside>

      {/* ── Animated drawer + backdrop ──────────────────────────────────────── */}
      {/* AnimatePresence allows the drawer and backdrop to animate OUT when removed */}
      <AnimatePresence>
        {open && (
          <>
            {/* Semi-transparent backdrop — clicking it closes the drawer */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-black/50"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={close}
            />

            {/* The drawer itself — slides in from the left */}
            <motion.div
              key="drawer"
              className="fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden w-[280px] bg-[#1e1f20]"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* ── Drawer header: close button + "Gemini" label ── */}
              <div className="flex items-center gap-2 px-2 pt-2 pb-1 shrink-0">
                <button
                  className={iconBtnClasses}
                  onClick={close}
                  title="Close menu"
                >
                  <Menu size={20} />
                </button>
                <span className="text-[17px] font-medium text-[#e3e3e3] tracking-[0.2px]">
                  Gemini
                </span>
              </div>

              {/* ── "New chat" button inside the drawer ── */}
              <div className="px-3 pt-2 pb-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { startNewChat(); close(); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl border-none bg-white/5 hover:bg-white/10 text-[#e3e3e3] text-sm font-medium cursor-pointer transition-colors"
                >
                  <SquarePen size={16} />
                  New chat
                </motion.button>
              </div>

              {/* ── Section label ── */}
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[11px] uppercase tracking-widest text-[#7a7a7a] font-medium">
                  Recent
                </span>
              </div>

              {/* ── Chat history list (staggered entrance animation) ── */}
              <motion.div
                className="overflow-y-auto flex-1 px-2"
                variants={listContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {!user ? (
                  <div className="px-3 py-4 text-center text-[#bdc1c6] text-[13px] bg-[#2a2a2a] rounded-xl mx-2 border border-[#333]">
                    <p className="mb-2">Guest Mode</p>
                    <button 
                      onClick={() => navigate('/login')}
                      className="text-[#8ab4f8] hover:underline"
                    >
                      Log in to save chats
                    </button>
                  </div>
                ) : (
                  chatSessions.map((session) => {
                    // Highlight the session that's currently open
                    const isActive = activeChat?.id === session.id;
                    const isEditing = editingId === session.id;
                    const isMenuOpen = menuOpenForId === session.id;

                    return (
                      <motion.div
                        key={session.id}
                        variants={listItemVariants}
                        whileHover={{ x: 3 }}
                        onMouseLeave={() => setMenuOpenForId(null)}
                        className={`relative flex items-center justify-between w-full px-2 py-1.5 rounded-[10px] mb-0.5 group transition-colors ${isActive ? 'bg-[#8ab4f8]/10' : 'hover:bg-white/5'}`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2.5 w-full px-1">
                            <MessageSquare size={14} className="opacity-60 shrink-0 text-[#a8c7fa]" />
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editTitle.trim() && editTitle !== session.title) renameChat(session.id, editTitle);
                                  setEditingId(null);
                                }
                              }}
                              onBlur={() => {
                                if (editTitle.trim() && editTitle !== session.title) renameChat(session.id, editTitle);
                                setEditingId(null);
                              }}
                              autoFocus
                              className="bg-transparent border-b border-[#8ab4f8] text-[#e3e3e3] text-[13.5px] outline-none w-full"
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { openChat(session.id); close(); }}
                              className={`flex items-center gap-2.5 flex-1 w-full border-none bg-transparent px-1 py-0.5 text-[13.5px] cursor-pointer text-left ${isActive ? 'text-[#a8c7fa]' : 'text-[#bdc1c6]'}`}
                            >
                              <MessageSquare size={14} className="opacity-60 shrink-0" />
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]">
                                {session.title}
                              </span>
                            </button>
                            
                            {/* Actions menu */}
                            {isMenuOpen ? (
                              <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(session.id);
                                    setEditTitle(session.title);
                                    setMenuOpenForId(null);
                                  }}
                                  className="p-1.5 rounded-full text-[#bdc1c6] hover:text-white hover:bg-white/10 transition-colors"
                                  title="Rename"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if(window.confirm('Are you sure you want to delete this chat?')) {
                                      deleteChat(session.id);
                                    }
                                    setMenuOpenForId(null);
                                  }}
                                  className="p-1.5 rounded-full text-[#bdc1c6] hover:text-[#ff5546] hover:bg-[#ff5546]/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenForId(null);
                                  }}
                                  className="p-1.5 rounded-full text-[#bdc1c6] hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenForId(session.id);
                                }}
                                className={`p-1.5 rounded-full text-[#bdc1c6] hover:text-white hover:bg-white/10 transition-opacity opacity-0 group-hover:opacity-100`}
                              >
                                <MoreVertical size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>

              {/* ── Drawer footer: Settings & Logout ── */}
              <div className="border-t border-[#2e2e2e] p-2 pb-3">
                <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[10px] border-none bg-transparent text-[#9aa0a6] text-[13.5px] cursor-pointer hover:bg-white/5 hover:text-[#e3e3e3] transition-colors">
                  <Settings size={16} />
                  Settings
                </button>
                {user ? (
                  <button onClick={() => { setLogoutModalOpen(true); close(); }} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[10px] border-none bg-transparent text-[#e8eaed] text-[13.5px] cursor-pointer hover:bg-white/5 hover:text-[#ff5546] transition-colors mt-1">
                    <LogOut size={16} />
                    Logout
                  </button>
                ) : (
                  <button onClick={() => navigate('/login')} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[10px] border-none bg-transparent text-[#e8eaed] text-[13.5px] cursor-pointer hover:bg-white/5 hover:text-[#8ab4f8] transition-colors mt-1">
                    <LogIn size={16} />
                    Login / Sign up
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirm={() => dispatch(logoutUser())} />
      {/* Styled delete confirmation modal — replaces browser window.confirm() */}
      <DeleteChatModal
        isOpen={!!deletingChat}
        onClose={() => setDeletingChat(null)}
        onConfirm={() => deleteChat(deletingChat.id)}
        chatTitle={deletingChat?.title}
      />
    </>
  );
}
