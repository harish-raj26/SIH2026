import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      type: 'info',
      title: 'Welcome to BizClear AI',
      message: 'Explore automated regulatory compliance and statutory roadmaps for your enterprise.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      link: '/dashboard',
    },
    {
      id: 'notif_2',
      type: 'success',
      title: 'FastAPI Backend Online',
      message: 'Connected to BizClear AI backend service at http://localhost:8000.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: false,
      link: '/dashboard',
    },
  ]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 4500 }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, type, title, message, timestamp: new Date().toISOString() };

      setToasts((prev) => [...prev, newToast]);

      // Also append to persistent notification list
      setNotifications((prev) => [
        { ...newToast, read: false, id: `notif_${Date.now()}` },
        ...prev.slice(0, 49),
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback((message, title = 'Success') => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((message, title = 'Error') => {
    return showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showToast({ type: 'warning', title, message });
  }, [showToast]);

  const showInfo = useCallback((message, title = 'Info') => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        notifications,
        unreadCount,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
