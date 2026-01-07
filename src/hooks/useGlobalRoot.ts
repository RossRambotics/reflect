/**
 * Global variable referencing the root DOM nodes.
 */
const globalRoots = new Map<string, HTMLElement>();

/**
 * Returns global root element.
 */
export function getGlobalRoot(type: string, init?: (element: HTMLElement) => void) {
  let root: HTMLElement | null | undefined = globalRoots.get(type);
  if (!root) {
    // create new root in DOM if none yet exists
    const moniker = `global-${type}-root`;
    root = document.getElementById(`--${moniker}`);
    if (!root) {
      root = document.createElement("div");
      root.setAttribute("id", `--${moniker}`);
      root.setAttribute(`data-${moniker}`, "");
      document.body.appendChild(root);

      // run initialization on the root
      if (init) {
        init(root);
      }
    }
    globalRoots.set(type, root);
  }
  return root;
}

/**
 * Hook to construct global root elements.
 */
export function useGlobalRoot(type: string, init?: (element: HTMLElement) => void) {
  return getGlobalRoot(type, init);
}
