<script setup lang="ts">
import ProcessForm from './Form.vue'
import CommentList from './CommentList.vue'
import type { FormPermission, ActHiProcinst } from '../type'

const props = defineProps<{ procInstId: string; forms?: Required<FormPermission>; activityId?: string; preview?: boolean }>()

const instance = ref<ActHiProcinst>()
api
  .get<ActHiProcinst>(`/process-center/instance/${props.procInstId}`)
  .then(res => (instance.value = res.data))
  .catch(err => showFailToast(err.msg || err.message || '获取表单配置失败'))

const processForm = ref()

defineExpose({
  getFormData: () =>
    new Promise(resolve => processForm.value.validates().then(() => resolve(processForm.value.getDataMap())))
})

const diagram = ref()
const diagramLoading = ref(true)
const loadXml = async () => {
  try {
    const res = await api.get<unknown>(`/process-center/instance/flow-diagram`, {
      processInstanceId: props.procInstId
    })
    diagram.value = res.data
  } catch (e: any) {
    showFailToast(e.msg || e.message || (e.length ? e : '获取流程图失败'))
  } finally {
    diagramLoading.value = false
  }
}

const currentTab = ref('processForm')
watch(currentTab, val => {
  if (val === 'processFlow') {
    diagramLoading.value = true
    loadXml()
  }
})
</script>

<template>
  <div class="detail-container">
    <van-tabs v-model:active="currentTab">
      <van-tab name="processForm">
        <template #title>
          <span class="label">
            <van-icon name="orders-o" />
            表单
          </span>
        </template>

        <process-form
          ref="processForm"
          v-memo="[JSON.stringify(forms ?? instance?.businessKey?.split(',') ?? [])]"
          :proc-inst-id="procInstId"
          :forms="forms ?? instance?.businessKey?.split(',') ?? []"
          :preview="!forms || preview"
          :activity-id="activityId"
        />
      </van-tab>

      <van-tab v-if="$slots.execute" name="ExecuteTask">
        <template #title>
          <span class="label">
            <van-icon name="records" />
            办理
          </span>
        </template>

        <slot name="execute" />
      </van-tab>

      <van-tab name="processComment">
        <template #title>
          <span class="label">
            <van-icon name="description" />
            过程意见
          </span>
        </template>

        <comment-list :proc-inst-id="procInstId" />
      </van-tab>

      <van-tab name="processFlow" style="height: 100%">
        <template #title>
          <span class="label">
            <van-icon name="photo-o" />
            流程图
          </span>
        </template>

        <van-skeleton v-if="diagramLoading" :rows="5" animated />
        <flow-viewer :diagram="diagram || {}" :process-instance-id="procInstId" render-more />
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped lang="scss">
.detail-container {
  height: 100%;
  position: relative;

  .van-tabs {
    height: 100%;

    :deep(.van-tabs__content) {
      height: calc(100% - 45px);
      overflow-y: auto;
    }
  }
}
</style>
