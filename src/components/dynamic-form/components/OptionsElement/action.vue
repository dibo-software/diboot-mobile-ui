<script setup lang="ts" name="OptionsElementIndex">
import useFormRuntimeStore from '../../../../stores/formRuntime'
import useComponentAction from '../../components/hooks/use-component-action'
import useDataChange from '../hooks/use-data-change'
import useDisplayControl from '../hooks/use-display-control'
import popPicker from './popPicker.vue'
import _ from 'lodash'
import IconTooltip from '@/components/icon-tooltip/index.vue'

const formRuntimeStore = useFormRuntimeStore()

type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
  hiddenComponentIds?: string[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:hiddenComponentIds', val: string[]): void
}>()
const appModule = inject('app-module', 'model-center')
const {
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
  setDefaultValue
} = useComponentAction({
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
const { executeDisplayControl } = useDisplayControl({
  config,
  hiddenComponentIds: props.hiddenComponentIds,
  updateHiddenComonentIds: (val: string[]) => {
    emit('update:hiddenComponentIds', val)
  }
})

const options = ref<Record<string, any>>([])

const loadModelOptions = async (
  optionsConfig: Record<string, any>,
  conditions?: Record<string, any>[],
  cacheIgnore?: boolean
) => {
  const modelName = optionsConfig.modelName
  const appModule = optionsConfig.appModule || 'model-center'
  conditions = conditions || optionsConfig.conditions || []
  if (!modelName) {
    return []
  }
  let key = `model__${modelName}`
  if (optionsConfig.conditions.length > 0) {
    key = `model_${config.id}`
  }
  // 读取选项缓存列表
  if (!cacheIgnore && formRuntimeStore.cache.optionsMap[key]) {
    return formRuntimeStore.cache.optionsMap[key]
  }
  const requestData: Record<string, any> = {}
  requestData[modelName] = {
    appModule,
    conditions,
    label: optionsConfig.showField,
    lazyChild: false,
    type: modelName
  }
  const res = await api.post<any[]>(`/${appModule}/dynamic-api/batch-load-related-data`, requestData)
  const list = res.data[modelName]
  formRuntimeStore.cache.optionsMap[key] = list
  return list
}
const loadModelTreeOptions = async (
  optionsConfig: Record<string, any>,
  conditions?: Record<string, any>[],
  cacheIgnore?: boolean
) => {
  const { modelName, showField } = optionsConfig
  const appModule = optionsConfig.appModule || 'model-center'
  conditions = conditions || optionsConfig.conditions || []
  if (!modelName) {
    return []
  }
  let key = `model__${modelName}`
  if (optionsConfig.conditions.length > 0) {
    key = `model_${config.id}`
  }
  // 读取选项缓存列表
  if (!cacheIgnore && formRuntimeStore.cache.optionsMap[key]) {
    return formRuntimeStore.cache.optionsMap[key]
  }
  const requestData: Record<string, any> = {}
  requestData[modelName] = {
    appModule,
    type: modelName,
    label: showField,
    parent: 'parentId',
    lazyChild: false,
    conditions
  }
  const res = await api.post<any[]>(`/${appModule}/dynamic-api/batch-load-related-data`, requestData)
  if (res.data) {
    const list = res.data[modelName]
    formRuntimeStore.cache.optionsMap[key] = list
    return list
  } else {
    formRuntimeStore.cache.optionsMap[key] = []
    return []
  }
}
const loadApiOptions = async (apiVal: string, cacheIgnore?: boolean) => {
  if (!apiVal) {
    return []
  }
  const key = `api__${apiVal}`
  if (!cacheIgnore && formRuntimeStore.cache.optionsMap[key]) {
    return formRuntimeStore.cache.optionsMap[key]
  }
  const apis = apiVal.split('__')
  let apiMethod = apis.length === 2 ? apis[0] : 'POST'
  apiMethod = apiMethod.toLowerCase()
  const apiUri = apis.length === 2 ? apis[1] : apiVal
  let res = { code: -1, data: [] }
  if (apiMethod.toLowerCase() === 'post') {
    res = await api.post(apiUri)
  } else {
    res = await api.get(apiUri)
  }
  if (res.code === 0) {
    formRuntimeStore.cache.optionsMap[key] = res.data
    return res.data
  } else {
    return []
  }
}
const loadDictOptions = async (dict: string, cacheIgnore?: boolean) => {
  if (!dict) {
    return []
  }
  const key = `dict__${dict}`
  if (!cacheIgnore && formRuntimeStore.cache.optionsMap[key]) {
    return formRuntimeStore.cache.optionsMap[key]
  }
  const res = await api.get<LabelValue>(`/dictionary/items/${dict}`)
  if (res.code === 0) {
    formRuntimeStore.cache.optionsMap[key] = res.data
    return res.data
  } else {
    return []
  }
}

const delay = (count: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, count)
  })
}
const initOptions = async (config: any) => {
  const { relationFilter } = config
  if (relationFilter && relationFilter.origin && relationFilter.queryField && relationFilter.initType === 'filter') {
    const { origin, queryField: field } = relationFilter
    // 等待依赖字段默认值加载完成
    await delay(200)
    // 设置初识查询条件
    const conditions = _.cloneDeep(config.conditions || [])
    const value = model.value[origin] || ''
    conditions.push({
      field,
      value
    })
    return await loadOptions(config, conditions, true)
  }
  return await loadOptions(config)
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
    async value => {
      conditions = _.cloneDeep(config.conditions || [])
      if (value != null && value !== '') {
        conditions.push({
          field,
          value
        })
      }
      // 对数据列表重新获取
      const list = await loadOptions(config, conditions, true)
      options.value = list
    }
  )
}

const loadOptions = async (config: any, conditions?: Record<string, any>[], cacheIgnore?: boolean) => {
  const { optionsConfig } = config
  // 根据不同类型进行不同加载逻辑
  const { sourceType, options, dict, api, modelName, showField } = optionsConfig
  let treeModel = optionsConfig.treeModel
  if (config.extension != null) {
    treeModel = config.extension.treeModel
  }
  let list = []
  if (sourceType === 'options') {
    list = options
  } else if (sourceType === 'dict' && dict) {
    list = await loadDictOptions(dict)
  } else if (sourceType === 'model' && modelName && showField) {
    if (treeModel) {
      list = await loadModelTreeOptions(optionsConfig, conditions, cacheIgnore)
    } else {
      list = await loadModelOptions(optionsConfig, conditions, cacheIgnore)
      if (!list || list.length === 0) {
        return []
      }
      list = list.map((item: any) => {
        const { label, value } = item
        return {
          label,
          value
        }
      })
    }
  } else if (sourceType === 'api' && api) {
    list = await loadApiOptions(api)
  }
  return list
}

const convert2options = (options: any[]) => {
  if (!options || options.length === 0) {
    return []
  }
  return options.map(item => {
    let children = item.children
    if (children && children.length > 0) {
      children = convert2options(children)
    }
    return {
      text: item.label,
      value: item.value,
      children
    }
  })
}

const onDataChange = (val: any) => {
  if (config.multiple) {
    return false
  }
  // 调用数据变更处理
  invokeDataChangeEvent(val)
}

watch(
  modelValue,
  val => {
    // 调用显示控制
    executeDisplayControl(val)
  },
  {
    immediate: true
  }
)

onMounted(async () => {
  const list = await initOptions(config)
  options.value = list
  await setDefaultValue()
  await nextTick()
  addDynamicConditions()
})
</script>
<template>
  <van-field
    v-if="config.type === 'select_radio'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    class="field-item"
  >
    <template #label v-if="showLabel">
      <span class="label-span">
        <span>{{ showLabel }}</span>
        <icon-tooltip v-if="config.fieldTips">
          <template #tip>
            <pre>{{ config.fieldTips }}</pre>
          </template>
        </icon-tooltip>
      </span>
    </template>
    <template #input>
      <van-radio-group v-model="modelValue" @change="onDataChange" :disabled="disabledValue">
        <van-radio v-for="option in options" :key="option.value" :name="option.value">
          {{ option.label }}
        </van-radio>
      </van-radio-group>
    </template>
  </van-field>
  <van-field
    v-if="config.type === 'select_check'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    class="field-item"
  >
    <template #label v-if="showLabel">
      <span class="label-span">
        <span>{{ showLabel }}</span>
        <icon-tooltip v-if="config.fieldTips">
          <template #tip>
            <pre>{{ config.fieldTips }}</pre>
          </template>
        </icon-tooltip>
      </span>
    </template>
    <template #input>
      <van-checkbox-group v-model="modelValue" @change="onDataChange" :disabled="disabledValue">
        <van-checkbox v-for="option in options" shape="square" :key="option.value" :name="option.value">
          {{ option.label }}
        </van-checkbox>
      </van-checkbox-group>
    </template>
  </van-field>
  <pop-picker
    v-else-if="config.type === 'select'"
    v-model="modelValue"
    :multiple="config.multiple"
    :options="options"
    :config="config"
    :label="showLabel"
    :rules="rules"
    :prop-name="propName"
    :required="isRequired"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
    @update:model-value="onDataChange"
  ></pop-picker>
</template>
<style lang="scss" scoped>
.field-item :deep(.van-radio) {
  margin-bottom: 5px;
}
.field-item :deep(.van-checkbox) {
  margin-bottom: 5px;
}
</style>
