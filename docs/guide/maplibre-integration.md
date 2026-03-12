# MapLibre 接入

MapLibre 当前推荐通过高阶宿主 `MapLibreTriangleHost` 接入。

这页文档优先对应当前 Storybook 示例：

- `Maps/DeckGL Triangle MultiPass`
- `Foundations/Triangle Lifecycle`

这条链路更贴近地图本身的渲染生命周期。

## 关键对象

- `MapLibreTriangleHost`
- `MapLibreLayerHost`
- `TriangleMultiPassLayer`
- `MapLibreCameraSync`
- `createMapLibreMercatorProjector`

## 推荐示例

```js
import { MapLibreTriangleHost } from '@windylib/maps-maplibre'

const host = new MapLibreTriangleHost({
  container,
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

相比底层拼装方式，这个 API 已经帮你处理了：

- `TriangleMultiPassLayer` 的创建
- `createMapLibreMercatorProjector()` 的调用
- `projectPosition` 注入
- 十六进制颜色到 RGBA 数组的转换

## 为什么 MapLibre 侧更适合 multipass

因为 MapLibre 这条链路天然具备：

- 稳定的共享 WebGL 渲染上下文
- 更完整的绘制生命周期
- 更适合使用 framebuffer 和 post-processing pass

所以像 `TriangleMultiPassLayer` 这种效果图层，放在 MapLibre 上通常更自然。

## 启用多 pass

```js
import { MapLibreTriangleHost } from '@windylib/maps-maplibre'

const host = new MapLibreTriangleHost({
  container,
  id: 'triangle-multipass',
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
```

## 什么时候看底层 API

如果你只是想把三角形图层放到 MapLibre 上，优先看 `MapLibreTriangleHost`。

如果你需要以下能力，再继续看底层接口：

- 自定义 layer class
- 自定义投影函数
- 自定义 shader 组装
- 观测更底层的 pass 生命周期

这时再看：

- `MapLibreLayerHost`
- `TriangleMultiPassLayer`
- `createMapLibreMercatorProjector`

## 相机同步

如果你的业务还需要把地图相机状态同步到共享相机服务，可以使用 `MapLibreCameraSync`。

它会把以下状态归一化出来：

- center
- zoom
- bearing
- pitch
- viewport
- camera position / target / up

这对后续做统一 camera 体系或 3D 视角联动很有用。
