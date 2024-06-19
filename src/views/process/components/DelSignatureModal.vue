<script setup lang="ts">
const visible = ref(false)
const value = ref<string[]>([])
const props = defineProps<{
  processInstanceId?: string
  taskId?: string
}>()
const emit = defineEmits<{
  (e: 'select', value: string[]): void
  (e: 'close'): void
}>()
// 关闭弹窗
const close = () => {
  visible.value = false
  value.value = []
  emit('close')
}
const delSignatureOptions = ref<LabelValue[]>([])

// 打开弹窗
const open = async () => {
  try {
    const res = await api.get<LabelValue[]>(
      `/process-center/task/del-signature-list?processInstanceId=${props.processInstanceId as string}&taskId=${
        props.taskId as string
      }`
    )
    if (res.code === 0) {
      if (res.data.length === 0) {
        showNotify({ type: 'warning', message: '当前无可减签用户' })
        close()
      } else {
        delSignatureOptions.value = res.data
        visible.value = true
      }
    } else {
      showNotify({ type: 'danger', message: res.msg })
    }
  } catch (e: any) {
    showNotify({ type: 'danger', message: e.message || e.msg || '操作失败'})
  }
}

// 提交减签数据
const confirm = () => {
  emit('select', value.value)
  close()
}
defineExpose({
  open
})
</script>

<template>
  <van-dialog v-model:show="visible" title="请选择减签用户" show-cancel-button @confirm="confirm" @cancel="close">
    <van-checkbox-group v-model="value">
      <van-checkbox v-for="(item, index) in delSignatureOptions" :key="index" :name="item.value">{{ item.label }}</van-checkbox>
    </van-checkbox-group>
  </van-dialog>
</template>
