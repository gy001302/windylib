import { LockedBoundsDeckLayer } from './LockedBoundsDeckLayer'

function buildGridPoints(bounds, step) {
  if (!bounds) {
    return []
  }

  const points = []

  for (let lng = bounds.west; lng <= bounds.east; lng += step) {
    for (let lat = bounds.south; lat <= bounds.north; lat += step) {
      const eastFactor = (lng - bounds.west) / Math.max(bounds.east - bounds.west, step)
      const northFactor = (lat - bounds.south) / Math.max(bounds.north - bounds.south, step)
      points.push({
        position: [Number(lng.toFixed(2)), Number(lat.toFixed(2))],
        u: Number((Math.sin(eastFactor * Math.PI * 2) * 12).toFixed(2)),
        v: Number((Math.cos(northFactor * Math.PI * 2) * 8).toFixed(2)),
      })
    }
  }

  return points
}

export class WindFieldLayerController extends LockedBoundsDeckLayer {
  constructor(options = {}) {
    super(options)
    this.gridStep = options.gridStep ?? 2
  }

  redraw(snapshot) {
    const particles = buildGridPoints(snapshot.bounds, this.gridStep)

    return [
      {
        id: `${this.id}-wind-field`,
        type: 'CustomWindFieldLayer',
        data: particles,
        bounds: snapshot.bounds,
        viewState: snapshot.viewState,
      },
    ]
  }
}
