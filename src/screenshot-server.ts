import express from "express";
import bodyParser from "body-parser";
import playwright, { Page } from "playwright";
import Docker from "dockerode";
import { PageCreateBody, PageScreenshotBody } from "./interface";
import { logger } from "./logger";
import pkg from "../package.json";

export async function createScreenshotServer({ port }: { port: number }) {
  // 自增 ID
  let id = 0;
  function getID() {
    id += 1;
    return id;
  }

  // 启动三个浏览器实例
  let browserMap = {
    chromium: await playwright.chromium.launch(),
    firefox: await playwright.firefox.launch(),
    webkit: await playwright.webkit.launch(),
  };

  // page handler 缓存
  const pageMap = new Map<number, Page>();

  const app = express();
  app.use(bodyParser.json());

  app.get("/", (req, res) => {
    res.send(`
  <html>
    <body>
      <div>
        Universe React Screenshot Server
      </div>
    </body>
  </html>
  `);
  });

  app.post("/page", async (req, res) => {
    const currentID = getID();
    try {
      const {
        url,
        viewport,
        browser: browserProp,
      } = req.body as PageCreateBody;
      const browser = browserMap[browserProp];
      if (!browser) {
        throw new Error(`${browserProp} is not ready`);
      }
      logger.time("browser.newContext");
      const context = await browser.newContext({ viewport });
      logger.timeEnd("browser.newContext");
      logger.time("context.newPage");
      const page = await context.newPage();
      logger.timeEnd("context.newPage");
      pageMap.set(currentID, page);
      logger.time("page.goto");
      await page.goto(url);
      logger.timeEnd("page.goto");
      res.send({
        id: currentID,
      });
    } catch (err) {
      console.error(err);
      res.status(400);
      res.send({
        message: err.message,
      });
      const page = pageMap.get(currentID);
      if (page) {
        await page.close();
        pageMap.delete(currentID);
      }
    }
  });

  app.post("/page/:id/_screenshot", async (req, res) => {
    try {
      const id = req.params.id;
      const {
        fullPage,
        quality,
        timeout,
        type,
      } = req.body as PageScreenshotBody;
      const page = pageMap.get(Number(id));
      if (!page) {
        throw new Error(`page ${id} is not found`);
      }
      res.send(await page.screenshot({ fullPage, quality, timeout, type }));
    } catch (err) {
      res.status(400);
      res.send({
        message: err.message,
      });
    }
  });

  app.delete("/page/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const page = pageMap.get(Number(id));
      if (!page) {
        throw new Error(`page ${id} is not found`);
      }
      await page.close();
      pageMap.delete(Number(id));
      res.end();
    } catch (err) {
      res.status(400);
      res.send({
        message: err.message,
      });
    }
  });

  const server = app.listen(port, () => {
    console.log(`screenshot server is listening at port ${port}`);
  });

  return () =>
    new Promise<void>(async (resolve, reject) => {
      try {
        await new Promise<void>((_resolve, _reject) => {
          server.close(async (err) => {
            if (err) {
              _reject(err);
              return;
            }
            _resolve();
          });
        });
        await browserMap.chromium.close();
        await browserMap.firefox.close();
        await browserMap.webkit.close();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
}

export async function createDockerScreenshotServer({ port }: { port: number }) {
  const DOCKER_IMAGE_TAG_NAME = "gavinxgu/react-screenshot-test";
  const DOCKER_IMAGE_VERSION = pkg.version;
  const DOCKER_IMAGE_TAG = `${DOCKER_IMAGE_TAG_NAME}:${DOCKER_IMAGE_VERSION}`;
  const DOCKER_INTERNAL_PORT = 3001;

  async function ensureDockerImagePresent(docker: Docker) {
    const images = await docker.listImages({
      filters: {
        reference: {
          [DOCKER_IMAGE_TAG]: true,
        },
      },
    });
    if (images.length === 0) {
      throw new Error(
        `It looks like you're missing the Docker image required to render screenshots.\n\nPlease run the following command:\n\n$ docker pull ${DOCKER_IMAGE_TAG}\n\n`
      );
    }
  }

  async function removeLeftoverContainers(docker: Docker) {
    const existingContainers = await docker.listContainers();
    for (const existingContainerInfo of existingContainers) {
      const [name] = existingContainerInfo.Image.split(":");
      if (name === DOCKER_IMAGE_TAG_NAME) {
        // eslint-disable-next-line no-await-in-loop
        const existingContainer = await docker.getContainer(
          existingContainerInfo.Id
        );
        if (existingContainerInfo.State === "running") {
          // eslint-disable-next-line no-await-in-loop
          await existingContainer.stop();
        }
        // eslint-disable-next-line no-await-in-loop
        await existingContainer.remove();
      }
    }
  }

  const docker = new Docker({
    socketPath:
      process.platform === "win32"
        ? "//./pipe/docker_engine"
        : "/var/run/docker.sock",
  });

  await ensureDockerImagePresent(docker);

  await removeLeftoverContainers(docker);

  // hostConfig
  let hostConfig: Docker.ContainerCreateOptions["HostConfig"] = {
    PortBindings: {
      [`${DOCKER_INTERNAL_PORT}/tcp`]: [{ HostPort: `${port}` }],
    },
  };
  if (process.platform === "linux") {
    hostConfig = {
      NetworkMode: "host",
    };
  }

  const container = await docker.createContainer({
    Image: DOCKER_IMAGE_TAG,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: false,
    StdinOnce: false,
    ExposedPorts: {
      [`${DOCKER_INTERNAL_PORT}/tcp`]: {},
    },
    Env: [`PORT=${DOCKER_INTERNAL_PORT}`, `NODE_ENV=${process.env.NODE_ENV}`],
    HostConfig: hostConfig,
  });

  await container.start();

  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
  });

  await new Promise<void>((resolve) => {
    stream.on("data", (message) => {
      console.log(message.toString());
      if (message.toString().indexOf("listening at") > -1) {
        resolve();
      }
    });
  });

  return async () => {
    await container.kill();
    await container.remove();
  };
}
