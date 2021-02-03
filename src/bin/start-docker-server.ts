import { createDockerScreenshotServer } from "../screenshot-server";

createDockerScreenshotServer({ port: 3001 }).then((cleanup) => {
  setInterval(function () {
    console.log("timer that keeps nodejs processing running");
  }, 1000 * 60 * 60);

  process.on("beforeExit", () => {
    cleanup();
  });
});
