import path from "path";
import { createViteComponentServer } from "../components-server";

createViteComponentServer(37683, {
  componentFilePath: path.resolve(__dirname, "../../examples/button.tsx"),
});
