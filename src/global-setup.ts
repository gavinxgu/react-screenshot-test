import { createDockerScreenshotServer } from "./screenshot-server-docker";

export let cleanup: (() => Promise<void>) | null = null;

export default async () => {
  cleanup = await createDockerScreenshotServer({ port: 3001 });
};
