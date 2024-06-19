<script setup lang="ts">
import SimpleSelect from './SimpleSelect.vue'
import type {SelectedValue} from '@/components/di/type'

const props = defineProps<{
  modelValue?: string
  strategy: string
  conditionValue?: number | string
}>()

const selectValue = computed({
  get: () => props.modelValue || '',
  set: (value?: string) => {
    emit('update:modelValue', value || '')
  }
})
// 初始化选项值
onMounted(() => initOptions())

const options = ref<any[]>([])
/**
 * 初始化分配下一节点执行人选项
 */
const initOptions = async () => {
  const res = await api.get<any[]>('/process-center/task/simple-dynamic-assign-data', {
    conditionValue: props.conditionValue,
    strategy: props.strategy
  })
  options.value = res.data
}
const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void
}>()

const selectOptions = ref<LabelValue[]>([])
const onSimpleSelectConfirm = (data: SelectedValue) => {
  selectOptions.value = toRaw(data.selectedOptions)
}
const removeSelected = (value: string) => {
  selectOptions.value = selectOptions.value?.filter(e => e.value !== value)
  selectValue.value = selectOptions.value.map(item => item.value).join(',')
}
</script>

<template>
    <simple-select
        v-model="selectValue"
        multiple
        :options="options"
        @confirm="onSimpleSelectConfirm"
    >
      <template #default="{ open }">
        <van-space wrap direction="vertical">
          <van-button type="primary" size="mini" icon="plus" plain @click="open()">
            下一节点的操作用户
          </van-button>
          <van-space wrap>
            <van-tag
                v-for="item in selectOptions"
                :key="item.value"
                plain
                closeable
                type="success"
                size="large"
                @close="removeSelected(item.value)"
            >
              {{ item.label }}
            </van-tag>
          </van-space>
        </van-space>
      </template>
    </simple-select>
</template>

<style scoped>
.m-t-10 {
  margin-top: 10px;
}
</style>
