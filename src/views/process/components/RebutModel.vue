<script setup lang="ts">
type ProcessNode = {
  nodeId: string // 节点id
  nodeName: string // nodeName
  userId: string // 执行人的id
  userName: string // userName
  endTime: string // 任务节点结束时间
}
const visible = ref(false)

const rebutNodeOptions = ref<ProcessNode[]>([])
const value = ref<string>()
const props = defineProps<{
  taskId?: string
}>()
const emit = defineEmits<{
  (e: 'select', value: { nodeId: string; nodeName: string }): void
  (e: 'close'): void
}>()
// 关闭弹窗
const close = () => {
  visible.value = false
  value.value = ''
  rebutNodeOptions.value = []
  emit('close')
}
// 打开弹窗，加载驳回列表
const open = async () => {
  try {
    const res = await api.get<ProcessNode[]>(`/process-center/task/rebut-node-list/${props.taskId as string}`)
    if (res.code === 0) {
      if (res.data.length === 0) {
        showNotify({ type: 'warning', message: '当前无可驳回的节点' })
        close()
      } else {
        visible.value = true
        rebutNodeOptions.value = res.data
      }
    } else {
      showNotify({ type: 'danger', message: res.msg })
      close()
    }
  } catch (e: any) {
    showNotify({ type: 'danger', message: e.message || e.msg || '操作失败'})
  }
}
// 确认驳回
const confirm = () => {
  emit('select', JSON.parse(value.value || ''))
  close()
}
defineExpose({
  open
})
</script>

<template>
  <van-dialog v-model:show="visible" title="驳回节点选择" show-cancel-button @confirm="confirm" @cancel="close">
    <van-radio-group v-model="value">
      <van-radio v-for="(rebutNode, index) in rebutNodeOptions" :key="index" :name="JSON.stringify(rebutNode)">{{ rebutNode.nodeName }}</van-radio>
    </van-radio-group>
  </van-dialog>
</template>
