import type { WidgetRecord } from "../specs";

export function expandRectBy(rect: { top: number; right: number; bottom: number; left: number }, delta: number) {
  rect.left -= delta;
  rect.top -= delta;
  rect.right += delta;
  rect.bottom += delta;
}

export function overlap(rect: { top: number; right: number; bottom: number; left: number }, widget: WidgetRecord) {
  const l = widget.layout.left;
  const t = widget.layout.top;
  const r = widget.layout.left + widget.layout.width;
  const b = widget.layout.top + widget.layout.height;

  return b > rect.top && t < rect.bottom && r > rect.left && l < rect.right;
}
