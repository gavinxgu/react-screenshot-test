import path from "path";
import { createViteComponentServer } from "../components-server";

const paths = [
  path.resolve(__dirname, "../../examples/button.tsx"),
  path.resolve(__dirname, "../../examples/box.tsx"),
];

console.log(paths);

createViteComponentServer(37683, {
  componentFilePath: paths,
});
