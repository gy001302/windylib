# `@windylib/maps-leaflet`

对应 `packages/maps/leaflet/src/index.js` 中的公开导出。

这个包的定位不是提供视觉图层，而是提供 Leaflet 侧的宿主接入能力。

## `LeafletMapAdapter`

把 Leaflet 地图 API 规整成更适合渲染流程使用的适配器。

主要提供：

- 投影点转换
- 视图状态读取
- 地图尺寸读取
- 渲染失效通知

你可以把它理解为：

- 对 Leaflet 原生 API 的一层轻量包装
- 给渲染层提供统一输入

## `LEAFLET_EVENT_NAMES`

适配器默认监听的一组事件，用于触发重绘。

## `LeafletCanvasHost`

创建并持有位于 Leaflet 地图之上的 overlay canvas。

典型用法：

```js
import { LeafletCanvasHost, LeafletMapAdapter } from '@windylib/maps-leaflet'

const host = new LeafletCanvasHost({
  map,
  mapAdapter: new LeafletMapAdapter(map),
})
```

当它与 `CanvasOverlayRendererHost` 搭配时，就可以承载 `TriangleLayer` 的渲染输出。
