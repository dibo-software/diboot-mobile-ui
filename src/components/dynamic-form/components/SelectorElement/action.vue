<script setup lang="ts" name="UploaderElementIndex">
import useComponentAction from '../hooks/use-component-action'
import popPicker from './popPicker.vue'
import { buildRelatedLoader } from '@/components/dynamic-form/utils/formModel/dynamicRelatedDataUtil'
type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}
const props = defineProps<Props>()
const {
  model,
  modelValue,
  disabledValue,
  config,
  labelWidth,
  showLabel,
  isRequired,
  rules,
  propName,
  setDefaultValue
} = useComponentAction({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex,
  hideFieldName: props.hideFieldName
})
// 非多选才生效
if (!config.multiple && config.defaultValueEnabled) setDefaultValue()

// 注入关联数据loaderMap与关联数据
const relatedDataLoaderMap = inject('related-data-loader-map', reactive<Record<string, any>>({}))
const relatedData = inject('related-data', reactive<Record<string, any>>({}))

const options = computed(() => {
  if (!relatedData || !config.id) {
    return []
  }
  return relatedData[config.id]
})

const selectorLoader = buildRelatedLoader(config)
const initConditions = () => {
  const { relationFilter } = config
  // 设置初识查询条件
  const configConditions = _.cloneDeep(config.conditions || [])
  if (relationFilter && relationFilter.origin && relationFilter.queryField && relationFilter.initType === 'filter') {
    const { origin, queryField: field } = relationFilter
    // 等待依赖字段默认值加载完成
    const value = model.value[origin] || ''
    configConditions.push({
      field,
      value
    })
  }
  if (selectorLoader != null) {
    console.log('selectorLoader', selectorLoader)
    // 设置conditions到selectorLoader
    selectorLoader.loader.conditions = configConditions
    relatedDataLoaderMap[config.id] = _.cloneDeep(selectorLoader)
  }
}
// 注册动态查询条件
const addDynamicConditions = () => {
  const { relationFilter } = config
  let conditions = _.cloneDeep(config.conditions || [])
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
      conditions = _.cloneDeep(config.conditions || [])
      if (value != null && value !== '') {
        conditions.push({
          field,
          value
        })
      }
      // 设置conditions到selectorLoader
      if (selectorLoader != null) {
        selectorLoader.loader.conditions = conditions
        relatedDataLoaderMap[config.id] = _.cloneDeep(selectorLoader)
      }
    }
  )
}
initConditions()
addDynamicConditions()
</script>
<template>
  <pop-picker
    v-model="modelValue"
    :type="config.type"
    :multiple="config.multiple"
    :label="showLabel"
    :rules="rules"
    :options="options"
    :config="config"
    :prop-name="propName"
    :required="isRequired"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
    :root-id="config.rootId"
  ></pop-picker>
</template>

<style lang="scss" scoped>
.tree-selector {
  :deep(.el-tree-node__content) {
    height: 32px;
  }
}
</style>
