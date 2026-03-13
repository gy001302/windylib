# Triangle 图层

`TriangleMultiPassLayer` 是当前仓库唯一的公开三角形图层。

它统一了两类能力：

- 基础三角形绘制
- 可选的后处理 pass，例如反色

同一个类可以挂到：

- Leaflet overlay canvas
- MapLibre shared WebGL

## 常用属性

- `id`：图层唯一标识
- `vertices`：三个输入顶点，格式为 `[lng, lat, z]`
- `color`：RGBA 数组，范围 `0-255`
- `subdivisionSteps`：三角形细分等级
- `invertEnabled`：是否启用反色 pass
- `vertexShader`：自定义顶点 shader
- `fragmentShader`：自定义片元 shader
- `projectPosition`：将输入坐标投影到渲染坐标的函数
- `onShaderStateChange`：观察 shader 编译和绘制状态
- `onPassStateChange`：观察 pass 是否进入 render 阶段

## 输入数据

```js
const vertices = [
  [116.38, 39.9, 1],
  [121.47, 31.23, 1],
  [113.26, 23.13, 1],
]
```

WindyLib 会基于这 3 个点生成细分后的三角网格。

## 最小实例化示例

```js
import { TriangleMultiPassLayer } from '@windylib/layers'

const layer = new TriangleMultiPassLayer({
  id: 'triangle-layer',
  vertices,
  color: [255, 111, 60, 220],
  subdivisionSteps: 24,
})
```

这段代码只表示“图层对象如何创建”，不是完整接入示例。

## 运行方式

### 1. 直接绘制

当 `invertEnabled = false` 时，图层会直接把三角形输出到当前宿主的渲染目标。

这适合：

- 纯三角形覆盖
- 不需要后处理
- 追求更直接的渲染链路

### 2. 先离屏再后处理

当 `invertEnabled = true` 时，图层会：

```text
renderToTexture(...)
-> renderPostProcessingPasses(...)
```

当前内置的后处理 pass 是：

- `InvertPass`

## 宿主兼容

### Leaflet

Leaflet 通过 overlay canvas 驱动这个图层。

这条路更轻，适合快速实验和视觉验证。

### MapLibre

MapLibre 通过 custom layer 驱动这个图层。

这条路更适合共享 WebGL 生命周期，也更适合做后处理。

## 什么时候继续下探

如果你只是想把三角形挂到地图上，优先看：

- `MapLibreTriangleHost`
- Leaflet 接入文档

只有在你需要自定义 shader 或观察底层 pass 状态时，再直接实例化这个图层。
