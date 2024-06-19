const customConvertors = [
  {
    type: 'score2label',
    name: '分数转换为合格/不合格',
    convert: function (val: any, params: any[]) {
      if (val > 60) {
        return '合格'
      } else {
        return '不合格'
      }
    }
  },
  {
    type: 'yearAutoIncrement',
    name: '年份+1',
    convert: function (val: any, params: any[]) {
      if (!val) {
        return val
      }
      try {
        const yearCount = parseInt(val)
        const nextCount = yearCount + 1
        return val.replace(`${yearCount}`, `${nextCount}`)
      } catch (e) {
        console.error('年份+1出错', e)
        return val
      }
    }
  }
]

const convertorOptions = customConvertors.map((item: any) => {
  return {
    label: item.name,
    value: item.type
  }
})

/**
 * 映射数值转换
 * @param val
 * @param convertorType
 * @param params
 * @returns {string|*}
 */
const mappingValueConvert = (val: any, convertorType: string, params: any[]) => {
  const convertor = customConvertors.find(item => item.type === convertorType)
  if (convertor === undefined || convertor.convert === undefined) {
    return val
  }
  return convertor.convert(val, params)
}

/**
 * 获取经过规则转换的结果值
 * @param value
 * @param convertor
 * @returns {string|*}
 */
const getMappingResultValue = (value: any, convertor: any) => {
  // 如果配置了转换器，则需要经过转换器进行转换
  if (convertor && convertor.type) {
    const { type, params } = convertor
    return mappingValueConvert(value, type, params)
  } else {
    return value
  }
}

export { customConvertors, convertorOptions, mappingValueConvert, getMappingResultValue }
