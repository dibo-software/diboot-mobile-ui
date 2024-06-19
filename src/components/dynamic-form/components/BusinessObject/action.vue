<script setup lang="ts" name="BusinessObjectAction">
import useComponentAction from '../hooks/use-component-action'
import useDataChange from '../hooks/use-data-change'
import popPicker from './popPicker.vue'
type Props = {
  id: string
  config?: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}
const props = defineProps<Props>()
const appModule = inject('app-module', '')
const { model, modelValue, disabledValue, config, labelWidth, showLabel, isRequired, rules, propName } =
  useComponentAction({
    id: props.id,
    config: props.config,
    model: props.model,
    modelIndex: props.modelIndex,
    hideFieldName: props.hideFieldName
  })

const { invokeDataChangeEvent } = useDataChange({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex
})

const onDataChange = (val: any) => {
  if (config.multiple) {
    return false
  }
  invokeDataChangeEvent(val)
}

const showSelector = ref(false)
const conditions = ref([])

const delay = (count: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, count)
  })
}
// 初始化查询条件
const initConditions = async () => {
  const { relationFilter } = config
  // 设置初识查询条件
  const configConditions = _.cloneDeep(config.conditions || [])
  if (relationFilter && relationFilter.origin && relationFilter.queryField && relationFilter.initType === 'filter') {
    const { origin, queryField: field } = relationFilter
    // 等待依赖字段默认值加载完成
    await delay(200)
    const value = model.value[origin] || ''
    configConditions.push({
      field,
      value
    })
  }
  conditions.value = configConditions || []
  showSelector.value = true
}
// 注册动态查询条件
const addDynamicConditions = () => {
  const { relationFilter } = config
  if (!relationFilter) {
    return
  }
  const { origin, queryField: field } = relationFilter
  if (!origin || !field) {
    return
  }
  // 监听当前origin字段变化
  watch(
    () => model.value[origin],
    value => {
      const configConditions = _.cloneDeep(config.conditions || [])
      if (value != null && value !== '') {
        configConditions.push({
          field,
          value
        })
      }
      // 对业务对象选择列表数据重新获取
      conditions.value = configConditions
    }
  )
}
onMounted(() => {
  initConditions()
})
// 注册动态查询条件
addDynamicConditions()
</script>
<template>
  <pop-picker
    :key="JSON.stringify(conditions)"
    :conditions="conditions"
    v-model="modelValue"
    :type="config.type"
    :multiple="config.multiple"
    :label="showLabel"
    :rules="rules"
    :prop-name="propName"
    :required="isRequired"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
    :config="config"
    @update:model-value="onDataChange"
  ></pop-picker>
</template>

<style lang="scss" scoped></style>
