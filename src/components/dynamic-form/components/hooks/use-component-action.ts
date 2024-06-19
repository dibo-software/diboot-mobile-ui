import { getWidthStyleStr } from '../..//utils/formItemWidth'
import { convertToRules } from '../../utils/formModel/formValidator'
import moment from 'moment'

export interface ComponentActionOption {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}

export default (option: ComponentActionOption) => {
  let model = ref<Record<string, any>>({})
  const requestData = inject('request-data', {})
  if (option.model) {
    model.value = toRaw(option.model)
  } else {
    /* eslint-disable vue/no-ref-as-operand */
    model = inject('model', ref<Record<string, any>>({}))
  }
  const disabled: boolean = inject('disabled', false)
  const disabledProps: string[] = inject('disabled-props', [])
  const formScopeId: string = inject('form-scope-id', '')
  const configMap: Record<string, any> = inject('config-map', {})
  const formConfig: Record<string, any> = inject('form-config', {})
  const { id, config, modelIndex } = option
  let hideFieldName = option.hideFieldName
  if (!hideFieldName) {
    hideFieldName = config.hideFieldName
  }
  const { fieldName, fieldLabel } = config
  const labelWidth = hideFieldName === true ? 'auto' : undefined
  const showLabel = hideFieldName === true ? undefined : fieldLabel
  const widthStyleStr = getWidthStyleStr(config)

  const getIsRequired = () => {
    const validateRules = config.validateRules
    return validateRules && validateRules.some((rule: Record<string, any>) => rule.type === 'notnull')
  }
  
  const getDefaultFieldName = () => {
    if (config.type === 'sub_form') {
      let subFormKey = config.formKey
      subFormKey = subFormKey.charAt(0).toLowerCase() + subFormKey.slice(1)
      if (config.relType === 'many') {
        subFormKey += 'List'
      }
      return subFormKey
    } else {
      return fieldName
    }
  }

  const getRulesExtInfo = (): Record<string, any> => {
    // 如果是子表单，则需要获取子表单模型名称
    let modelName = formConfig?.formKey
    if (config.formScopeId && configMap) {
      const subFormConfig = configMap[config.formScopeId]
      if (subFormConfig) {
        modelName = subFormConfig.formKey
      }
    }
    const extInfo: Record<string, any> = {
      modelName
    }
    if (model.value?.id) {
      extInfo.id = model.value?.id
    }
    if (config.fieldName) {
      extInfo.field = config.fieldName
    }
    return extInfo
  }

  const getRules = () => {
    const { validateRules } = config
    const extensionInfo: Record<string, any> = {}
    // 对于具有id的记录，传入id
    if (model.value?.id) {
      extensionInfo.id = id
    }
    return convertToRules(validateRules, extensionInfo, {}, getRulesExtInfo)
  }

  const getPropName = (fieldName?: string) => {
    if (!fieldName) {
      fieldName = config.fieldName
    }
    let propName = ''
    if (option.modelIndex != null) {
      propName += `${option.modelIndex}.`
    }
    propName += fieldName
    return propName
  }

  const modelValue = computed({
    get: () => {
      const fieldName = getDefaultFieldName()
      if (model?.value && fieldName) {
        return model.value[fieldName]
      } else {
        return ''
      }
    },
    set: (v: any) => {
      /* eslint-disable vue/no-ref-as-operand */
      if (model) {
        const fieldName = getDefaultFieldName()
        model.value[fieldName] = v
      }
    }
  })

  const disabledValue = computed(() => {
    if (disabled) {
      return true
    }
    // 根据禁用字段属性列表判断是否禁用
    const { fieldName } = config
    let fullFieldName = ''
    if (formScopeId && configMap[formScopeId]) {
      const config: any = configMap[formScopeId]
      if (config && config.formKey) {
        fullFieldName = `${config.formKey}.`
      }
    }
    fullFieldName += fieldName
    if (fullFieldName != null && disabledProps && disabledProps.includes(fullFieldName)) {
      return true
    }
    // 根据自身设置属性判断是否禁用
    const { disabled: configDisabled } = config
    if (configDisabled != null) {
      return configDisabled
    }
    return false
  })

  const setDefaultValue = async () => {
    const defaultValue = await getDefaultValueFromConfig(config)
    const { type, fieldType, multiple } = config
    if (defaultValue && (modelValue.value == null || modelValue.value === '')) {
      if (fieldType === 'checkbox' || multiple) {
        modelValue.value = defaultValue.split(',')
      } else if (type === 'datepicker') {
        // 对于日期选择器设置当前默认值
        if (defaultValue === 'current') {
          let formatter = 'YYYY-MM-DD'
          const timeSelected = config.timeSelected
          if (timeSelected) {
            formatter = 'YYYY-MM-DD HH:mm:ss'
          }
          modelValue.value = moment().format(formatter)
        }
      } else if (type === 'timepicker') {
        // 对于时间选择设置当前时间
        if (defaultValue === 'current') {
          const formatter = 'HH:mm:ss'
          modelValue.value = moment().format(formatter)
        }
      } else {
        modelValue.value = defaultValue
      }
    } else if (config.type === 'switch' && (modelValue.value == null || modelValue.value === '')) {
      // 如果是switch组件且未设置初始值，则设置为false
      modelValue.value = false
    }
  }
  const getDefaultValueFromConfig = async (config: any) => {
    const { defaultValueSource, defaultValue } = config
    // 如果配置了从接口数据设置初始值，则从接口中获取数据
    if (defaultValueSource && defaultValueSource.mode === 'api' && defaultValueSource.api) {
      const { api: apiUrl, key } = defaultValueSource
      const apis = apiUrl.split('__')
      let apiMethod = apis.length === 2 ? apis[0] : 'POST'
      apiMethod = apiMethod.toLowerCase()
      const apiUri = apis.length === 2 ? apis[1] : apiUrl
      let res
      if (apiMethod.toLowerCase() === 'post') {
        res = await api.post(apiUri, requestData)
      } else {
        res = await api.get(apiUri, requestData)
      }
      if (res.code === 0) {
        const { data } = res
        if (data) {
          if (key && data[key]) {
            return data[key]
          } else if (typeof data === 'string') {
            return data
          }
        }
      }
    } else if (defaultValue != null && defaultValue !== '') {
      return defaultValue
    } else {
      return ''
    }
  }

  const isRequired = getIsRequired()

  const rules = getRules()
  const propName = getPropName()

  return {
    model,
    modelValue,
    disabledValue,
    config,
    labelWidth,
    widthStyleStr,
    showLabel,
    isRequired,
    rules,
    propName,
    setDefaultValue,
    getPropName
  }
}
