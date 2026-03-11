# Core 开发计划

## 目标

`packages/core` 负责建立渲染核心能力，而不是承载地图示例或宿主适配。

当前核心目标：

- 在 `core` 中明确 `Overlaid / Interleaved` 两种模式
- 保持 `core` 只提供基础设施、抽象和共享资源
- `layers` 作为上层能力包
- `maps` 作为宿主适配层

## 当前边界

### `core` 应负责

- 渲染生命周期
- 设备管理
- pass / post-processing 基础设施
- renderer host 抽象
- 基础 layer 抽象
- 几何和共享 shader 资源

### `core` 不应负责

- 具体业务 layer 集合
- 具体地图 SDK 的接入逻辑
- Storybook 展示代码

## 当前代码归类

### 更偏 `Overlaid`

- `src/renderers/CanvasOverlayRendererHost.js`
- `src/renderers/ProjectedTriangleRenderer.js`

### 更偏 `Interleaved`

- `src/BaseLayer.js`
- `src/BaseMultiPassLayer.js`
- `src/MultiPassRenderer.js`
- `src/passes/*`

### 共享基础能力

- `src/ResourceManager.js`
- `src/PostProcessor.js`
- `src/geometry/triangleMesh.js`
- `src/shaders/*`

## 第一优先级

先做模式抽象，不先做地图接入。

执行顺序：

1. 盘点 `Overlaid` 和 `Interleaved` 共同接口
2. 给 `core` 建立清晰的 host / renderer 协议
3. 明确哪些类保留在 `core`
4. 明确哪些能力应上移到 `layers`

## 第二优先级

整理 `core` 的公开 API：

- 保证导出只包含基础设施
- 不把业务 layer 再放回 `core`
- shader 资源允许放在 `core` 统一管理

## 第三优先级

为 `Overlaid / Interleaved` 建立最小验证用例：

- 不依赖 Storybook 先完成抽象
- 优先做可测试的生命周期和接口验证

## 当前阶段结论

短期内按这个原则推进：

- `core` 留基础设施和 shader
- `layers` 留具体 layer 实现
- `maps` 留宿主适配
- `storybook` 留演示验证
