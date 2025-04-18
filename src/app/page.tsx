"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useRef, useCallback } from "react";
import PdfModal from "../components/PdfModal";
import WindowBar from "../components/WindowBar";
// Import command processing logic, types, and constants
import {
  processCommand,
  availableCommands,
  OutputMessage,
  CommandResult,
  files,
} from "../lib/commands";

// Define initial messages as ReactNodes (paragraphs)
const initialWelcomeMessages: React.ReactNode[] = [
  <p key="init-1">Welcome to zzandland.io!</p>,
  <p key="init-2">{`Available commands: ${availableCommands}`}</p>,
];

// Helper function to render OutputMessage to ReactNode
const renderOutputMessage = (
  message: OutputMessage,
  index: number
): React.ReactNode => {
  switch (message.type) {
    case "error":
      return (
        <p key={index}>
          <span className="text-[#fb4934]">{message.text}</span>
        </p>
      );
    case "warning":
      return (
        <p key={index}>
          <span className="text-[#fabd2f]">{message.text}</span>
        </p>
      );
    case "list":
      return (
        <div key={index} className="flex flex-wrap gap-x-4">
          {message.items?.map((file) => (
            <span
              key={file.name}
              className={file.isExecutable ? "text-[#8ec07c]" : ""} // Gruvbox Aqua/Green
            >
              {file.name}
              {file.isExecutable ? "*" : ""}
            </span>
          ))}
        </div>
      );
    case "command": // Render command echo
      return <p key={index}>{message.text}</p>;
    case "normal":
    default:
      return <p key={index}>{message.text}</p>;
  }
};

// Helper function to handle keydown events
const handleKeyDownLogic = (
  event: KeyboardEvent,
  isModalOpen: boolean,
  closeModal: () => void,
  input: string,
  output: React.ReactNode[],
  initialMessages: React.ReactNode[],
  commandHistory: string[],
  historyIndex: number,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setOutput: React.Dispatch<React.SetStateAction<React.ReactNode[]>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setModalPdfUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>
) => {
  // Close modal on Escape or Delete key press
  if (isModalOpen && (event.key === "Escape" || event.key === "Delete")) {
    closeModal();
    return; // Prevent further processing if closing modal
  }

  // Handle Tab autocompletion *before* preventing default for other keys
  if (!isModalOpen && event.key === "Tab") {
    event.preventDefault(); // Prevent default tab behavior (focus change)

    const currentInput = input.trimStart(); // Use trimmed input for logic
    const parts = currentInput.split(" ").filter((part) => part !== "");

    // --- Autocompletion Logic ---
    if (parts.length === 1 && !currentInput.includes(" ")) {
      // Potentially completing a command
      const commandPrefix = parts[0];
      const commandList = availableCommands.split(", ");
      const matchingCommands = commandList.filter((cmd) =>
        cmd.startsWith(commandPrefix)
      );

      if (matchingCommands.length === 1) {
        setInput(matchingCommands[0] + " "); // Complete with space
      }
      // TODO: Handle multiple matches (e.g., show options or complete common prefix)
    } else if (parts.length >= 1 && parts[0] === "open") {
      // Potentially completing a filename for the 'open' command
      const filenamePrefix = parts[1] || ""; // Get prefix or empty string if no second part yet
      const availableFilenames = files.visible.map((f) => f.name);
      const matchingFiles = availableFilenames.filter((name) =>
        name.startsWith(filenamePrefix)
      );

      if (matchingFiles.length === 1) {
        setInput(`open ${matchingFiles[0]}`); // Complete with command + filename
      }
      // TODO: Handle multiple matches
    }
    // Add more clauses here for other commands needing completion

    return; // Stop further processing for Tab key
  }

  // --- Handle Arrow Key History Navigation ---
  if (!isModalOpen && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    event.preventDefault();

    if (commandHistory.length === 0) return; // No history

    let newIndex = historyIndex;

    if (event.key === "ArrowUp") {
      newIndex = Math.max(0, historyIndex - 1);
    } else {
      // ArrowDown
      newIndex = Math.min(commandHistory.length, historyIndex + 1);
    }

    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex);
      if (newIndex === commandHistory.length) {
        setInput(""); // Reached the end, clear input
      } else {
        setInput(commandHistory[newIndex]);
      }
    }
    return; // Stop further processing for arrow keys
  }

  // Prevent default for other handled keys
  if (
    !isModalOpen &&
    (event.key === "Enter" ||
      event.key === "Backspace" ||
      // Remove character keys from preventDefault
      event.key === "ArrowUp" || // Keep for arrows
      event.key === "ArrowDown" || // Keep for arrows
      event.key === "Tab") // Keep for Tab
  ) {
    event.preventDefault();
  }

  // --- Process Enter Key ---
  if (!isModalOpen && event.key === "Enter") {
    const commandInput = input.trim();

    // Add to history if it's a non-empty command and not the same as the last one
    if (
      commandInput &&
      commandInput !== commandHistory[commandHistory.length - 1]
    ) {
      setCommandHistory((prev) => [...prev, commandInput]);
    }
    // Reset history index to point to the end (ready for new input)
    setHistoryIndex(
      commandHistory.length +
        (commandInput &&
        commandInput !== commandHistory[commandHistory.length - 1]
          ? 1
          : 0)
    );

    const result: CommandResult = processCommand(commandInput);

    setInput(""); // Clear input after processing

    // Handle clear command
    if (result.clear) {
      setOutput(initialMessages);
    } else {
      // Process the output messages into ReactNodes
      const newOutputNodes = result.newOutput.map((msg, index) =>
        // We need a unique key for rendering, use current output length + index
        renderOutputMessage(msg, output.length + index)
      );
      // Append new nodes to existing output
      setOutput((prevOutput) => [...prevOutput, ...newOutputNodes]);
    }

    // Handle modal action
    if (result.action?.type === "openModal" && result.action.url) {
      setModalPdfUrl(result.action.url);
      setIsModalOpen(true);
    }

    // Only process Backspace/typing if modal is closed
  } else if (!isModalOpen && event.key === "Backspace") {
    // Backspace logic remains the same, handled by keydown
    setInput((prevInput) => prevInput.slice(0, -1));
    event.preventDefault(); // Prevent default backspace navigation
  } else if (
    !isModalOpen &&
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    // If user types something, reset history index to the end
    setHistoryIndex(commandHistory.length);
  }
};

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<React.ReactNode[]>(
    initialWelcomeMessages
  );
  const terminalRef = useRef<HTMLDivElement>(null); // Ref for the terminal div to auto-scroll
  const hiddenInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden input

  // State for modal visibility and PDF URL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPdfUrl, setModalPdfUrl] = useState<string | null>(null);

  // State for command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Initialize historyIndex correctly when commandHistory changes
  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  // Function to close the modal - Memoized with useCallback
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalPdfUrl(null);
  }, [setIsModalOpen, setModalPdfUrl]); // Dependencies are stable state setters

  // Function to handle keydown events - Now uses the helper
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Call the extracted logic function
      handleKeyDownLogic(
        event,
        isModalOpen,
        closeModal,
        input,
        output,
        initialWelcomeMessages,
        commandHistory,
        historyIndex,
        setInput,
        setOutput,
        setIsModalOpen,
        setModalPdfUrl,
        setCommandHistory,
        setHistoryIndex
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Add all dependencies used by handleKeyDownLogic that come from the component scope
  }, [
    input,
    output,
    isModalOpen,
    closeModal, // Now stable due to useCallback
    // State setters (setInput, etc.) are generally stable and don't need to be dependencies
    // Include setters used directly in the effect if any, or indirectly via non-memoized callbacks
    // Since closeModal uses setters and is memoized, we list closeModal itself.
    setInput,
    setOutput,
    setIsModalOpen,
    setModalPdfUrl,
    commandHistory,
    historyIndex,
    setCommandHistory,
    setHistoryIndex,
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]); // Scroll whenever output changes

  // Function to focus the hidden input
  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  // Focus the input when the component mounts
  useEffect(() => {
    focusInput();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <>
      {/* Darkest Gruvbox background for the page */}
      {/* Adjusted padding and min-height for better mobile view */}
      <div className="flex items-center justify-center min-h-dvh bg-[#1d2021] p-2 sm:p-4">
        {/* Main Terminal Container */}
        {/* Standard Gruvbox dark background for terminal container */}
        {/* Adjusted height for better mobile view */}
        <div className="w-full max-w-4xl h-[85vh] sm:h-[80vh] rounded-lg shadow-lg bg-[#282828] flex flex-col overflow-hidden">
          {/* Use the WindowBar component (styled separately) */}
          <WindowBar />

          {/* Terminal Content Area - Standard Gruvbox dark theme */}
          <div
            ref={terminalRef}
            // Standard Gruvbox dark bg, keeping fg same for contrast
            className="flex-grow bg-[#282828] text-[#ebdbb2] font-mono text-sm p-4 overflow-y-auto focus:outline-none cursor-text leading-normal rounded-b-lg relative" // Added relative positioning
            tabIndex={-1} // Make it programmatically focusable if needed, but not via tab
            onClick={focusInput} // Focus hidden input on tap/click
          >
            {/* Render the output nodes directly */}
            {output.map((line, index) => (
              <React.Fragment key={index}>{line}</React.Fragment>
            ))}
            <p>
              <span>&gt; </span>
              <span className="whitespace-pre">{input}</span>
              {/* Gruvbox cursor color */}
              <span className="relative top-0.5 w-[8px] h-[1em] bg-[#ebdbb2] inline-block cursor-blink"></span>
            </p>
            {/* Hidden Input for Mobile Keyboard */}
            <input
              ref={hiddenInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // Styling to hide it visually but keep it functional
              className="absolute top-0 left-0 w-0 h-0 p-0 m-0 border-0 opacity-0"
              // Auto-capitalize/correct features can be annoying in terminals
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* PdfModal component (styling is self-contained) */}
      <PdfModal
        isOpen={isModalOpen}
        pdfUrl={modalPdfUrl}
        onClose={closeModal}
      />
    </>
  );
}
