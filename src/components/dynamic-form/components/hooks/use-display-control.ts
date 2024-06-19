import _ from 'lodash'

export interface DisplayControlOption {
  config: any
  model?: Record<string, any>
  hiddenComponentIds?: string[]
  updateHiddenComonentIds?: (hiddenComponentIds: string[]) => void
}

export default (option: DisplayControlOption) => {
  const hiddenComponentIds = inject('hidden-component-ids', ref<string[]>([]))
  // 获取model对象
  let model = ref<Record<string, any>>({})
  const requestData = inject('request-data', {})
  if (option.model) {
    model.value = toRaw(option.model)
  } else {
    /* eslint-disable vue/no-ref-as-operand */
    model = inject('model', ref<Record<string, any>>({}))
  }
  // 获取configMap
  const configMap: Record<string, any> = inject('config-map', {})

  const executeDisplayControl = (val: any) => {
    doExecuteDisplayControl(val, option.config)
  }

  const doExecuteDisplayControl = (val: any, config: any, hiddenAll?: boolean) => {
    // 获取当前组件的所有显示受控参数配置
    const { displayControls } = config
    if (!displayControls || displayControls.length === 0) {
      return false
    }

    // 得出当前需显示与隐藏的组件ID列表
    const hiddenIds = []
    const showIds = []
    for (const displayConfig of displayControls) {
      const { mode, values, componentIds } = displayConfig
      // 获取多选情况下的数据匹配方式（部分匹配or/全匹配and）
      let { matchRule } = displayConfig
      matchRule = matchRule || 'or'
      if (
        !mode ||
        values == null ||
        (values instanceof Array && values.length === 0) ||
        (values instanceof String && !values) ||
        !componentIds ||
        componentIds.length === 0
      ) {
        continue
      }
      // 隐藏所有，则全部hidden
      if (hiddenAll) {
        hiddenIds.push(...componentIds)
        continue
      }
      // 否则，进行显隐判定
      let hasValue = false
      if (values instanceof Array) {
        hasValue = hasValue4multiple(values, val, matchRule)
      } else {
        hasValue = values === val
      }
      const showModules = mode === 'contains' ? hasValue : !hasValue
      if (showModules) {
        showIds.push(...componentIds)
      } else {
        hiddenIds.push(...componentIds)
      }
    }
    // 对当前作用域下的隐藏组件ID列表做调整
    updateHiddenComponentIds(hiddenIds, showIds)

    // 对隐藏组件递归执行控制
    for (const moduleId of hiddenIds) {
      const subConfig = configMap[moduleId]
      if (subConfig && subConfig.fieldName) {
        const subValue = getValue4config(subConfig)
        doExecuteDisplayControl(subValue, subConfig, true)
      }
    }
  }

  const getValue4config = (config: any) => {
    const { fieldName } = config
    // 如果具有formScopeId，则从formScopeId对应的子表单数据中取值
    if (fieldName) {
      return model.value[fieldName]
    }
    return undefined
  }

  const updateHiddenComponentIds = (hiddenIds: string[], showIds: string[]) => {
    let newHiddenComponentIds: string[] = []
    // 收集所有隐藏组件ID列表
    if (option.hiddenComponentIds) {
      newHiddenComponentIds.push(...option.hiddenComponentIds)
    } else {
      newHiddenComponentIds.push(...hiddenComponentIds.value)
    }
    newHiddenComponentIds.push(...hiddenIds)
    // 过滤掉显示组件ID列表
    newHiddenComponentIds = newHiddenComponentIds.filter(id => !showIds.includes(id))
    // 对组件ID去重
    newHiddenComponentIds = [...new Set(newHiddenComponentIds)]
    if (option.hiddenComponentIds) {
      if (option.updateHiddenComonentIds) {
        option.updateHiddenComonentIds(newHiddenComponentIds)
      } else {
        option.hiddenComponentIds.length = 0
        option.hiddenComponentIds.push(...newHiddenComponentIds)
      }
    } else {
      hiddenComponentIds.value = [...new Set(newHiddenComponentIds)]
    }
  }

  const hasValue4multiple = (values: any[], val: any, matchRule?: string) => {
    matchRule = matchRule || 'or'
    // 根据val的类型分别进行处理
    if (val instanceof Array) {
      // 如果val为数组类型，则根据匹配类型进行判定
      if (matchRule === 'strict') {
        // 严格匹配，则一一比对选项
        const _values = _.cloneDeep(values)
        const _val = _.cloneDeep(val)
        _values.sort()
        _val.sort()
        return JSON.stringify(_values) === JSON.stringify(_val)
      } else if (matchRule === 'and') {
        // 全部匹配，则包含全部选项的时候，即可通过判定
        if (val.length === 0) {
          return false
        }
        const exist = !values.some(v => !val.includes(v))
        return exist
      } else {
        const exist = val.some(item => values.includes(item))
        return exist
      }
    } else {
      return values.includes(val)
    }
  }

  return {
    executeDisplayControl,
    updateHiddenComponentIds
  }
}
