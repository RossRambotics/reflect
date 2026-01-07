import type { StoreApi, UseBoundStore } from "zustand";

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & {
      use: { [K in keyof T]: () => T[K] };
      set: { [K in keyof T]: (v: T[K]) => void };
    }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  store.set = {};

  for (const k of Object.keys(store.getState())) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store.set as any)[k] = (v: unknown) =>
      store.setState(() => ({
        [k as keyof S]: v,
      }));
  }

  return store;
};
