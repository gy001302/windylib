# API 总览

WindyLib 当前对外提供 4 个主要入口包。

## `@windylib/core`

共享运行时能力：

- 相机基础能力
- 几何工具
- overlay renderer host
- multipass 基础设施

## `@windylib/layers`

可复用图层：

- `TriangleLayer`
- `TriangleMultiPassLayer`

## `@windylib/maps-leaflet`

Leaflet 侧适配层：

- `LeafletMapAdapter`
- `LeafletCanvasHost`

## `@windylib/maps-maplibre`

MapLibre 侧适配层：

- `MapLibreLayerHost`
- `MapLibreCameraSync`
- projection 工具函数
