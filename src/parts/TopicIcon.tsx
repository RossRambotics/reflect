import { Binary, Box, Braces, Brackets, CaseLower, Hash, ToggleLeft } from "lucide-react";

import type { DataChannel } from "@2702rebels/wpidata/abstractions";

export type TopicIconProps = React.SVGAttributes<SVGSVGElement> & {
  type?: DataChannel["dataType"];
};

export const TopicIcon = ({ type, ...other }: TopicIconProps) => {
  switch (type) {
    case "stringArray":
    case "booleanArray":
    case "numberArray":
      return <Brackets {...other} />;
    case "number":
      return <Hash {...other} />;
    case "string":
      return <CaseLower {...other} />;
    case "boolean":
      return <ToggleLeft {...other} />;
    case "binary":
      return <Binary {...other} />;
    case "json":
      return <Braces {...other} />;
    default:
      return <Box {...other} />;
  }
};
