import getPort from "get-port";
import { createScreehotClient } from "./screenshot-client";
import {
  createSSRComponentServer,
  createWebpackComponentServer,
} from "./components-server";
import { PageCreateBody, PageScreenshotBody } from "./interface";
import { logger } from "./logger";

export { recordCss } from "./recorded-css";

class Render<T> {
  constructor(
    public readonly createServer: (
      port: number,
      props: T
    ) => Promise<() => Promise<void>>
  ) {}

  async render(props: T) {
    const port = await getPort();
    const cleanupWebpackServer = await this.createServer(port, props);
    const client = createScreehotClient({ port: 3001 });
    return {
      createPage: async (
        pageOpt: Pick<PageCreateBody, "browser" | "viewport"> = {
          browser: "chromium",
        }
      ) => {
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
        return {
          screenshot: async (payload: PageScreenshotBody = {}) => {
            logger.time("client.screenshot");
            const res = Buffer.from(
              (await client.screenshot(id, payload)).data
            );
            logger.timeEnd("client.screenshot");
            return res;
          },
          close: async () => client.closePage(id),
        };
      },
      cleanup: async () => {
        logger.time("cleanup");
        await cleanupWebpackServer();
        logger.timeEnd("cleanup");
      },
    };
  }
}

export const webpackRender = new Render(createWebpackComponentServer);
export const ssrRender = new Render(createSSRComponentServer);
