const DEFAULT_DEBOUNCE_MS = 16

function noop() {}

export class LockedBoundsDeckLayer {
  constructor(options) {
    const {
      id,
      mapAdapter,
      updateLayers = noop,
      onBeforeRedraw = noop,
      onAfterRedraw = noop,
      debounceMs = DEFAULT_DEBOUNCE_MS,
      immediateEvents = ['load', 'moveend', 'zoomend', 'resize'],
    } = options ?? {}

    if (!id) {
      throw new Error('LockedBoundsDeckLayer: id is required.')
    }

    if (!mapAdapter) {
      throw new Error('LockedBoundsDeckLayer: mapAdapter is required.')
    }

    this.id = id
    this.mapAdapter = mapAdapter
    this.updateLayers = updateLayers
    this.onBeforeRedraw = onBeforeRedraw
    this.onAfterRedraw = onAfterRedraw
    this.debounceMs = debounceMs
    this.immediateEvents = new Set(immediateEvents)
    this.layerState = {
      layers: [],
      redrawCount: 0,
      lastReason: 'init',
      lastFrameAt: 0,
    }

    this._redrawTimer = null
    this._boundHandleMapEvent = this._handleMapEvent.bind(this)
  }

  attach() {
    this.mapAdapter.eventNames.forEach((eventName) => {
      this.mapAdapter.on(eventName, this._boundHandleMapEvent)
    })

    this.invalidate('attach', true)
    return this
  }

  detach() {
    this.mapAdapter.eventNames.forEach((eventName) => {
      this.mapAdapter.off(eventName, this._boundHandleMapEvent)
    })

    if (this._redrawTimer) {
      window.clearTimeout(this._redrawTimer)
      this._redrawTimer = null
    }

    return this
  }

  invalidate(reason = 'manual', immediate = false) {
    this.layerState.lastReason = reason

    if (immediate) {
      this._flushRedraw(reason)
      return
    }

    if (this._redrawTimer) {
      window.clearTimeout(this._redrawTimer)
    }

    this._redrawTimer = window.setTimeout(() => {
      this._redrawTimer = null
      this._flushRedraw(reason)
    }, this.debounceMs)
  }

  getSnapshot() {
    return {
      id: this.id,
      bounds: this.mapAdapter.getBounds(),
      viewState: this.mapAdapter.getViewState(),
      size: this.mapAdapter.getSize(),
      redrawCount: this.layerState.redrawCount,
      reason: this.layerState.lastReason,
      timestamp: Date.now(),
    }
  }

  getLayers() {
    return this.layerState.layers
  }

  _handleMapEvent(event) {
    const reason = event?.type ?? 'map-event'
    this.invalidate(reason, this.immediateEvents.has(reason))
  }

  _flushRedraw(reason) {
    const snapshot = this.getSnapshot()
    this.onBeforeRedraw(snapshot)

    const nextLayers = this.redraw(snapshot)
    this.layerState.layers = Array.isArray(nextLayers) ? nextLayers : []
    this.layerState.redrawCount += 1
    this.layerState.lastFrameAt = snapshot.timestamp
    this.layerState.lastReason = reason
    this.updateLayers(this.layerState.layers, snapshot)

    this.onAfterRedraw({
      ...snapshot,
      layers: this.layerState.layers,
    })
  }

  redraw() {
    throw new Error('LockedBoundsDeckLayer.redraw(snapshot) must be implemented by subclasses.')
  }
}
