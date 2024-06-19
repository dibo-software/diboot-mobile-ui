<script setup lang="ts">
import type { RelatedData } from '@/hooks/use-option'
import type { SelectedValue } from '@/components/di/type'
import { tree2List } from '@/utils/list'

type Relation = RelatedData & {
  // 需要拼接的前缀
  prefix?: string
}
type SelectType = 'User' | 'Organization' | 'Role' | 'Position'

type SelectRelationMap = { [key in SelectType]: Relation }
const selectTypeMap: SelectRelationMap = {
  User: {
    type: 'User',
    label: 'realname',
    prefix: 'User:'
  },
  Organization: {
    type: 'Organization',
    label: 'name',
    parent: 'parentId',
    orderBy: 'sortId',
    prefix: 'O:'
  },
  Role: {
    type: 'Role',
    label: 'name',
    prefix: 'R:'
  },
  Position: {
    type: 'Position',
    label: 'name',
    prefix: 'P:'
  }
} as const

const props = withDefaults(
  defineProps<{
    // 选择器类型 （取自 selectTypeMap#key）
    type?: SelectType
    // 值
    modelValue?: string
    // 是否多选
    multiple?: boolean
    // 是否拼接前缀
    prefixed?: boolean
    // 占位符
    placeholder?: string
    // 设置固定的选项数据
    fixedOptions?: LabelValue[]
  }>(),
  { type: 'User', modelValue: undefined, placeholder: undefined, fixedOptions: undefined }
)

const { relatedData, loadRelatedData } = useOption({ defModule: 'model-center', baseApi: '/dynamic-api' })

const dataList = computed(() => tree2List(relatedData[props.type] ?? []))

watch(
  () => props.type,
  type => {
    if (selectTypeMap[type] && !relatedData[type])
      loadRelatedData(selectTypeMap[type]).then(arr => {
        relatedData[props.type] = arr
        if (props.fixedOptions) relatedData[props.type].unshift(...props.fixedOptions)
      })
  },
  { immediate: true }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void
  (e: 'change', value?: string): void
  (e: 'close'): void
  (e: 'confirm', value: SelectedValue): void
}>()

const selectValue = computed({
  get: () => {
    let value = props.modelValue ?? ''
    if (value.includes(':')) {
      const typePrefix = value.split(':')[0] + ':'
      if (selectTypeMap[props.type].prefix !== typePrefix) return props.multiple ? [] : ''
      value = value.replace(RegExp(typePrefix, 'g'), '')
    }
    return props.multiple ? (value ? `${value}`.split(',') : []) : value
  },
  set: (value: string | string[] | undefined) => {
    const results = Array.isArray(value) ? value : value ? [value] : undefined
    let result
    if (results?.length && props.prefixed) {
      const prefix = selectTypeMap[props.type].prefix ?? ''
      result = results.map(e => prefix + e).join()
    } else result = results ? results.join() : ''
    emit('update:modelValue', result)
    emit('change', result)
  }
})

const showPicker = ref(false)

const open = (visible?: boolean) => (showPicker.value = visible == null ? !showPicker.value : visible)

const buildFilter = (value: string | string[]) =>
  Array.isArray(value) ? (e: LabelValue) => value.includes(e.value) : (e: LabelValue) => e.value === value

const onConfirm = (data: SelectedValue) => {
  selectValue.value = toRaw(props.multiple ? data.selectedValues : data.selectedValues[0])
  showPicker.value = false
  if (data.selectedValues?.length && props.prefixed) {
    const prefix = selectTypeMap[props.type].prefix ?? ''
    data.selectedOptions.map(({ label, value }) => ({ label, value: prefix + value }))
  }
  emit('confirm', data)
}

defineExpose({
  open,
  clear: () => (selectValue.value = props.multiple ? [] : ''),
  loadData: async (value: string | string[]) => {
    return dataList.value.filter(buildFilter(value))
  }
})
</script>

<template>
  <slot v-bind="{ open }" />
  <van-popup v-model:show="showPicker" round position="bottom" :style="{ height: '60%' }" @close="emit('close')">
    <Select
      :value="selectValue"
      :multiple="multiple"
      :columns-field-names="{ text: 'label', value: 'value', children: 'children' }"
      :columns="relatedData[type]"
      @confirm="onConfirm"
    />
  </van-popup>
</template>
