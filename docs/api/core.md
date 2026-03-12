# `@windylib/core`

对应 `packages/core/src/index.js` 中的公开导出。

这个包更适合被理解为“底层运行时”，而不是最终业务 API。

如果你只是要画三角形，通常先看 `@windylib/layers`；只有当你需要做宿主接入、渲染调度或后处理时，才需要深入到这里。

## 相机

### `SimpleCamera`

底层相机对象，负责 viewport 与 perspective 状态。

适合在这些场景中使用：

- 做统一 camera 抽象
- 在地图相机和自定义渲染相机之间同步
- 给 3D 相关渲染提供稳定相机输入

### `SimpleCameraService`

更高层的相机服务封装，主要用于同步和预览流程。

典型用途：

- 配合 `MapLibreCameraSync`
- 在预览 UI 里读取当前相机状态

## 几何

### `buildTriangleMesh(vertices, subdivisionSteps)`

根据 3 个输入顶点构建细分后的三角网格。

输入：

- `vertices`：三角形三个顶点
- `subdivisionSteps`：细分等级

输出：

- 一个展开后的三角形顶点数组

### `normalizeColor(color)`

把 `0-255` 的 RGBA 数组转换成 shader 使用的归一化颜色值。

### `invertColor(color)`

对 RGB 通道做反色，同时保留 alpha。

## 渲染

### `CanvasOverlayRendererHost`

创建并管理独立于地图原生渲染器之外的 WebGL2 overlay canvas。

它负责的事情包括：

- 连接 `canvasHost`
- 创建 WebGL2 context
- 挂接 luma device
- 驱动 renderer 的 `render(frame)` 调用

更适合 Leaflet 这种 overlay canvas 模式。

### `BaseLayer`

地图绑定图层的基础类。

`TriangleLayer` 与 `TriangleMultiPassLayer` 都建立在这个抽象之上。

它提供了这些基础行为：

- 默认 props 解析
- `setProps`
- 设备初始化
- 请求重绘

## 多 pass

### `MultiPassRenderer`

负责串联多个 render pass 与 post-processing pass。

适合在你要做这些事情时使用：

- 先画到离屏纹理
- 再做后处理
- 需要多个 pass 顺序执行

### `ResourceManager`

分配并复用 GPU 纹理与 framebuffer。

### `BasePass`

普通 render pass 的基础约定。

### `BasePostProcessingPass`

后处理 pass 的基础约定。

### `FullscreenPostProcessingPass`

用于全屏纹理消费类 pass 的通用基类。

如果你要新增类似“反色、模糊、颜色映射”这样的后处理效果，通常会从这个类继续派生。
