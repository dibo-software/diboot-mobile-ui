const findLabel = (dataList: LabelValue[] = [], val: any | any[], splitFlag?: string): string | undefined => {
  console.log('dataList', dataList)
  console.log('val', val)
  splitFlag = splitFlag || '、'
  if (Array.isArray(val)) {
    return val.map(e => findLabel(dataList, e)).join(splitFlag)
  } else {
    for (const data of dataList) {
      if (data.value === val) return data.label
      else if (data.children?.length) {
        const label = findLabel(data.children, val)
        if (label) {
          return label
        }
      }
    }
  }
  return ''
}

export { findLabel }
