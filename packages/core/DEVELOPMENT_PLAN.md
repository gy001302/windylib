# Core 开发计划

## 目标

`packages/core` 要逐步演进成一个对标 `deck.gl` 的渲染内核。

这里的“对标”不是照搬 API，而是补齐 deck.gl 最关键的几层能力：

- 图层生命周期协议
- 图层状态和变更标记
- 图层管理与 diff
- attribute/geometry 更新机制
- pass 和后处理管线
- overlaid / interleaved 宿主接入协议
- viewport / camera 抽象

`packages/core` 负责“内核”。

不负责：

- 地图 SDK 适配
- Storybook 页面逻辑
- 具体业务图层集合

## 对标 deck.gl 的模块映射

### 1. Layer 基类

deck.gl 对应：

- `Layer`

当前代码：

- [BaseLayer.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/BaseLayer.js)
- [BaseMultiPassLayer.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/BaseMultiPassLayer.js)

当前问题：

- 还只有基础生命周期挂载
- 图层内部状态没有标准化
- props 更新分类还不够细
- 图层和 GPU 资源更新还没有彻底解耦

目标：

- 统一 `initialize / updateState / draw / finalizeState`
- 图层实例只保留“状态和行为”
- 把 props 变化、attribute 变化、shader 变化分离

### 2. LayerManager

deck.gl 对应：

- `LayerManager`

当前代码：

- [LayerManager.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/LayerManager.js)

当前问题：

- 只具备基础调度能力
- 没有完整的新旧 layer diff
- 没有 state 复用策略
- 没有图层树展开能力

目标：

- 支持新旧 layer diff
- 支持图层状态复用
- 统一生命周期调用顺序
- 后续允许 composite layer 展开子图层

### 3. ChangeFlags / State

deck.gl 对应：

- `changeFlags`
- `state`
- `internalState`

当前代码：

- [ChangeFlags.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/ChangeFlags.js)
- [LayerContext.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/LayerContext.js)
- [LayerLifecycle.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/LayerLifecycle.js)

当前问题：

- `changeFlags` 维度还偏少
- layer 自身状态没有统一格式
- context 和 layer state 的边界还不够硬

目标：

- 统一变更分类
- 把图层运行时状态从实例字段中收敛出来
- 让 `LayerLifecycle` 成为唯一生命周期入口

### 4. AttributeManager

deck.gl 对应：

- `AttributeManager`
- accessor 驱动的 attribute 更新

当前代码：

- 暂无

当前问题：

- 现在 attribute、buffer、geometry 更新逻辑散落在 layer 或 renderer 中
- 没有 partial update
- 没有统一 invalidation 机制

目标：

- 新增 `AttributeManager`
- 支持 attribute 注册、失效、重算
- 支持按数据变化和 props 变化更新 buffer

这是当前最重要的缺口之一。

### 5. Model / Geometry / Shader 装配层

deck.gl 对应：

- `Model`
- `Geometry`
- shader module 组合

当前代码：

- [ProjectedTriangleRenderer.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/renderers/ProjectedTriangleRenderer.js)
- [triangleMesh.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/geometry/triangleMesh.js)
- [shaderlib](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/shaderlib)

当前问题：

- renderer 还是单点实现
- model 装配没有抽成通用协议
- shader 资源有了，但 shader module 体系还没有

目标：

- 抽出通用 model 构建协议
- 把 geometry、uniform、shader、attribute 更新组织起来
- 为多种 layer 复用同一套渲染装配方式

### 6. Pass / Effects

deck.gl 对应：

- `Effect`
- post-process pipeline

当前代码：

- [BasePass.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/passes/BasePass.js)
- [BasePostProcessingPass.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/passes/BasePostProcessingPass.js)
- [RenderPass.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/passes/RenderPass.js)
- [InvertPass.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/passes/InvertPass.js)
- [MultiPassRenderer.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/MultiPassRenderer.js)
- [PostProcessor.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/lib/PostProcessor.js)

当前问题：

- 已经有 pass 链雏形
- 但还主要服务于单一示例
- pass 和 layer/effect 的关系还没有框架化

目标：

- 保留 pass 作为内核能力
- 后续引入 effect 抽象
- 让 pass 不只服务三角形示例

### 7. Viewport / Camera

deck.gl 对应：

- `View`
- `Viewport`
- `ViewState`

当前代码：

- [SimpleCamera.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/viewports/SimpleCamera.js)
- [SimpleCameraService.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/viewports/SimpleCameraService.js)

当前问题：

- 现在更像“单相机工具”
- 还不是完整视图系统
- 还没有多视图和统一 viewport 协议

目标：

- 保留简单相机
- 逐步升级为 viewport 抽象
- 后续支持不同宿主提供统一 view state

### 8. 宿主接入协议

deck.gl 对应：

- `Deck`
- `MapboxOverlay`
- overlaid / interleaved 模式分流

当前代码：

- [CanvasOverlayRendererHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/renderers/CanvasOverlayRendererHost.js)

当前问题：

- 当前更偏 overlaid
- interleaved 还没有进入统一内核协议
- host、renderer、layer 之间的边界还需要继续收紧

目标：

- 建立统一 host 协议
- 支持：
  - `overlaid`
  - `interleaved`
- 让两种模式复用同一套 layer/update/draw 内核

这是当前第二个最重要的缺口。

## 目录设计原则

`core/src` 按职责分层，不按“文件长得像什么”分层。

当前采用这几层：

- `lib`
  - 内核协议、生命周期、状态、资源和渲染调度
- `passes`
  - pass 和后处理基础设施
- `shaderlib`
  - shader 资源
- `viewports`
  - camera / viewport 抽象
- `renderers`
  - 具体 renderer 和 host
- `geometry`
  - 几何计算工具

后续如果新增目录，也必须能回答一个问题：

“它在渲染内核里承担哪一层职责？”

## 开发阶段

### 第一阶段：补齐生命周期和状态边界

目标：

- 把 `BaseLayer` 彻底收敛到统一生命周期协议
- 明确 `state / context / changeFlags`

先做：

1. 统一 `initialize / updateState / draw / finalizeState`
2. 扩展 `ChangeFlags`
3. 规范 layer 内部状态结构
4. 让 `LayerLifecycle` 成为唯一入口

完成标准：

- 图层更新不再依赖分散的实例字段判断
- 生命周期调用路径单一

### 第二阶段：实现 AttributeManager

目标：

- 建立 deck.gl 风格的 attribute 更新层

先做：

1. 新增 `AttributeManager`
2. 支持 attribute 注册
3. 支持 invalidation
4. 支持数据变化驱动 buffer 更新

完成标准：

- layer 不再手写大段 buffer 更新判断
- geometry/attribute 更新逻辑收口

### 第三阶段：重做 LayerManager diff

目标：

- 让 `LayerManager` 具备框架级图层调度能力

先做：

1. 新旧 layer diff
2. state 复用
3. 生命周期顺序控制
4. 为 composite layer 预留接口

完成标准：

- 图层列表更新时可以稳定复用已有状态和资源

### 第四阶段：统一 host 协议

目标：

- 在 core 内核层实现 `overlaid / interleaved`

先做：

1. 定义 host 抽象接口
2. 把现有 overlay host 收敛为 `overlaid` 实现
3. 新增 `interleaved` 协议骨架
4. 让两种模式共享同一套 layer 驱动

完成标准：

- `maps` 只负责地图宿主适配
- `core` 负责模式本身

### 第五阶段：补 model / shader module 装配层

目标：

- 让 layer 渲染从“单点写法”变成“标准装配”

先做：

1. 提炼通用 model 创建流程
2. 整理 geometry / attribute / uniform / shader 关系
3. 为多个 layer 复用同一套绘制装配方式

完成标准：

- renderer 不再只是示例型实现

## 当前优先级

按顺序执行：

1. 生命周期和状态边界
2. `AttributeManager`
3. `LayerManager diff`
4. `overlaid / interleaved`
5. model / shader module 装配层

## 下一步执行项

当前下一步不再调整目录，直接进入 `AttributeManager`。

原因：

- 当前图层的数据更新逻辑仍然散落在 layer 内部
- `MapTriangleLayer` 还在自己判断 geometry、buffer、颜色和 shader 变化
- 如果不先补 `AttributeManager`，后续 `LayerManager diff` 和 `overlaid / interleaved` 都会继续建立在分散逻辑上

下一步要做的事：

1. 在 `src/lib` 新增 `AttributeManager.js`
2. 定义第一版最小接口：
   - `add`
   - `invalidate`
   - `invalidateAll`
   - `update`
   - `remove`
3. 第一版只支持：
   - 普通顶点 attribute
   - 全量更新
   - 基于 `props` / `data` 变化的失效判断
4. 让 `MapTriangleLayer` 成为第一个接入 `AttributeManager` 的 layer

第一版明确不做的事：

- 不做 instanced attribute
- 不做 partial update
- 不做复杂 accessor 体系
- 不做多 layer 共享 attribute 缓存

完成标准：

- `MapTriangleLayer` 不再手写主要 buffer 更新流程
- attribute 更新逻辑由 `core` 接管
- 为后续 `LayerManager diff` 和标准化 model 装配层打基础

## 当前结论

`packages/core` 现在已经有了 deck.gl 式内核的雏形，但还没有进入“框架完整体”阶段。

最关键的差距不是目录，而是下面这四层还没补齐：

- `AttributeManager`
- 完整 `LayerManager diff`
- `overlaid / interleaved` 统一 host 协议
- 标准化的 model / shader 装配层

后续开发必须围绕这四层推进，而不是继续做零散文件搬运。
