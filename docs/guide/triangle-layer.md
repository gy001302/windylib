# TriangleLayer 使用

`TriangleLayer` 是当前仓库最核心的公共图层。

它的目标不是绑定某一个地图框架，而是提供一套统一的三角形渲染能力，让不同宿主都能复用。

## 适合什么场景

适合以下需求：

- 用三个经纬度顶点渲染一个三角形区域
- 需要对三角形做细分，提高视觉平滑度
- 希望在 Leaflet 和 MapLibre 之间复用同一套图层逻辑
- 需要自定义 shader，而不想重复写宿主接入逻辑

## 核心属性

最常用的属性包括：

- `id`：图层唯一标识
- `vertices`：三角形三个顶点，格式为 `[lng, lat, z]`
- `color`：RGBA 数组，范围 `0-255`
- `subdivisionSteps`：三角形细分等级
- `invertEnabled`：是否启用基础反色逻辑
- `vertexShader`：自定义顶点 shader 代码
- `fragmentShader`：自定义片元 shader 代码
- `projectPosition`：将输入位置投影到渲染坐标的函数
- `onShaderStateChange`：用于观察 shader 编译或绘制状态

## 数据模型

顶点输入约定为：

```js
const vertices = [
  [116.38, 39.9, 1],
  [121.47, 31.23, 1],
  [113.26, 23.13, 1],
]
```

WindyLib 内部会基于这 3 个点生成一个细分后的三角网格。

## 最小示例

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
  projectPosition: (position) => ({
    x: position[0],
    y: position[1],
  }),
})
```

## 渲染模式

`TriangleLayer` 当前支持两种宿主模式。

### 1. 共享地图 WebGL 上下文

这是 MapLibre 这类框架更自然的接入方式。

特点：

- 图层直接参与地图渲染生命周期
- 使用地图提供的投影数据
- 更适合与地图底图统一渲染

### 2. Overlay Canvas

这是 Leaflet 当前使用的方式。

特点：

- 在地图上方创建独立 canvas
- 通过 `project(position)` 把地理坐标映射到屏幕坐标
- 宿主更简单，但渲染与底图是分离的

## Shader 定制

如果你要自定义 shader，通常只需要替换 `vertexShader` 或 `fragmentShader`。

默认 shader 已经能直接绘制纯色三角形；自定义时更适合做：

- 颜色实验
- alpha 渐变
- 基于插值坐标的视觉效果

## 什么时候不用它

如果你的需求是：

- 复杂地理图层管理
- 大规模矢量图层调度
- 与现有 deck.gl 图层体系深度兼容

那 `TriangleLayer` 更适合作为底层能力，而不是完整的最终业务图层系统。
