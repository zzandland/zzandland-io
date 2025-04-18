import React from "react";
import Image from "next/image";

const WindowBar: React.FC = () => {
  return (
    <div className="bg-[#3c3836] px-4 py-2 flex items-center space-x-2 rounded-t-lg border-b border-[#504945]">
      {/* GitHub Button - Standard Red */}
      <a
        href="https://github.com/zzandland"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub Profile"
        className="group"
      >
        {/* Standard Red */}
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center transition-colors hover:bg-red-600">
          <Image
            src="/github-alt-brands.svg"
            alt="GitHub"
            width={16}
            height={16}
            className="brightness-50 transition-opacity"
          />
        </div>
      </a>
      {/* Snapchat Button - Standard Yellow */}
      <a
        href="https://snapchat.com/t/UoKQHsXP"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Snapchat Profile"
        className="group"
      >
        {/* Standard Yellow */}
        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center transition-colors hover:bg-yellow-600">
          <Image
            src="/snapchat-brands.svg"
            alt="Snapchat"
            width={16}
            height={16}
            className="brightness-50 transition-opacity"
          />
        </div>
      </a>
      {/* LinkedIn Button - Standard Green */}
      <a
        href="https://www.linkedin.com/in/zzandland"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn Profile"
        className="group"
      >
        {/* Standard Green */}
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center transition-colors hover:bg-green-600">
          <Image
            src="/linkedin-brands.svg"
            alt="LinkedIn"
            width={16}
            height={16}
            className="brightness-50 transition-opacity"
          />
        </div>
      </a>
    </div>
  );
};

export default WindowBar;
