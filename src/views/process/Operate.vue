<script setup lang="ts" name="ProcessOperate">
import ProcessDetail from './components/Detail.vue'
import ExecuteTask from './components/ExecuteTask.vue'
import type { ProcessExecuteTask, FormPermission, FormPermissionProperty } from './type'

interface Operate {
  procInstId: string // 实例ID
  taskId: string // 任务ID
  category?: string // 分类：代办/抄送
  withManager?: boolean // 管理员
}

const processDetail = ref()

const params = ref<Operate>()

const loading = ref(false)
const task = ref<ProcessExecuteTask>()
const formPermission = ref<FormPermission>()
const activityId = ref()
watch(loading, value =>
  value ? showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 }) : closeToast()
)

const open = (paramData: Operate) => {
  task.value = undefined
  if (paramData.category === 'cc') {
    formPermission.value = undefined
    params.value = paramData
    return
  }
  loading.value = true
  api
    .get<ProcessExecuteTask>(`/process-center/task/execute/${paramData.taskId}`)
    .then(res => {
      task.value = res.data
      task.value.hasMsgEvent = !!task.value.messageBoundaryEventVO
      formPermission.value = JSON.parse(res.data.fieldsPermission ?? '[]').reduce(
        (map: FormPermission, item: FormPermissionProperty) => {
          // 处理主表单只读字段与不显示字段
          const disabledProps = [...item.readonlyFields]
          const invisibleProps = [...item.invisibleFields]
          // 处理子表单只读字段与不显示字段
          const { relations } = item
          const visibleRelations: string[] = []
          if (relations && relations.length > 0) {
            for (const relationItem of relations) {
              if (relationItem.readonlyFields && relationItem.readonlyFields.length > 0) {
                disabledProps.push(
                  ...relationItem.readonlyFields.map(fieldName => `${relationItem.formId}.${fieldName}`)
                )
              }
              if (relationItem.invisibleFields && relationItem.invisibleFields.length > 0) {
                invisibleProps.push(
                  ...relationItem.invisibleFields.map(fieldName => `${relationItem.formId}.${fieldName}`)
                )
              }
              // 收集具有授权的关联子表单表单编码
              if (relationItem.formId) {
                visibleRelations.push(relationItem.formId)
              }
            }
          }
          map[item.formId] = { disabledProps, invisibleProps, visibleRelations }
          return map
        },
        {}
      )
      activityId.value = res.data.activityId
      params.value = paramData
    })
    .catch(err => {
      showFailToast(err.msg || err.message || '加载任务数据失败！')
      fallback()
    })
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
  const { procInstId, taskId } = router.currentRoute.value.params
  if (taskId === params.value?.taskId) return
  const { category, withManager } = router.currentRoute.value.query
  open({
    procInstId: procInstId as string,
    taskId: taskId as string,
    category: category as string,
    withManager: !!withManager
  })
}
const keepAlive = router.currentRoute.value.meta.keepAlive
if (keepAlive) onActivated(activated)
else activated()

const toRead = ref(false)

const handleRead = () => {
  toRead.value = true
  api
    .put('/process-center/task/operate', { taskOperate: 'read', taskId: params.value!.taskId })
    .then(() => {
      showSuccessToast('操作成功')
      fallback()
    })
    .catch(err => showFailToast(err.msg || err.message || '操作失败'))
    .finally(() => (toRead.value = false))
}
</script>

<template>
  <div v-if="params" class="container">
    <process-detail
      ref="processDetail"
      :key="params.procInstId"
      :forms="formPermission"
      :proc-inst-id="params.procInstId"
      :category="params.category"
      :activity-id="activityId"
      class="process-detail"
    >
      <template #execute>
        <execute-task
          v-if="task && processDetail && params.category !== 'cc'"
          :task="task"
          :task-id="params.taskId"
          :proc-inst-id="params.procInstId"
          :with-manager="params.withManager"
          :get-form-data="processDetail?.getFormData"
          @complete="fallback"
        />

        <div
          v-if="params.category === 'cc'"
          style="height: 30vh; display: flex; align-items: center; justify-content: center"
        >
          <van-button size="small" type="primary" icon="completed" :loading="toRead" @click="handleRead">
            已阅
          </van-button>
        </div>
      </template>
    </process-detail>
  </div>
</template>

<style scoped lang="scss">
.container {
  height: 100%;
  display: flex;

  .process-detail {
    flex: 1;
    border-right: 1px solid var(--el-border-color-lighter);
  }
}
</style>
