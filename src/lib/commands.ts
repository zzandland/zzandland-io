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
  url?: string;
  isExecutable: boolean = false;
  isDirectory: boolean = false;
  children: FileNode[];
  parent?: FileNode;

  constructor(
    name: string,
    url: string = "",
    isExecutable: boolean = false,
    isDirectory: boolean = false,
    children: FileNode[] = []
  ) {
    this.name = name;
    this.url = url;
    this.isExecutable = isExecutable;
    this.isDirectory = isDirectory;
    this.children = children;
    this.children.forEach((child) => (child.parent = this));
  }
}

// Calculate available commands string
export const availableCommands = Object.values(Command)
  .filter((cmd) => cmd !== Command.Unknown)
  .join(", ");

export const root: FileNode = new FileNode("root", "", false, true, [
  new FileNode("about", "", false, true, [
    new FileNode("resume", "about/Si Yong Kim - Software Engineer.pdf", true),
  ]),
  new FileNode("projects", "", false, true, [
    new FileNode("SDL2-sort", "projects/SDL2-sort/SDL2-sort.html", true),
  ]),
]);

// Function to check if a path is valid
const isValidPath = (path: string, curDir: FileNode) => {
  const pathParts = path.split("/");
  let currentNode: FileNode = curDir;

  for (const part of pathParts) {
    if (part === "" || part === ".") continue; // Skip empty or current directory
    if (part === "..") {
      currentNode = currentNode.parent ?? currentNode; // Go up one level
      continue;
    }

    const foundNode = currentNode?.children.find((node) => node.name === part);
    if (!foundNode) {
      return false; // Path is invalid
    }
    currentNode = foundNode;
  }

  return true; // Path is valid
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
  const targetPath = args[0];

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
      let currentNode: FileNode = curDir;
      if (targetPath) {
        if (!isValidPath(targetPath, curDir)) {
          newOutputMessages.push({
            type: "error",
            text: `cd: no such file or directory: ${targetPath}`,
          });
          break;
        }

        const pathParts = targetPath.split("/");

        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          if (part === "" || part === ".") continue; // Skip empty or current directory
          if (part === "..") {
            currentNode = currentNode.parent ?? currentNode; // Go up one level
            continue;
          }

          const foundNode = currentNode?.children.find(
            (node) => node.name === part
          );
          if (!foundNode) {
            newOutputMessages.push({
              type: "error",
              text: `ls: no such file or directory: ${targetPath}`,
            });
            break;
          }
          if (i < pathParts.length - 1 && !foundNode.isDirectory) {
            newOutputMessages.push({
              type: "error",
              text: `ls: not a directory: ${part}`,
            });
            break;
          }
          currentNode = foundNode;
        }
      }

      const filesToList = currentNode.isDirectory
        ? currentNode.children?.map((node) => ({
            name: node.isDirectory ? `${node.name}/` : node.name,
            isExecutable: node.isExecutable,
          }))
        : [
            {
              name: currentNode.name,
              isExecutable: currentNode.isExecutable,
            },
          ];

      filesToList.sort((a, b) => a.name.localeCompare(b.name));

      newOutputMessages.push({ type: "list", items: filesToList });
      break;
    case Command.Cd:
      if (!targetPath || targetPath === "/" || targetPath === "~") {
        // 'cd' without args usually goes home, let's go to root
        while (curDir.parent) {
          curDir = curDir.parent;
        }
      } else {
        if (!isValidPath(targetPath, curDir)) {
          newOutputMessages.push({
            type: "error",
            text: `cd: no such file or directory: ${targetPath}`,
          });
          break;
        }

        const pathParts = targetPath.split("/");
        let currentNode: FileNode = curDir;

        for (const part of pathParts) {
          if (part === "" || part === ".") continue; // Skip empty or current directory
          if (part === "..") {
            currentNode = currentNode.parent ?? currentNode; // Go up one level
            continue;
          }

          const foundNode = currentNode?.children.find(
            (node) => node.name === part
          );
          if (!foundNode) {
            newOutputMessages.push({
              type: "error",
              text: `cd: no such file or directory: ${targetPath}`,
            });
            break;
          }
          if (!foundNode.isDirectory) {
            newOutputMessages.push({
              type: "error",
              text: `cd: not a directory: ${part}`,
            });
            break;
          }
          currentNode = foundNode;
        }
        curDir = currentNode;
      }

      break;
    case Command.Open:
      if (!targetPath) {
        newOutputMessages.push({
          type: "warning",
          text: "Usage: open <filename>",
        });
      } else {
        if (!isValidPath(targetPath, curDir)) {
          newOutputMessages.push({
            type: "error",
            text: `Error: File or directory not found: ${targetPath}`,
          });
          break;
        }
        // Check if the targetPath is a path
        const pathParts = targetPath.split("/");
        let currentNode: FileNode = curDir;
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          if (part === "" || part === ".") continue; // Skip empty or current directory
          if (part === "..") {
            currentNode = currentNode.parent ?? currentNode; // Go up one level
            continue;
          }
          const foundNode = currentNode?.children.find(
            (node) => node.name === part
          );
          if (!foundNode) {
            newOutputMessages.push({
              type: "error",
              text: `Error: File or directory not found: ${targetPath}`,
            });
            break;
          }
          if (i < pathParts.length - 1) {
            if (!foundNode.isDirectory) {
              newOutputMessages.push({
                type: "error",
                text: `Error: File or directory not found: ${targetPath}`,
              });
              break;
            }
            currentNode = foundNode;
            continue;
          } else {
            // Check if the last part is a file
            if (foundNode.isDirectory) {
              newOutputMessages.push({
                type: "warning",
                text: `Cannot open directory: ${foundNode.name}. Use 'cd'.`,
              });
              break;
            } else if (foundNode.isExecutable) {
              newOutputMessages.push({
                type: "normal",
                text: `Opening ${foundNode.name}...`,
              });
              if (foundNode.url) {
                action = {
                  type: "openModal",
                  url: foundNode.url,
                };
              }
            } else {
              newOutputMessages.push({
                type: "error",
                text: `Cannot open file: ${foundNode.name}.`,
              });
              break;
            }
          }
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
