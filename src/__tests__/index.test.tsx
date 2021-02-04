import React from "react";
import path from "path";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { webpackRender, ssrRender } from "..";
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
      ui: <Button />,
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
