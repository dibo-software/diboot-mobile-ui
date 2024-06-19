<script setup lang="ts" name="CascaderElementPopPicker">
import IconTooltip from '@/components/icon-tooltip/index.vue'
type Props = {
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
// 打开数据选择弹窗
const openPopup = () => {
  if (props.disabled) {
    return
  }
  showPicker.value = true
}

const findText = (dataList: Record<string, any>[] = [], val: any | any[]): string | undefined => {
  if (Array.isArray(val)) {
    return val.map(e => findText(dataList, e)).join('/')
  } else {
    for (const data of dataList) {
      if (data.value === val) return data.text
      else if (data.children?.length) return findText(data.children, val)
    }
  }
}

const modelLabel = computed(() => findText(props.options, props.modelValue?.split(',')))

const cascaderValue = computed(() => {
  if (props.modelValue) {
    const valList = props.modelValue.split(',')
    return valList[valList.length - 1]
  } else {
    return ''
  }
})

const onCascaderFinish = ({ selectedOptions }: { selectedOptions: Record<string, any>[] }) => {
  showPicker.value = false
  const val = selectedOptions.map((item: Record<string, any>) => item.value)
  emit('update:modelValue', val.join(','))
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
    <van-popup v-model:show="showPicker" round position="bottom" :style="{ height: '60%' }">
      <van-cascader
        :model-value="cascaderValue"
        :title="props.placeholder"
        :options="props.options"
        :disabled="props.disabled"
        @cancel="showPicker = false"
        @finish="onCascaderFinish"
      />
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
