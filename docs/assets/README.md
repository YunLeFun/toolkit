# 素材库公开契约

本目录随 `@yunlefun/assets` 版本维护云乐坊第一方应用可依赖的素材契约。包提供 Zod schema、TypeScript 类型、HTTP 客户端和 Picker 消息协议；Drive 服务端负责认证、授权、存储和素材生命周期。公开契约不代表第三方应用可直接接入；使用服务需要事先登记应用与所需权限。

## HTTP API

`createAssetClient` 的 `baseUrl` 为 `/api/v1/library`，资源路径从 `/assets` 开始。旧 `/api/v1/assets` 是独立的兼容接口，不使用此包的响应 schema。

| 方法 | 相对路径 | 客户端方法 |
| --- | --- | --- |
| GET | `/assets` | `listAssets` |
| GET | `/assets/:assetId` | `getAsset` |
| POST | `/assets/uploads` | `createUpload` |
| POST | `/assets/uploads/:uploadId/complete` | `completeUpload` |
| PATCH | `/assets/:assetId` | `updateAsset` |
| POST | `/assets/:assetId/trash` | `trashAsset` |
| POST | `/assets/:assetId/restore` | `restoreAsset` |
| POST | `/assets/:assetId/access` | `createAccess` |
| DELETE | `/assets/:assetId` | `purgeAsset` |
| PUT | `/asset-usages/:consumerAppId/:resourceType/:resourceId` | `replaceUsages` |

输入与输出的权威定义在 [`schemas.ts`](../../packages/assets/src/schemas.ts)。客户端解析成功响应及 `{ error }` 失败响应，不自动重试。写入请求生成 `Idempotency-Key`；需要重试同一次操作时，调用方应通过 `headers` 提供原键。会话写入还需要应用提供 CSRF token。列表以 `nextCursor === null` 判断结束，空页仍可能有下一游标。

上传接口只返回短期精确对象 PUT 能力或去重结果；图片字节不经过客户端包或素材 API。签名预览和下载 URL 仅在鉴权后短期签发，不应持久保存。`assetId + sha256` 是消费者保存的稳定引用，名称与标签不参与内容身份。

## Picker v1

`openAssetPicker` 打开 Drive 的 `/picker`，在查询参数中传递已登记 `appId`、调用方精确 `origin`、随机 `requestId` 和 MIME 限制。Drive 只向核准的来源发送版本为 `1` 的 `postMessage`。成功响应包含 `assetId`、`sha256`、`requestId`；失败响应包含错误码与消息。协议的权威 schema 在 [`schemas.ts`](../../packages/assets/src/schemas.ts)。

客户端同时验证弹窗窗口引用、Drive 来源、`requestId` 和消息 schema。消费者收到选择结果后，仍需由自己的服务端核对素材权限；消息中不包含签名 URL 或长期凭据。

## 版本与发布

当前源码版本为 `0.1.0`，尚未发布 npm。协议变更与包版本一起提交；Drive 应在 npm 首发且契约测试通过后改为依赖发布版。在切换前，Drive 的工作区副本是运行时来源，两个副本的协议变更须同步核对。
