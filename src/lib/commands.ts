// Define Command Enum
export enum Command {
  Help = "help",
  Clear = "clear",
  Ls = "ls",
  Open = "open",
  Unknown = "unknown",
}

// Calculate available commands string
export const availableCommands = Object.values(Command)
  .filter((cmd) => cmd !== Command.Unknown)
  .join(", ");

// Define our "filesystem" entries
export const files = {
  visible: [
    { name: "resume.pdf", isExecutable: false },
    { name: "SDL2-sort.html", isExecutable: false }, // Add the new HTML file
    { name: "project1", isExecutable: true },
    { name: "project2", isExecutable: true },
  ],
  hidden: [
    { name: ".", isExecutable: false },
    { name: "..", isExecutable: false },
  ],
};

// Type for structured output message
export interface OutputMessage {
  type: "normal" | "error" | "warning" | "list" | "command";
  text?: string;
  items?: { name: string; isExecutable: boolean }[];
}

// Type for the action returned by processCommand
export interface CommandAction {
  type: "openModal";
  url: string;
}

// Type for the result of processCommand
export interface CommandResult {
  newOutput: OutputMessage[]; // Return structured messages
  clear?: boolean; // Flag to clear the output
  action?: CommandAction;
}

// Helper function to process commands
export const processCommand = (commandInput: string): CommandResult => {
  // Start with the command echo
  let newOutputMessages: OutputMessage[] = [
    { type: "command", text: `> ${commandInput}` },
  ];
  let action: CommandAction | undefined = undefined;
  let shouldClear = false;

  const commandParts = commandInput.split(" ").filter((part) => part !== "");
  const baseCommand = commandParts[0]?.toLowerCase() ?? "";
  const args = commandParts.slice(1);

  let command: Command;
  if (Object.values(Command).includes(baseCommand as Command)) {
    command = baseCommand as Command;
  } else {
    command = Command.Unknown;
  }

  switch (command) {
    case Command.Help:
      // Return normal text
      newOutputMessages.push({
        type: "normal",
        text: `Available commands: ${availableCommands}`,
      });
      break;
    case Command.Clear:
      shouldClear = true;
      // The actual clearing happens in page.tsx based on the flag
      newOutputMessages = []; // Or return empty? Let page.tsx handle it.
      break;
    case Command.Ls:
      const showHidden = args.includes("-a");
      let filesToList = [...files.visible];
      if (showHidden) {
        filesToList = [...files.hidden, ...files.visible].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } else {
        filesToList.sort((a, b) => a.name.localeCompare(b.name));
      }
      // Return list data
      newOutputMessages.push({ type: "list", items: filesToList });
      break;
    case Command.Open:
      const fileNameToOpen = args[0];
      if (!fileNameToOpen) {
        // Return warning text
        newOutputMessages.push({
          type: "warning",
          text: "Usage: open <filename>",
        });
      } else if (fileNameToOpen === "resume.pdf") {
        const resumeExists = [...files.visible, ...files.hidden].some(
          (f) => f.name === "resume.pdf"
        );
        if (resumeExists) {
          // Return normal text
          newOutputMessages.push({
            type: "normal",
            text: "Opening resume.pdf...",
          });
          action = {
            type: "openModal",
            url: "/Si Yong Kim - Software Engineer.pdf",
          };
        } else {
          // Return error text
          newOutputMessages.push({
            type: "error",
            text: "Error: resume.pdf definition not found.",
          });
        }
      } else if (fileNameToOpen === "SDL2-sort.html") {
        // Handle opening the HTML file
        const htmlFileExists = [...files.visible, ...files.hidden].some(
          (f) => f.name === "SDL2-sort.html"
        );
        if (htmlFileExists) {
          newOutputMessages.push({
            type: "normal",
            text: "Opening SDL2-sort.html...",
          });
          action = {
            type: "openModal",
            url: "/SDL2-sort.html",
          };
        } else {
          newOutputMessages.push({
            type: "error",
            text: "Error: SDL2-sort.html not found.",
          });
        }
      } else {
        const fileExists = [...files.visible, ...files.hidden].some(
          (f) => f.name === fileNameToOpen
        );
        if (fileExists) {
          // Return warning text
          newOutputMessages.push({
            type: "warning",
            text: `Cannot open this file type yet: ${fileNameToOpen}`,
          });
        } else {
          // Return warning text
          newOutputMessages.push({
            type: "warning",
            text: `File not found: ${fileNameToOpen}`,
          });
        }
      }
      break;
    case Command.Unknown:
      if (commandInput !== "") {
        if (commandInput.startsWith("./")) {
          // Return warning text
          newOutputMessages.push({
            type: "warning",
            text: "Direct execution with './' is not supported. Use 'open <filename>'.",
          });
        } else {
          // Return error text and help text
          newOutputMessages.push({
            type: "error",
            text: `Invalid command: '${commandInput}'`,
          });
          newOutputMessages.push({
            type: "normal",
            text: `Available commands: ${availableCommands}`,
          });
        }
      }
      break;
  }

  // If the command was 'clear', result is just the clear flag
  if (shouldClear) {
    return { newOutput: [], clear: true };
  }

  // Otherwise return the accumulated messages and potential action
  return { newOutput: newOutputMessages, action };
};
