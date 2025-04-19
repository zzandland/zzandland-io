import React from "react";

interface PdfModalProps {
  isOpen: boolean;
  pdfUrl: string | null;
  onClose: () => void;
}

const PdfModal: React.FC<PdfModalProps> = ({ isOpen, pdfUrl, onClose }) => {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    // No need for an else block here, cleanup handles resetting

    // Cleanup function to reset overflow when component unmounts or isOpen becomes false
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]); // Dependency array ensures this runs when isOpen changes

  if (!isOpen || !pdfUrl) {
    return null; // Don't render anything if not open or no URL
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-8" // Added dark overlay
      onClick={onClose} // Close on clicking the overlay
    >
      {/* PDF container */}
      <div
        className="bg-[#282828] rounded-lg shadow-xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col relative border border-[#928374]" // Use flex-col
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        {/* PDF Embed */}
        <div className="flex-grow bg-white">
          {" "}
          {/* Keep iframe background white */}
          <iframe
            src={`${pdfUrl}#view=FitH`} // Append #view=FitH to suggest horizontal fit
            title="Resume PDF Viewer"
            width="100%"
            height="100%"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
