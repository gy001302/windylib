# 架构设计

WindyLib 的核心思路是：共享图层实现，加上尽量薄的地图接入层。

## 共享图层

`TriangleLayer` 是统一的三角形渲染实现。

它负责：

- 三角网格生成
- 顶点与片元 shader 组织
- 几何 buffer 管理
- 直接向宿主渲染目标输出

它的关键设计点是：

- 对地图框架本身尽量少感知
- 把“怎么画三角形”和“怎么挂到地图上”拆开
- 允许同一个图层对象被不同宿主复用

## 效果图层

`TriangleMultiPassLayer` 继承自 `TriangleLayer`。

它额外提供：

- 离屏渲染
- 后处理 pass 编排
- 通过全屏 pass 实现反色效果

## 地图接入层

地图相关包只负责宿主接入，不再维护单独的三角形实现。

这也是当前架构最重要的约束：

- `core` 不负责具体地图框架
- `layers` 不负责创建地图实例
- `maps/*` 不再重复实现三角形绘制

### Leaflet

- `LeafletCanvasHost`
- `LeafletMapAdapter`

Leaflet 通过 overlay canvas host 承载渲染，再由 `TriangleLayer` 输出到这个上下文。

### MapLibre

- `MapLibreLayerHost`
- `MapLibreCameraSync`
- projection 相关工具

MapLibre 通过 custom layer 的方式接入，让 `TriangleLayer` 或 `TriangleMultiPassLayer` 参与地图渲染生命周期。

## 为什么这样拆

这样拆的直接收益有三个：

### 1. 逻辑复用

同一套三角形绘制逻辑可以复用到多个地图框架。

### 2. 调试更清晰

出现问题时更容易判断是：

- 图层逻辑问题
- 地图宿主问题
- shader 问题
- multipass 问题

### 3. 后续扩展更稳

以后如果要接入新的地图框架，原则上只需要新建一个 `maps/*` 宿主层，而不是再复制一遍图层实现。
