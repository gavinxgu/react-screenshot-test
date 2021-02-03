import fs from "fs";
import path from "path";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { renderClient } from "..";
import "./index.css";

jest.setTimeout(30000);

expect.extend({ toMatchImageSnapshot });

describe("chromium renderClient", () => {
  test("should render button", async () => {
    const image = await renderClient(
      path.resolve(__dirname, "../../examples/button.tsx"),
      { browser: "chromium" }
    );
    expect(image).toMatchImageSnapshot();
  });
});

describe("webkit renderClient", () => {
  test("should render button", async () => {
    const image = await renderClient(
      path.resolve(__dirname, "../../examples/button.tsx"),
      { browser: "webkit" }
    );
    expect(image).toMatchImageSnapshot();
  });
});

describe("firefox renderClient", () => {
  test("should render button", async () => {
    const image = await renderClient(
      path.resolve(__dirname, "../../examples/button.tsx"),
      { browser: "firefox" }
    );
    expect(image).toMatchImageSnapshot();
  });
});
