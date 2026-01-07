import type { DataChannel } from "@2702rebels/wpidata/abstractions";

export class Slot {
  /**
   * Constructs slot reference from the channel.
   */
  public static fromChannel(channel: DataChannel) {
    const slot = `${channel.source}:${channel.id}`;
    return channel.dataType === "composite" ? `${slot}/*` : slot;
  }

  /**
   * Constructs channel source and identifier from the slot reference.
   */
  public static toChannel(slot: string) {
    const [source, id] = slot.split(":", 2);
    if (source == null || id == null) {
      return undefined;
    }

    const composite = id.endsWith("/*");
    return { source, id: composite ? id.slice(0, -2) : id, composite } as const;
  }

  /**
   * Formats channel source for display purposes.
   */
  public static formatSource(value: string) {
    switch (value) {
      case "nt":
        return "NT";
      case "wpilog":
        return "LOG";
      default:
        return value;
    }
  }

  /**
   * Formats slot reference for display purposes.
   */
  public static formatAsRef(slot: string | undefined | null) {
    if (slot == null) {
      return "";
    }

    const [source, name] = slot.split(":", 2);
    return source && name ? `${Slot.formatSource(source)}:${name.endsWith("/*") ? name.slice(0, -2) : name}` : slot;
  }

  /**
   * Formats slot reference to be used as title by dropping unnecessary ornamental details.
   */
  public static formatAsTitle(slot: string | undefined | null) {
    if (slot == null) {
      return null;
    }

    const v = slot.trim();
    let [, name] = slot.split(":", 2);
    name ??= v;

    if (name.startsWith("/SmartDashboard")) {
      name = name.substring(15);
    }

    while (name[0] === "/") {
      name = name.substring(1);
    }

    if (name.endsWith("/*")) {
      name = name.slice(0, -2);
    }

    return name;
  }
}
