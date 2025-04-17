"use client"; // Mark this component as a Client Component

import { useState, useEffect, useRef } from 'react';

// Define initial welcome messages
const initialWelcomeMessages = [
  'Welcome to zzandland.io!',
  "Type 'help' for available commands.",
];

export default function Home() {
  const [input, setInput] = useState('');
  // Initialize output state with the welcome messages
  const [output, setOutput] = useState<string[]>(initialWelcomeMessages);
  const terminalRef = useRef<HTMLDivElement>(null); // Ref for the terminal div to auto-scroll

  // Function to handle keydown events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for keys we handle
      if (event.key === 'Enter' || event.key === 'Backspace' || event.key.length === 1) {
        event.preventDefault();
      }

      if (event.key === 'Enter') {
        const command = input.trim();
        const newOutput = [...output, `> ${command}`]; // Temporarily store new output

        // Basic command handling
        if (command === 'help') {
          setOutput([...newOutput, "Available commands: help, clear"]);
        } else if (command === 'clear') {
          // Reset to initial welcome messages instead of empty array
          setOutput(initialWelcomeMessages);
        } else if (command !== '') {
          setOutput([...newOutput, `command not found: ${command}`]);
        } else {
          // If just Enter is pressed on empty line, just add the prompt line
          setOutput(newOutput)
        }

        setInput(''); // Clear the input field
      } else if (event.key === 'Backspace') {
        setInput((prevInput) => prevInput.slice(0, -1)); // Remove last character
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Append printable characters
        setInput((prevInput) => prevInput + event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [input, output]); // Re-run effect if input changes (needed for closure)

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]); // Scroll whenever output changes

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div
        ref={terminalRef} // Assign ref
        className="w-full max-w-4xl h-[80vh] bg-black text-green-400 font-mono text-sm rounded-lg shadow-lg p-4 overflow-y-auto focus:outline-none cursor-text leading-normal"
        tabIndex={0} // Make div focusable to potentially capture keys directly (though window listener is more robust)
      >
        {/* Display Output History */}
        {output.map((line, index) => (
          <p key={index}>{line}</p>
        ))}

        {/* Input Line: Use standard <p> tag, remove flex/baseline alignment */}
        <p className="mt-2">
          <span>&gt; </span>
          <span className="whitespace-pre">{input}</span>
          {/* Cursor: Add relative positioning and nudge down slightly */}
          <span className="relative top-0.5 w-[8px] h-[1em] bg-green-400 inline-block cursor-blink"></span>
        </p>
      </div>
    </div>
  );
}
