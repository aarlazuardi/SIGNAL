"use client";

// This file now redirects to private-key-modal-new.jsx for backward compatibility
import PrivateKeyModalNew from "./private-key-modal-new";

export default function PrivateKeyModal(props) {
  // Simply pass all props to the new implementation
  return <PrivateKeyModalNew {...props} />;
}
