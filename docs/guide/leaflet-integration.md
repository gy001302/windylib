# Leaflet 接入

Leaflet 目前通过 overlay canvas 的方式接入 `TriangleLayer`。

这条链路的职责分工很清晰：

- `LeafletMapAdapter`：把 Leaflet 地图 API 规整成统一适配器
- `LeafletCanvasHost`：创建并管理地图上方的 canvas
- `CanvasOverlayRendererHost`：负责 WebGL2 设备与渲染调度
- `TriangleLayer`：真正执行三角形绘制

## 渲染链路

整体流程如下：

1. 创建 Leaflet 地图
2. 创建 `LeafletMapAdapter`
3. 创建 `LeafletCanvasHost`
4. 创建 `TriangleLayer`
5. 用 `CanvasOverlayRendererHost` 把 host 和 layer 连接起来

## 示例

```js
import L from 'leaflet'
import { CanvasOverlayRendererHost } from '@windylib/core'
import { TriangleLayer } from '@windylib/layers'
import { LeafletCanvasHost, LeafletMapAdapter } from '@windylib/maps-leaflet'

const map = L.map(container, {
  center: [35.0, 116.0],
  zoom: 5,
})

const canvasHost = new LeafletCanvasHost({
  map,
  mapAdapter: new LeafletMapAdapter(map),
})

const layer = new TriangleLayer({
  id: 'leaflet-triangle',
  vertices: [
    [116.38, 39.9, 1],
    [121.47, 31.23, 1],
    [113.26, 23.13, 1],
  ],
  color: [255, 111, 60, 220],
  subdivisionSteps: 24,
})

const rendererHost = new CanvasOverlayRendererHost({
  canvasHost,
  renderer: layer,
})

await rendererHost.attach()
```

## 更新数据

Leaflet 侧更新通常只需要：

```js
layer.setProps({
  vertices: nextVertices,
  color: nextColor,
})

rendererHost.invalidate()
```

## 优点

- 宿主接入逻辑简单
- 不依赖 Leaflet 原生 WebGL 图层系统
- 适合快速实验和视觉验证

## 限制

- 绘制发生在 overlay canvas，而不是底图内部
- 与地图自身图层的深度关系比较弱
- 更复杂的合成效果需要额外设计
