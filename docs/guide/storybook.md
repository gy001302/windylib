# Storybook

Storybook 是当前仓库里查看渲染结果最快的方式。

## 启动

```bash
pnpm storybook
```

## 当前示例

- Leaflet 三角形叠加层
- MapLibre 多 pass 三角形渲染
- MapLibre 相机同步
- 三角形生命周期观测

## 为什么这里需要 Storybook

当前包 API 还在演进中，Storybook 最适合做这些验证：

- 投影行为
- shader 改动
- 多 pass 渲染
- 相机同步
