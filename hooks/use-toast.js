// Inspired by react-hot-toast library
import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

function genId() {
  if (!window.__toast_count) window.__toast_count = 0;
  window.__toast_count = (window.__toast_count + 1) % Number.MAX_SAFE_INTEGER;
  return window.__toast_count.toString();
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (message) => {
    const id = genId();
    setToasts((prevToasts) => [...prevToasts, { id, message, visible: true }]);
    setTimeout(() => dismissToast(id), TOAST_REMOVE_DELAY);
  };

  const updateToast = (id, newMessage) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, message: newMessage } : toast
      )
    );
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );
    setTimeout(() => removeToast(id), TOAST_REMOVE_DELAY);
  };

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    updateToast,
    dismissToast,
    removeToast,
  };
}
