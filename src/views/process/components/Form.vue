<script setup lang="ts">
import DiForm from '@/components/di/Form.vue'
import { asyncComponent } from '@/components/di/utils'
import type { PageDesign } from '@/components/di/type'
import type { FormPermission } from '../type'
import type { VNode, ConcreteComponent } from 'vue'
import RuntimeFormRender from '@/components/dynamic-form/RuntimeFormRender.vue'

type FormType = InstanceType<typeof DiForm>

// 动态模型获取数据接口
provide('data-base-api', '/dynamic-api')
provide('related-data-base-api', '/dynamic-api')

const baseUrl = '/form-data/process'

const getFormComponent = (config: PageDesign) => {
  if (config.staticPath)
    return h(asyncComponent(config.staticPath), { baseApi: `/${config.appModule}${baseUrl}/${config.modelKey}` })
  return h((config.dynamicMode === 'CONFIG' ? DiForm : /*TODO 设计表单*/ RuntimeFormRender) as ConcreteComponent, {
    baseApi: `/${config.appModule}${baseUrl}/${config.modelKey}`,
    ...config.configData
  })
}

const props = defineProps<{
  // 流程实例ID
  procInstId?: string
  // 表单权限对象 ;   string[]: 表单ID列表
  forms?: Required<FormPermission> | string[]
  // 表单模式 (侧边导航【默认】，可指定：tabs)
  mode?: string
  // 预览模式
  preview?: boolean
  // 流程节点id
  activityId?: string
}>()

const formList = ref<LabelValue<VNode>[]>()
const formItems = ref<LabelValue[]>()
let formRefs: Record<string, FormType> = {}

watch(
  () => props.forms,
  value => {
    formRefs = {}
    formList.value = undefined
    formItems.value = undefined
    console.log('props forms vaue watch', value)
    if (!value || !(Array.isArray(value) ? value.length : Object.keys(value).length)) return
    const formIds = Array.isArray(value) ? value : Object.keys(value)
    // 是否是动态模型
    const isDynamicModel = !formIds[0].startsWith('CUSTOM:')
    api
      .post<PageDesign[]>(
        isDynamicModel ? '/model-center/form-design/configs' : '/process-center/definition/custom-form-ui/configs',
        formIds
      )
      .then(res => {
        formList.value = res.data?.map(e => ({
          value: e.modelKey,
          label: e.title,
          parentId: e.id || e.modelKey,
          ext: getFormComponent(e)
        }))
        formItems.value = res.data?.map(item => ({ value: item.modelKey, label: item.title }) as LabelValue) ?? []
      })
      .catch(err => showFailToast(err.msg || err.message || '获取表单配置失败'))
  },
  { immediate: true }
)

const getFormPermission = (formId: string) => {
  return props.forms && Object.keys(props.forms).length ? (props.forms as FormPermission)[formId] : undefined
}

const collectFormRefs = (el: FormType, modelKey: string) => {
  if (!el) return
  if (!formRefs[modelKey])
    el.init(
      props.procInstId ? (props.activityId ? `${props.procInstId}/${props.activityId}` : props.procInstId) : undefined
    )
  formRefs[modelKey] = el
}

const active = ref<number>(0)

defineExpose({
  formItems,
  initData: (procInstId: string) =>
    Object.values(formRefs).forEach(form =>
      form?.init(procInstId ? (props.activityId ? `${procInstId}/${props.activityId}` : procInstId) : undefined)
    ),
  validates: () => {
    const formKeys = formList.value?.map(e => e.value) ?? []
    // if (!formKeys?.length) return Promise.reject('无表单')
    return Promise.all(
      formKeys.reverse().map(async key => {
        try {
          return Promise.resolve((await formRefs[key]?.validate()) ?? true)
        } catch (e) {
          active.value = formKeys.length - formKeys.indexOf(key) - 1
          showNotify({ message: '表单校验不通过', type: 'danger' })
          return Promise.reject(e)
        }
      })
    )
      .then(results => results.every(result => result))
      .then(result => new Promise<void>((resolve, reject) => (result ? resolve() : reject('表单校验不通过'))))
  },
  getDataMap: async () => {
    const dataMap: Record<string, unknown> = {}
    await Promise.all(Object.keys(formRefs).map(async key => (dataMap[key] = await formRefs[key].getData())))
    return dataMap
  }
})
</script>

<template>
  <div class="form-container">
    <van-empty v-if="!forms" description="无表单" />
    <van-skeleton v-else-if="forms && !formList?.length" />

    <van-tabs v-else-if="mode === 'tabs'" v-model="active">
      <van-tab v-for="(item, index) in formList" :key="index" :name="index" :label="item.label">
        <div class="flex">
          <component
            :is="item.ext"
            v-bind="getFormPermission(`${item.parentId}`)"
            :ref="(el: FormType) => collectFormRefs(el, item.value)"
            :disabled="preview"
          />
        </div>
      </van-tab>
    </van-tabs>

    <div v-else style="height: 100%">
      <div v-for="(item, index) in formList" :id="item.value" :key="index" style="margin: 10px">
        <span style="zoom: 1.1; display: flex; justify-content: center; padding-bottom: 10px">
          {{ item.label }}
        </span>
        <component
          :is="item.ext"
          v-bind="getFormPermission(`${item.parentId}`)"
          :ref="(el: FormType) => collectFormRefs(el, item.value)"
          :disabled="preview"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-container {
  height: 100%;
  position: relative;

  :deep(.flex) {
    display: flex;
  }
}
</style>
