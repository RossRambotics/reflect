import type { DataChannelRecord, DataType, StructuredTypeDescriptor } from "@2702rebels/wpidata/abstractions";

/**
 * Struct contract for "sendable" structure containing both robot and operator perspectives of the reef state.
 */
export interface ReefStateSendable {
  readonly robot: ReefStateStruct;
  readonly operator: ReefStateStruct;
}

/**
 * Struct contract for `frc.robot.lib.struct.ReefStateStruct`.
 */
export interface ReefStateStruct {
  readonly algae: number;
  readonly coralsL1: number;
  readonly coralsL2: number;
  readonly coralsL3: number;
  readonly coralsL4: number;
  readonly target: number;
  readonly locked: boolean;
  readonly level: number;
}

export const transform = (
  dataType: DataType,
  records: ReadonlyArray<DataChannelRecord>,
  structuredType: StructuredTypeDescriptor | undefined
) => {
  if (records.length === 0) {
    return undefined;
  }

  const value = records.at(-1)?.value;
  if (value == null) {
    return undefined;
  }

  try {
    if (!Array.isArray(value) && typeof value === "object") {
      if (structuredType && structuredType.format === "composite" && structuredType.name === "ReefState") {
        return value as unknown as ReefStateSendable;
      }
    }
  } catch {
    // swallow invalid data
  }

  return undefined;
};
