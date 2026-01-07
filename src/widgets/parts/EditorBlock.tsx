import { Label } from "@ui/label";

import { cn } from "../../lib/utils";

export type EditorBlockProps = {
  label: React.ReactNode;
  className?: string;
};

export const EditorBlock = ({ children, label, className }: React.PropsWithChildren<EditorBlockProps>) => (
  <div className={cn("flex flex-col gap-2 px-4", className)}>
    <Label className="ml-1">{label}</Label>
    {children}
  </div>
);
