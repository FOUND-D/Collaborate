import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ToastNotification = ({ socket }) => {
  const [toast, setToast] = useState(null);
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // Check local storage for silent notifications setting
      if (localStorage.getItem('silentNotifications') === 'true') {
        return;
      }
      setToast(notification);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToast((prev) => (prev?.id === notification.id ? null : prev));
      }, 4000);
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, userInfo]);

  if (!userInfo) return null;

  const handleToastClick = () => {
    setToast(null);
    navigate('/notifications');
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            width: '320px',
            cursor: 'pointer'
          }}
          onClick={handleToastClick}
        >
          <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem', marginTop: '2px' }}>
            <FaBell />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {toast.title}
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <FaTimes />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
