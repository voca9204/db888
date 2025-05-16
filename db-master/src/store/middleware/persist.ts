import { type StateCreator, type StoreMutatorIdentifier } from 'zustand';
import { persist as persistMiddleware } from 'zustand/middleware';

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  options: {
    name: string;
    partialize?: (state: T) => Partial<T>;
    version?: number;
  }
) => StateCreator<T, Mps, Mcs>;

export const persist = persistMiddleware as Persist;
