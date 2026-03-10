import { LockedBoundsDeckLayer } from './LockedBoundsDeckLayer'

export class WeatherLayerController extends LockedBoundsDeckLayer {
  redraw(snapshot) {
    return this.renderWeatherLayers(snapshot)
  }

  renderWeatherLayers() {
    throw new Error('WeatherLayerController.renderWeatherLayers(snapshot) must be implemented by subclasses.')
  }
}
