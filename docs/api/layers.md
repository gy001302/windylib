# `@windylib/layers`

对应 `packages/layers/src/index.js` 中的公开导出。

这是图层实现层，不是最高层的用户接入 API。

如果你的目标只是“把三角形图层挂到地图上”，更推荐优先看：

- `@windylib/maps-maplibre` 的 `MapLibreTriangleHost`
- `@windylib/maps-leaflet` 的宿主接入说明

## `TriangleMultiPassLayer`

当前唯一的公开三角形图层。

它统一了：

- 三角形几何生成
- shader 驱动的绘制
- shared WebGL 模式
- overlay canvas 模式
- 可选的后处理 pass

底层实例化示例：

```js
import { TriangleMultiPassLayer } from '@windylib/layers'

const layer = new TriangleMultiPassLayer({
  id: 'triangle-multipass',
  vertices: [
    [116.38, 39.9, 1],
    [121.47, 31.23, 1],
    [113.26, 23.13, 1],
  ],
  color: [255, 111, 60, 220],
  invertEnabled: true,
})
```

这段代码表示的是图层对象本身，不是完整的地图接入示例。

关键点：

- `vertices` 是核心输入
- `invertEnabled` 决定是否启用反色后处理
- `projectPosition` 决定地理坐标如何映射到渲染坐标
- `vertexShader` / `fragmentShader` 允许覆盖默认 shader
- `onShaderStateChange` 和 `onPassStateChange` 适合做调试
