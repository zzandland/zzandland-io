import React, { useRef, useEffect } from "react"; // Import useRef and useEffect
import Modal from "./Modal"; // Import the common Modal component

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
  }, [isOpen]); // Depend on isOpen

  if (!isOpen || !url) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      widthClass="w-full md:max-w-screen-md" // Full width on mobile, max-width on larger screens
      heightClass="h-[90vh]" // Override default height
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
