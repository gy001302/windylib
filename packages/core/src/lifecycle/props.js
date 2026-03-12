function isPropDefinition(value) {
  return Boolean(value) && typeof value === 'object' && 'value' in value
}

function getPropDefinition(defaultProps, key) {
  const propDefinition = defaultProps?.[key]
  return isPropDefinition(propDefinition) ? propDefinition : null
}

export function resolveDefaultProps(defaultProps = {}) {
  return Object.fromEntries(
    Object.entries(defaultProps).map(([key, value]) => {
      if (isPropDefinition(value)) {
        return [key, value.value]
      }

      return [key, value]
    }),
  )
}

export function diffLayerProps({
  defaultProps = {},
  oldProps = {},
  props = {},
  nextProps = {},
} = {}) {
  const previousProps = oldProps ?? {}
  const changedProps = Object.keys(nextProps).filter((key) => {
    const propDefinition = getPropDefinition(defaultProps, key)
    if (propDefinition?.compare === false) {
      return false
    }

    return props[key] !== previousProps[key]
  })

  return {
    propsChanged: changedProps.length > 0,
    dataChanged: changedProps.includes('vertices') || changedProps.includes('subdivisionSteps'),
    viewportChanged: false,
    updateTriggersChanged: false,
    changedProps,
  }
}
