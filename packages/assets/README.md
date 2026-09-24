# `@yunlefun/assets`

云乐坊第一方应用的素材契约包，提供 Zod schema、TypeScript 类型、HTTP 客户端与 Picker 消息校验。源码与[版本化契约说明](../../docs/assets/README.md)一同维护。

> 当前包尚未发布到 npm。Drive 仍使用其工作区内的同版本实现；切换到本包需等首次发布并验证兼容性。

包不包含 CloudBase、COS、管理员能力或凭据。应用必须由 Drive 注册并授权；公开包本身不授予素材服务访问权。

## Usage

发布后可从 npm 安装：

```bash
pnpm add @yunlefun/assets
```

```ts
import { createAssetClient, openAssetPicker } from '@yunlefun/assets'

const assets = createAssetClient({
  baseUrl: 'https://drive.yunle.fun/api/v1/library',
  headers: () => ({ 'x-csrf-token': csrfToken }),
})

const page = await assets.listAssets({ limit: 30 })
const selected = await openAssetPicker({
  appId: 'your-registered-app-id',
  driveOrigin: 'https://drive.yunle.fun',
})
```

`selected` 只包含 `assetId` 和 `sha256` 等选择结果。消费者应在自己的服务端重新鉴权，再获取短期预览或下载能力。上例中的 CSRF 值应由应用自身会话流程提供。

## License

[MIT](./LICENSE)
