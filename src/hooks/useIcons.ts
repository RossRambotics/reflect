import iconsXml from "../icons.xml?raw";
import { useGlobalRoot } from "./useGlobalRoot";

/**
 * Hook that registers icons.
 */
export function useIcons() {
  return useGlobalRoot("icons", (root) => {
    root.style.position = "fixed";
    root.style.left = "-999em";
    root.style.height = "0";
    root.style.width = "0";
    root.style.visibility = "hidden";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.innerHTML = iconsXml;
    root.appendChild(svg);
  });
}
