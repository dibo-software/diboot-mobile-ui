import type { WritableComputedRef } from 'vue'
import { getMappingResultValue } from '../../utils/formModel/fieldsMappingConvertor'

const SUB_FORM_MAP_KEY = 'subFormMap'
export interface DataChangeOption {
  id: string
  config: any
  modelValue?: WritableComputedRef<any>
  model?: Record<string, any>
  modelIndex?: number
}

export default (option: DataChangeOption) => {
  const appModule = inject<string>('appModule', 'model-center')

  const { id: fieldName, config, modelValue } = option
  let model = ref<Record<string, any>>({})
  if (option.model) {
    model.value = toRaw(option.model)
  } else {
    /* eslint-disable vue/no-ref-as-operand */
    model = inject('model', ref<Record<string, any>>({}))
  }
  const rootModel = inject('root-model', ref<Record<string, any>>({}))
  const configMap: Record<string, any> = inject('config-map', {})
  const formConfig: Record<string, any> = inject('form-config', {})

  const dataList = computed({
    get: () => {
      return modelValue?.value
    },
    set: (v: any[]) => {
      modelValue?.value.clear()
      modelValue?.value.push(...v)
    }
  })

  const doDataChangeEvent4Custom = async (value: any, modelConfig: Record<string, any>) => {
    const { modelQueryApi, relations } = modelConfig
    if (!modelQueryApi || !relations || relations.length === 0) {
      ElMessage.warning('数据变更配置有误，自动操作失败')
      return []
    }
    const apis = modelQueryApi.split('__')
    let apiMethod = apis.length === 2 ? apis[0] : 'POST'
    apiMethod = apiMethod.toLowerCase()
    const apiUri = apis.length === 2 ? apis[1] : modelQueryApi
    const requestData = inject('request-data', {})
    let res = { code: -1, data: [], msg: '' }
    try {
      if (apiMethod.toLowerCase() === 'post') {
        res = await api.post(apiUri, { value, ...requestData })
      } else {
        res = await api.get(apiUri, { value, ...requestData })
      }
    } catch (e: any) {
      let msg = e.msg
      if (msg.includes(':')) {
        msg = msg.split(':')[1]
      }
      ElMessage.warning(msg)
      return []
    }
    if (res.code === 0) {
      const { data } = res
      if (data) {
        const values = []
        for (const r of relations) {
          const { origin, target, convertor } = r
          const resultVal = getMappingResultValue(data[origin], convertor)
          // 将originValue值设置给target的字段对应的表单元素中
          values.push({
            fieldName: target,
            value: resultVal
          })
        }
        return values
      }
    } else {
      ElMessage.warning(res.msg)
    }
    return []
  }

  const doDataChangeEvent4ModelName = async (value: any, entityConfig: Record<string, any>) => {
    const { modelName, searchField, relations } = entityConfig
    if (!modelName || !searchField || !relations || relations.length === 0) {
      ElMessage.warning('数据变更配置有误，自动操作失败')
      return []
    }
    const keyList = relations.map((item: Record<string, any>) => item.origin)
    const res = await api.post(`/${appModule}/dynamic-api/load-relation-record/${modelName}/${searchField}`, {
      value,
      keyList
    })
    if (res.code === 0) {
      const { data: record } = res
      if (record) {
        const values = []
        for (const r of relations) {
          const { origin: originKey, target, convertor } = r
          if (!originKey) {
            continue
          }
          const resultVal = getMappingResultValue(record[originKey], convertor)
          // 将originValue值设置给target的字段对应的表单元素中
          values.push({
            fieldName: target,
            value: resultVal
          })
        }
        return values
      }
    }
    return []
  }

  const doDataChangeEvent4Current = async (value: any, entityConfig: Record<string, any>) => {
    const { relations } = entityConfig
    if (!relations || relations.length === 0) {
      ElMessage.warning('数据变更配置有误，自动操作失败')
      return []
    }
    const values = []
    for (const r of relations) {
      const { target, convertor } = r
      const resultVal = getMappingResultValue(value, convertor)
      // 将originValue值设置给target的字段对应的表单元素中
      values.push({
        fieldName: target,
        value: resultVal
      })
    }
    return values
  }
  const doDataChangeEvent4Common = async (value: any, dataChangeConfig: Record<string, any>) => {
    const { type, modelConfig } = dataChangeConfig
    let values = []
    if (type === 'custom') {
      values = await doDataChangeEvent4Custom(value, modelConfig)
    } else if (type === 'dynamic') {
      values = await doDataChangeEvent4ModelName(value, modelConfig)
    } else {
      values = await doDataChangeEvent4Current(value, modelConfig)
    }
    return values
  }
  const invokeDataChangeEvent = async (value: any, dataChangeConfig?: Record<string, any>) => {
    if (value == null || value === '') {
      return false
    }
    if (dataChangeConfig == null) {
      dataChangeConfig = getDataChangeConfig()
    }
    if (dataChangeConfig == null) {
      return false
    }
    // 获取执行数据变更事件后的变更数据列白哦
    const values = await doDataChangeEvent4Common(value, dataChangeConfig)
    // 将values变更数据列表设置到表单数据中
    if (!values || values.length === 0) {
      return false
    }
    for (const item of values) {
      const { fieldName, value } = item
      model.value[fieldName] = value
    }
  }
  const getDataChangeConfig = () => {
    const { dataChangeConfig } = config
    if (!dataChangeConfig || !dataChangeConfig.mode || dataChangeConfig.trigger !== 'blur') {
      return undefined
    }
    return dataChangeConfig
  }

  const executeExpressions = async () => {
    let { expressionsObjList } = formConfig
    expressionsObjList = expressionsObjList || []
    // 全局公式列表格式为：[{sourceList: [], subSourceListMap: {}, target: '', expressions: ''}]
    const currentFieldNames: string[] = []
    const { id, type, formKey, fieldName, formScopeId: currentScopeId } = config // 元素配置信息
    if (type === 'date_range') {
      const { startFieldName, endFieldName } = config
      currentFieldNames.push(startFieldName)
      currentFieldNames.push(endFieldName)
    } else {
      currentFieldNames.push(fieldName)
    }
    // 当前表单配置信息
    const currentFromConfig = configMap[currentScopeId] || config
    // 检索当前字段相关的计算公式列表
    const objList: any[] = expressionsObjList.filter((obj: any) => {
      const { sourceList, subSourceListMap, formScopeId } = obj
      const hasCurrentFields = sourceList.some((item: any) => {
        return currentFieldNames.includes(item)
      })
      return (
        (hasCurrentFields && formScopeId === currentScopeId) ||
        (subSourceListMap &&
          ['sub_form'].includes(currentFromConfig.type) &&
          subSourceListMap[currentFromConfig.formKey])
      )
    })
    // 获取当前表单数据map
    const formDataMap = _.cloneDeep(model.value)
    // 对计算公式列表进行循环计算并赋值
    for (const obj of objList) {
      const { sourceList, subSourceListMap, target, expressions, formScopeId, decimalNumber } = obj
      // 检测是否所有字段都有值，如果没有，则跳过该公式计算
      const fullValueFlag = !sourceList.some((item: any) => {
        return formDataMap[item] == null
      })
      // 检测子字段是否都有值
      let fullSubValueFlag = true
      if (subSourceListMap) {
        for (const subFormKey in subSourceListMap) {
          if (!rootModel.value[subFormKey]) {
            fullSubValueFlag = false
            break
          }
        }
      }
      if (fullValueFlag && fullSubValueFlag) {
        // 整理仅需的数据
        const formData: Record<string, any> = {}
        sourceList.forEach((item: string) => {
          formData[item] = formDataMap[item]
        })
        if (subSourceListMap) {
          const subFormDataMap: Record<string, any> = {}
          for (const subFormKey in subSourceListMap) {
            let subFormDataList = rootModel.value[subFormKey]
            if (!(subFormDataList instanceof Array)) {
              subFormDataList = [subFormDataList]
            }
            subFormDataMap[subFormKey] = subFormDataList
              .map((itemMap: any) => {
                const row: Record<string, any> = {}
                const validSubSourceList = subSourceListMap[subFormKey]
                for (const f in itemMap) {
                  if (validSubSourceList.includes(f)) {
                    row[f] = itemMap[f]
                  }
                }
                return row
              })
              .filter((item: any) => Object.keys(item).length > 0)
          }
          formData[SUB_FORM_MAP_KEY] = subFormDataMap
        }
        // 开始执行
        const res = await api.post(`/${appModule}/form-formula/execute-expressions`, {
          expressions,
          decimalNumber,
          formData
        })
        if (res.code === 0) {
          // 设置到target
          if (Object.keys(subSourceListMap).length > 0) rootModel.value[target] = res.data
          else model.value[target] = res.data
        } else {
          console.log(res.msg)
        }
      }
    }
  }
  return {
    dataList,
    executeExpressions,
    getDataChangeConfig,
    invokeDataChangeEvent
  }
}
