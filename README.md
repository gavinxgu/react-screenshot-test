# @gux/react-screenshot-test

To Solve 2 Problem

- Component client feature test
- E2E

## How to use

```tsx
import { render } from "@gux/react-screenshot-test";

describe("Screenshot test", () => {
  it("should render correctly", () => {
    const { page } = render(<Badge dot>{"999"}</Badge>);
  });
});
```

## 思路

- docker 运行 screenshot server 负责浏览器操作
- 本地测试运行 component server 负责提供组件测试界面

## Develop

```bash
# 启动 debug docker container
make docker_server_debug
# 启动 tsc
yarn build -w
# 测试
make test_debug
```

如果需要测试 docker server 则 build 镜像以后，直接测试即可

```
bash docker-build.sh
yarn test
```
