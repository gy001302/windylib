# `@windylib/layers`

对应 `packages/layers/src/index.js` 中的公开导出。

这是图层实现层，不是最高层的用户接入 API。

如果你的目标只是“把三角形图层挂到地图上”，更推荐优先看：

- `@windylib/maps-maplibre` 的 `MapLibreTriangleHost`
- `@windylib/maps-leaflet` 的宿主接入说明

当你需要更底层的控制能力时，再回到这个包。

## `TriangleLayer`

统一的三角形图层实现。

当你希望同一套三角形绘制逻辑可以挂到不同地图宿主上时，优先使用它。

它负责：

- 三角形几何生成
- 基于 shader 的渲染
- 共享地图上下文里的直接渲染
- canvas overlay 模式下的投影渲染

底层实例化示例：

```js
import { TriangleLayer } from '@windylib/layers'

const layer = new TriangleLayer({
  id: 'triangle-layer',
  vertices: [
    [116.38, 39.9, 1],
    [121.47, 31.23, 1],
    [113.26, 23.13, 1],
  ],
  color: [255, 111, 60, 220],
  subdivisionSteps: 24,
})
```

这段代码只表示“图层对象如何创建”，不是一个可直接运行的完整接入示例。

关键点：

- `vertices` 是核心输入
- `projectPosition` 决定了输入地理坐标如何映射到渲染坐标
- `vertexShader` / `fragmentShader` 允许你覆盖默认 shader
- `onShaderStateChange` 适合做调试 UI 或日志

## `TriangleMultiPassLayer`

`TriangleLayer` 的扩展版本，增加 multipass 后处理能力。

当前内置能力：

- 通过离屏 pass 与全屏后处理 pass 实现反色渲染

更适合这些场景：

- 需要后处理效果
- 需要观察 pass 生命周期
- 需要为后续更多效果做实验

底层实例化示例：

```js
import { TriangleMultiPassLayer } from '@windylib/layers'

const layer = new TriangleMultiPassLayer({
  id: 'triangle-multipass',
  vertices,
  color: [255, 111, 60, 220],
  projectPosition,
  invertEnabled: true,
})
```

同样地，这段代码表示的是图层对象本身，不是完整的地图接入示例。
