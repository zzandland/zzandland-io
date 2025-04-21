// Define Command Enum
export enum Command {
  Help = "help",
  Clear = "clear",
  Ls = "ls",
  Cd = "cd", // Add Cd command
  Open = "open",
  Unknown = "unknown",
}

export class FileNode {
  name: string;
  isExecutable: boolean;
  isDirectory?: boolean;
  children: FileNode[];
  parent?: FileNode;

  constructor(
    name: string,
    isExecutable: boolean,
    isDirectory: boolean = false,
    children: FileNode[] = [],
    parent?: FileNode
  ) {
    this.name = name;
    this.isExecutable = isExecutable;
    this.isDirectory = isDirectory;
    this.children = children;
    this.parent = parent;
    this.children.forEach((child) => (child.parent = this));
  }
}

// Calculate available commands string
export const availableCommands = Object.values(Command)
  .filter((cmd) => cmd !== Command.Unknown)
  .join(", ");

export const root: FileNode = new FileNode("root", false, true, [
  new FileNode("about", false, true, [
    new FileNode("Si Yong Kim - Software Engineer.pdf", true),
  ]),
  new FileNode("projects", false, true, [new FileNode("SDL2-sort", true)]),
]);

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
  newDir?: FileNode; // New directory after 'cd' command
}
// Helper function to process commands
export const processCommand = (
  commandInput: string,
  curDir: FileNode
): CommandResult => {
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
      const filesToList =
        curDir.children?.map((node) => ({
          name: node.isDirectory ? `${node.name}/` : node.name,
          isExecutable: node.isExecutable,
        })) ?? [];

      filesToList.sort((a, b) => a.name.localeCompare(b.name));

      newOutputMessages.push({ type: "list", items: filesToList });
      break;
    case Command.Cd:
      const targetDirName = args[0];

      if (!targetDirName || targetDirName === "/" || targetDirName === "~") {
        // 'cd' without args usually goes home, let's go to root
        while (curDir.parent) {
          curDir = curDir.parent;
        }
      } else if (targetDirName === "..") {
        // Go up one level
        if (curDir.parent) {
          curDir = curDir.parent; // Update curDir to parent
        }
      } else {
        // Try to find the target directory within the current directory
        const targetNode = curDir.children.find(
          (node) => node.name === targetDirName
        );

        if (!targetNode) {
          // Target not found
          newOutputMessages.push({
            type: "error",
            text: `cd: no such file or directory: ${targetDirName}`,
          });
        } else {
          if (targetNode.isDirectory) {
            curDir = targetNode;
          } else {
            // Found something, but it's not a directory
            newOutputMessages.push({
              type: "error",
              text: `cd: not a directory: ${targetDirName}`,
            });
          }
        }
      }

      // If cd failed, newOutputMessages already contains the error
      break;
    case Command.Open:
      const fileNameToOpen = args[0];
      if (!fileNameToOpen) {
        newOutputMessages.push({
          type: "warning",
          text: "Usage: open <filename>",
        });
      } else {
        // Find the file/directory in the *current* directory
        // Find node within the current directory
        const fileNode = curDir.children?.find(
          (node) => node.name === fileNameToOpen
        );

        if (fileNode) {
          // Check if opening the resume directly
          if (fileNode.isExecutable) {
            newOutputMessages.push({
              type: "normal",
              text: `Opening ${fileNode.name}...`,
            });
            action = {
              type: "openModal",
              url: "/about/Si Yong Kim - Software Engineer.pdf",
            };
          }
          // Check if opening the SDL project directly
          else if (fileNode.isExecutable && false) {
            newOutputMessages.push({
              type: "normal",
              text: `Opening ${fileNode.name}...`,
            });
            action = {
              type: "openModal",
              url: "/projects/SDL2-sort/SDL2-sort.html",
            };
          }
          // --- Generic Cases ---
          else if (fileNode.isDirectory) {
            newOutputMessages.push({
              type: "warning",
              text: `Cannot open directory: ${fileNode.name}. Use 'cd'.`,
            });
          } else if (fileNode.isExecutable) {
            // Handle other potential executable files if added later
            // For now, assume only the special cases above are directly "openable"
            newOutputMessages.push({
              type: "warning",
              text: `Cannot open this executable file directly: ${fileNode.name}.`,
            });
          } else {
            newOutputMessages.push({
              type: "warning",
              text: `Cannot open this file type yet: ${fileNode.name}`,
            });
          }
        } else {
          newOutputMessages.push({
            type: "error",
            text: `Error: File or directory not found: ${fileNameToOpen}`,
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
      } else {
        // Explicitly handle empty input case - the default return handles the output.
      }
      break;
  }

  // If the command was 'clear', result is just the clear flag
  if (shouldClear) {
    return { newOutput: [], clear: true, newDir: curDir };
  }

  // Otherwise return the accumulated messages, potential action, and potentially the *original* path
  // (only cd returns a newPath)
  return { newOutput: newOutputMessages, action, newDir: curDir };
};
