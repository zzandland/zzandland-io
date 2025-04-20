"use client"; // Mark this component as a Client Component

import React, { useState, useEffect, useRef, useCallback } from "react";
import PdfModal from "../components/PdfModal";
import HtmlModal from "../components/HtmlModal"; // Import the new HtmlModal
import WindowBar from "../components/WindowBar";
import {
  processCommand,
  availableCommands,
  files,
  OutputMessage,
  CommandResult,
} from "../lib/commands";

// Initial welcome messages
const initialWelcomeMessages: React.ReactNode[] = [
  <p key="welcome-1">Welcome to zzandland.io!</p>,
  <p key="welcome-2">Type &apos;help&apos; to see available commands.</p>,
];

// Helper function to render OutputMessage to ReactNode
const renderOutputMessage = (
  message: OutputMessage,
  key: number | string
): React.ReactNode => {
  switch (message.type) {
    case "error":
      return (
        <p key={key} className="text-[#fb4934]">
          {message.text}
        </p>
      );
    case "warning":
      return (
        <p key={key} className="text-[#fabd2f]">
          {message.text}
        </p>
      );
    case "list":
      return (
        <ul key={key} className="list-none pl-0">
          {message.items?.map((item, index) => (
            <li
              key={index}
              className={item.isExecutable ? "text-[#b8bb26]" : ""}
            >
              {item.name}
            </li>
          ))}
        </ul>
      );
    case "command": // Style for command echo
      return (
        <p key={key} className="text-[#83a598]">
          {message.text}
        </p>
      );
    case "normal":
    default:
      return <p key={key}>{message.text}</p>;
  }
};

// Helper function to handle keydown events
const handleKeyDownLogic = (
  event: KeyboardEvent,
  isModalOpen: boolean,
  isHtmlModalOpen: boolean, // Add state for HTML modal
  closeModal: () => void,
  closeHtmlModal: () => void, // Add close function for HTML modal
  input: string,
  output: React.ReactNode[],
  initialMessages: React.ReactNode[],
  commandHistory: string[],
  historyIndex: number,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setOutput: React.Dispatch<React.SetStateAction<React.ReactNode[]>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setModalPdfUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setIsHtmlModalOpen: React.Dispatch<React.SetStateAction<boolean>>, // Add setter for HTML modal state
  setHtmlModalUrl: React.Dispatch<React.SetStateAction<string | null>>, // Add setter for HTML modal URL
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>
) => {
  // --- Modal Key Handling ---
  if (isModalOpen || isHtmlModalOpen) {
    // Close modal on Escape key press
    if (event.key === "Escape") {
      if (isModalOpen) closeModal();
      if (isHtmlModalOpen) closeHtmlModal();
      event.preventDefault(); // Prevent potential browser default actions for Escape
      return; // Stop further processing
    }

    // Allow specific keys for SDL2/HtmlModal iframe
    if (isHtmlModalOpen) {
      const allowedKeys = ["1", "2", "3", "4", "z", "x", " "];
      if (allowedKeys.includes(event.key.toLowerCase())) {
        // Don't preventDefault or stopPropagation, let the iframe handle it
        return;
      }
    }

    // For any other key press while a modal is open, prevent it from reaching the terminal input
    event.preventDefault();
    return;
  }

  // --- Terminal Key Handling (No modal open) ---

  // Handle Tab autocompletion
  if (event.key === "Tab") {
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

  // Handle Arrow Key History Navigation
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
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

  // Process Enter Key
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default Enter behavior (like form submission)
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
        renderOutputMessage(msg, output.length + index)
      );
      // Append new nodes to existing output
      setOutput((prevOutput) => [...prevOutput, ...newOutputNodes]);
    }

    // Handle modal actions
    if (result.action?.type === "openModal" && result.action.url) {
      setModalPdfUrl(result.action.url);
      setIsModalOpen(true);
    } else if (result.action?.type === "openHtmlModal" && result.action.url) {
      // Handle HTML modal
      setHtmlModalUrl(result.action.url);
      setIsHtmlModalOpen(true);
    }
    return; // Added return here after processing Enter
  }

  // Process Backspace Key
  if (event.key === "Backspace") {
    setInput((prevInput) => prevInput.slice(0, -1));
    event.preventDefault(); // Prevent default backspace navigation
    return; // Added return here after processing Backspace
  }

  // Handle regular character input
  if (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    // If user types something, reset history index to the end
    setHistoryIndex(commandHistory.length);
    // Let the default input handling occur for typing characters by *not* calling preventDefault()
    // and *not* returning early. The hidden input's onChange will handle state update.
  } else if (
    !["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"].includes(
      event.key
    )
  ) {
    // Prevent default for other non-character keys we haven't explicitly handled
    // to avoid unexpected browser behavior (like scrolling with arrow keys if history nav fails)
    // This might need adjustment based on desired behavior for keys like Home, End, etc.
    event.preventDefault();
  }
};

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<React.ReactNode[]>(
    initialWelcomeMessages
  );
  const terminalRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // State for PDF modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPdfUrl, setModalPdfUrl] = useState<string | null>(null);

  // State for HTML modal
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [htmlModalUrl, setHtmlModalUrl] = useState<string | null>(null);

  // State for command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Update history index when command history changes
  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  // Function to close the PDF modal - Memoized
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalPdfUrl(null);
  }, [setIsModalOpen, setModalPdfUrl]);

  // Function to close the HTML modal - Memoized
  const closeHtmlModal = useCallback(() => {
    setIsHtmlModalOpen(false);
    setHtmlModalUrl(null);
  }, [setIsHtmlModalOpen, setHtmlModalUrl]);

  // Function to handle keydown events - Now uses the helper
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyDownLogic(
        event,
        isModalOpen,
        isHtmlModalOpen, // Pass HTML modal state
        closeModal,
        closeHtmlModal, // Pass HTML modal close function
        input,
        output,
        initialWelcomeMessages,
        commandHistory,
        historyIndex,
        setInput,
        setOutput,
        setIsModalOpen,
        setModalPdfUrl,
        setIsHtmlModalOpen, // Pass HTML modal setter
        setHtmlModalUrl, // Pass HTML modal URL setter
        setCommandHistory,
        setHistoryIndex
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    input,
    output,
    isModalOpen,
    isHtmlModalOpen, // Add dependency
    closeModal,
    closeHtmlModal, // Add dependency
    setInput,
    setOutput,
    setIsModalOpen,
    setModalPdfUrl,
    setIsHtmlModalOpen, // Add dependency
    setHtmlModalUrl, // Add dependency
    commandHistory,
    historyIndex,
    setCommandHistory,
    setHistoryIndex,
  ]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]); // Scroll whenever output changes

  // Focus hidden input on mount and click
  const focusInput = () => {
    hiddenInputRef.current?.focus();
  };

  useEffect(() => {
    focusInput();
  }, []);

  return (
    <>
      <div className="flex items-center justify-center min-h-dvh bg-[#1d2021] px-2 py-0 sm:p-4 h-[100dvh]">
        <div className="w-full max-w-4xl h-[98dvh] md:h-[85dvh] rounded-lg shadow-lg bg-[#282828] flex flex-col overflow-hidden">
          <WindowBar />
          <div
            ref={terminalRef}
            className="flex-grow bg-[#282828] text-[#ebdbb2] font-mono text-sm px-4 py-1 sm:p-4 overflow-y-auto focus:outline-none cursor-text leading-normal rounded-b-lg relative"
            tabIndex={-1}
            onClick={focusInput}
            onTouchStart={focusInput} // Added for mobile touch focus
          >
            {output.map((line, index) => (
              <React.Fragment key={index}>{line}</React.Fragment>
            ))}
            <p>
              <span>&gt; </span>
              <span className="whitespace-pre">{input}</span>
              {/* Only show cursor when input is focused (implicitly via hidden input) */}
              <span className="relative top-0.5 w-[8px] h-[1em] bg-[#ebdbb2] inline-block cursor-blink"></span>
            </p>
            {/* Hidden input to capture keyboard events */}
            <input
              ref={hiddenInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)} // Update input state on change
              onBlur={() => {
                // Attempt to refocus on blur unless a modal is open
                if (!isModalOpen && !isHtmlModalOpen) {
                  // Delay refocus slightly to allow modal opening logic to run
                  setTimeout(() => focusInput(), 0);
                }
              }}
              className="absolute top-0 left-0 w-full h-full p-0 m-0 border-0 opacity-0 cursor-default"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* PdfModal component */}
      <PdfModal
        isOpen={isModalOpen}
        pdfUrl={modalPdfUrl}
        onClose={closeModal}
      />

      {/* HtmlModal component */}
      <HtmlModal
        isOpen={isHtmlModalOpen}
        htmlUrl={htmlModalUrl}
        onClose={closeHtmlModal}
      />
    </>
  );
}
