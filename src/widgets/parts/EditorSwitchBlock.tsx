import { Label } from "@ui/label";
import { Switch } from "@ui/switch";

import { cn } from "../../lib/utils";

export type EditorSwitchBlockProps = React.ComponentProps<typeof Switch> & {
  label: React.ReactNode;
  className?: string;
};

export const EditorSwitchBlock = ({ label, className, ...props }: React.PropsWithChildren<EditorSwitchBlockProps>) => (
  <div className={cn("mx-4 flex items-center gap-2", className)}>
    <Switch {...props} />
    <Label>{label}</Label>
  </div>
);
