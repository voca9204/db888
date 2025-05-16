import { type StateCreator, type StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>;

const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    const isFunction = typeof args[0] === 'function';
    const description = name ? `${name}: ` : '';
    
    if (process.env.NODE_ENV === 'development') {
      console.group(
        `%c${description}${isFunction ? 'updating' : 'setting'} store`,
        'color: #3f51b5; font-weight: bold'
      );
      console.log('%cold state', 'color: #9e9e9e; font-weight: bold', get());
      
      set(...args);
      
      console.log('%cnew state', 'color: #4caf50; font-weight: bold', get());
      console.groupEnd();
    } else {
      set(...args);
    }
  };
  
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;
