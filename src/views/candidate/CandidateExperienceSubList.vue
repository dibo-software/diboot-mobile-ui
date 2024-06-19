<script setup lang="ts">
import type { CandidateExperience } from './type'
import PopPicker from '@/components/dynamic-form/components/DatetimeElement/popPicker.vue'

const props = defineProps<{
  candidateId?: string
  // 禁用表单内的所有组件
  disabled?: boolean
  // 禁用属性列表（只读不可输入）
  disabledProps?: string[]
  // 不可见属性列表（忽略不加载）
  invisibleProps?: string[]
}>()

const baseApi = '/candidate-experience'
const { getList, queryParam, loading, dataList, pagination } = useList<CandidateExperience>({
  baseApi
})
// 设置当前页数据，不进行分页处理
pagination.pageSize = 100
watch(
  () => props.candidateId,
  () => {
    queryParam.candidateId = props.candidateId
    getList()
  }
)
const addItem = () => {
  dataList.push({
    startDate: '',
    endDate: '',
    duty: ''
  })
}

const remove = (index: number) => {
  const tempDataList = dataList.filter((item, idx) => idx !== index)
  dataList.length = 0
  dataList.push(...(tempDataList || []))
}

defineExpose({
  getSubData: () => dataList
})
const showField = (field: string) => !props.invisibleProps || !props.invisibleProps.includes(field)
const disabledField = (field: string) => props.disabledProps && props.disabledProps.includes(field)

const activeNames = ref([0])
const showPicker = ref(false)
const openPopup = (disabled: boolean) => {
  if (disabled) return
  showPicker.value = true
}
</script>

<template>
  <van-collapse v-model="activeNames">
    <van-collapse-item
      :key="index"
      :name="`${index}`"
      :lazy-render="false"
      :title="`${index + 1}、工作经验`"
      v-for="(record, index) in dataList"
    >
      <pop-picker
        v-if="showField('startDate')"
        v-model="record.startDate"
        label="开始时间"
        prop-name="startDate"
        :disabled="disabledField('startDate')"
        placeholder="请选择开始时间"
        :picker-type="['year', 'month', 'day']"
        type="datePicker"
      />
      <pop-picker
        v-if="showField('startDate')"
        v-model="record.endDate"
        label="结束时间"
        prop-name="endDate"
        :disabled="disabledField('endDate')"
        placeholder="请输入 结束时间"
        :picker-type="['year', 'month', 'day']"
        type="datePicker"
      />
      <van-field
        name="description"
        v-model="record.duty"
        label="工作内容"
        :disabled="disabledField('duty')"
        placeholder="请输入 工作内容"
        rows="2"
        autosize
        type="textarea"
      />

      <van-button
        v-if="!disabled && showField('REMOVE_FLAG__')"
        icon="delete-o"
        type="danger"
        size="small"
        plain
        style="width: 100%"
        @click="remove(index)"
        >删除</van-button
      >
    </van-collapse-item>
  </van-collapse>
  <p style="width: 100%; text-align: center">
    <van-button
      v-if="!disabled && showField('APPEND_FLAG__')"
      icon="plus"
      type="primary"
      plain
      size="small"
      @click="addItem"
      style="width: calc(100% - 20px)"
    >
      添加
    </van-button>
  </p>
</template>
