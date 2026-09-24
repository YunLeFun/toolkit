# YunLeFun Toolkit

云乐坊的公共工具箱，集中维护可公开复用的协议、类型定义和 npm 包。每个包独立版本化；随包演进的契约说明放在本仓库 `docs/`。

## Packages

| 包 | 用途 |
| --- | --- |
| [`@yunlefun/assets`](./packages/assets/) | 第一方应用的素材 schema、HTTP 客户端与 Picker 消息协议；[npm 0.1.0](https://www.npmjs.com/package/@yunlefun/assets) |
| [`@yunlefun/utils`](./packages/utils/) | 通用工具函数 |
| [`@yunlefun/vueuse`](./packages/vueuse/) | Vue Composition API 工具 |

[`@yunlefun/assets` 契约说明](./docs/assets/README.md)与包源码在同一个仓库，便于按版本核对。公开包只包含客户端契约；使用云乐坊服务仍需相应应用的注册和授权。

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## License

[MIT](./LICENSE)
