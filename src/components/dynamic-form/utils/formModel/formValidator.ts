import { isReactive } from 'vue'
type FormItemValidateRule = {
  mode: string
  msg: string
  type?: string
  params?: CustomValidatorParam[]
  api?: string
  validator?: CustomValidator
}

type CustomValidatorParam = {
  value: any
  label: string
  placeholder?: string
}

type CustomValidator = {
  type: string
  name: string
  reg?: RegExp | null
  msg: string
  msgTemplate?: string
  validate?: (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) => Promise<boolean>
  params?: CustomValidatorParam[]
  afterParamsChange?: (validator: FormItemValidateRule) => void
}

const isEmpty = (val: any) => {
  let emptyFlag = false
  if (typeof val === 'object') {
    let obj = val
    if (isReactive(val)) {
      obj = toRefs(val)
    }
    emptyFlag = Object.keys(obj).length <= 0
  } else {
    emptyFlag = val === '' || val === undefined || val === null
  }
  return emptyFlag
}

const customValidators: CustomValidator[] = [
  {
    type: 'notnull',
    name: '必填',
    reg: undefined,
    msg: '当前值不能为空',
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      return !isEmpty(val)
    }
  },
  {
    type: 'unique',
    name: '唯一性校验',
    reg: undefined,
    msg: '当前值有重复',
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!getExtInfo) {
        return false
      }
      const extInfo = getExtInfo()
      if (!extInfo) {
        return false
      }
      const modelName = extInfo.modelName
      let field = extInfo.field
      // 针对具有点号的字段名，取最后一段
      if (field.includes('.')) {
        field = field.substring(field.lastIndexOf('.') + 1)
      }
      const url = `/model-center/dynamic-api/${modelName}/check-unique`
      const formData: Record<string, any> = {
        field,
        value: val
      }
      if (extInfo.id) {
        formData.id = extInfo.id
      }
      try {
        const res = await api.get(url, formData)
        if (res.code === 0) {
          if (res.data !== undefined) {
            return !!res.data
          } else {
            return true
          }
        }
        return false
      } catch (e) {
        return false
      }
    }
  },
  {
    type: 'lengthLimit',
    name: '长度限制',
    msg: '',
    msgTemplate: '请将长度控制在 params_0 以内',
    params: [
      {
        value: 0,
        label: '最大长度',
        placeholder: '请输入最大长度'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      if (val.length <= paramValue) {
        return true
      } else {
        return false
      }
    }
  },
  {
    type: 'email',
    name: '邮箱',
    reg: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    msg: '请输入正确的邮箱'
  },
  {
    type: 'idcard',
    name: '身份证号',
    reg: /^\d{15}|\d{18}$/,
    msg: '请输入正确的身份证号'
  },
  {
    type: 'cellphone',
    name: '手机号码',
    reg: /^1\d{10}$/,
    msg: '请输入正确的手机号码',
    validate: undefined
  },
  {
    type: 'gt',
    name: '大于',
    msg: '',
    msgTemplate: '请输入大于 params_0 的值',
    params: [
      {
        value: 0,
        label: '值 > ',
        placeholder: '值大于多少？'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      if (val > paramValue) {
        return true
      } else {
        return false
      }
    }
  },
  {
    type: 'gte',
    name: '大于等于',
    msg: '',
    msgTemplate: '请输入大于等于 params_0 的值',
    params: [
      {
        value: 0,
        label: '值 >= ',
        placeholder: '值大于等于多少？'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      if (val >= paramValue) {
        return true
      } else {
        return false
      }
    }
  },
  {
    type: 'lt',
    name: '小于',
    msg: '',
    msgTemplate: '请输入小于 params_0 的值',
    params: [
      {
        value: 0,
        label: '值 < ',
        placeholder: '值 < ?'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      if (val < paramValue) {
        return true
      } else {
        return false
      }
    }
  },
  {
    type: 'lte',
    name: '小于等于',
    msg: '',
    msgTemplate: '请输入小于等于 params_0 的值',
    params: [
      {
        value: 0,
        label: '值 <= ',
        placeholder: '值小于等于多少？'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      if (val <= paramValue) {
        return true
      } else {
        return false
      }
    }
  },
  {
    type: 'between',
    name: '在多少之间',
    msg: '',
    params: [
      {
        value: 0,
        label: '最小值',
        placeholder: '请输入最小值'
      },
      {
        value: false,
        label: '含最小值'
      },
      {
        value: 10,
        label: '最大值',
        placeholder: '请输入最大值'
      },
      {
        value: true,
        label: '含最大值'
      }
    ],
    afterParamsChange: function (validateRule: FormItemValidateRule) {
      const { params } = validateRule
      if (!params) {
        return
      }
      const minValue = params[0].value
      const maxValue = params[2].value
      if (minValue >= maxValue) {
        showNotify({ type: 'warning', message: '请勿设置最小值 大于 最大值的情况！' })
      }
      // 处理是否包含最小值和最大值的情况
      validateRule.msg = `请输入大于${params[1].value ? '等于' : ''} ${minValue} 并 小于${
        params[3].value ? '等于' : ''
      } ${maxValue} 的值`
    },
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const minValue = params[0].value
      const containsMin = params[1].value
      const maxValue = params[2].value
      const containsMax = params[3].value
      if (minValue == null && maxValue == null) {
        return true
      }
      if (val < minValue) {
        return false
      } else if (val === minValue && !containsMin) {
        return false
      } else if (val > maxValue) {
        return false
      } else if (val === maxValue && !containsMax) {
        return false
      }
      return true
    }
  },
  {
    type: 'regExp',
    name: '正则表达式',
    msg: '',
    msgTemplate: '请输入正确值',
    params: [
      {
        value: '',
        label: '正则',
        placeholder: '正则表达式'
      }
    ],
    validate: async function (val: any, params?: CustomValidatorParam[], getExtInfo?: () => Record<string, any>) {
      if (!val || !params || params.length === 0) {
        return true
      }
      const paramValue = params[0].value
      if (paramValue == null) {
        return true
      }
      // 开始正则校验
      try {
        const regExp = new RegExp(paramValue)
        return regExp.test(val)
      } catch (e) {
        console.log('正则校验失败', e)
        return false
      }
    }
  }
]

const generalValidate = async function (
  value: any,
  validations: FormItemValidateRule[],
  requestData: Record<string, any> = {},
  getExtInfo?: () => Record<string, any>
) {
  // 如果校验规则为空，则直接通过校验
  if (!validations || validations.length === 0) {
    return ''
  }
  let result
  for (const validation of validations) {
    const { mode, api: validateApi, type, msg, params } = validation
    if (mode === 'custom') {
      const customValidation = customValidators.find(item => {
        return item.type === type
      })
      if (customValidation == null) {
        continue
      }
      // 如果值为空且不为非空校验，则跳过
      const isNull = isEmpty(value)
      console.log('isNull', isNull, type, value)
      if (isNull && type !== 'notnull') {
        continue
      }
      const { reg, validate } = customValidation
      if (reg) {
        if (!reg.test(value)) {
          result = msg
          break
        }
      } else if (validate && typeof validate === 'function') {
        try {
          const boolResult = await validate(value, params, getExtInfo)
          if (!boolResult) {
            result = msg
            break
          }
        } catch (e) {
          console.log('自定义校验函数出错', e)
          break
        }
      }
    } else if (mode === 'api' && validateApi) {
      try {
        const apis: string[] = validateApi.split('__')
        let apiMethod: string = apis.length === 2 ? apis[0] : 'POST'
        apiMethod = apiMethod.toLowerCase()
        const apiUri: string = apis.length === 2 ? apis[1] : validateApi
        const data = { value, ...requestData }
        if (getExtInfo) {
          const extInfo = getExtInfo()
          Object.assign(data, extInfo)
        }
        let res: Record<string, any> = { code: 0, data: true }
        if (apiMethod.toLowerCase() === 'post') {
          res = await api.post(apiUri, data)
        } else {
          res = await api.get(apiUri, data)
        }
        if (res.code === 0) {
          if (res.data != null && res.data !== true) {
            result = msg || res.msg || ''
            break
          }
        } else {
          result = msg || res.msg || ''
          break
        }
      } catch (e: any) {
        console.log('校验异常', e)
        result = msg || e.msg || ''
        break
      }
    }
  }
  return result
}

const convertToRules = (
  validateRules: FormItemValidateRule[],
  extensionInfo: Record<string, any>,
  requestData: Record<string, any>,
  getExtInfo?: () => Record<string, any>
) => {
  Object.assign(extensionInfo, requestData)
  return [
    {
      validator: (val: any) => {
        return new Promise((resolve, reject) => {
          generalValidate(val, validateRules, extensionInfo, getExtInfo)
            .then(msg => {
              resolve(msg)
            })
            .catch(() => {
              reject('校验失败')
            })
        })
      }
    }
  ]
}

export { customValidators, generalValidate, convertToRules }
export type { FormItemValidateRule, CustomValidatorParam, CustomValidator }
