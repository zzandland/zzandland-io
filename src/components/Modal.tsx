import React, { useEffect } from "react"; // Import useEffect and useRef

interface ModalProps {
  isOpen: boolean;
  title: string | null;
  onClose: () => void;
  children: React.ReactNode; // To render specific content (iframe, etc.)
  widthClass?: string; // Optional width class override
  heightClass?: string; // Optional height class override
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  widthClass = "w-[100%]", // Default width from HtmlModal
  heightClass = "h-[100%]", // Default height from HtmlModal
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
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-8" // Dark overlay
      onClick={onClose} // Close on clicking the overlay
    >
      <div
        className={`bg-[#282828] rounded-lg shadow-xl ${widthClass} ${heightClass} overflow-hidden flex flex-col relative border border-[#928374] focus:outline-none`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
        // Make the container programmatically focusable if needed as a fallback, but don't auto-focus it.
        tabIndex={-1}
      >
        {/* Title Bar (from HtmlModal style) */}
        <div className="bg-[#3c3836] text-[#ebdbb2] px-4 py-2 flex justify-between items-center rounded-t-lg flex-shrink-0">
          <span className="font-semibold">{title || ""}</span>
          <button
            onClick={onClose}
            className="text-[#ebdbb2] hover:text-[#fb4934] text-xl font-bold" // Gruvbox fg, red on hover
            aria-label="Close modal"
          >
            &times; {/* Close button */}
          </button>
        </div>
        {/* Content Area */}
        <div className="flex-grow bg-white overflow-auto">{children}</div>
        {/* Footer Area */}
        <div className="bg-[#3c3836] h-4 flex-shrink-0 rounded-b-lg"></div>
      </div>
    </div>
  );
};

export default Modal;
