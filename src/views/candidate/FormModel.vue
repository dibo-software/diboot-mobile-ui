<script setup lang="ts">
import CandidateExperienceSubList from './CandidateExperienceSubList.vue'

import type { Candidate } from './type'
const props = defineProps<{
  baseApi: string
  // 禁用表单内的所有组件
  disabled?: boolean
  // 禁用属性列表（只读不可输入）
  disabledProps?: string[]
  // 不可见属性列表（忽略不加载）
  invisibleProps?: string[]
}>()

// 获取详情 （可指定想应类型，提换 Record<string, unknown> ）
const { loadData, loading, model } = useDetail<Candidate>(props.baseApi, {
  processStatus: 'ONGOING'
})

const emit = defineEmits<{
  (e: 'complete', id?: string): void
  (e: 'submitting', submitting: boolean): void
}>()

const { submitting, submit } = useForm({
  baseApi: props.baseApi,
  successCallback: id => emit('complete', id)
})

watch(submitting, value => emit('submitting', value))

// 表单
const formRef = ref()

// 子表单关联的id
const candidateId = ref()
const candidateExperienceSubListRef = ref()
defineExpose({
  init: (id?: string, refresh = true, initData?: Record<string, unknown>) => {
    if (model.value.id === id && !refresh) return
    loadData(id).then(() => {
      if (!id && initData) Object.keys(initData).forEach(key => ((model.value as any)[key] = initData[key]))
      candidateId.value = model.value.id
    })
  },
  validate: (name?: string | string[]) => formRef.value!.validate(name),
  getData: () => {
    model.value.candidateExperienceSubList = candidateExperienceSubListRef.value.getSubData()
    return model.value
  },
  submit: () => submit(model.value, formRef.value),
  reset: () => formRef.value?.resetValidation()
})
console.log(props.invisibleProps)
console.log(props.disabledProps)
const showField = (field: string) => !props.invisibleProps || !props.invisibleProps.includes(field)
const disabledField = (field: string) => props.disabledProps && props.disabledProps.includes(field)

const candidateExperienceInvisibleProps = computed(() => {
  return (
    props.invisibleProps
      ?.filter(item => item.startsWith('CUSTOM:CandidateExperience.'))
      .map(item => item.split('.')[1]) || []
  )
})
const candidateExperienceDisabledProps = computed(() => {
  return (
    props.disabledProps
      ?.filter(item => item.startsWith('CUSTOM:CandidateExperience.'))
      .map(item => item.split('.')[1]) || []
  )
})
</script>

<template>
  <van-space direction="vertical" fill>
    <van-notice-bar left-icon="volume-o" text="这个是自定义表单，文件位置在@/views/candidate/FormModel.vue" />
    <van-form ref="formRef">
      <van-field
        v-show="showField('name')"
        :rules="[{ required: true, message: '不能为空' }]"
        name="name"
        v-model="model.name"
        label="姓名"
        :disabled="disabledField('name')"
        placeholder="请输入 姓名"
      />
      <van-field
        v-show="showField('age')"
        :rules="[{ required: true, message: '不能为空' }]"
        name="age"
        v-model="model.age"
        label="年龄"
        :disabled="disabledField('age')"
        placeholder="请输入 年龄"
        type="number"
      />
      <van-field
        v-show="showField('description')"
        name="description"
        v-model="model.description"
        label="备注"
        :disabled="disabledField('description')"
        placeholder="请输入 备注"
        rows="2"
        autosize
        type="textarea"
      />
    </van-form>
    <candidate-experience-sub-list
      ref="candidateExperienceSubListRef"
      :candidate-id="candidateId"
      :disabled="disabled"
      :invisible-props="candidateExperienceInvisibleProps"
      :disabled-props="candidateExperienceDisabledProps"
    />
  </van-space>
</template>

<style scoped></style>
