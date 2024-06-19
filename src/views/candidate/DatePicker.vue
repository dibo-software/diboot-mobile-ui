<script setup lang="ts" name="DatetimeElementPopPicker">
import type { SelectedValue } from '@/components/di/type'

const MIN_DATE_STR = '1970/01/01'
const MAX_DATE_STR = '2031/01/01'

type Props = {
  modelValue: any
  label: string
  rules?: any[]
  propName?: any[]
  required?: boolean
  disabled?: boolean
  pickerType: string
  type?: string
  timeSelected?: boolean
  placeholder?: string
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  timeSelected: false,
  type: 'date'
})
const minDate = new Date(MIN_DATE_STR)
const maxDate = new Date(MAX_DATE_STR)
const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
}>()
const showPicker = ref(false)

const datetimeArray: any = ref([])
const date = new Date()
const complete = (num: number) => (num <= 9 ? `0${num}` : `${num}`)
datetimeArray.value.push(`${date.getFullYear()}`)
datetimeArray.value.push(complete(date.getMonth() + 1))
datetimeArray.value.push(complete(date.getDate()))
datetimeArray.value.push(complete(date.getHours()))
datetimeArray.value.push(complete(date.getMinutes()))
datetimeArray.value.push(complete(date.getSeconds()))
const getInitDateTime = (pickerType = props.pickerType) => {
  switch (JSON.stringify(pickerType)) {
    case '["year"]':
      return datetimeArray.value.slice(0, 1)
    case '["year","month"]':
      return datetimeArray.value.slice(0, 2)
    case '["year","month","day"]':
      return datetimeArray.value.slice(0, 3)
    default:
      return undefined
  }
}

const datePickerValue = computed(() => {
  return props.modelValue
    ? `${props.modelValue}`.split(/[ \-:]/)
    : props.type === 'timepicker'
    ? datetimeArray.value.slice(3, 5)
    : getInitDateTime()
})
const dateTargetPickerVal = computed(() => {
  return props.modelValue ? `${props.modelValue}`.split(/[ \-:]/)?.splice(0, 3) : datetimeArray.value.slice(0, 3)
})
const datetimeTargetPickerVal = computed(() => {
  return props.modelValue ? `${props.modelValue}`.split(/[ \-:]/)?.splice(3) : datetimeArray.value.slice(3)
})

// 打开数据选择弹窗
const openPopup = () => {
  if (props.disabled) {
    return
  }
  showPicker.value = true
}

const onConfirmDatePicker = ({ selectedValues }: SelectedValue) => {
  showPicker.value = false
  emit('update:modelValue', selectedValues?.join('-'))
}

const onConfirmDateTimePicker = (list: SelectedValue[]) => {
  showPicker.value = false
  emit('update:modelValue', list[0].selectedValues?.join('-') + ' ' + list[1].selectedValues?.join(':'))
}

const onConfirmTimePicker = ({ selectedValues }: SelectedValue) => {
  showPicker.value = false
  emit('update:modelValue', selectedValues?.join(':'))
}
</script>
<template>
  <div class="pop-picker" :key="showPicker">
    <van-field
      :model-value="props.modelValue"
      is-link
      readonly
      :label="props.label"
      :placeholder="props.placeholder"
      :required="props.required"
      :name="props.propName"
      :disabled="props.disabled"
      :rules="props.rules"
      @click="openPopup"
    />
    <van-popup v-model:show="showPicker" round position="bottom" :style="{ height: '60%' }">
      <template v-if="props.type === 'timepicker'">
        <van-time-picker :model-value="datePickerValue" @confirm="onConfirmTimePicker" @cancel="showPicker = false" />
      </template>
      <template v-else>
        <van-picker-group
          v-if="props.timeSelected"
          :tabs="['选择日期', '选择时间']"
          next-step-text="下一步"
          @confirm="onConfirmDateTimePicker"
          @cancel="showPicker = false"
        >
          <van-date-picker :min-date="minDate" :max-date="maxDate" :model-value="dateTargetPickerVal" />
          <van-time-picker :model-value="datetimeTargetPickerVal" :columns-type="['hour', 'minute', 'second']" />
        </van-picker-group>
        <van-date-picker
          v-else
          :min-date="minDate"
          :max-date="maxDate"
          :model-value="datePickerValue"
          :columns-type="pickerType"
          @confirm="onConfirmDatePicker"
          @cancel="showPicker = false"
        />
      </template>
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
