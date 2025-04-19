import React from "react";

interface HtmlModalProps {
  isOpen: boolean;
  htmlUrl: string | null;
  onClose: () => void;
}

const HtmlModal: React.FC<HtmlModalProps> = ({ isOpen, htmlUrl, onClose }) => {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    // Cleanup function to reset overflow when component unmounts or isOpen becomes false
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !htmlUrl) {
    return null; // Don't render anything if not open or no URL
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-8" // Added dark overlay
      onClick={onClose} // Close on clicking the overlay
    >
      {/* HTML container */}
      <div
        className="bg-[#282828] rounded-lg shadow-xl w-[1100px] h-[800px] max-w-full max-h-[90vh] overflow-hidden flex flex-col relative border border-[#928374]" // Set specific size, allow shrinking
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* Simple Title Bar */}
        <div className="bg-[#3c3836] text-[#ebdbb2] px-4 py-2 flex justify-between items-center rounded-t-lg">
          <span className="font-semibold">{htmlUrl}</span>
          <button
            onClick={onClose}
            className="text-[#ebdbb2] hover:text-[#fb4934] text-xl font-bold" // Gruvbox fg, red on hover
            aria-label="Close modal"
          >
            &times; {/* Close button */}
          </button>
        </div>
        {/* HTML Embed */}
        <div className="flex-grow bg-white">
          {" "}
          {/* Keep iframe background white for compatibility */}
          <iframe
            src={htmlUrl}
            title="Embedded HTML Content"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            // Consider adding sandbox attributes if the content is untrusted
            // sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default HtmlModal;
