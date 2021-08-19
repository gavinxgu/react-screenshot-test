import { createDockerScreenshotServer } from "./screenshot-server-docker";
import { isDebug, serverType, serverPort } from "./const";
import { createScreenshotServer } from "./screenshot-server";

export let cleanup: (() => Promise<void>) | null = null;

export default async () => {
  if (isDebug || serverType === 'local') {
    cleanup = await createScreenshotServer({
      port: Number(serverPort),
    })
  } else {
    cleanup = await createDockerScreenshotServer({port: Number(serverPort)});
  }
};
