<script setup lang="ts">
import ActionView from './render/ActionView.vue'
import { isFunction } from 'lodash'
import { buildOptionProps } from '@/components/di/utils'

type Props = {
  baseApi: string
  appModule?: string
  components?: any[]
  configMap?: Record<string, any>
  formConfig?: Record<string, any>
  // 禁用表单内的所有组件
  disabled?: boolean
  // 禁用属性列表（只读不可输入）
  disabledProps?: string[]
  // 不可见属性列表（忽略不加载）
  invisibleProps?: string[]
  // 可见子表单编码列表
  visibleRelations?: string[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'complete', id?: string): void
  (e: 'submitting', submitting: boolean): void
}>()

const rootComponents = shallowRef<any[]>([])
// 将配置数据注入store中
onMounted(() => {
  const { components, configMap, formConfig } = props
  if (components && configMap && formConfig) {
    rootComponents.value = toRaw(components)
  }
})

// 获取表单数据
const { loadData, loading, model } = useDetail<Record<string, unknown>>(props.baseApi, {})

const actionViewRef = ref()
const validate = async (callback?: any) => {
  const shouldThrow = !isFunction(callback)
  let result = true
  try {
    // 表单直接校验
    await validateForm()
  } catch (e) {
    result = false
    console.error('表单校验失败', e)
  }
  try {
    // 调用组件方法校验
    await actionViewRef.value.validate()
  } catch (e) {
    result = false
    console.error('表单组件校验失败', e)
  }
  callback?.(result)
  if (!result) {
    return shouldThrow && Promise.reject('表单校验失败')
  }
  return result
}
// 提交表单数据
const { submitting, submit: doSubmit } = useForm({
  baseApi: props.baseApi,
  successCallback: id => emit('complete', id),
  afterValidate: async () => {
    await validate()
  }
})
watch(submitting, value => emit('submitting', value))

// 表单
const formRef = ref()
// 定义表单操作方法
const init = (id?: string, refresh = true) => {
  if (model.value.id === id && !refresh) {
    return
  }
  loadData(id)
}
// 表单数据处理
const getData = () => {
  return model.value
}
const submit = async () => {
  const data = getData()
  return await doSubmit(data)
}
const reset = () => {
  // 调用组件方法重置
  actionViewRef.value.reset()
  return formRef.value?.resetFields()
}

const invalidFieldNames = ref<string[]>([])
const validateForm = () => {
  return new Promise((resolve, reject) => {
    formRef.value
      ?.validate()
      .then(() => {
        invalidFieldNames.value = []
        resolve(true)
      })
      .catch(() => {
        const resultObj = formRef.value?.getValidationStatus()
        const invalidFields: string[] = Object.keys(resultObj).reduce((prevArr: string[], curKey: string) => {
          if (resultObj[curKey] === 'failed') {
            prevArr.push(curKey)
          }
          return prevArr
        }, [])
        invalidFieldNames.value = invalidFields
        reject('表单校验失败')
      })
  })
}

// 定义关联数据统一加载器
const relatedDataLoaderMap = reactive<Record<string, any>>({})
const relatedDataMap = reactive<Record<string, any>>({})
const optionPropObj: Record<string, any> = { load: {} }
const { initRelatedData, relatedData, handleLinkage, remoteRelatedDataFilter } = useOption(optionPropObj)
const buildRelatedDataMap = () => {
  const loaderProps = Object.keys(relatedDataLoaderMap).reduce((arr: any[], key) => {
    arr.push(relatedDataLoaderMap[key])
    return arr
  }, [])
  const newOptionProps = buildOptionProps(loaderProps)
  Object.assign(optionPropObj.load, newOptionProps.load)
  initRelatedData()
}
watch(() => relatedDataLoaderMap, _.debounce(buildRelatedDataMap, 200), {
  deep: true
})

defineExpose({
  getAnchors: (): LabelValue[] => [],
  init,
  validate,
  getData,
  submit,
  reset
})

// 注入所属应用模块名
provide('app-module', props.appModule || 'model-center')
// 注入基础api
provide('base-api', props.baseApi)
// 注入表单全局配置数据
provide('form-config', props.formConfig)
// 注入表单组件配置数据集合
provide('config-map', props.configMap)
// 注入全局禁用属性
provide('disabled', props.disabled)
// 注入禁用字段列表
provide('disabled-props', props.disabledProps)
// 注入不可见字段列表
provide('invisible-props', props.invisibleProps)
// 注入可见子表单列表
provide('visible-relations', props.visibleRelations)
// 注入整个表单响应式数据对象
provide('model', model)
// 注入整个表单响应式数据对象为根对象
provide('root-model', model)
// 注入整个表单需要隐藏的模块ID列表
const hiddenComponentIds = ref<string[]>([])
provide('hidden-component-ids', hiddenComponentIds)
// 注入主表单校验所得不可用字段
provide('invalid-field-names', invalidFieldNames)
// 注入关联数据加载器列表
provide('related-data-loader-map', relatedDataLoaderMap)
// 注入关联数据选项列表
provide('related-data', relatedData)
</script>
<template>
  <div class="runtime-form-render">
    <!--    <van-button type="primary" @click="validate()">开始校验</van-button>-->
    <van-form ref="formRef" :label-align="props.formConfig?.layout === 'top' ? 'top' : 'left'" :scroll-to-error="true">
      <action-view
        ref="actionViewRef"
        :components="rootComponents"
        type="root"
        :model-key="props.formConfig?.formKey"
      />
    </van-form>
  </div>
</template>
<style lang="scss" scoped>
.runtime-form-render {
  width: 100%;
  height: auto;
}
</style>
