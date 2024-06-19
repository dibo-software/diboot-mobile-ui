<script setup lang="ts" name="ProcessStart">
import type { ProcessStart, FormPermission, FormPermissionProperty, ProcessConfig } from './type'
import ProcessForm from './components/Form.vue'
import DraftList from './components/DraftList.vue'
import UserGroupSelect from './components/UserGroupSelect.vue'
import type { SelectedValue } from '@/components/di/type'
import { getFormIdsDenyFields } from '@/components/di/utils'

const baseApi = '/process-center/definition'
let submitApi = ''

const model = ref<Partial<ProcessStart>>({})

const loading = ref(false)

const processConfig = ref<ProcessConfig>()

const formPermission = ref<FormPermission>()

const open = (procDefId: string, procInstId?: string) => {
  submitApi = procInstId ? '/restart-process' : '/start-process'
  model.value.processDefinitionId = procDefId
  model.value.processInstanceId = procInstId
  loading.value = true
  api
    .get<{
      processConfig: ProcessConfig
      fieldsPermission: string
    }>(`/process-center/definition/multi-form-info-for-start-node/${procDefId}`)
    .then(async res => {
      processConfig.value = res.data.processConfig
      const fieldsPermission: FormPermissionProperty[] = JSON.parse(res.data.fieldsPermission ?? '[]')
      const formIds = fieldsPermission.map(e => e.formId)
      // 是否是动态模型
      const isDynamicModel = formIds.length > 0 && !formIds[0].startsWith('CUSTOM:')
      // 静态表单，不做安全字段相关处理
      const denyFieldsMap = isDynamicModel ? await getFormIdsDenyFields(...formIds) : {}
      formPermission.value = fieldsPermission.reduce((map: FormPermission, item: FormPermissionProperty) => {
        // 处理主表单只读字段与不显示字段
        const disabledProps = [...item.readonlyFields]
        const invisibleProps = [...item.invisibleFields]
        if (denyFieldsMap[item.formId]?.length) invisibleProps.push(...denyFieldsMap[item.formId])
        // 处理子表单只读字段与不显示字段
        const { relations } = item
        const visibleRelations: string[] = []
        if (relations && relations.length > 0) {
          for (const relationItem of relations) {
            if (relationItem.readonlyFields && relationItem.readonlyFields.length > 0) {
              disabledProps.push(...relationItem.readonlyFields.map(fieldName => `${relationItem.formId}.${fieldName}`))
            }
            if (relationItem.invisibleFields && relationItem.invisibleFields.length > 0) {
              invisibleProps.push(
                ...relationItem.invisibleFields.map(fieldName => `${relationItem.formId}.${fieldName}`)
              )
            }
            if (denyFieldsMap[relationItem.formId]?.length)
              invisibleProps.push(
                ...denyFieldsMap[relationItem.formId].map(fieldName => `${relationItem.formId}.${fieldName}`)
              )
            // 收集具有授权的关联子表单表单编码
            if (relationItem.formId) {
              visibleRelations.push(relationItem.formId)
            }
          }
        }
        map[item.formId] = { disabledProps, invisibleProps, visibleRelations }
        return map
      }, {})
      model.value.businessKey = res.data.processConfig.formIds?.join()
    })
    .catch(err => showFailToast(err.msg || err.message || '获取流程配置失败'))
    .finally(() => (loading.value = false))
}

const router = useRouter()

const closeTab = inject('close-tab', () => void 0)
// 回退
const fallback = () => {
  router.go(-1)
  closeTab()
}

// 入口：根据路由参数加载数据
const activated = () => {
  const procDefId = router.currentRoute.value.params.procDefId
  if (procDefId === model.value.processDefinitionId) return
  model.value = {}
  open(procDefId as string, router.currentRoute.value.query.procInstId as string | undefined)
}
const keepAlive = router.currentRoute.value.meta.keepAlive
if (keepAlive) onActivated(activated)
else activated()

const processForm = ref()

const holdId = ref<string>()

const draftListRef = ref()

// 加载草稿数据
const loadDraftData = (id: string) => {
  holdId.value = id
  processForm.value?.initData(id)
}

const submitting = ref(false)
const submit = async (hold?: boolean) => {
  submitting.value = true
  try {
    await processForm.value?.validates()
  } catch (e) {
    showNotify({ type: 'danger', message: '表单校验不通过' })
    console.error('发起流程提交出错', e)
    submitting.value = false
    return false
  }
  const data = await processForm.value?.getDataMap()
  if (!data) {
    showFailToast('无法获取表单数据！')
    return false
  }
  model.value.formValues = data
  model.value.hold = hold
  model.value.holdId = holdId.value
  api
    .post(`${baseApi}${submitApi}`, model.value)
    .then(() => {
      showSuccessToast('提交成功')
      fallback()
    })
    .catch(err => showFailToast(err.msg || err.message || (err.length ? err : '提交失败')))
    .finally(() => (submitting.value = false))
}

const onConfirm = (data: SelectedValue) => {
  model.value.ccToList = (data.selectedOptions ?? []).map((e: LabelValue) => ({
    userIdAndType: e.value,
    displayName: e.label
  }))
}
</script>

<template>
  <div class="container">
    <process-form
      ref="processForm"
      :proc-inst-id="model.processInstanceId"
      :forms="formPermission"
      :mode="processConfig?.formMode"
      class="form"
    />

    <van-space class="operation">
      <user-group-select
        :model-value="model.ccToList?.map(e => e.userIdAndType).join()"
        multiple
        prefixed
        @confirm="onConfirm"
      >
        <template #default="{ open }">
          <van-badge :content="model.ccToList?.length" :show-zero="false">
            <van-button @click="open()">抄送</van-button>
          </van-badge>
        </template>
      </user-group-select>
      <van-button type="primary" :disabled="submitting" @click="submit()">提交</van-button>
      <van-button type="success" plain :disabled="submitting" @click="submit(true)">暂存</van-button>
      <van-button type="warning" plain :disabled="!model.businessKey" @click="draftListRef?.open()">
        草稿箱
      </van-button>
    </van-space>

    <draft-list
      v-if="model.processDefinitionId && model.businessKey"
      ref="draftListRef"
      :definition-id="model.processDefinitionId"
      :business-key="model.businessKey"
      @select="loadDraftData"
    />
  </div>
</template>

<style scoped lang="scss">
.container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .form {
    flex: 1;
    height: 0;
    overflow-y: auto;
  }

  .operation {
    display: flex;
    justify-content: space-evenly;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
