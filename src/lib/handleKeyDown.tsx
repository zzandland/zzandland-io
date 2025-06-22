import React from "react";
import {
  Command,
  processCommand,
  FileNode,
  OutputMessage,
  CommandResult,
  parseCommand,
} from "./commands"; // Assuming commands.ts is in the same lib directory
import { resolvePath } from "./path";

// Helper function to render OutputMessage to ReactNode (copied from page.tsx for now, consider moving to a shared utils file)
const renderOutputMessage = (message: OutputMessage): React.ReactNode => {
  const key = Math.random().toString(36).substring(7); // Generate a pseudo-random key
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
        // Use flexbox to create a multi-column layout
        <div key={key} className="flex flex-wrap gap-x-4 gap-y-1">
          {message.items?.map((item, index) => (
            <span key={`${key}-${index}`}>
              {/* Ensure unique keys for list items */}
              {item.name}
            </span>
          ))}
        </div>
      );
    case "command":
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

// Exported function to handle keydown events
export const handleKeyDownLogic = (
  event: KeyboardEvent,
  input: string,
  initialMessages: React.ReactNode[],
  commandHistory: string[],
  historyIndex: number,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  setOutput: React.Dispatch<React.SetStateAction<React.ReactNode[]>>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setModalUrl: React.Dispatch<React.SetStateAction<string | null>>,
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>,
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>,
  curDir: FileNode,
  setCurDir: React.Dispatch<React.SetStateAction<FileNode>>
) => {
  // Handle Tab autocompletion
  if (event.key === "Tab") {
    event.preventDefault();
    if (!input) return;

    const { command, targetPath } = parseCommand(input);

    // Split targetPath into directory path and last part
    const parts = targetPath.split("/");
    const partToAutocomplete = parts.pop() ?? "";

    if (!partToAutocomplete) {
      return;
    }

    const directoryPath = parts.join("/");
    const targetNode = resolvePath(directoryPath, curDir);

    if (!targetNode || !targetNode.isDirectory) {
      return;
    }

    // Find the first child that starts with the partToAutocomplete
    const completionMatch = targetNode.children?.find((childNode) =>
      childNode.name.startsWith(partToAutocomplete)
    );

    if (!completionMatch) {
      return;
    }

    // If a match is found, reconstruct the path and update the input field
    // Reconstruct the completed path, including the base directory path and the matched name
    const autoCompletedPath = [
      directoryPath,
      completionMatch.name + (completionMatch.isDirectory ? "/" : " "),
    ]
      .filter(Boolean)
      .join("/");

    setInput(
      command === Command.Open
        ? autoCompletedPath
        : command + " " + autoCompletedPath
    );
    return;
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

    const result: CommandResult = processCommand(commandInput, curDir); // Pass current path

    setInput(""); // Clear input after processing
    if (result.newDir) {
      setCurDir(result.newDir); // Update current directory if changed
    }

    // Handle clear command
    if (result.clear) {
      setOutput(initialMessages);
    } else {
      // Process the output messages into ReactNodes
      const newOutputNodes = result.newOutput.map((msg) =>
        renderOutputMessage(msg)
      );
      // Append new nodes to existing output
      setOutput((prevOutput) => [...prevOutput, ...newOutputNodes]);
    }

    // Handle modal actions
    if (result.action?.type === "openModal" && result.action.url) {
      setModalUrl(result.action.url);
      setIsModalOpen(true);
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
