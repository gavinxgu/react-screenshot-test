import React from "react";
import path from "path";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { webpackRender, ssrRender, viteRender } from "..";
import Button from "../../examples/button";
import "./index.css";

jest.setTimeout(30000);

expect.extend({ toMatchImageSnapshot });

describe("webpack render", () => {
  test("should render button", async () => {
    const { createPage, cleanup } = await webpackRender.render({
      componentFilePath: path.resolve(__dirname, "../../examples/button.tsx"),
    });
    let page = await createPage({ browser: "chromium" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "firefox" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "webkit" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    await page.close();
    await cleanup();
  });
});

describe("ssr render", () => {
  test("should render button", async () => {
    const { createPage, cleanup } = await ssrRender.render({
      uis: [
        {
          path: "/",
          ui: <Button />,
        },
      ],
    });
    let page = await createPage({ browser: "chromium" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "firefox" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "webkit" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    await page.close();
    await cleanup();
  });
});

describe("vite render", () => {
  test("should render button", async () => {
    const paths = [path.resolve(__dirname, "../../examples/button.tsx")];

    const { createPage, cleanup } = await viteRender.render({
      componentFilePath: paths,
    });

    let page = await createPage({ browser: "chromium", path: paths[0] });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "firefox", path: paths[0] });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();

    page = await createPage({ browser: "webkit", path: paths[0] });
    expect(await page.screenshot()).toMatchImageSnapshot();
    await page.close();
    await cleanup();
  });

  test("should render two components", async () => {
    const paths = [
      path.resolve(__dirname, "../../examples/button.tsx"),
      path.resolve(__dirname, "../../examples/box.tsx"),
    ];

    const { createPage, cleanup } = await viteRender.render({
      componentFilePath: paths,
    });

    let page = await createPage({ browser: "chromium", path: paths[0] });
    expect(await page.screenshot()).toMatchImageSnapshot();
    await page.goto({ path: paths[1] });
    expect(await page.screenshot()).toMatchImageSnapshot();
    page.close();
    await cleanup();
  });
});

describe("class-component webpack render", () => {
  test("should render button", async () => {
    const { createPage, cleanup } = await webpackRender.render({
      componentFilePath: path.resolve(
        __dirname,
        "../../examples/class-component.tsx"
      ),
    });
    let page = await createPage({ browser: "chromium" });
    expect(await page.screenshot()).toMatchImageSnapshot();
    await page.close();
    await cleanup();
  });
});
