import axios from "axios";
import { PageCreateBody, PageScreenshotBody } from "./interface";

export function createScreehotClient({ port }: { port: number }) {
  const serverHost = `http://localhost:${port}`;
  return {
    createPage: (payload: PageCreateBody) =>
      axios.post<{ id: number }>(`${serverHost}/page`, payload),
    screenshot: (id: number, payload: PageScreenshotBody) =>
      axios.post<ArrayBuffer>(`${serverHost}/page/${id}/_screenshot`, payload, {
        responseType: "arraybuffer",
      }),
    closePage: (id: number) => axios.delete(`${serverHost}/page/${id}`),
  };
}
