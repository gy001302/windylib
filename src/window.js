import * as core from '../packages/core/src/index.js'
import * as layers from '../packages/layers/src/index.js'
import * as mapsLeaflet from '../packages/maps/leaflet/src/index.js'
import * as mapsMaplibre from '../packages/maps/maplibre/src/index.js'
import * as untilShaders from '../packages/until/src/index.ts'
import * as l7Core from '../packages/l7-core/src/index.ts'

const wl = {
  core,
  layers,
  maps: {
    leaflet: mapsLeaflet,
    maplibre: mapsMaplibre,
  },
  until: untilShaders,
  l7Core,
}

export {
  core,
  l7Core,
  layers,
  mapsLeaflet,
  mapsMaplibre,
  untilShaders,
  wl,
}
