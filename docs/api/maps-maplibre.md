# `@windylib/maps-maplibre`

对应 `packages/maps/maplibre/src/index.js` 中的公开导出。

这个包负责 MapLibre 侧的宿主、相机同步和投影工具。

## `MapLibreTriangleHost`

推荐优先使用的高阶 API。

它适合直接给业务接入用，目标是让用户不必手动拼这些内部件：

- `MapLibreLayerHost`
- `TriangleMultiPassLayer`
- `createMapLibreMercatorProjector()`
- `toColorArray()`

最小示例：

```js
import * as maplibregl from 'maplibre-gl'
import { MapLibreTriangleHost } from '@windylib/maps-maplibre'

const map = new maplibregl.Map({
  container,
  style: 'https://demotiles.maplibre.org/style.json',
  center: [117.0367, 31.42],
  zoom: 4.2,
})

const host = new MapLibreTriangleHost({
  map,
  id: 'triangle-layer',
  vertices: [
    [116.38, 39.9, 1],
    [121.47, 31.23, 1],
    [113.26, 23.13, 1],
  ],
  zoom: 4.2,
  color: '#ff6f3c',
  alpha: 0.86,
  invertEnabled: true,
})

host.attach()
```

## `createMapLibreTriangleHost(options)`

`MapLibreTriangleHost` 的工厂函数版本。

## `MapLibreLayerHost`

消费已有的 MapLibre 地图实例，并把可渲染图层挂进去。

最小职责：

- 控制初始视角
- 在 `load` 后把 layer 加到地图里
- 在 props 变化时同步中心点、缩放和图层 props

这个类更适合高级扩展，不适合作为普通用户的首选入口。

## `MapLibreCameraSync`

把 MapLibre 相机状态同步到共享相机服务。

适合这些场景：

- 需要把地图相机状态转成统一 camera 对象
- 需要做地图和自定义 3D 相机联动
- 需要在调试界面里观察相机状态

## `createMapLibreMercatorProjector()`

返回一个将经纬度投影到 Mercator 坐标的辅助函数。

它通常会直接传给底层 `TriangleMultiPassLayer` 的 `projectPosition`。

如果你直接使用 `MapLibreTriangleHost`，通常不需要自己处理它。

## `toColorArray(hex, alpha)`

把十六进制颜色和 alpha 转成 RGBA 数组。

示例：

```js
toColorArray('#ff6f3c', 0.86)
// => [255, 111, 60, 219]
```
