import { DndContext, DragOverlay, useDndContext } from "@dnd-kit/core";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Resizable } from "@ui/resizable";
import { Tabs } from "@ui/tabs";

import { useSettingsStore } from "../stores/Settings";
import { useDashboardActions, useDesignModeState } from "../stores/Workspace";
import { DashboardView } from "./DashboardView";
import { TopicEntry } from "./TopicEntry";
import { TopicsExplorer } from "./TopicsExplorer";
import { isDashboardDndData, useDashboardDnd } from "./useDashboardDnd";
import { WidgetGallery } from "./WidgetGallery";

import type { RuntimeDashboard } from "../stores/Workspace";
import type { TopicEntryProps } from "./TopicEntry";

const DraggableOverlayTopicEntry = (props: TopicEntryProps) => (
  <div className="flex min-w-min rounded-sm border border-muted-foreground/20 bg-accent/90 p-2">
    <TopicEntry
      {...props}
      inert
    />
  </div>
);

const DraggableOverlayContent = () => {
  const { active } = useDndContext();
  const dragData = active?.data.current;

  if (isDashboardDndData(dragData) && dragData.type === "topic") {
    return <DraggableOverlayTopicEntry {...dragData.props} />;
  }

  return null;
};

const DraggableOverlay = () =>
  createPortal(
    <DragOverlay dropAnimation={null}>
      <DraggableOverlayContent />
    </DragOverlay>,
    document.body
  );

export type DashboardProps = {
  dashboard: RuntimeDashboard;
};

export const Dashboard = ({ dashboard }: DashboardProps) => {
  const designMode = useDesignModeState();
  const grain = useSettingsStore((state) => state.grain);
  const actions = useDashboardActions(dashboard.id);

  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportBox = useCallback(() => viewportRef.current?.getBoundingClientRect(), []);
  const dndProps = useDashboardDnd(dashboard, actions, { grain, gap: true }, viewportBox);

  const view = (
    <DashboardView
      dashboard={dashboard}
      actions={actions}
      viewportRef={viewportRef}
      designMode={designMode}
      grain={grain}
      panSnapToGrid={useSettingsStore.use.panSnapToGrid()}
    />
  );

  const [tab, setTab] = useState("widgets");

  // auto-save layout to local storage
  const { defaultLayout, onLayoutChange } = Resizable.useDefaultLayout({
    groupId: "dashboard-root-layout",
    storage: localStorage,
  });

  return (
    <DndContext {...dndProps}>
      {designMode ? (
        <Resizable
          orientation="horizontal"
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}>
          <Resizable.Panel
            className="flex flex-col bg-secondary/20"
            id="topics-explorer"
            defaultSize={300}
            minSize={200}
            maxSize={500}
            collapsible>
            {tab === "widgets" && <WidgetGallery />}
            {tab === "channels" && <TopicsExplorer behavior="draggable" />}
            <Tabs
              className="mt-auto h-[57px] flex-none border-t border-border bg-background"
              value={tab}
              onValueChange={setTab}
              placement="top">
              <Tabs.Item value="widgets">Widgets</Tabs.Item>
              <Tabs.Item value="channels">Channels</Tabs.Item>
            </Tabs>
          </Resizable.Panel>
          <Resizable.Handle withHandle />
          <Resizable.Panel id="viewport">{view}</Resizable.Panel>
        </Resizable>
      ) : (
        <div className="flex flex-1 overflow-hidden">{view}</div>
      )}
      <DraggableOverlay />
    </DndContext>
  );
};
