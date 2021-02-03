import path from "path";
import { Server } from "http";
import { promisify } from "util";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import VirtualModulesPlugin from "webpack-virtual-modules";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import { readRecordedCss } from "./recorded-css";
import { isEnvDevelopment, isEnvProduction, isEnvTest } from "./const";
import { logger } from "./logger";

export async function createWebpackComponentServer({
  port,
  componentFilePath,
}: {
  port: number;
  componentFilePath: string;
}) {
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
    const compilerClose = promisify(compiler.close.bind(compiler));
    const appClose = promisify(app.close.bind(app));
    logger.time("compilerClose");
    await compilerClose();
    logger.timeEnd("compilerClose");
    await appClose();
  };

  return cleanup;
}
