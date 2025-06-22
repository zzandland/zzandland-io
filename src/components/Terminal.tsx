import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import IframeModal from "./IframeModal";
import WindowBar from "./WindowBar";
import { root, formatPath, handleRouteChange } from "../lib/path";
import { handleKeyDownLogic } from "../lib/handleKeyDown";

// Initial welcome messages
const initialWelcomeMessages: React.ReactNode[] = [
  <p key="welcome-1">Welcome to zzanland.io!</p>,
  <p key="welcome-2">Type 'help' to see available commands.</p>,
];

export default function Terminal() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<React.ReactNode[]>(
    initialWelcomeMessages
  );
  const terminalRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [curDir, setCurDir] = useState(root);
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.substring(1);
    const result = handleRouteChange(path, root);

    setCurDir(result.newDir);

    if (result.outputMessage) {
      setOutput((prevOutput) => [...prevOutput, result.outputMessage]);
    }
    if (result.isModalOpen && result.modalUrl) {
      setModalUrl(result.modalUrl);
      setIsModalOpen(result.isModalOpen);
    }
  }, [location.pathname]);

  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalUrl(null);
    setTimeout(focusInput, 0);
  }, []);

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
  }, [input, commandHistory, historyIndex, curDir]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    });
  }, [output, input, terminalRef]);

  const focusInput = () => {
    hiddenInputRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    focusInput();
  }, []);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-[#1d2021] px-2 py-0 sm:p-4 h-[100vh]">
        <div className="w-full max-w-4xl h-[98vh] sm:h-[85vh] rounded-lg shadow-lg bg-[#282828] flex flex-col overflow-hidden">
          <WindowBar />
          <div
            ref={terminalRef}
            className="flex-grow bg-[#282828] text-[#ebdbb2] font-mono text-sm px-4 py-2 sm:p-4 overflow-y-auto focus:outline-none cursor-text leading-normal rounded-b-lg relative"
            tabIndex={-1}
            onClick={focusInput}
            onTouchStart={focusInput}
          >
            {output.map((line, index) => (
              <React.Fragment key={index}>{line}</React.Fragment>
            ))}
            <p>
              <span className="text-[#fabd2f] font-bold">
                {formatPath(curDir) + " "}
              </span>
              <span>&gt; </span>
              <span className="whitespace-pre">{input}</span>
              <span className="relative top-0.5 w-[8px] h-[1em] bg-[#ebdbb2] inline-block cursor-blink"></span>
            </p>
            <input
              ref={hiddenInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => {
                if (!isModalOpen) {
                  setTimeout(() => focusInput(), 0);
                }
              }}
              className="w-0 h-0 p-0 m-0 border-0 opacity-0 cursor-default"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
      <IframeModal
        isOpen={isModalOpen && !!modalUrl}
        url={modalUrl}
        onClose={closeModal}
      />
    </>
  );
}
