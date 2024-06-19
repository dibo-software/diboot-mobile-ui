<script setup lang="ts">
import UserGroupSelect from './UserGroupSelect.vue'
import DelSignatureModal from './DelSignatureModal.vue'
import RebutModel from './RebutModel.vue'
import SimpleDynamicAssign from './SimpleDynamicAssign.vue'
import type { ProcessOperate, ProcessExecuteTask } from '../type'
import type { DefineComponent } from 'vue'
import { showSuccessToast } from 'vant'
import type { SelectedValue } from '@/components/di/type'

const props = defineProps<{
  task: ProcessExecuteTask
  taskId: string
  procInstId: string
  // 是否是管理员
  withManager?: boolean
  // 获取表单数据
  getFormData: () => Promise<Record<string, Record<string, unknown>>>
}>()

const loading = ref(false)

watch(loading, value =>
  value ? showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 }) : closeToast()
)

const model = ref<Partial<ProcessOperate>>({ taskId: props.taskId, processInstanceId: props.procInstId })

const emit = defineEmits<{ (e: 'complete'): void }>()

const renameName = (key: string, def: string) => (props.task.buttonExtension ?? {})[key]?.rename || def

const state = ref<Record<string, boolean>>({})
/**
 * 在操作之前需要做的事情(选择用户等)
 */
const handleOperateBefore = (taskOperate: string, component?: DefineComponent, auditPass = true) => {
  state.value[taskOperate] = true
  // 校验审批通过时的动态执行人选取
  if (taskOperate === 'approve' && props.task.assignExecutorStrategy && !model.value.nextNodeExecutor) {
    showFailToast('请选择下一节点执行！')
    state.value[taskOperate] = false
    return
  }
  console.log(model.value)
  if (!model.value.message && taskOperate !== 'hold') {
    showFailToast('请输入审批意见！')
    state.value[taskOperate] = false
    return
  }
  model.value.supportRebutTargetActivityIds = props.task.supportRebutTargetActivityIds
  model.value.taskOperate = taskOperate === 'nonApprove' ? 'approve' : taskOperate
  model.value.auditPass = auditPass
  // 如果需要打开做其他操作
  if (component) {
    component.open()
  } else {
    handleOperate()
  }
}

/**
 * 操作类型
 */
const handleOperate = () => {
  // 获取多表单数据
  props
    .getFormData()
    .then(formData => {
      loading.value = true
      const { taskOperate } = model.value
      state.value[taskOperate as string] = true
      model.value.manager = props.withManager
      // 设置默认值
      const extension = (props.task.buttonExtension ?? {})[taskOperate as string]
      if (extension?.formRules?.length) {
        extension.formRules.forEach((item: Record<string, unknown>) => {
          const { key, value } = item
          const tableAndField = `${key}`.split('.')
          formData[tableAndField[0]][tableAndField[1]] = value
        })
      }
      if (extension?.variableRules?.length) {
        extension.variableRules.forEach((item: Record<string, unknown>) => {
          const { key, value } = item
          ;(model.value.values ? model.value.values : (model.value.values = {}))[key as string] = value
        })
      }
      model.value.formData = formData
      api
        .put('/process-center/task/operate', model.value)
        .then(() => {
          showSuccessToast('操作成功！')
          emit('complete')
        })
        .catch(err => showFailToast(err.msg || err.message || err || '执行任务失败！'))
        .finally(() => (loading.value = state.value[taskOperate as string] = false))
    })
    .catch(err => showFailToast(err.msg || err.message || err || '获取表单数据失败！'))
}

const userSelector = ref<DefineComponent>()
const usedUser = ref(false)
/**
 * 选择人员之后操作
 */
const handleUserSelector = (userTypeAndId?: string) => {
  if (usedUser.value) return (usedUser.value = false)
  if (!userTypeAndId) {
    showFailToast('请选择人员')
    handleCloseModal()
  } else {
    model.value.userId = userTypeAndId
    handleOperate()
    usedUser.value = true
    userSelector.value?.clear()
  }
}

const userMultiSelector = ref<DefineComponent>()
const usedUserMulti = ref(false)
/**
 * 选择人员之后操作
 */
const handleUserMultiSelector = (multipleUserTypeAndId?: string) => {
  if (usedUserMulti.value) return (usedUserMulti.value = false)
  if (!multipleUserTypeAndId) {
    showFailToast('请选择人员')
    handleCloseModal()
  } else {
    model.value.userIdList = multipleUserTypeAndId.split(',')
    handleOperate()
    usedUserMulti.value = true
    userMultiSelector.value?.clear()
  }
}

const rebutSelector = ref()
/**
 * 选择驳回节点之后操作
 */
const handleRebutSelector = (rebutNode: { nodeId: string; nodeName: string }) => {
  model.value.activityId = rebutNode.nodeId
  model.value.activityName = rebutNode.nodeName
  handleOperate()
}

const delSignatureSelector = ref()
/**
 * 选择减签之后操作
 */
const handleDelSignatureSelector = (delSignatureList: string[]) => {
  model.value.deleteExecutionIdList = delSignatureList
  handleOperate()
}

const handleCloseModal = () => (state.value = {})

const onCcConfirm = (data: SelectedValue) => {
  model.value.ccToVos = (data.selectedOptions ?? []).map((e: LabelValue) => ({
    userIdAndType: e.value,
    displayName: e.label
  }))
}
</script>

<template>
  <van-form label-align="top">
    <van-field label="抄送">
      <template #input>
        <user-group-select
          :model-value="model.ccToVos?.map(e => e.userIdAndType).join()"
          multiple
          prefixed
          @confirm="onCcConfirm"
        >
          <template #default="{ open }">
            <van-space wrap>
              <van-button type="primary" size="mini" icon="plus" plain @click="open()">抄送人</van-button>
              <van-tag
                v-for="ccTo in model.ccToVos"
                :key="ccTo.userIdAndType"
                plain
                closeable
                type="success"
                size="large"
                @close="() => (model.ccToVos = model.ccToVos?.filter(e => e.userIdAndType !== ccTo.userIdAndType))"
              >
                {{ ccTo.displayName }}
              </van-tag>
            </van-space>
          </template>
        </user-group-select>
      </template>
    </van-field>
    <van-field label="动态指定下一节点执行" v-if="task?.assignExecutorStrategy">
      <template #input>
        <simple-dynamic-assign
            v-model="model.nextNodeExecutor"
            style="width: 100%"
            :condition-value="task.dynamicAssignConditionValue"
            :strategy="task.assignExecutorStrategy"
        />
      </template>
    </van-field>
    <van-field v-model="model.message" type="textarea" required label="审核意见" placeholder="请输入审核意见" />

    <label style="display: block; font-size: var(--van-cell-font-size); margin: 8px var(--van-cell-font-size)">
      操作
    </label>
    <van-space wrap style="margin: 0 var(--van-cell-font-size)">
      <van-button
        v-if="withManager || task?.buttons.includes('approve')"
        type="primary"
        size="small"
        icon="passed"
        :loading="state.approve"
        @click="handleOperateBefore('approve')"
      >
        {{ renameName('approve', '审批通过') }}
      </van-button>
      <van-button
        v-if="(withManager || task?.buttons.includes('approve')) && task?.hasMultiInstanceLoopCharacteristics"
        type="primary"
        size="small"
        icon="close"
        :loading="state.nonApprove"
        @click="handleOperateBefore('nonApprove', undefined, false)"
      >
        {{ renameName('nonApprove', '审批不通过（会签）') }}
      </van-button>
      <van-button
        v-if="task?.hasMsgEvent"
        type="primary"
        size="small"
        icon="close"
        :loading="state.msg"
        @click="handleOperateBefore('msg')"
      >
        {{ renameName('msg', '消息处理') }}
      </van-button>
      <van-button
        type="primary"
        size="small"
        icon="share-o"
        :loading="state.turnInto"
        @click="handleOperateBefore('turnInto', userSelector)"
      >
        {{ renameName('turnInto', '转办') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('delegate')"
        type="primary"
        size="small"
        icon="user-o"
        :loading="state.delegate"
        @click="handleOperateBefore('delegate', userSelector)"
      >
        {{ renameName('delegate', '委派') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('preSignature')"
        type="primary"
        size="small"
        icon="arrow-left"
        :loading="state.preSignature"
        @click="handleOperateBefore('preSignature', userMultiSelector)"
      >
        {{ renameName('preSignature', '前加签') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('postSignature')"
        type="primary"
        size="small"
        :loading="state.postSignature"
        @click="handleOperateBefore('postSignature', userMultiSelector)"
      >
        {{ renameName('postSignature', '后加签') }}
        <van-icon name="arrow" />
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('addSignature') && task?.hasMultiInstanceLoopCharacteristics"
        type="primary"
        size="small"
        icon="add-o"
        :loading="state.addSignature"
        @click="handleOperateBefore('addSignature', userMultiSelector)"
      >
        {{ renameName('addSignature', '加签（会签）') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('delSignature') && task?.hasMultiInstanceLoopCharacteristics"
        type="primary"
        size="small"
        icon="minus"
        :loading="state.delSignature"
        @click="handleOperateBefore('delSignature', delSignatureSelector)"
      >
        {{ renameName('delSignature', '减签（会签）') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('rebut')"
        type="primary"
        size="small"
        icon="revoke"
        :loading="state.rebut"
        @click="handleOperateBefore('rebut', task?.supportRebutTargetActivityIds ? null : rebutSelector)"
      >
        {{ renameName('rebut', '驳回') }}
      </van-button>
      <van-button
        v-if="!withManager && task?.buttons.includes('hold')"
        type="primary"
        size="small"
        icon="pause-circle-o"
        :loading="state.hold"
        @click="handleOperateBefore('hold')"
      >
        {{ renameName('hold', '暂存') }}
      </van-button>
      <van-button
        v-if="withManager || task?.buttons.includes('stop')"
        type="danger"
        size="small"
        icon="close"
        :loading="state.stop"
        @click="handleOperateBefore('stop')"
      >
        {{ renameName('stop', '终止') }}
      </van-button>
    </van-space>
  </van-form>

  <user-group-select ref="userSelector" prefixed @change="handleUserSelector" @close="handleCloseModal" />
  <user-group-select
    ref="userMultiSelector"
    multiple
    prefixed
    @change="handleUserMultiSelector"
    @close="handleCloseModal"
  />
  <rebut-model ref="rebutSelector" :task-id="model.taskId" @select="handleRebutSelector" @close="handleCloseModal" />
    <del-signature-modal
      ref="delSignatureSelector"
      :task-id="model.taskId"
      :process-instance-id="model.processInstanceId"
      @select="handleDelSignatureSelector"
      @close="handleCloseModal"
    />
</template>
