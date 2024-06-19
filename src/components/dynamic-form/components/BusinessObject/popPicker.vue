<script setup lang="ts" name="BusinessObjectPopPicker">
import type { SelectedRowValue, SelectedValue } from '@/components/di/type'
import Select from '@/components/select/index.vue'
import dataListSelector from './dataListSelector.vue'
import { findLabel } from '@/components/select/optionsUtil'
import { showFailToast } from 'vant'
import type { ConditionItem } from '@/hooks/use-option'
import IconTooltip from '@/components/icon-tooltip/index.vue'

type Props = {
  type: string
  modelValue: any
  label: string
  config: Record<string, any>
  multiple?: boolean
  rules?: any[]
  propName?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  rootId?: string
  // 列表数据过滤条件
  conditions?: Array<ConditionItem>
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
const selectedRows = ref<Record<string, any>[]>([])
const appModule = inject('app-module', '')

watch(
  () => props.modelValue,
  val => {
    if (val && selectedRows.value.length === 0) {
      loadInitOptions(val)
    }
  },
  {
    immediate: true
  }
)
const loadInitOptions = async (value: string[] | string) => {
  if (!value) {
    return false
  }
  let ids = value instanceof Array ? value : [value]
  ids = [...new Set(ids)]
  await loadInitOptions4dynamic(ids)
}

const loadInitOptions4dynamic = async (ids: string[]) => {
  const { code: modelName } = props.config.businessObj
  const res = await api.post<Record<string, any>[]>(`/${appModule}/dynamic-api/load-by-ids/${modelName}`, ids)
  if (res.code === 0) {
    const { data } = res
    if (data && data.length > 0) {
      selectedRows.value = data
    }
  } else {
    showFailToast('未加载到选项初始数据')
  }
}

const modelLabel = computed(() => {
  const options = selectedRows.value.map(item => {
    return {
      label: item[props.config.businessObj.showTarget],
      value: item.id
    }
  })
  return findLabel(options, props.modelValue)
})
// 打开数据选择弹窗
const openPopup = () => {
  if (props.disabled) {
    return
  }
  showPicker.value = true
}

const onConfirmSelect = ({ selectedValues, selectedRows: selectedOptions }: SelectedRowValue) => {
  showPicker.value = false
  if (props.multiple) {
    emit('update:modelValue', selectedValues)
  } else {
    emit('update:modelValue', selectedValues[0])
  }
  selectedRows.value = selectedOptions
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
    <van-popup v-model:show="showPicker" round position="bottom" :lazy-render="true" :style="{ height: '80%' }">
      <Suspense>
        <data-list-selector
          :app-module="appModule"
          :conditions="props.conditions"
          :dataType="config.businessObj.code"
          :dataLabel="config.businessObj.showTarget"
          :value="props.modelValue"
          :selected-rows="selectedRows"
          :disabled="props.disabled"
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
