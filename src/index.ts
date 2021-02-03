import { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import getPort from "get-port";
import { createScreehotClient } from "./screenshot-client";
import { createWebpackComponentServer } from "./components-server";
import { PageCreateBody } from "./interface";
import { logger } from "./logger";

export { recordCss } from "./recorded-css";

export async function renderServerSide(ui: ReactElement) {
  const port = await getPort();
}

export async function renderClient(
  componentFilePath: string,
  pageOpt: Pick<PageCreateBody, "browser" | "viewport"> = {
    browser: "chromium",
  }
) {
  const port = await getPort();
  const cleanup = await createWebpackComponentServer({
    port,
    componentFilePath,
  });
  const client = createScreehotClient({ port: 3001 });
  logger.time("client.createPage");
  const {
    data: { id },
  } = await client.createPage({
    url: `http://${
      process.platform !== "linux" ? "host.docker.internal" : "localhost"
    }:${port}`,
    browser: pageOpt.browser,
    viewport: pageOpt.viewport,
  });
  logger.timeEnd("client.createPage");
  logger.time("client.screenshot");
  const { data } = await client.screenshot(id, { fullPage: true });
  logger.timeEnd("client.screenshot");
  await client.closePage(id);
  await cleanup();
  return Buffer.from(data);
}
