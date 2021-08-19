let env = (process.env.NODE_ENV ?? "development") as
  | "development"
  | "production"
  | "test";
export const isDebug = !!process.env.DEBUG;
export const isEnvDevelopment = env === "development";
export const isEnvProduction = env === "production";
export const isEnvTest = env === "test";
export const serverType = (process.env.SERVER_TYPE ?? 'docker') as 'docker' | 'local'
export const serverPort = process.env.PORT ?? 3001