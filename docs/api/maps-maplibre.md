# `@windylib/maps-maplibre`

对应 `packages/maps/maplibre/src/index.js` 中的公开导出。

这个包负责 MapLibre 侧的宿主、相机同步和投影工具。

## `MapLibreLayerHost`

创建 MapLibre 地图实例，并把可渲染图层挂进去。

最小职责：

- 创建地图
- 控制初始视角
- 在 `load` 后把 layer 加到地图里
- 在 props 变化时同步中心点、缩放和图层 props

## `MapLibreCameraSync`

把 MapLibre 相机状态同步到共享相机服务。

适合这些场景：

- 需要把地图相机状态转成统一 camera 对象
- 需要做地图和自定义 3D 相机联动
- 需要在调试界面里观察相机状态

## `createMapLibreCameraState(map, options)`

根据 MapLibre 地图实例构建标准化的相机状态快照。

返回值里包括：

- 地图中心点
- zoom / pitch / bearing
- viewport
- camera 的 `position / target / up`

## `createMapLibreMercatorProjector()`

返回一个将经纬度投影到 Mercator 坐标的辅助函数。

它通常会直接传给 `TriangleLayer` 或 `TriangleMultiPassLayer` 的 `projectPosition`。

## `getMapCenter(vertices)`

根据三角形顶点计算中心点。

## `projectLngLatToMercator(position)`

把单个地理坐标点投影到 Mercator 坐标。

## `toColorArray(hex, alpha)`

把十六进制颜色和 alpha 转成 RGBA 数组。

示例：

```js
toColorArray('#ff6f3c', 0.86)
// => [255, 111, 60, 219]
```
