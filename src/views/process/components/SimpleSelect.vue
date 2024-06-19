<script setup lang="ts">
import type { SelectedValue } from '@/components/di/type'

const props = withDefaults(
  defineProps<{
    // 值
    modelValue?: string
    // 是否多选
    multiple?: boolean
    // 占位符
    placeholder?: string
    // 设置固定的选项数据
    options: LabelValue[]
  }>(),
  { modelValue: undefined, placeholder: undefined, options: undefined }
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
    return props.multiple ? (value ? `${value}`.split(',') : []) : value
  },
  set: (value: string | string[] | undefined) => {
    const results = Array.isArray(value) ? value : value ? [value] : undefined
    let result = results ? results.join(',') : ''
    emit('update:modelValue', result)
    emit('change', result)
  }
})

const showPicker = ref(false)

const open = (visible?: boolean) => (showPicker.value = visible == null ? !showPicker.value : visible)

const onConfirm = (data: SelectedValue) => {
  selectValue.value = toRaw(props.multiple ? data.selectedValues : data.selectedValues[0])
  showPicker.value = false
  emit('confirm', data)
}

defineExpose({
  open,
  clear: () => (selectValue.value = props.multiple ? [] : '')
})
</script>

<template>
  <slot v-bind="{ open }" />
  <van-popup v-model:show="showPicker" round position="bottom" :style="{ height: '60%' }" @close="emit('close')">
    <Select
      :value="selectValue"
      :multiple="multiple"
      :columns-field-names="{ text: 'label', value: 'value', children: 'children' }"
      :columns="options"
      @confirm="onConfirm"
    />
  </van-popup>
</template>
