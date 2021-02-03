import { isEnvDevelopment, isDebug } from "./const";

function createLogger(name: string) {
  return {
    info: (...args: any[]) =>
      (isDebug || isEnvDevelopment) && console.log(name, ...args),
    error: (...args: any[]) => console.error(name, ...args),
    time: (label: string) =>
      (isDebug || isEnvDevelopment) && console.time(label),
    timeEnd: (label: string) =>
      (isDebug || isEnvDevelopment) && console.timeEnd(label),
  };
}

export const logger = createLogger("[rst]");
