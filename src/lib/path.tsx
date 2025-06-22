import React from "react";

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

export const root: FileNode = new FileNode("root", "", false, true, [
  new FileNode("about", "", false, true, [
    new FileNode(
      "resume.pdf",
      "/about/Si Yong Kim - Software Engineer.pdf",
      true
    ),
  ]),
  new FileNode("projects", "", false, true, [
    new FileNode("SDL2-sort", "/projects/SDL2-sort/SDL2-sort.html", true),
  ]),
]);

export const resolvePath = (
  path: string,
  curDir: FileNode
): FileNode | null => {
  const pathParts = path.split("/");
  let currentNode: FileNode = curDir;

  for (const part of pathParts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      currentNode = currentNode.parent ?? currentNode;
      continue;
    }

    const foundNode = currentNode.children.find((node) => node.name === part);
    if (!foundNode) {
      return null;
    }
    currentNode = foundNode;
  }
  return currentNode;
};

export const formatPath = (currentDir: FileNode): string => {
  const path: string[] = [];
  let currentNode: FileNode = currentDir;
  while (currentNode.parent) {
    path.unshift(currentNode.name);
    currentNode = currentNode.parent;
  }
  return path.length === 0 ? "~" : `~/${path.join("/")}`;
};

export interface RouteChangeResult {
  newDir: FileNode;
  outputMessage?: React.ReactNode;
  modalUrl?: string | null;
  isModalOpen?: boolean;
}

export const handleRouteChange = (
  path: string,
  rootNode: FileNode
): RouteChangeResult => {
  if (!path) {
    return { newDir: rootNode };
  }

  const targetNode = resolvePath(path, rootNode);

  if (!targetNode) {
    return {
      newDir: rootNode,
      outputMessage: (
        <p key="path-not-found" className="text-[#fb4934]">
          cd: no such file or directory: /{path}
        </p>
      ),
    };
  }

  if (targetNode.isDirectory) {
    return { newDir: targetNode };
  }

  if (targetNode.isExecutable && targetNode.url) {
    return {
      newDir: targetNode.parent ?? rootNode,
      outputMessage: (
        <p key="auto-open-message">Opening {targetNode.name}...</p>
      ),
      modalUrl: targetNode.url,
      isModalOpen: true,
    };
  }

  // Fallback for non-executable files or other cases
  return { newDir: targetNode.parent ?? rootNode };
};
