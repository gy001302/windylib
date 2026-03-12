export default {
  title: 'WindyLib',
  description: '面向 Leaflet 与 MapLibre 的三角形图层与地图叠加渲染库。',
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/overview' },
      { text: 'Storybook', link: '/guide/storybook' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '架构设计', link: '/guide/architecture' },
            { text: 'TriangleLayer 使用', link: '/guide/triangle-layer' },
            { text: 'Leaflet 接入', link: '/guide/leaflet-integration' },
            { text: 'MapLibre 接入', link: '/guide/maplibre-integration' },
            { text: 'Storybook', link: '/guide/storybook' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: '总览', link: '/api/overview' },
            { text: 'Core', link: '/api/core' },
            { text: 'Layers', link: '/api/layers' },
            { text: 'Maps Leaflet', link: '/api/maps-leaflet' },
            { text: 'Maps MapLibre', link: '/api/maps-maplibre' },
          ],
        },
      ],
    },
  },
}
