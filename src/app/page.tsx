"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import IframeModal from "../components/IframeModal";
import WindowBar from "../components/WindowBar";
import { root, FileNode } from "../lib/commands";
import { handleKeyDownLogic } from "../lib/handleKeyDown"; // Import the refactored logic from .tsx file

// Initial welcome messages
const initialWelcomeMessages: React.ReactNode[] = [
  <p key="welcome-1">Welcome to zzandland.io!</p>,
  <p key="welcome-2">Type &apos;help&apos; to see available commands.</p>,
];

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<React.ReactNode[]>(
    initialWelcomeMessages
  );
  const terminalRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null); // Renamed state variable and setter

  // State for command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // State for current directory path
  const [curDir, setCurDir] = useState<FileNode>(root);

  // Update history index when command history changes
  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  // Function to close the modal - Memoized
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalUrl(null);
    // Ensure focus returns to the input after closing the modal
    setTimeout(() => hiddenInputRef.current?.focus(), 0);
  }, [setIsModalOpen, setModalUrl]);

  // Function to handle keydown events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyDownLogic(
        event,
        input,
        initialWelcomeMessages,
        commandHistory,
        historyIndex,
        setInput,
        setOutput,
        setIsModalOpen,
        setModalUrl,
        setCommandHistory,
        setHistoryIndex,
        curDir,
        setCurDir
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    input,
    commandHistory, // Keep commandHistory as dependency for history navigation logic
    historyIndex, // Keep historyIndex as dependency for history navigation logic
    curDir, // Keep curDir as dependency for command processing context
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

  // Function to format the path for display
  const formatPath = (curDir: FileNode): string => {
    const path: string[] = [];
    let currentNode: FileNode = curDir;
    while (currentNode.parent) {
      path.unshift(currentNode.name); // Prepend the name to the path
      currentNode = currentNode.parent;
    }

    if (path.length === 0) {
      return "~";
    }
    return `~/${path.join("/")}`;
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
              {/* Apply styling to the path - yellowish and bold */}
              <span className="text-[#fabd2f] font-bold">
                {formatPath(curDir) + " "}
              </span>
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
                if (!isModalOpen) {
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

      {/* IframeModal component */}
      <IframeModal
        isOpen={isModalOpen && !!modalUrl} // Only open if modalUrl is set
        url={modalUrl}
        onClose={closeModal}
      />
    </>
  );
}
