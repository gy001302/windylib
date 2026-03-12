# `@windylib/layers`

对应 `packages/layers/src/index.js` 中的公开导出。

这是最接近业务使用层的一组 API。

如果你的目标是：

- 在地图上叠加一个三角形区域
- 调整颜色或 shader
- 启用基础后处理

通常从这个包开始就够了。

## `TriangleLayer`

统一的三角形图层实现。

当你希望同一套三角形绘制逻辑可以挂到不同地图宿主上时，优先使用它。

它负责：

- 三角形几何生成
- 基于 shader 的渲染
- 共享地图上下文里的直接渲染
- canvas overlay 模式下的投影渲染

典型用法：

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

最小示例：

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
