import { FileNode, resolvePath } from "./path";

export type { FileNode };

// Define Command Enum
export enum Command {
  Help = "help",
  Clear = "clear",
  Ls = "ls",
  Cd = "cd",
  Open = "",
  Unknown = "unknown",
}

// Calculate available commands string
export const availableCommands = Object.values(Command)
  .filter((cmd) => cmd !== Command.Unknown)
  .join(", ");

// Type for structured output message
export interface OutputMessage {
  type: "normal" | "error" | "warning" | "list" | "command";
  text?: string;
  items?: { name: string; isExecutable: boolean }[];
}

// Type for the action returned by processCommand
export interface CommandAction {
  type: "openModal" | "clear";
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
  input: string,
  curDir: FileNode
): CommandResult => {
  // Start with the command echo
  let newOutputMessages: OutputMessage[] = [
    { type: "command", text: `> ${input}` },
  ];

  if (!input) {
    return { newOutput: newOutputMessages, newDir: curDir };
  }

  let action: CommandAction | undefined = undefined;
  let shouldClear = false;

  const { command, targetPath, execArgs } = parseCommand(input);

  const targetNode = resolvePath(targetPath, curDir);

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
      if (!targetNode) {
        newOutputMessages.push({
          type: "error",
          text: `Error: File or directory not found: ${targetPath}`,
        });
        break;
      }

      let fileToOpen: FileNode | undefined;

      if (targetNode.isDirectory) {
        newOutputMessages.push({
          type: "warning",
          text: `Cannot open directory: ${targetNode.name}. Use 'cd'.`,
        });
      } else if (targetNode.isExecutable) {
        fileToOpen = targetNode;
      }

      if (fileToOpen && fileToOpen.url) {
        newOutputMessages.push({
          type: "normal",
          text: `Opening ${fileToOpen.name}...`,
        });
        // Extract additional arguments for the executable
        let url = fileToOpen.url;
        if (execArgs.length > 0) {
          url += `?args=${execArgs.join(" ")}`;
        }
        action = {
          type: "openModal",
          url: url,
        };
      } else if (!fileToOpen) {
        // This case handles non-executable files or directories that don't meet the auto-open criteria
        newOutputMessages.push({
          type: "error",
          text: `Cannot open file: ${targetPath}. It is not executable or it's a directory.`,
        });
      }
      break;

    case Command.Unknown:
    default:
      // Return error text and help text
      newOutputMessages.push(
        {
          type: "error",
          text: `Invalid command: '${input}'`,
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

interface CommandArgs {
  command: Command;
  targetPath: string;
  execArgs: string[];
}

// parseCommand parses the input string into a command and its arguments
export const parseCommand = (input: string): CommandArgs => {
  // first can be command or targetPath
  const [first, second, ...rest] = input
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  // if first is a valid command, return the command, targetPath, and execArgs
  if (Object.values(Command).includes(first as Command)) {
    return {
      command: first as Command,
      targetPath: second ?? "",
      execArgs: rest ?? [],
    };
  } else {
    // if first is targetPath, return open command, targetPath, and execArgs
    return {
      command: Command.Open,
      targetPath: first,
      execArgs: [second, ...rest],
    };
  }
};
