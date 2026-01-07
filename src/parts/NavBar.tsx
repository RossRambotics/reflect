import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/alert-dialog";
import { Button } from "@ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui/dropdown-menu";
import { Icon } from "@ui/icon";
import { toast } from "@ui/sonner";
import { Tooltip } from "@ui/tooltip";

import { openWorkspaceFile, saveWorkspaceFile } from "../commands";
import { useRobotNetworkAddress } from "../hooks/useRobotSettings";
import { cn } from "../lib/utils";
import { useConnectionStatus } from "../stores/Data";
import {
  getWorkspaceDocument,
  useDashboard,
  useDashboards,
  useDesignModeState,
  workspaceActions,
} from "../stores/Workspace";
import { useModal } from "./Modal";

import type { DragEndEvent, PointerSensorOptions } from "@dnd-kit/core";

const modifiers = [restrictToVerticalAxis, restrictToParentElement];
const pointerSensorOptions: PointerSensorOptions = {
  activationConstraint: {
    /**
     * Activate dragging only after a delay (in ms) to allow click interactions.
     * See https://docs.dndkit.com/api-documentation/sensors/pointer#delay
     */
    delay: 250,
    /**
     * Motion tolerance in pixels to abort the drag operation during the delay.
     */
    tolerance: 100,
  },
};

const KbdCmd = () => <span className="text-[8px]">⌘</span>;

function formatConnectionStatus(status: ReturnType<typeof useConnectionStatus>, address: string | null | undefined) {
  if (status === "disconnected") {
    return "Disconnected";
  }

  const addr = address ? ` to ${address}` : "";
  switch (status) {
    case "connected":
      return `Connected${addr}`;
    case "connecting":
      return `Connecting${addr}`;
  }
}

const ConnectionStatusIndicator = () => {
  const status = useConnectionStatus();
  const address = useRobotNetworkAddress();

  const component = (
    <Icon
      name={status === "disconnected" ? "i:emoji-sad-solid" : "i:emoji-happy-solid"}
      size="default"
      className={cn(
        status === "disconnected" && "text-destructive",
        status === "connected" && "text-green-600",
        status === "connecting" && "text-yellow-600"
      )}
    />
  );

  return (
    <div className="-mx-2 mt-1 border-t px-3 pt-3 pb-1">
      <Tooltip anchor={component}>
        <Tooltip.Content side="right">{formatConnectionStatus(status, address)}</Tooltip.Content>
      </Tooltip>
    </div>
  );
};

type NavBarItemProps = {
  id: string;
  icon: string;
  name: string;
  selected?: boolean;
  shortcut?: React.ReactNode;
  overlay?: string;
  onPress?: (id: string) => void;
};

const NavBarItem = ({ id, icon, name, overlay, shortcut: shortcut, selected, onPress }: NavBarItemProps) => {
  const handleClick = useCallback(() => {
    if (onPress) {
      onPress(id);
    }
  }, [onPress, id]);

  const button = (
    <Button
      onClick={handleClick}
      variant={selected ? "secondary" : "ghost"}
      className={selected ? "flex-none rounded-full hover:rounded-md" : "flex-none"}
      size="icon">
      <Icon
        name={icon}
        size="sm"
        className={selected ? "text-accent-foreground/80" : "text-muted-foreground group-hover:text-accent-foreground"}
      />
      {overlay && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 grid place-items-center text-center text-xs font-semibold select-none",
            selected ? "text-accent-foreground/80" : "text-muted-foreground group-hover:text-accent-foreground"
          )}>
          {overlay}
        </div>
      )}
    </Button>
  );

  return (
    <Tooltip anchor={button}>
      <Tooltip.Content side="right">
        <div className="flex items-center gap-2">
          <div>{name}</div>
          {shortcut && (
            <kbd className="pointer-events-none inline-flex items-center gap-1 rounded bg-muted px-1.5 py-1 text-xs/3 text-foreground/80 select-none">
              {shortcut}
            </kbd>
          )}
        </div>
      </Tooltip.Content>
    </Tooltip>
  );
};

NavBarItem.displayName = "NavBarItem";

const SortableNavBarItem = (props: NavBarItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={-1}>
      <NavBarItem {...props} />
    </div>
  );
};

const DashboardDeleteAlertDialog = ({
  onAction,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  onAction: () => void;
}) => (
  <AlertDialog {...props}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the dashboard.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          onClick={onAction}>
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const selectDashboard = (id: string) => {
  workspaceActions.selectDashboard(id);
};

function useDashboardHotKeys() {
  useHotkeys("alt+d", () => workspaceActions.toggleDesignMode());
  useHotkeys("alt+a", () => workspaceActions.selectDashboard("auto"));
  useHotkeys("alt+t", () => workspaceActions.selectDashboard("teleop"));
  useHotkeys("alt+1", () => workspaceActions.selectDashboardByKey(0));
  useHotkeys("alt+2", () => workspaceActions.selectDashboardByKey(1));
  useHotkeys("alt+3", () => workspaceActions.selectDashboardByKey(2));
  useHotkeys("alt+4", () => workspaceActions.selectDashboardByKey(3));
  useHotkeys("alt+5", () => workspaceActions.selectDashboardByKey(4));
  useHotkeys("alt+6", () => workspaceActions.selectDashboardByKey(5));
  useHotkeys("alt+7", () => workspaceActions.selectDashboardByKey(6));
  useHotkeys("alt+8", () => workspaceActions.selectDashboardByKey(7));
  useHotkeys("alt+9", () => workspaceActions.selectDashboardByKey(8));
}

export const NavBar = () => {
  const designMode = useDesignModeState();
  const dashboards = useDashboards();
  const dashboard = useDashboard();

  const showSettings = useModal("settings", undefined, {
    className: "w-[40rem]",
  });

  const sensors = useSensors(useSensor(PointerSensor, pointerSensorOptions));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over != null && active.id !== over.id) {
      workspaceActions.moveDashboard(active.id as string, over.id as string);
    }
  }, []);

  const handleWorkspaceImport = useCallback(async () => {
    const workspaceDocument = await openWorkspaceFile();
    if (workspaceDocument) {
      const error = workspaceActions.import(workspaceDocument);
      if (error) {
        toast.error("Failed to parse workspace file", {
          description: "Workspace document is malformed or unsupported",
        });
      } else {
        toast.success("Workspace imported successfully");
      }
    }
  }, []);

  const handleWorkspaceExport = useCallback(async () => {
    await saveWorkspaceFile(getWorkspaceDocument());
  }, []);

  const [deleteOpen, setDeleteOpen] = useState(false);

  useDashboardHotKeys();

  return (
    <nav className="flex h-full flex-col items-center gap-1 overflow-hidden px-2 py-2">
      <div className="-mx-2 mb-1 border-b px-2 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex-none"
              size="icon">
              <Icon
                name="i:menu"
                size="sm"
                className="text-muted-foreground group-hover:text-accent-foreground"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="right">
            <DropdownMenuItem onClick={handleWorkspaceImport}>Import workspace</DropdownMenuItem>
            <DropdownMenuItem onClick={handleWorkspaceExport}>Export workspace</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {dashboards.auto && (
        <NavBarItem
          id={dashboards.auto.id}
          name={dashboards.auto.name}
          shortcut={
            <>
              <KbdCmd />
              <div>A</div>
            </>
          }
          icon="i:auto"
          selected={dashboards.auto.id === dashboard?.id}
          onPress={selectDashboard}
        />
      )}
      {dashboards.teleop && (
        <NavBarItem
          id={dashboards.teleop.id}
          name={dashboards.teleop.name}
          shortcut={
            <>
              <KbdCmd />T
            </>
          }
          icon="i:controller"
          selected={dashboards.teleop.id === dashboard?.id}
          onPress={selectDashboard}
        />
      )}
      <div className="flex flex-col gap-1">
        <DndContext
          sensors={sensors}
          modifiers={modifiers}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={dashboards.custom}
            strategy={verticalListSortingStrategy}>
            {dashboards.custom.map((_, index) => (
              <SortableNavBarItem
                key={_.id}
                id={_.id}
                name={_.name}
                overlay={(index + 1).toFixed()}
                shortcut={
                  <>
                    <KbdCmd />
                    {index + 1}
                  </>
                }
                icon="i:square-blank"
                selected={_.id === dashboard?.id}
                onPress={selectDashboard}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      {dashboards.custom.length < 9 && (
        <NavBarItem
          id="__add"
          name="Add dashboard"
          icon="i:square-plus"
          onPress={() => workspaceActions.addDashboard()}
        />
      )}
      <div className="mt-auto flex flex-col gap-1">
        {designMode && dashboard && dashboard.type === "custom" && (
          <>
            <NavBarItem
              id="__delete"
              name="Delete dashboard"
              icon="i:trash-bin"
              onPress={() => setDeleteOpen(true)}
            />
            <DashboardDeleteAlertDialog
              onAction={() => workspaceActions.removeDashboard(dashboard.id)}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            />
          </>
        )}
        {dashboard && (
          <NavBarItem
            id="__designMode"
            name={designMode ? "Exit design mode" : "Enter design mode"}
            icon={designMode ? "i:grid-lock" : "i:grid-edit"}
            shortcut={
              <>
                <KbdCmd />D
              </>
            }
            selected={designMode}
            onPress={workspaceActions.toggleDesignMode}
          />
        )}
        <NavBarItem
          id="__settings"
          name="Settings"
          icon="i:settings"
          onPress={showSettings}
        />
      </div>
      <ConnectionStatusIndicator />
    </nav>
  );
};
