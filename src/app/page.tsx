"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useRef } from 'react';

// Define Command Enum
enum Command {
  Help = 'help',
  Clear = 'clear',
  Ls = 'ls', // Add Ls command
  Unknown = 'unknown' // Keep Unknown for the case where input doesn't match
}

// Define our "filesystem" entries
const files = {
  visible: [
    { name: 'resume.pdf', isExecutable: false },
    { name: 'project1', isExecutable: true }, // Example project
    { name: 'project2', isExecutable: true }, // Example project
  ],
  hidden: [
    { name: '.', isExecutable: false },
    { name: '..', isExecutable: false },
  ]
};

// Convert initial messages to ReactNode (using Fragments or simple strings)
const initialWelcomeMessages: React.ReactNode[] = [
  'Welcome to zzandland.io!',
  "Type 'help' for available commands.",
];

export default function Home() {
  const [input, setInput] = useState('');
  // Update output state type to handle ReactNode
  const [output, setOutput] = useState<React.ReactNode[]>(initialWelcomeMessages);
  const terminalRef = useRef<HTMLDivElement>(null); // Ref for the terminal div to auto-scroll
  
  // State for modal visibility and PDF URL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPdfUrl, setModalPdfUrl] = useState<string | null>(null);

  // Calculate available commands dynamically inside component
  const availableCommands = Object.values(Command)
    .filter(cmd => cmd !== Command.Unknown)
    .join(', ');

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalPdfUrl(null);
  };

  // Function to handle keydown events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close modal on Escape or Delete key press
      if (isModalOpen && (event.key === 'Escape' || event.key === 'Delete')) {
        closeModal();
        return; // Prevent further processing if closing modal
      }
      
      // Prevent default for handled keys if modal isn't open
      if (!isModalOpen && (event.key === 'Enter' || event.key === 'Backspace' || event.key.length === 1)) {
        event.preventDefault();
      }

      // Only process terminal input if modal is closed
      if (!isModalOpen && event.key === 'Enter') {
        const commandInput = input.trim();
        let newOutput: React.ReactNode[] = [...output, `> ${commandInput}`];

        // File Execution Logic
        if (commandInput.startsWith('./')) {
          const fileName = commandInput.substring(2);

          if (fileName === 'resume.pdf') {
            newOutput.push("Opening resume.pdf...");
            setModalPdfUrl('/Si Yong Kim - Software Engineer.pdf'); // Set PDF URL for modal
            setIsModalOpen(true); // Open the modal
            // Remove download logic
          } else {
            newOutput.push(<span className="text-yellow-500">{`Cannot execute: ${commandInput}`}</span>);
          }
        // Regular Command Logic
        } else {
          const commandParts = commandInput.split(' ').filter(part => part !== '');
          const baseCommand = commandParts[0]?.toLowerCase() || '';
          const args = commandParts.slice(1);

          let command: Command;
          if (Object.values(Command).includes(baseCommand as Command)) {
            command = baseCommand as Command;
          } else {
            command = Command.Unknown;
          }

          switch (command) {
            case Command.Help:
              newOutput.push(`Available commands: ${availableCommands}`);
              break;
            case Command.Clear:
              newOutput = initialWelcomeMessages;
              break;
            case Command.Ls:
              const showHidden = args.includes('-a');
              let filesToList = [...files.visible];
              if (showHidden) {
                filesToList = [...files.hidden, ...files.visible];
              }
              const fileListElement = (
                <div className="flex flex-wrap gap-x-4">
                  {filesToList.map(file => (
                    <span
                      key={file.name}
                      className={file.isExecutable ? 'text-red-500' : ''}
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              );
              newOutput.push(fileListElement);
              break;
            case Command.Unknown:
              if (commandInput !== '') {
                newOutput.push(<span className="text-yellow-500">{`Invalid command: '${commandInput}'`}</span>);
                newOutput.push(`Available commands: ${availableCommands}`);
              }
              break;
          }
        }

        setOutput(newOutput);
        setInput('');

      // Only process Backspace/typing if modal is closed
      } else if (!isModalOpen && event.key === 'Backspace') {
        setInput((prevInput) => prevInput.slice(0, -1));
      } else if (!isModalOpen && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        setInput((prevInput) => prevInput + event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [input, output, availableCommands, isModalOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]); // Scroll whenever output changes

  return (
    // Wrap everything in a fragment to allow adjacent elements (terminal and modal)
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        {/* Terminal Window */}
        <div
          ref={terminalRef}
          className="w-full max-w-4xl h-[80vh] bg-black text-green-400 font-mono text-sm rounded-lg shadow-lg p-4 overflow-y-auto focus:outline-none cursor-text leading-normal"
          tabIndex={0}
        >
          {output.map((line, index) => (
            // Render the node directly if it's an object (JSX), or wrap primitives in <p>
            React.isValidElement(line) ? (
                <React.Fragment key={index}>{line}</React.Fragment>
            ) : (
                <p key={index}>{line}</p>
            )
          ))}
          {/* Ensure input line is always a <p> for consistent styling */}
          <p>
            <span>&gt; </span>
            <span className="whitespace-pre">{input}</span>
            <span className="relative top-0.5 w-[8px] h-[1em] bg-green-400 inline-block cursor-blink"></span>
          </p>
        </div>
      </div>

      {/* Modal for PDF Viewer */}
      {isModalOpen && modalPdfUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-8"
          onClick={closeModal} // Still close on clicking the (now invisible) overlay area
        >
          {/* PDF container styling remains the same */}
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
          >
            {/* PDF Embed */}
            <div className="flex-grow">
               <iframe
                 src={modalPdfUrl}
                 title="Resume PDF Viewer"
                 width="100%"
                 height="100%"
                 style={{ border: 'none' }}
               />
             </div>
          </div>
        </div>
      )}
    </>
  );
}
