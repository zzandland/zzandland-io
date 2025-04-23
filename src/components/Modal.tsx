import React, { useEffect } from "react"; // Import useEffect and useRef

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // To render specific content (iframe, etc.)
  widthClass?: string; // Optional width class override
  aspectRatio?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  widthClass = "w-[100%]", // Default width for Modal
  aspectRatio,
}) => {
  // Keep effect for background scroll prevention
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null; // Don't render anything if not open
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-8" // Dark overlay removed, centers the modal box
      onClick={onClose} // Close on clicking the overlay
    >
      <div
        className={`bg-[#282828] rounded-lg shadow-xl max-h-full ${widthClass} overflow-hidden flex flex-col relative border border-[#928374] focus:outline-none`}
        style={aspectRatio ? { aspectRatio: aspectRatio } : {}}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
        tabIndex={-1}
      >
        <div className="bg-[#3c3836] text-[#ebdbb2] px-4 py-2 flex justify-start items-center rounded-t-lg flex-shrink-0">
          {" "}
          {/* Changed justify-between to justify-start */}
          {/* Close Button - Styled as macOS red circle */}
          <button
            onClick={onClose}
            className="group w-3 h-3 bg-[#fb4934] rounded-full flex items-center justify-center border border-[#cc241d]" // Red circle with a darker red border
            aria-label="Close modal"
          >
            {/* X mark shown on hover */}
            <span className="text-[#3c3836] text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              ✕
            </span>
          </button>
          {/* Add other macOS-like buttons (yellow, green) if needed later */}
        </div>
        {/* Content Area */}
        <div className="flex-grow overflow-auto">{children}</div>
        {/* Footer Area */}
        <div className="bg-[#3c3836] h-4 flex-shrink-0 rounded-b-lg"></div>
      </div>
    </div>
  );
};

export default Modal;
