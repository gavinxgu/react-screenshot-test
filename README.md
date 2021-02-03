# @gavinxgu/react-screenshot-test

To Solve 2 Problem

- Component client feature test
- E2E

## How to use

```tsx
import { render } from '@gavinxgu/react-screenshot-test'

describe('Screenshot test', () => {
  it('should render correctly', () => {
    const { page } = render(<Badge dot>{'999'}</Badge>)
  })
})
```

## 思路

- docker 运行 screenshot server 负责浏览器操作
- 本地测试运行 component server 负责提供组件测试界面
