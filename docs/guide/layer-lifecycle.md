# 图层生命周期

这一页解释当前图层系统在真实代码里的生命周期。

重点覆盖三层：

- `BaseLayer`
- `TriangleLayer`
- `TriangleMultiPassLayer`

如果你在调试以下问题，这页最有用：

- 为什么图层没有马上显示
- 为什么改了 props 之后会重绘
- 为什么 shader 会重新编译
- 为什么 `invertEnabled` 改了之后 pass 会重建

## 总体顺序

最常见的一条完整链路如下：

```text
new TriangleMultiPassLayer(...)
-> onAdd(...)
-> onDeviceReady()
-> configurePasses()
-> render(...)
-> TriangleRenderPass.render(...)
-> InvertPass.render(...)
-> setProps(...)
-> onPropsChange(...)
-> onLayerPropsChange(...)
-> render(...)
-> onBeforeRemove()
-> onRemove(...)
```

不同宿主下，前半段会略有区别：

- MapLibre：图层进入地图的 custom layer 生命周期
- Leaflet overlay：图层通过 `CanvasOverlayRendererHost` 被驱动

## `BaseLayer` 生命周期

`BaseLayer` 是所有图层的共同起点。

### 1. `constructor(props)`

在构造阶段会做这些事：

- 合并默认 props
- 初始化 `id`
- 初始化运行时字段，如 `map / gl / device`

这个阶段还没有 GPU 设备，也没有进入地图宿主。

### 2. `onAdd(map, gl)`

当宿主把图层真正挂进去时触发。

这一步会：

- 记录 `map`
- 记录 `gl`
- 异步调用 `luma.attachDevice(...)`

只有设备附着完成后，后续绘制才真正可用。

### 3. `onDeviceReady(device)`

设备创建成功后触发。

这是图层初始化 GPU 资源的关键时机，例如：

- 创建 buffer
- 创建 model
- 创建资源管理器
- 初始化 pass

### 4. `setProps(nextProps)`

任何 props 变化都会先进入这里。

它会做两件事：

1. 合并新旧 props
2. 调用 `onPropsChange({ props, oldProps, nextProps })`

最后会调用 `requestRender()` 请求宿主重绘。

### 5. `render(...)`

宿主真正进入绘制阶段时触发。

`BaseLayer` 本身不实现具体绘制逻辑，具体行为由子类决定。

### 6. `onBeforeRemove(...)` / `onRemove(...)`

当图层被移除时触发。

这里通常负责：

- 销毁 model
- 销毁 buffer
- 销毁 framebuffer / texture
- 释放设备引用

## `TriangleLayer` 生命周期

`TriangleLayer` 在 `BaseLayer` 的基础上增加了三角形几何、shader 和 model 的管理。

### 构造阶段

`TriangleLayer` 的构造函数里除了 `super(props)`，还会：

- 初始化 `models`
- 初始化 `positionsBuffer`
- 初始化 `meshVertices`
- 初始化 `shaderState`
- 立即执行 `_refreshMesh()`

注意：

此时虽然已经生成了 CPU 侧 mesh，但 GPU buffer 还没创建。

### `_refreshMesh()`

这个方法负责：

- 调用 `buildTriangleGeometry(...)`
- 生成细分后的三角形顶点
- 生成 `positions`
- 计算 `vertexCount`

触发时机有两个：

- 构造阶段
- `vertices` 或 `subdivisionSteps` 改变时

### `onDeviceReady()`

`TriangleLayer` 在设备准备好后会先调用 `_syncGeometry()`。

它会把 CPU 侧的 `positions` 同步进 GPU buffer。

这一阶段后，图层才具备真正绘制的条件。

### `onPropsChange(...)`

这是 `TriangleLayer` 生命周期里最关键的一步。

它会先判断两类变化：

#### 几何变化

几何变化条件：

- `vertices` 改变
- `subdivisionSteps` 改变

一旦发生，会执行：

```text
_refreshMesh()
-> _syncGeometry()
```

#### shader 变化

shader 变化条件：

- `vertexShader` 改变
- `fragmentShader` 改变

一旦发生，会执行：

```text
_destroyModels()
```

下一次绘制时，model 会按新 shader 重新创建。

### `render(...)`

`TriangleLayer` 支持两种渲染模式。

#### 1. Shared WebGL 模式

当 `render(gl, args)` 带有 `shaderData` 和 `defaultProjectionData` 时，会走：

```text
renderLayer(...)
-> drawToRenderPass(...)
```

这条链更适合 MapLibre。

#### 2. Overlay Canvas 模式

当传入的是 `frame`，并且有 `project(...)` 方法时，会走：

```text
renderProjectedFrame(frame)
```

这条链更适合 Leaflet overlay canvas。

### `drawToRenderPass(...)`

这是共享 WebGL 模式下真正的绘制核心。

它会：

- 获取或创建 model
- 写入投影相关 uniforms
- 写入颜色 uniforms
- 开启 alpha blend
- 调用 `model.draw(renderPass)`

如果成功，会触发：

- `onShaderStateChange({ stage: 'draw', ok: true })`

如果失败，会触发：

- `onShaderStateChange({ stage: 'draw', ok: false })`

### `_getModel(shaderDescription)`

这个方法负责按 shader 变体缓存 model。

如果当前变体不存在，会创建一个新的 `Model`。

成功时会触发：

- `onShaderStateChange({ stage: 'compile', ok: true })`

失败时会触发：

- `onShaderStateChange({ stage: 'compile', ok: false })`

### `onBeforeRemove()`

`TriangleLayer` 在移除前会清理：

- 普通 model
- projected model
- positions buffer
- projected positions buffer

## `TriangleMultiPassLayer` 生命周期

`TriangleMultiPassLayer` 在 `TriangleLayer` 之上再增加一层 multipass 调度。

### `_onDeviceReady()`

在设备就绪后，它不会直接创建 pass，而是先创建：

- `ResourceManager`
- `MultiPassRenderer`

然后调用：

```text
configurePasses()
```

### `configurePasses()`

这个方法负责重新计算当前启用的 pass 链。

内部逻辑是：

```text
createPasses()
+ createPostProcessingPasses()
-> multiPassRenderer.setPasses(...)
```

### `createPasses()`

当前默认总会创建一个 `TriangleRenderPass`。

它的行为取决于：

- `invertEnabled = false`
  直接渲染到屏幕
- `invertEnabled = true`
  先渲染到离屏纹理

### `createPostProcessingPasses()`

当前只有一个条件性 pass：

- `InvertPass`

只有 `invertEnabled = true` 时才会创建。

### `onLayerPropsChange(...)`

`TriangleMultiPassLayer` 会在这里响应更高层的 props 变化。

最重要的逻辑是：

- 如果 `invertEnabled` 改了
- 或者 shader 改了

则重新执行：

```text
configurePasses()
```

然后再执行：

```text
multiPassRenderer.updatePasses(...)
```

为什么要这样做：

- `invertEnabled` 会改变 pass 链结构
- shader 改变后，相关渲染对象可能需要重新适配当前 pass

### `renderLayer(...)`

这里不再直接画图，而是交给：

```text
multiPassRenderer.render(this, renderContext)
```

于是实际执行顺序变成：

```text
TriangleRenderPass
-> InvertPass
```

或者：

```text
TriangleRenderPass
```

取决于 `invertEnabled` 是否开启。

### Pass 事件

`TriangleMultiPassLayer` 通过 `onPassStateChange` 暴露 pass 生命周期。

当前常见事件包括：

- `stage: 'compile'`
- `stage: 'render'`

在这些 pass 上会触发：

- `render-pass`
- `invert-pass`

如果是离屏渲染，还会带上：

- `target: 'framebuffer'`
- `pixelSample`

这对调试后处理链非常有用。

## 两类状态回调的区别

### `onShaderStateChange`

关注：

- shader 是否编译成功
- draw 是否成功

适合排查：

- shader 语法错误
- uniforms 不合法
- 绘制失败

### `onPassStateChange`

关注：

- pass 有没有被创建
- pass 是不是在 framebuffer 还是 screen 上执行
- pass 是否真正进入 render 阶段

适合排查：

- multipass 链路没跑起来
- 反色没有生效
- framebuffer 输出为空

## 调试建议

如果你怀疑图层生命周期有问题，建议按这个顺序排查：

1. 先看 `onShaderStateChange`
2. 再看 `onPassStateChange`
3. 再确认 `setProps()` 是否真的触发
4. 最后再看宿主是否调用了 `requestRender()`

这样能最快区分出问题是在：

- 图层对象内部
- pass 链
- shader
- 地图宿主
