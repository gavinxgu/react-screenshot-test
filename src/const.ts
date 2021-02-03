let env = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "production"
  | "test";
export const isDebug = !!process.env.DEBUG;
export const isEnvDevelopment = env === "development";
export const isEnvProduction = env === "production";
export const isEnvTest = env === "test";
