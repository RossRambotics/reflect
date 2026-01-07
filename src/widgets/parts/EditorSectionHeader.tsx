export const EditorSectionHeader = ({ children }: React.PropsWithChildren) => (
  <div className="flex flex-col gap-1 border-y bg-secondary/20 px-4 py-4 select-none">
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);
