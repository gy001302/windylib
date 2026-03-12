# 快速开始

## 安装依赖

当前仓库使用 `pnpm workspace`。

```bash
pnpm install
```

## 启动 Storybook

```bash
pnpm storybook
```

## 启动文档站

```bash
pnpm docs:dev
```

默认地址：

```text
http://localhost:5173/
```

## 构建全部包

```bash
pnpm build
```

如果只想构建某一部分：

```bash
pnpm build:core
pnpm build:layers
pnpm build:storybook
```

## 仓库结构

- `packages/core`：渲染基础设施与公共能力
- `packages/layers`：通用图层实现
- `packages/maps/leaflet`：Leaflet 适配器与 canvas host
- `packages/maps/maplibre`：MapLibre host 与工具函数
- `storybook`：示例与可视化验证环境

## 推荐的理解顺序

如果你的目标是尽快理解项目，建议这样看：

1. 先看 `packages/layers`
2. 再看 `packages/maps/leaflet` 和 `packages/maps/maplibre`
3. 最后看 `packages/core`

原因是：

- `layers` 更贴近“你最终要用什么”
- `maps/*` 解释“怎么接入到具体地图框架”
- `core` 更偏基础设施和渲染机制
