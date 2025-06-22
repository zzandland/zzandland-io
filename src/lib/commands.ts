// Define Command Enum
export enum Command {
  Help = "help",
  Clear = "clear",
  Ls = "ls",
  Cd = "cd",
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
    new FileNode(
      "resume.pdf",
      "about/Si Yong Kim - Software Engineer.pdf",
      true
    ),
  ]),
  new FileNode("projects", "", false, true, [
    new FileNode("SDL2-sort", "projects/SDL2-sort/SDL2-sort.html", true),
  ]),
]);

// Function to resolve a path to a FileNode
const resolvePath = (path: string, curDir: FileNode): FileNode | null => {
  const pathParts = path.split("/");
  let currentNode: FileNode = curDir;

  for (const part of pathParts) {
    if (part === "" || part === ".") continue; // Skip empty or current directory
    if (part === "..") {
      // Go up one level, but don't go above root implicitly handled by parent being undefined
      currentNode = currentNode.parent ?? currentNode;
      continue;
    }

    // Find the child node matching the current path part
    const foundNode = currentNode.children.find((node) => node.name === part);
    if (!foundNode) {
      return null; // Path part not found, invalid path
    }
    // Move to the found node for the next part
    currentNode = foundNode;
  }

  // Return the final node reached after traversing the path
  return currentNode;
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

  if (!commandInput) {
    return { newOutput: newOutputMessages, newDir: curDir };
  }

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
      const targetNode = targetPath ? resolvePath(targetPath, curDir) : curDir;
      if (!targetNode) {
        newOutputMessages.push({
          type: "error",
          text: `ls: no such file or directory: ${targetPath}`,
        });
        break;
      }
      const filesToList = targetNode.isDirectory
        ? targetNode.children?.map((node) => ({
            name: node.isDirectory ? `${node.name}/` : node.name,
            isExecutable: node.isExecutable,
          }))
        : [
            {
              name: targetNode.name,
              isExecutable: targetNode.isExecutable,
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
        const targetNode = targetPath
          ? resolvePath(targetPath, curDir)
          : curDir;
        if (!targetNode || !targetNode.isDirectory) {
          newOutputMessages.push({
            type: "error",
            text: `cd: no such directory: ${targetPath}`,
          });
          break;
        }

        curDir = targetNode;
      }
      break;

    case Command.Open:
      if (!targetPath) {
        newOutputMessages.push({
          type: "warning",
          text: "Usage: open <filename>",
        });
      } else {
        const targetNode = targetPath
          ? resolvePath(targetPath, curDir)
          : curDir;
        if (!targetNode) {
          newOutputMessages.push({
            type: "error",
            text: `Error: File or directory not found: ${targetPath}`,
          });
          break;
        }
        // Check if the last part is a file
        if (targetNode.isDirectory) {
          // If it is a directory and it has only one child, and that child is executable, open it.
          if (
            targetNode.children.length === 1 &&
            targetNode.children[0].isExecutable
          ) {
            const fileToOpen = targetNode.children[0];
            newOutputMessages.push({
              type: "normal",
              text: `Opening ${fileToOpen.name}...`,
            });
            if (fileToOpen.url) {
              action = {
                type: "openModal",
                url: fileToOpen.url,
              };
            }
          } else {
            newOutputMessages.push({
              type: "warning",
              text: `Cannot open directory: ${targetNode.name}. Use 'cd'.`,
            });
          }
          break;
        } else if (targetNode.isExecutable) {
          newOutputMessages.push({
            type: "normal",
            text: `Opening ${targetNode.name}...`,
          });
          if (targetNode.url) {
            action = {
              type: "openModal",
              url: targetNode.url,
            };
          }
        } else {
          newOutputMessages.push({
            type: "error",
            text: `Cannot open file: ${targetNode.name}.`,
          });
          break;
        }
      }
      break;

    case Command.Unknown:
    default:
      // Return error text and help text
      newOutputMessages.push(
        {
          type: "error",
          text: `Invalid command: '${commandInput}'`,
        },
        {
          type: "normal",
          text: `Available commands: ${availableCommands}`,
        }
      );
      break;
  }

  // If the command was 'clear', result is just the clear flag
  if (shouldClear) {
    return { newOutput: [], clear: true, newDir: curDir };
  }

  return { newOutput: newOutputMessages, action, newDir: curDir };
};
