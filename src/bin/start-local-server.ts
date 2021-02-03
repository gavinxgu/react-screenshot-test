import { createScreenshotServer } from "../screenshot-server";

createScreenshotServer({
  port: Number(process.env.PORT || 3001),
}).then((cleanup) => {
  process.on("beforeExit", () => {
    cleanup();
  });
});
