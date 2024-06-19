const getWidthStyleStr = (config: any) => {
  const { widthMode } = config
  if (!widthMode || widthMode.mode === 'default') {
    return ''
  }
  const { mode, width } = widthMode
  if (mode === 'full') {
    return 'width: 100%;'
  }
  if (!width) {
    return ''
  }
  return !isNaN(width) ? `width: ${width}px;` : `width: ${width};`
}

export { getWidthStyleStr }
