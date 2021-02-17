import getPort from "get-port";
import { createScreehotClient } from "./screenshot-client";
import {
  createSSRComponentServer,
  createWebpackComponentServer,
  createViteComponentServer
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
    const cleanupServer = await this.createServer(port, props);
    const client = createScreehotClient({ port: 3001 });
    return {
      createPage: async (
        pageOpt: Omit<PageCreateBody, "url"> = {
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
          ...pageOpt,
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
        await cleanupServer();
        logger.timeEnd("cleanup");
      },
    };
  }
}

export const webpackRender = new Render(createWebpackComponentServer);
export const ssrRender = new Render(createSSRComponentServer);
export const viteRender = new Render(createViteComponentServer);
