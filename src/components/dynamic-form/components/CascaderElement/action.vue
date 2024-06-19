<script setup lang="ts" name="CascaderElementIndex">
import useFormRuntimeStore from '../../../../stores/formRuntime'
import useComponentAction from '../../components/hooks/use-component-action'
import popPicker from './popPicker.vue'

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

const options = ref<Record<string, any>[]>([])

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

const convert2options = (options: any[], mapping: Record<string, string>, parentValue: string) => {
  if (!options || options.length === 0) {
    return []
  }
  return options.map(item => {
    const { value, label, children } = mapping
    let childrenList = item[children]
    const row: Record<string, any> = {
      parentValue,
      text: item[label],
      value: item[value]
    }
    if (childrenList && childrenList.length > 0) {
      childrenList = convert2options(childrenList, mapping, item[value])
      row.children = childrenList
    }
    return row
  })
}

const loadOptions = async (config: any) => {
  const { optionsConfig } = config
  // 加载列表数据
  const { api } = optionsConfig
  let list = await loadApiOptions(api)
  list = convert2options(list, config.mapping, '')
  return list
}

onMounted(async () => {
  const list = await loadOptions(config)
  options.value = list
  await setDefaultValue()
})
</script>
<template>
  <pop-picker
    v-model="modelValue"
    :multiple="config.multiple"
    :options="options"
    :label="showLabel"
    :config="config"
    :rules="rules"
    :prop-name="propName"
    :required="isRequired"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
  ></pop-picker>
</template>
