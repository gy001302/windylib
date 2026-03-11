export class MapHost {
  static componentName = 'MapHost'

  constructor(options = {}) {
    this.props = { ...(options.initialProps ?? {}) }
  }

  attach() {
    return this
  }

  detach() {
    return this
  }

  setProps(nextProps = {}) {
    const previousProps = this.props
    this.props = {
      ...this.props,
      ...nextProps,
    }
    this.onPropsChange({
      props: this.props,
      oldProps: previousProps,
      nextProps,
    })
    return this
  }

  requestRender() {}

  getMap() {
    return null
  }

  getMapAdapter() {
    return null
  }

  getHostKind() {
    return 'unknown'
  }

  supportsSharedCanvas() {
    return false
  }

  onPropsChange() {}
}
