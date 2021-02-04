import Docker from "dockerode";
import pkg from "../package.json";

export async function createDockerScreenshotServer({ port }: { port: number }) {
  const DOCKER_IMAGE_TAG_NAME = "gavinxgu/react-screenshot-test";
  const DOCKER_IMAGE_VERSION = pkg.version;
  const DOCKER_IMAGE_TAG = `${DOCKER_IMAGE_TAG_NAME}:${DOCKER_IMAGE_VERSION}`;
  const DOCKER_INTERNAL_PORT = 3001;

  async function ensureDockerImagePresent(docker: Docker) {
    const images = await docker.listImages({
      filters: {
        reference: {
          [DOCKER_IMAGE_TAG]: true,
        },
      },
    });
    if (images.length === 0) {
      throw new Error(
        `It looks like you're missing the Docker image required to render screenshots.\n\nPlease run the following command:\n\n$ docker pull ${DOCKER_IMAGE_TAG}\n\n`
      );
    }
  }

  async function removeLeftoverContainers(docker: Docker) {
    const existingContainers = await docker.listContainers();
    for (const existingContainerInfo of existingContainers) {
      const [name] = existingContainerInfo.Image.split(":");
      if (name === DOCKER_IMAGE_TAG_NAME) {
        // eslint-disable-next-line no-await-in-loop
        const existingContainer = await docker.getContainer(
          existingContainerInfo.Id
        );
        if (existingContainerInfo.State === "running") {
          // eslint-disable-next-line no-await-in-loop
          await existingContainer.stop();
        }
        // eslint-disable-next-line no-await-in-loop
        await existingContainer.remove();
      }
    }
  }

  const docker = new Docker({
    socketPath:
      process.platform === "win32"
        ? "//./pipe/docker_engine"
        : "/var/run/docker.sock",
  });

  await ensureDockerImagePresent(docker);

  await removeLeftoverContainers(docker);

  // hostConfig
  let hostConfig: Docker.ContainerCreateOptions["HostConfig"] = {
    PortBindings: {
      [`${DOCKER_INTERNAL_PORT}/tcp`]: [{ HostPort: `${port}` }],
    },
  };
  if (process.platform === "linux") {
    hostConfig = {
      NetworkMode: "host",
    };
  }

  const container = await docker.createContainer({
    Image: DOCKER_IMAGE_TAG,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    OpenStdin: false,
    StdinOnce: false,
    ExposedPorts: {
      [`${DOCKER_INTERNAL_PORT}/tcp`]: {},
    },
    Env: [`PORT=${DOCKER_INTERNAL_PORT}`, `NODE_ENV=${process.env.NODE_ENV}`],
    HostConfig: hostConfig,
  });

  await container.start();

  const stream = await container.logs({
    stdout: true,
    stderr: true,
    follow: true,
  });

  await new Promise<void>((resolve) => {
    stream.on("data", (message) => {
      console.log(message.toString());
      if (message.toString().indexOf("listening at") > -1) {
        resolve();
      }
    });
  });

  return async () => {
    await container.kill();
    await container.remove();
  };
}
