import path from "path";
import express from "express";
import { Server } from "http";
import { promisify } from "util";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import VirtualModulesPlugin from "webpack-virtual-modules";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import { createServer, Plugin } from "vite";
import { readRecordedCss, recordCss } from "./recorded-css";
import { isEnvDevelopment, isEnvProduction, isEnvTest } from "./const";
import { logger } from "./logger";
import { ReactElement } from "react";
import { renderToString } from "react-dom/server";

export async function createSSRComponentServer(
  port: number,
  {
    ui,
  }: {
    ui: ReactElement;
  }
) {
  const app = express();
  app.get("/", (_, res) => {
    try {
      res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>React Screenshot Test</title>
        <style type="text/css">${readRecordedCss()}</style>
      </head>
      <body>
        ${renderToString(ui)}
      </body>
    </html>
        `);
    } catch (err) {
      res.status(400);
      res.send({
        message: err.message,
      });
    }
  });

  function appStart() {
    return new Promise<Server>((resolve, reject) => {
      const server = app.listen(port, "127.0.0.1", () => {
        resolve(server);
      });
    });
  }

  const server = await appStart();

  return async () => {
    const closeServer = promisify(server.close.bind(server));
    await closeServer();
  };
}

export async function createWebpackComponentServer(
  port: number,
  {
    componentFilePath,
  }: {
    componentFilePath: string;
  }
) {
  const { dir, name } = path.parse(componentFilePath);
  const entryFile = path.format({
    dir,
    name: name + ".entry",
    ext: ".tsx",
  });
  const virtualModules = new VirtualModulesPlugin({
    [entryFile]: `
import React from 'react'
import { render } from 'react-dom'
import Component from '${path.join(dir, name)}'

render(<Component />, document.getElementById('root'))
    `,
  });

  const opts: {
    runtime: "automatic" | "classic";
  } = {
    runtime: "classic",
  };

  const compiler = webpack({
    stats: "errors-only",
    entry: {
      main: entryFile,
    },
    mode:
      isEnvDevelopment || isEnvTest
        ? "development"
        : isEnvProduction
        ? "production"
        : "none",
    resolve: {
      extensions: [...DEFAULT_EXTENSIONS, ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  require("@babel/preset-env").default,
                  {
                    // Allow importing core-js in entrypoint and use browserlist to select polyfills
                    useBuiltIns: "entry",
                    // Set the corejs version we are using to avoid warnings in console
                    corejs: 3,
                    // Exclude transforms that make all code slower
                    exclude: ["transform-typeof-symbol"],
                  },
                ],
                [
                  require("@babel/preset-react").default,
                  {
                    // Adds component stack to warning messages
                    // Adds __self attribute to JSX which React will use for some warnings
                    development: isEnvDevelopment || isEnvTest,
                    // Will use the native built-in instead of trying to polyfill
                    // behavior for any plugins that require one.
                    ...(opts.runtime !== "automatic"
                      ? { useBuiltIns: true }
                      : {}),
                    runtime: opts.runtime || "classic",
                  },
                ],
                [require("@babel/preset-typescript").default],
              ],
              plugins: [require("@babel/plugin-proposal-class-properties")],
            },
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        templateContent: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>React Screenshot Test</title>
    <style type="text/css">${readRecordedCss()}</style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
      }),
      virtualModules,
    ],
  });

  const app = new WebpackDevServer(compiler, {
    open: false,
    clientLogLevel: "none",
    stats: "errors-only",
    liveReload: false,
    noInfo: true,
  });

  function appStart() {
    return new Promise<Server>((resolve, reject) => {
      const server = app.listen(port, "127.0.0.1", (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(server);
      });
    });
  }

  logger.time("appStart");
  await appStart();
  logger.timeEnd("appStart");

  const cleanup = async () => {
    const closeCompiler = promisify(compiler.close.bind(compiler));
    const closeApp = promisify(app.close.bind(app));
    await closeCompiler();
    await closeApp();
  };

  return cleanup;
}

export async function createViteComponentServer(
  port: number,
  {
    componentFilePath,
  }: {
    componentFilePath: string;
  }
) {
  const { dir, name } = path.parse(componentFilePath);
  const entryFile = `/src/${name}.virtual.tsx`;
  const virtualFilePlugin = ({
    fileId,
    content,
  }: {
    fileId: string;
    content: string;
  }): Plugin => {
    return {
      name: "virtual-file-plugin", // required, will show up in warnings and errors
      resolveId(id) {
        // console.log("resolveId", id);
        if (id === fileId) {
          return fileId;
        }
      },
      load(id) {
        // console.log("load", id);
        if (id === fileId) {
          return content;
        }
      },
    };
  };

  const htmlPlugin = ({ entryID }: { entryID: string }): Plugin => {
    return {
      name: "html-plugin",
      transformIndexHtml(html) {
        return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>React Screenshot Test</title>
    <style type="text/css">${readRecordedCss()}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${entryID}"></script>
  </body>
</html>`;
      },
    };
  };

  // console.log(entryFile, path.join(dir, name));

  const server = await createServer({
    configFile: false,
    clearScreen: false,
    root: path.resolve(__dirname, "../public"),
    plugins: [
      htmlPlugin({
        entryID: entryFile,
      }),
      virtualFilePlugin({
        fileId: entryFile,
        content: `
import React from 'react'
import { render } from 'react-dom'
import Component from '${path.join(dir, name)}'

render(<Component />, document.getElementById('root'))`,
      }),
    ],
    server: {
      port,
    },
  });
  await server.listen();

  return async () => {
    await server.close();
  };
}
