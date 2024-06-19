<script setup lang="ts" name="DatetimeElementIndex">
import useComponentAction from '../hooks/use-component-action'
import useDataChange from '../hooks/use-data-change'
import moment from 'moment'
import popPicker from './popPicker.vue'

type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}
const props = defineProps<Props>()
const appModule = inject('app-module', '')
const {
  modelValue,
  model,
  disabledValue,
  config,
  labelWidth,
  widthStyleStr,
  showLabel,
  isRequired,
  rules,
  propName,
  getPropName,
  setDefaultValue
} = useComponentAction({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex,
  hideFieldName: props.hideFieldName
})
const { invokeDataChangeEvent, executeExpressions } = useDataChange({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex
})

const startFieldRules = [
  {
    validator: (val: any) => {
      return new Promise((resolve, reject) => {
        const endDatetime = model.value[config.endFieldName]
        // 检测区间选择是否设置完整
        if (!val && endDatetime) {
          resolve(`请选择${config.startFieldLabel}`)
          return
        }
        // 检测开始时间是否早于结束时间
        if (val && endDatetime) {
          const result = moment(val).isBefore(endDatetime)
          if (!result) {
            resolve(`须早于${config.endFieldLabel}`)
            return
          }
        }
        resolve('')
      })
    }
  }
]
startFieldRules.push(...rules)
const endFieldRules = [
  {
    validator: (val: any) => {
      return new Promise((resolve, reject) => {
        const startDatetime = model.value[config.startFieldName]
        // 检测区间选择是否设置完整
        if (!val && startDatetime) {
          resolve(`请选择${config.endFieldLabel}`)
          return
        }
        // 检测结束时间是否晚于开始时间
        if (val && startDatetime) {
          const result = moment(val).isAfter(startDatetime)
          if (!result) {
            resolve(`须晚于${config.startFieldLabel}`)
            return
          }
        }
        resolve('')
      })
    }
  }
]
endFieldRules.push(...rules)

const getPickerType = (config: any) => {
  const { pickerType } = config
  if (pickerType === 'year') {
    return ['year']
  } else if (pickerType === 'month') {
    return ['year', 'month']
  } else {
    return ['year', 'month', 'day']
  }
}
const datePickerType = getPickerType(config)
const onDataChange = (val: any) => {
  invokeDataChangeEvent(val)
  executeExpressions()
}
const isDateRange: boolean = config.type === 'date_range'

const convert2showValue = (val: string) => {
  if (datePickerType.includes('month') && datePickerType.includes('day')) {
    return val
  }
  const vals = val ? val.split('-') : []
  if (vals.length !== 3) {
    return val
  }
  let result = vals[0]
  if (datePickerType.includes('month')) {
    result += `-${vals[1]}`
  }
  if (datePickerType.includes('day')) {
    result += `-${vals[2]}`
  }
  return result
}
const convert2modelValue = (val: string) => {
  let result = val
  if (!datePickerType.includes('month')) {
    result += '-01'
  }
  if (!datePickerType.includes('day')) {
    result += '-01'
  }
  return result
}

// 日期区间选择值重载
const startModelValue = computed({
  get: () => {
    const { startFieldName } = config
    return convert2showValue(model.value[startFieldName])
  },
  set: v => {
    const { startFieldName } = config
    model.value[startFieldName] = convert2modelValue(v)
  }
})
const endModelValue = computed({
  get: () => {
    const { endFieldName } = config
    return convert2showValue(model.value[endFieldName])
  },
  set: v => {
    const { endFieldName } = config
    model.value[endFieldName] = convert2modelValue(v)
  }
})
// 单字段选择值处理
const defaultModelValue = computed({
  get: () => {
    const { fieldName } = config
    return convert2showValue(model.value[fieldName])
  },
  set: v => {
    const { fieldName } = config
    model.value[fieldName] = convert2modelValue(v)
  }
})
onMounted(async () => {
  await setDefaultValue()
})
</script>
<template>
  <template v-if="config.type === 'date_range'">
    <pop-picker
      v-model="startModelValue"
      :label="config.startFieldLabel"
      :rules="startFieldRules"
      :prop-name="getPropName(config.startFieldName)"
      :required="isRequired"
      :disabled="disabledValue"
      :placeholder="config.placeholder"
      :picker-type="datePickerType"
      :config="config"
      :type="config.type"
      :time-selected="config.timeSelected"
      @update:model-value="onDataChange"
    ></pop-picker>
    <pop-picker
      v-model="endModelValue"
      :label="config.endFieldLabel"
      :config="config"
      :rules="endFieldRules"
      :prop-name="getPropName(config.endFieldName)"
      :required="isRequired"
      :disabled="disabledValue"
      :placeholder="config.placeholder"
      :picker-type="datePickerType"
      :type="config.type"
      :time-selected="config.timeSelected"
      @update:model-value="onDataChange"
    ></pop-picker>
  </template>
  <pop-picker
    v-else
    v-model="defaultModelValue"
    :label="showLabel"
    :rules="rules"
    :prop-name="propName"
    :required="isRequired"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
    :picker-type="datePickerType"
    :config="config"
    :type="config.type"
    :time-selected="config.timeSelected"
    @update:model-value="onDataChange"
  ></pop-picker>
</template>
