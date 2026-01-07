import { DragOverlay, useDndContext, useDndMonitor, useDraggable, useDroppable } from "@dnd-kit/core";
import { Minus, Plus } from "lucide-react";
import { Resizable } from "re-resizable";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Background } from "@ui/background";
import { Button } from "@ui/button";

import { cn } from "../lib/utils";
import { canAccept } from "../widgets/utils";
import { expandRectBy, overlap } from "./Layout";
import {
  isDashboardDndData,
  isWidgetOverlapping,
  setWidgetOverlapping,
  toGrain,
  useWidgetOverlapping,
} from "./useDashboardDnd";
import { ViewportPane } from "./ViewportPane";
import { Widget } from "./Widget";
import { WidgetEditableAdorner } from "./WidgetEditableAdorner";

import type { DragOverEvent } from "@dnd-kit/core";
import type { Viewport } from "@xyflow/system";
import type { Enable, NumberSize } from "re-resizable";
import type { Direction } from "re-resizable/lib/resizer";
import type { RuntimeDashboard, RuntimeWidget, useDashboardActions } from "../stores/Workspace";
import type { ViewportPaneRef } from "./ViewportPane";

const ControlButtonComponent = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button
    variant="secondary"
    className="h-6 w-6 rounded-none p-0 focus-visible:ring-1 focus-visible:ring-offset-0"
    {...props}
  />
);

const ControlButton = memo(ControlButtonComponent);

function getConstraint(widget: RuntimeWidget, grain: number, prop: "width" | "height") {
  // no sizing restrictions
  if (!widget.constraints) {
    return {
      fixed: false,
      min: grain * 2,
      max: undefined,
    };
  }

  const p = widget.constraints[prop];
  if (!p) {
    return {
      fixed: false,
      min: grain * 2,
      max: undefined,
    };
  }

  const fixed = p.fixed == true || (p.max != null && p.max === p.min);
  return {
    fixed,
    max: p.max != null ? p.max * grain : undefined,
    min: p.min != null ? p.min * grain : 2 * grain,
  };
}

function getSizingConstraint(
  width: ReturnType<typeof getConstraint>,
  height: ReturnType<typeof getConstraint>
): Enable | undefined | false {
  if (width.fixed && height.fixed) {
    return false;
  }

  if (width.fixed) {
    return {
      top: true,
      bottom: true,
    };
  }

  if (height.fixed) {
    return {
      left: true,
      right: true,
    };
  }

  return undefined;
}

/** Draggable and resizable widget wrapper component. */
const DynamicWidget = ({
  dashboard,
  widget,
  designMode,
  onWidgetRemove,
  onWidgetLayout,
  onWidgetUpdateProps,
  scale,
  grain,
  gap,
  selected,
}: {
  dashboard: RuntimeDashboard;
  widget: RuntimeWidget;
  designMode?: boolean;
  onWidgetRemove: DashboardViewProps["actions"]["removeWidget"];
  onWidgetLayout: DashboardViewProps["actions"]["layoutWidget"];
  onWidgetUpdateProps: DashboardViewProps["actions"]["updateWidgetProps"];
  scale: number;
  grain: number;
  gap: boolean;
  selected?: boolean;
}) => {
  const [resizing, setResizing] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    disabled: !designMode || resizing,
    id: widget.id,
    data: {
      type: "widget",
      widget,
    },
  });

  // static sizing constraints based on the widget specification
  const constraints = useMemo(() => {
    const widthConstraint = getConstraint(widget, grain, "width");
    const heightConstraint = getConstraint(widget, grain, "height");
    const sizing = getSizingConstraint(widthConstraint, heightConstraint);
    return {
      width: widthConstraint,
      height: heightConstraint,
      sizing,
    };
  }, [widget, grain]);

  const handleResizeStart = useCallback(() => {
    setResizing(true);
  }, []);

  const { widgets } = dashboard;
  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent, dir: Direction, element: HTMLElement, delta: NumberSize) => {
      const dx = delta.width;
      const dy = delta.height;

      const bbox = {
        left: widget.layout.left,
        top: widget.layout.top,
        right: widget.layout.left + widget.layout.width,
        bottom: widget.layout.top + widget.layout.height,
      };

      // offset element by temporary left/top style when resized in the top, left directions
      switch (dir) {
        case "topLeft":
          element.style.left = `${-dx}px`;
          element.style.top = `${-dy}px`;
          bbox.left -= toGrain(dx, grain);
          bbox.top -= toGrain(dy, grain);
          break;
        case "top":
        case "topRight":
          element.style.top = `${-dy}px`;
          bbox.right += toGrain(dx, grain);
          bbox.top -= toGrain(dy, grain);
          break;
        case "left":
        case "bottomLeft":
          element.style.left = `${-dx}px`;
          bbox.left -= toGrain(dx, grain);
          bbox.bottom += toGrain(dy, grain);
          break;
        default:
          bbox.right += toGrain(dx, grain);
          bbox.bottom += toGrain(dy, grain);
          break;
      }

      if (gap) {
        expandRectBy(bbox, 1);
      }

      setWidgetOverlapping(Object.values(widgets).some((_) => _.id !== widget.id && overlap(bbox, _)));
    },
    [gap, grain, widgets, widget.id, widget.layout]
  );

  const handleResizeStop = useCallback(
    (e: MouseEvent | TouchEvent, dir: Direction, element: HTMLElement, delta: NumberSize) => {
      // reset temporary offsets introduced during resize
      element.style.left = "";
      element.style.top = "";

      const overlapping = isWidgetOverlapping();

      if (onWidgetLayout && !overlapping) {
        const dx = toGrain(delta.width, grain);
        const dy = toGrain(delta.height, grain);
        const layout = widget.layout;
        switch (dir) {
          case "topLeft":
            onWidgetLayout(widget.id, {
              left: layout.left - dx,
              top: layout.top - dy,
              width: layout.width + dx,
              height: layout.height + dy,
            });
            break;
          case "top":
          case "topRight":
            onWidgetLayout(widget.id, {
              left: layout.left,
              top: layout.top - dy,
              width: layout.width + dx,
              height: layout.height + dy,
            });
            break;
          case "left":
          case "bottomLeft":
            onWidgetLayout(widget.id, {
              left: layout.left - dx,
              top: layout.top,
              width: layout.width + dx,
              height: layout.height + dy,
            });
            break;
          default:
            onWidgetLayout(widget.id, {
              left: layout.left,
              top: layout.top,
              width: layout.width + dx,
              height: layout.height + dy,
            });
            break;
        }
      }

      setResizing(false);
      setWidgetOverlapping(false);
    },
    [widget, onWidgetLayout, grain]
  );

  const overlapping = useWidgetOverlapping();
  const dndDisabled = resizing || !designMode;

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: widget.id,
    disabled: dndDisabled,
    data: {
      type: "widget",
      widget,
    },
  });

  // highlight widget if it can accept the current topic
  const [droppableState, setDroppableState] = useState<boolean | undefined>(undefined);
  const resetDroppableState = useCallback(() => setDroppableState(undefined), []);

  useDndMonitor({
    onDragOver: useCallback(
      (e: DragOverEvent) => {
        if (e.over?.id === widget.id) {
          const dragData = e.active.data.current;
          if (isDashboardDndData(dragData) && dragData.type === "topic" && dragData.props.channel) {
            setDroppableState(canAccept(widget.descriptor, dragData.props.channel));
            return;
          }
        }
        setDroppableState(undefined);
      },
      [widget.id, widget.descriptor]
    ),
    onDragCancel: resetDroppableState,
    onDragEnd: resetDroppableState,
  });

  return (
    <div
      ref={dndDisabled ? undefined : setNodeRef}
      style={{
        top: widget.layout.top * grain,
        left: widget.layout.left * grain,
        width: widget.layout.width * grain,
        height: widget.layout.height * grain,
      }}
      data-dragging={isDragging ? true : undefined}
      className="nopan pointer-events-auto absolute touch-none data-dragging:opacity-20">
      <Resizable
        scale={scale}
        grid={[grain, grain]}
        size={{ width: widget.layout.width * grain, height: widget.layout.height * grain }}
        enable={designMode && constraints.sizing}
        minWidth={constraints.width.min}
        maxWidth={constraints.width.max}
        minHeight={constraints.height.min}
        maxHeight={constraints.height.max}
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}>
        <div
          className={cn("h-full w-full cursor-auto", designMode && "cursor-grab")}
          ref={dndDisabled ? undefined : setActivatorNodeRef}
          {...(dndDisabled ? undefined : attributes)}
          {...(dndDisabled ? undefined : listeners)}>
          <Widget
            widget={widget}
            mode={designMode ? "design" : undefined}
          />
        </div>
        <div
          ref={setDroppableRef}
          className={cn(
            "pointer-events-none absolute inset-0 rounded-lg",
            droppableState === true && "bg-accent/40",
            droppableState === false && "bg-destructive/20"
          )}
        />
        {selected && designMode && (
          <WidgetEditableAdorner
            widget={widget}
            onWidgetRemove={onWidgetRemove}
            onWidgetUpdateProps={onWidgetUpdateProps}
          />
        )}
        {resizing && overlapping && (
          <div className="absolute inset-0 z-20 rounded-lg ring-2 ring-destructive ring-inset" />
        )}
      </Resizable>
    </div>
  );
};

const DraggableOverlayRealWidget = ({
  widget,
  scale,
  overlapping,
}: {
  widget: RuntimeWidget;
  scale: number;
  overlapping: boolean;
}) => {
  // magic hackery to keep the draggable widget scaled and positioned correctly
  // in the overlay; dndkit sizes the overlay based on the scaled dimensions,
  // so first we resize the bounding container back to the original size while
  // keeping it centered within the overlay, then we render a scaled widget,
  // so it fits the overlay dimensions exactly, but is correctly scaled
  const resize = `${100 / scale}%`;
  const adjust = `${50 * (1 - 1 / scale)}%`;
  const transform = `scale(${scale})`;

  return (
    <div
      className="absolute"
      style={{ width: resize, height: resize, left: adjust, top: adjust }}>
      <div
        className="w-hull h-full"
        style={{ transform }}>
        <Widget
          widget={widget}
          mode="design"
        />
        {overlapping && <div className="absolute inset-0 rounded-lg ring-2 ring-destructive ring-inset" />}
      </div>
    </div>
  );
};

const DraggableOverlayTemplateWidget = ({
  widget,
  grain,
  scale,
  overlapping,
}: {
  widget: RuntimeWidget;
  grain: number;
  scale: number;
  overlapping: boolean;
}) => {
  return (
    <div
      style={{
        width: widget.layout.width * grain,
        height: widget.layout.height * grain,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}>
      <Widget
        widget={widget}
        mode="template"
      />
      {overlapping && <div className="absolute inset-0 rounded-lg ring-2 ring-destructive ring-inset" />}
    </div>
  );
};

const DraggableOverlayContent = ({ grain, scale }: { grain: number; scale: number }) => {
  const { active } = useDndContext();
  const dragData = active?.data.current;
  const overlapping = useWidgetOverlapping();

  if (isDashboardDndData(dragData)) {
    switch (dragData.type) {
      case "widget":
        return (
          <DraggableOverlayRealWidget
            widget={dragData.widget}
            scale={scale}
            overlapping={overlapping}
          />
        );
      case "template":
        return (
          <DraggableOverlayTemplateWidget
            widget={dragData.widget}
            grain={grain}
            scale={scale}
            overlapping={overlapping}
          />
        );
    }
  }

  return null;
};

const DraggableOverlay = (props: { grain: number; scale: number }) =>
  createPortal(
    <DragOverlay dropAnimation={null}>
      <DraggableOverlayContent {...props} />
    </DragOverlay>,
    document.body
  );

export type DashboardViewProps = {
  dashboard: RuntimeDashboard;
  actions: ReturnType<typeof useDashboardActions>;
  viewportRef: React.Ref<HTMLDivElement | null>;
  designMode?: boolean;
  gap?: boolean;
  grid?: "dots" | "lines";
  grain?: number;
  minZoom?: number;
  maxZoom?: number;
  panSnapToGrid?: boolean;
};

export const DashboardView = ({
  dashboard,
  actions,
  viewportRef,
  designMode,
  gap = true,
  grid = "dots",
  grain = 24,
  minZoom = 0.5,
  maxZoom = 2,
  panSnapToGrid = false,
}: DashboardViewProps) => {
  const { viewport, widgets } = dashboard;
  const { removeWidget, layoutWidget, updateWidgetProps, updateViewport } = actions;

  const scale = viewport?.scale ?? 1;
  const imperativeRef = useRef<ViewportPaneRef>(null);
  const onZoomIn = useCallback(() => imperativeRef.current?.zoomIn(), []);
  const onZoomOut = useCallback(() => imperativeRef.current?.zoomOut(), []);

  const handleViewportChange = useCallback(
    (v: Viewport) => {
      const snapSize = grain * v.zoom;
      updateViewport(
        panSnapToGrid ? Math.round(v.x / snapSize) * snapSize : Math.round(v.x),
        panSnapToGrid ? Math.round(v.y / snapSize) * snapSize : Math.round(v.y),
        v.zoom
      );
    },
    [updateViewport, panSnapToGrid, grain]
  );

  return (
    <div className="relative flex h-full w-full bg-background">
      <ViewportPane
        ref={viewportRef}
        handle={imperativeRef}
        viewportX={viewport ? viewport.x : undefined}
        viewportY={viewport ? viewport.y : undefined}
        viewportScale={scale}
        onViewportChange={handleViewportChange}
        minZoom={minZoom}
        maxZoom={maxZoom}>
        {Object.values(widgets).map((widget) => (
          <DynamicWidget
            key={widget.id}
            dashboard={dashboard}
            widget={widget}
            scale={scale}
            designMode={designMode}
            onWidgetRemove={removeWidget}
            onWidgetLayout={layoutWidget}
            onWidgetUpdateProps={updateWidgetProps}
            grain={grain}
            gap={gap}
            selected={designMode}
          />
        ))}
        <DraggableOverlay
          scale={scale}
          grain={grain}
        />
      </ViewportPane>
      <div className="absolute bottom-3 left-3 z-20 flex gap-px select-none">
        <ControlButton
          onClick={onZoomIn}
          disabled={scale >= maxZoom}
          title="Zoom in"
          aria-label="Zoom in">
          <Plus className="size-4 shrink-0" />
        </ControlButton>
        <ControlButton
          onClick={onZoomOut}
          disabled={scale <= minZoom}
          title="Zoom out"
          aria-label="Zoom out">
          <Minus className="size-4 shrink-0" />
        </ControlButton>
        <div className="flex place-items-center bg-secondary px-2 font-mono text-xs">{Math.round(scale * 100)}%</div>
      </div>
      {grid && (
        <Background
          className="opacity-80"
          variant={grid}
          weight={grid === "lines" ? 0.5 : 1}
          scale={scale}
          gap={grain}
          offset={grain / 2}
          nudgeX={viewport ? viewport.x % (grain * scale) : 0}
          nudgeY={viewport ? viewport.y % (grain * scale) : 0}
        />
      )}
    </div>
  );
};
