import React, { useRef, useEffect } from "react";
import Modal from "./Modal";

interface IframeModalProps {
  isOpen: boolean;
  url: string | null;
  onClose: () => void;
}

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

  // Determine aspect ratio based on content type (example)
  const aspectRatio = url.endsWith(".pdf") ? "8.5/11" : "16/9"; // Example: A4/Letter for PDF, 16:9 for others

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      widthClass="w-full md:max-w-screen-md" // Full width on mobile, max-width on larger screens
      aspectRatio={aspectRatio} // Pass aspectRatio instead of heightStyle
    >
      {/* Embed content as children */}
      <iframe
        ref={iframeRef} // Attach ref
        src={`${url}#view=FitH`} // Append #view=FitH to suggest horizontal fit
        width="100%"
        height="100%"
      />
    </Modal>
  );
};

export default IframeModal;
