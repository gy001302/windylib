# WindyLib 开发计划

## 当前判断

当前代码能跑通 Leaflet、MapLibre、Storybook 和文档示例，但核心问题已经很明确：

- 生命周期语义不够统一
- 对外 API 还偏内部工程化
- `packages` 与应用层边界虽然已收紧，但还没有完全产品化
- 文档、示例、公开接口已经开始统一，但命名和调用方式还可以继续收口

这份计划不再按“对标某个框架的全部模块”展开，而是基于当前真实代码和下一步要做的减法来写。

## 当前代码现状

### 已完成

- 公开三角形图层已经收口为 `TriangleMultiPassLayer`
- Leaflet 与 MapLibre 复用同一个三角形图层实现
- `PostProcessor` 和 `MultiPassRenderer` 已删除
- `ResourceManager` 已压缩成更薄的资源复用层
- `packages/maps/maplibre` 不再创建地图实例，只消费外部 `map`
- `packages/maps/leaflet` 和 `packages/maps/maplibre` 都已经是 “map adapter / host” 思路
- 文档和 Storybook 已对齐当前能力
- 文档内已经提供 iframe 示例，示例 HTML 已迁到 `docs/public/examples`

### 当前核心模块

- [BaseLayer.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/BaseLayer.js)
- [ResourceManager.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/ResourceManager.js)
- [CanvasOverlayRendererHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/core/src/renderers/CanvasOverlayRendererHost.js)
- [TriangleMultiPassLayer/index.js](/Users/yang.ju/WebstormProjects/windylib/packages/layers/src/TriangleMultiPassLayer/index.js)
- [LeafletCanvasHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/leaflet/src/LeafletCanvasHost.js)
- [LeafletMapAdapter.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/leaflet/src/LeafletMapAdapter.js)
- [MapLibreLayerHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/maplibre/src/MapLibreLayerHost.js)
- [MapLibreMapAdapter.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/maplibre/src/MapLibreMapAdapter.js)
- [MapLibreTriangleHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/maplibre/src/MapLibreTriangleHost.js)
- [MapLibreCameraSync.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/maplibre/src/MapLibreCameraSync.js)

## 主要问题

### 1. 生命周期没有形成统一契约

这是当前最根本的问题。

现在不同对象各自使用：

- `constructor`
- `attach / detach`
- `onAdd / onRemove`
- `onDeviceReady`
- `setProps`
- `render`

这些阶段虽然都合理，但还没有被统一成一套稳定心智模型，所以会导致：

- 有些初始化发生在 constructor
- 有些初始化发生在 attach
- 有些资源第一次 render 才真正创建
- props 变化与宿主挂载变化混在一起

这也是当前“代码臃肿感”的主要来源。

### 2. 对外 API 还偏内部实现

当前用户使用方式还是：

- `new ...Host(...)`
- `attach()`
- `setProps(...)`
- `detach()`

这对内部实现是清楚的，但对外还是偏工程术语。

更适合的用户语义应该逐步收口为：

- `addTo(...)`
- `setOptions(...)`
- `remove()`

内部继续保留：

- `mount`
- `update`
- `unmount`

这样用户接口和内部生命周期分层才会清楚。

### 3. Layer、Host、Renderer 边界仍然偏厚

虽然已经比之前好很多，但 `TriangleMultiPassLayer` 还是偏大。

当前它同时承担：

- geometry 生成
- buffer / model 管理
- shared WebGL 绘制
- projected overlay 绘制
- post-processing pass 调度

这在功能上没问题，但继续演进时会遇到阅读和扩展压力。

### 4. `core` 还需要继续做减法

`core` 现在比之前干净，但后续要继续坚持：

- 只放稳定、通用、跨地图框架的基础能力
- 不再回到“大而全渲染框架”的方向

当前不该再把这些重新堆回 `core`：

- 通用多 pass 调度壳子
- 地图实例创建逻辑
- 业务图层专属宿主逻辑

## 生命周期目标

后续统一采用两层语义：

### 内部生命周期

- `mount(context)`
- `update(options)`
- `unmount()`

说明：

- `constructor` 只做对象创建和轻量 normalize
- `mount` 才开始接宿主、绑事件、创建重资源
- `update` 只处理配置和状态变化
- `unmount` 负责解绑和销毁

### 对外用户 API

- `addTo(hostOrMap)`
- `setOptions(options)`
- `remove()`

说明：

- `addTo` 对应内部 `mount`
- `setOptions` 对应内部 `update`
- `remove` 对应内部 `unmount`

这套语义同时兼容：

- Leaflet 的 `addTo/remove`
- L7 的 `addLayer/removeLayer`
- deck.gl 的 `mount/update/unmount` 心智

## 公开 API 目标

### MapLibre

目标形态：

```js
const layer = new MapLibreTriangleLayer(options)
layer.addTo(map)
layer.setOptions(nextOptions)
layer.remove()
```

当前状态：

- 已经有 [MapLibreTriangleHost.js](/Users/yang.ju/WebstormProjects/windylib/packages/maps/maplibre/src/MapLibreTriangleHost.js)
- 但命名和方法仍然偏内部实现

下一步：

- 把 `MapLibreTriangleHost` 逐步演进为更像公开产品 API 的对象
- 至少提供一层 `addTo / setOptions / remove` 兼容语义

### Leaflet

目标形态：

```js
const layer = new LeafletTriangleLayer(options)
layer.addTo(map)
layer.setOptions(nextOptions)
layer.remove()
```

当前状态：

- Leaflet 侧还是 `LeafletCanvasHost + CanvasOverlayRendererHost + TriangleMultiPassLayer`
- 对内部组合是合理的
- 对用户仍然偏底层

下一步：

- 提供一层更短的 Leaflet 公开入口
- 不要求用户直接理解全部 host 组合

## 包边界目标

### `packages/core`

只负责：

- `BaseLayer`
- 相机基础能力
- geometry 纯计算
- shader 资源
- 资源管理
- pass 基础设施
- overlaid canvas renderer host

不负责：

- 地图实例创建
- Storybook 页面逻辑
- 业务图层拼装

### `packages/layers`

只负责：

- 公开图层实现
- 图层内部通用 helper

当前重点对象：

- [TriangleMultiPassLayer/index.js](/Users/yang.ju/WebstormProjects/windylib/packages/layers/src/TriangleMultiPassLayer/index.js)

### `packages/maps/*`

只负责：

- 地图适配器
- host
- camera sync
- 公开接入层

当前已经完成的重要边界调整：

- `packages/maps/maplibre` 不再包含 `new maplibregl.Map`

## 文档与示例目标

当前已经达成：

- 文档内 iframe 示例
- `docs/public/examples`
- `docs/public/sdk/wl-all.umd.js`
- docs build 自动先跑 `build.dist`

后续要求：

- 文档示例始终优先对齐当前公开 API
- 文档中不再出现内部 API 伪装成用户级快速开始
- Storybook 继续作为真实功能验证
- docs 负责“可直接看懂和直接运行”

## 分阶段计划

### 第一阶段：统一生命周期命名和职责

目标：

- 从内部把生命周期语义钉死

执行项：

1. 约定所有可挂载对象的统一内部阶段：
   - `mount`
   - `update`
   - `unmount`
2. 明确 constructor 不做宿主副作用
3. 明确资源创建阶段和销毁阶段
4. 统一 host / layer / sync 三类对象的生命周期说明

完成标准：

- “什么时候开始工作” 不再模糊
- “什么时候销毁资源” 不再分散
- 代码和文档使用同一套术语

### 第二阶段：收口公开 API

目标：

- 把公开 API 从工程术语收成地图用户能直接理解的形式

执行项：

1. 为 MapLibre 公开对象提供：
   - `addTo`
   - `setOptions`
   - `remove`
2. 为 Leaflet 提供同等级入口
3. 保留旧接口一段时间作为兼容层
4. 文档和 examples 改为优先展示新接口

完成标准：

- 用户不需要先理解 `attach / detach / setProps`
- 对外调用方式统一

### 第三阶段：继续压缩 `TriangleMultiPassLayer`

目标：

- 让图层实现继续减肥，但不打断当前功能

执行项：

1. 评估 geometry 是否拆成纯数据对象
2. 评估 renderer 是否从 layer 中再独立一层
3. 保持 post-processing 只保留必要抽象
4. 不引入新的空心调度器

完成标准：

- 关键调用链更短
- 读一个文件就能看懂主要渲染逻辑

### 第四阶段：建立统一“地图图层”公开入口

目标：

- 用户不再感知 host 拼装细节

执行项：

1. Leaflet 侧提供高阶 layer API
2. MapLibre 侧提供高阶 layer API
3. 保持底层 adapter / host 继续可用

完成标准：

- 文档快速开始只有少量代码
- 高阶 API 与 Storybook 示例完全一致

## 当前优先级

按顺序执行：

1. 生命周期统一
2. 对外 API 收口到 `addTo / setOptions / remove`
3. `TriangleMultiPassLayer` 继续减肥
4. Leaflet / MapLibre 高阶入口统一

## 当前结论

WindyLib 现在最重要的任务不是继续扩抽象，而是：

- 让生命周期先明确
- 让公开 API 更短
- 让 `packages` 和应用层边界继续清晰
- 让文档、示例、Storybook 持续对齐

后续开发应优先做“减法和统一”，而不是重新引入新的框架层。
