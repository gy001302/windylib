# MapLibre 接入

MapLibre 目前通过 custom layer 风格的宿主接入 `TriangleLayer` 与 `TriangleMultiPassLayer`。

这条链路更贴近地图本身的渲染生命周期。

## 关键对象

- `MapLibreLayerHost`
- `TriangleLayer`
- `TriangleMultiPassLayer`
- `MapLibreCameraSync`
- `createMapLibreMercatorProjector`

## 最小示例

```js
import {
  MapLibreLayerHost,
  createMapLibreMercatorProjector,
} from '@windylib/maps-maplibre'
import { TriangleLayer } from '@windylib/layers'

const projector = createMapLibreMercatorProjector()

const host = new MapLibreLayerHost({
  container,
  initialProps: {
    vertices: [
      [116.38, 39.9, 1],
      [121.47, 31.23, 1],
      [113.26, 23.13, 1],
    ],
    zoom: 4.2,
    color: [255, 111, 60, 220],
  },
  createLayer: (props) => new TriangleLayer({
    id: 'maplibre-triangle',
    vertices: props.vertices,
    color: props.color,
    projectPosition: projector,
  }),
})

host.attach()
```

## 为什么 MapLibre 侧更适合 multipass

因为 MapLibre 这条链路天然具备：

- 稳定的共享 WebGL 渲染上下文
- 更完整的绘制生命周期
- 更适合使用 framebuffer 和 post-processing pass

所以像 `TriangleMultiPassLayer` 这种效果图层，放在 MapLibre 上通常更自然。

## 启用多 pass

```js
import { TriangleMultiPassLayer } from '@windylib/layers'

createLayer: (props) => new TriangleMultiPassLayer({
  id: 'triangle-multipass',
  vertices: props.vertices,
  color: props.color,
  projectPosition: projector,
  invertEnabled: true,
})
```

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
