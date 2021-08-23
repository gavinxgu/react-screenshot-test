import express from "express";
import bodyParser from "body-parser";
import playwright, { Page } from "playwright";
import { PageCreateBody, PageGotoBody, PageScreenshotBody } from "./interface";
import { logger } from "./logger";

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
        deviceScaleFactor,
      } = req.body as PageCreateBody;
      const browser = browserMap[browserProp];
      if (!browser) {
        throw new Error(`${browserProp} is not ready`);
      }
      logger.time("browser.newContext");
      const context = await browser.newContext({ viewport, deviceScaleFactor });
      logger.timeEnd("browser.newContext");
      logger.time("context.newPage");
      const page = await context.newPage();
      logger.timeEnd("context.newPage");
      pageMap.set(currentID, page);
      logger.time("page.goto");
      await page.goto(url, {
        waitUntil: "networkidle",
      });
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
      const { fullPage, quality, timeout, type } =
        req.body as PageScreenshotBody;
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

  app.post("/page/:id/_goto", async (req, res) => {
    try {
      const id = req.params.id;
      const { url } = req.body as PageGotoBody;
      const page = pageMap.get(Number(id));
      if (!page) {
        throw new Error(`page ${id} is not found`);
      }
      await page.goto(url, {
        waitUntil: "networkidle",
      });
      res.end();
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
