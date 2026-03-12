# WindyLib

WindyLib 是一套面向地图场景的三角形叠加渲染库。

当前主要提供：

- `@windylib/core`：共享渲染基础设施
- `@windylib/layers`：可复用图层
- `@windylib/maps-leaflet`：Leaflet 适配层
- `@windylib/maps-maplibre`：MapLibre 适配层

## 从这里开始

- [快速开始](./guide/getting-started)
- [架构设计](./guide/architecture)
- [TriangleLayer 使用](./guide/triangle-layer)
- [Leaflet 接入](./guide/leaflet-integration)
- [MapLibre 接入](./guide/maplibre-integration)
- [API 总览](./api/overview)

## 当前方向

当前的核心抽象是 `TriangleLayer`。

- `TriangleLayer` 是统一的三角形渲染实现
- `TriangleMultiPassLayer` 在其上扩展后处理能力，例如反色
- 地图包只负责宿主和适配，不再各自维护一套三角形实现

## 推荐阅读路径

如果你是第一次接触这个仓库，建议按这个顺序读：

1. [快速开始](./guide/getting-started)
2. [架构设计](./guide/architecture)
3. [TriangleLayer 使用](./guide/triangle-layer)
4. [Leaflet 接入](./guide/leaflet-integration) 或 [MapLibre 接入](./guide/maplibre-integration)
5. [API 总览](./api/overview)
