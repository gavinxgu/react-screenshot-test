import { cleanup } from "./global-setup";

export default async () => {
  await cleanup?.();
};
