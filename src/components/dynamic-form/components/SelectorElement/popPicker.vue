<script setup lang="ts" name="SelectorElementPopPicker">
import type { SelectedValue } from '@/components/di/type'
import Select from '@/components/select/index.vue'
import { findLabel } from '@/components/select/optionsUtil'
import IconTooltip from '@/components/icon-tooltip/index.vue'

type Props = {
  type: string
  modelValue: any
  options: any[]
  label: string
  config: Record<string, any>
  multiple?: boolean
  rules?: any[]
  propName?: any[]
  required?: boolean
  disabled?: boolean
  placeholder?: string
  rootId?: string
}
const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false,
  required: false
})
const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
}>()
const showPicker = ref(false)
const modelLabel = computed(() => findLabel(props.options, props.modelValue))
// 打开数据选择弹窗
const openPopup = () => {
  if (props.disabled) {
    return
  }
  showPicker.value = true
}

const onConfirmSelect = ({ selectedValues }: SelectedValue) => {
  showPicker.value = false
  if (props.multiple) {
    emit('update:modelValue', selectedValues)
  } else {
    emit('update:modelValue', selectedValues[0])
  }
}
</script>
<template>
  <div class="pop-picker">
    <van-field
      v-model="modelLabel"
      is-link
      readonly
      :rules="props.rules"
      :placeholder="props.placeholder"
      :required="props.required"
      :name="props.propName"
      :disabled="props.disabled"
      @click="openPopup"
    >
      <template #label v-if="props.label">
        <span class="label-span">
          <span>{{ props.label }}</span>
          <icon-tooltip v-if="props.config.fieldTips">
            <template #tip>
              <pre>{{ props.config.fieldTips }}</pre>
            </template>
          </icon-tooltip>
        </span>
      </template>
    </van-field>
    <van-popup v-model:show="showPicker" round position="bottom" :lazy-render="false">
      <Suspense>
        <Select
          :value="props.modelValue"
          :columns="props.options"
          :columns-field-names="{ text: 'label', value: 'value', children: 'children' }"
          :multiple="props.multiple"
          @cancel="showPicker = false"
          @confirm="onConfirmSelect"
        />
      </Suspense>
    </van-popup>
  </div>
</template>
<style lang="scss" scoped>
.pop-picker {
  :deep(.van-popup) {
    min-height: 60vh;
    max-height: 70vh;
  }
}
</style>
