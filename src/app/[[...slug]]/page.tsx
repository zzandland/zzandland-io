import { root, FileNode } from "../../lib/commands";
import Terminal from "../../components/Terminal";

// Function to recursively generate paths from the FileNode structure
function generatePaths(
  node: FileNode,
  currentPath: string[] = []
): { slug: string[] }[] {
  let paths: { slug: string[] }[] = [];

  // Add path for the current directory node if it's not the root node
  if (currentPath.length > 0) {
    paths.push({ slug: [...currentPath] });
  }

  node.children.forEach((child) => {
    const childPath = [...currentPath, child.name];
    if (child.isDirectory) {
      paths = paths.concat(generatePaths(child, childPath));
    } else if (child.isExecutable && child.url) {
      // Add path for executable files
      paths.push({ slug: childPath });
    }
  });

  return paths;
}

export async function generateStaticParams() {
  const paths = generatePaths(root);
  return [{ slug: [] }, ...paths];
}

// This is now a Server Component (or at least, not a top-level Client Component)
export default function Page() {
  console.log(generatePaths(root));
  // All client-side logic, state, effects, and UI rendering are now in Terminal
  return <Terminal />;
}
