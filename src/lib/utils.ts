import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ClassValue } from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export type RequiredProperty<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
