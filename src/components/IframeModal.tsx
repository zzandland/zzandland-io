import React, { useRef, useEffect } from "react";
import Modal from "./Modal";

interface IframeModalProps {
  isOpen: boolean;
  url: string | null;
  onClose: () => void;
}

const determineAspectRatio = (url: string): string => {
  if (url.endsWith(".pdf")) {
    return "9/11";
  }
  return "16/9";
};

const IframeModal: React.FC<IframeModalProps> = ({ isOpen, url, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null); // Ref for the iframe

  useEffect(() => {
    if (isOpen && iframeRef.current) {
      // Focus the iframe when the modal opens
      setTimeout(() => iframeRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen || !url) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      widthClass="w-full md:max-w-screen-lg" // Full width on mobile, max-width on larger screens
      aspectRatio={determineAspectRatio(url)} // Pass aspectRatio instead of heightStyle
    >
      {/* Embed content as children */}
      <iframe
        ref={iframeRef} // Attach ref
        src={`${url}`}
        width="100%"
        height="100%"
      />
    </Modal>
  );
};

export default IframeModal;
