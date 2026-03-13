# 图层生命周期

## 在线预览

<iframe src="/examples/triangle-lifecycle.html" style="width:100%;height:760px;border:1px solid #d7d3c8;border-radius:12px;background:#fff;"></iframe>

当前最重要的图层对象是：

- `TriangleMultiPassLayer`

它建立在 `BaseLayer` 之上，同时负责：

- 三角网格管理
- shader/model/buffer 管理
- Leaflet overlay 绘制
- MapLibre shared WebGL 绘制
- 可选的后处理 pass

## 整体顺序

典型执行链路如下：

```text
new TriangleMultiPassLayer(...)
-> onAdd(...)
-> onDeviceReady()
-> _initializeResources()
-> render(...)
```

如果开启了反色：

```text
render(...)
-> renderToTexture(...)
-> renderPostProcessingPasses(...)
-> InvertPass
```

如果没有开启反色：

```text
render(...)
-> renderLayer(...)
-> drawToRenderPass(...)
```

## `BaseLayer` 阶段

`BaseLayer` 负责：

- 默认 props 解析
- `setProps(...)`
- device 初始化
- 请求重绘

`TriangleMultiPassLayer` 在这之上增加真正的图层逻辑。

## 构造阶段

构造函数里会初始化：

- mesh 相关状态
- model 缓存
- projected model/buffer
- `ResourceManager`
- 后处理 pass 列表

同时会立刻执行：

```text
_refreshMesh()
```

把输入顶点转换成细分后的三角网格。

## `onPropsChange(...)`

当前会重点处理三类变化：

- 几何变化：`vertices` / `subdivisionSteps`
- shader 变化：`vertexShader` / `fragmentShader`
- pass 结构变化：`invertEnabled`

对应行为分别是：

- 重新生成 mesh 并同步 buffer
- 销毁已缓存 model，等待下一帧重建
- 重建后处理 pass 列表

## `onDeviceReady()`

设备准备好后会执行：

```text
_initializeResources()
```

它会完成两件事：

- `_syncGeometry()`
- `_rebuildPasses()`

## `render(...)`

这个方法会根据宿主分成两条路径。

### 1. Shared WebGL

当传入的是 `render(gl, args)`，并且有：

- `shaderData`
- `defaultProjectionData`

会走 MapLibre 这类共享 WebGL 路径。

### 2. Overlay Canvas

当传入的是 `frame`，并且有 `project(...)` 方法时，会走 Leaflet overlay 路径。

## 直接绘制路径

当没有启用后处理 pass 时，会走：

```text
renderLayer(...)
-> drawToRenderPass(...)
```

或者在 Leaflet 下走：

```text
renderProjectedFrame(...)
-> drawProjectedToRenderPass(...)
```

## 后处理路径

当 `invertEnabled = true` 时，会先离屏输出，再执行后处理：

```text
renderToTexture(...)
-> renderPostProcessingPasses(...)
-> InvertPass
```

Leaflet 侧也复用这套思路，只是基础几何先通过投影坐标绘制到离屏纹理。

## 状态回调

### `onShaderStateChange`

关注：

- shader 编译是否成功
- draw 是否成功

### `onPassStateChange`

关注：

- `render-pass` 是否执行
- `invert-pass` 是否执行
- 当前输出目标是 `screen` 还是 `framebuffer`

## 销毁阶段

图层移除时会清理：

- post-processing passes
- `ResourceManager`
- model 缓存
- positions buffer
- projected model / buffer

也就是说，当前资源收口都在同一个类里，不再依赖额外的 multipass 调度器。
