# 开发计划

## 核心原则

这一轮的重点不在 `packages/maps`，而在 `packages/core`。

目标应当明确为：

- `packages/core` 负责实现 `Overlaid / Interleaved` 两种渲染模式
- `packages/maps` 只负责把这些能力接到具体地图宿主上
- `packages/storybook` 只负责展示和验证，不负责定义架构

换句话说：

- 模式能力应该收敛在 `core`
- 地图接入只是 `maps`
- 演示样例只是 `storybook`

## 第一阶段目标

第一阶段不是直接把所有地图实现完，而是先在 `packages/core` 内建立清晰的模式抽象。

第一阶段要做的事情只有一件：

**先把 `core` 的渲染模式抽象设计清楚，并形成稳定接口。**

## 当前判断

根据现有代码，`core` 已经具备一些基础能力，但还没有显式表达“模式”：

- 有独立 canvas 方向的能力：
  - `CanvasOverlayRendererHost`
  - `ProjectedTriangleRenderer`
- 有 layer / multipass / renderer 能力：
  - `BaseLayer`
  - `BaseMultiPassLayer`
  - `MultiPassRenderer`
  - `TriangleMultiPassLayer`

但现在缺少一层统一语义：

- 什么叫 `Overlaid`
- 什么叫 `Interleaved`
- 两种模式在 `core` 里分别由什么对象承担
- 上层如何以统一方式消费这两种模式

## 正确的职责划分

### `packages/core`

负责：

- 定义模式抽象
- 提供模式基类或宿主接口
- 管理渲染生命周期
- 定义共享的 renderer / layer / pass 协议

不负责：

- 具体地图 SDK 的接入细节
- 业务示例页面

### `packages/maps`

负责：

- 将 `core` 的模式能力接到地图环境
- 处理 MapLibre / Leaflet 的事件、容器、生命周期
- 作为宿主适配层

不负责：

- 定义渲染模式本身

### `packages/storybook`

负责：

- 展示
- 回归验证
- 交互实验

不负责：

- 驱动底层架构设计

## `core` 需要建立的模式模型

`packages/core` 后续应当明确支持两种模式：

### `Overlaid`

含义：

- 渲染发生在独立 canvas 上
- 不共享地图内部 WebGL context
- 通过宿主同步视图状态和重绘时机

适用特征：

- 隔离性更强
- 调试成本更低
- 更适合跨地图宿主复用

### `Interleaved`

含义：

- 渲染与地图的 WebGL 生命周期交织在一起
- 与地图共享上下文或共享渲染时机
- 更依赖地图宿主的 layer 生命周期

适用特征：

- 集成更深
- 能力上限更高
- 对宿主耦合更强

## 第一阶段真正要先做什么

第一步先做设计，不先写完整实现。

第一步的具体工作应当是：

1. 在 `packages/core` 中定义模式接口
2. 明确哪些现有类属于 `Overlaid`
3. 明确哪些现有类属于 `Interleaved`
4. 设计统一入口，让 `maps` 可以基于同一套 `core` 协议接入

## 建议的第一步产出

第一步建议产出以下内容：

### 1. 模式命名

先统一命名，不再靠语义猜测：

- `OverlaidRendererHost`
- `InterleavedRendererHost`

或者：

- `CoreOverlaidHost`
- `CoreInterleavedHost`

名字不是重点，重点是：

- 必须显式出现 `Overlaid`
- 必须显式出现 `Interleaved`

### 2. 统一接口

先在 `core` 里约定共同接口，至少包括：

- `attach()`
- `detach()`
- `setProps()`
- `requestRender()`
- `getHostKind()`
- `supportsSharedCanvas()`

### 3. 现有类归类

先做归类，不急着改实现：

- `CanvasOverlayRendererHost`
  倾向归入 `Overlaid`
- `BaseLayer` / `BaseMultiPassLayer`
  倾向作为 `Interleaved` 方向的重要基础
- `TriangleMultiPassLayer`
  倾向作为 `Interleaved` 场景下的 layer 实现

### 4. `maps` 的角色下沉为宿主适配

后续 `maps` 包只做：

- MapLibre 宿主适配
- Leaflet 宿主适配
- 演示这两种模式如何挂载

而不是在 `maps` 中重新定义模式本身。

## 后续改造顺序

按正确顺序，应该这样推进：

1. 先整理 `packages/core` 的模式抽象
2. 再把现有 `core` 类映射到 `Overlaid / Interleaved`
3. 再调整 `packages/maps/maplibre` 去承接两种模式
4. `packages/maps/leaflet` 保持 `Overlaid`
5. 最后用 `packages/storybook` 做验证

## `packages/maps` 的后续定位

在这个计划下：

### `packages/maps/leaflet`

只体现 `Overlaid` 示例：

- 叠加独立 canvas
- 不追求 `Interleaved`

### `packages/maps/maplibre`

作为双模式实验场：

- 展现 `Overlaid`
- 展现 `Interleaved`

但请注意：

这里是“体现和实验”，不是模式定义的归属地。

## 第一阶段完成标准

第一阶段完成，不是指功能全部实现，而是指：

- `core` 内已经有清晰的模式定义
- `Overlaid / Interleaved` 的职责边界已明确
- `maps` 被明确定义为宿主适配层
- 后续实现顺序不会再倒置

## 下一步

下一步应该开始做：

**只针对 `packages/core` 的模式归类分析。**

也就是先回答这几个问题：

1. `core` 里现有哪些类天然属于 `Overlaid`
2. `core` 里现有哪些类天然属于 `Interleaved`
3. 哪个抽象应当成为两种模式的共同上层接口
4. 哪些 `maps` 侧逻辑应该回收到 `core`

在这一步完成之前，不建议先改 `packages/maps/maplibre` 的双模式实现。
