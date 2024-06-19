<script setup lang="ts">
import type { ActHiComment, ActRuTask } from '../type'
import { imageBindSrc, fileDownload } from '@/utils/file'

const props = defineProps<{ procInstId: string }>()

const currentTask = ref<ActRuTask>()

api.get<ActRuTask>(`/process-center/task/${props.procInstId}`).then(res => (currentTask.value = res.data))

const { getList, dataList } = useList<ActHiComment>({
  baseApi: '/process-center/act-hi-comment',
  initQueryParam: { procInstId: props.procInstId }
})
getList()

// 暴露出数据列表
defineExpose({ getDataList: () => dataList })
</script>

<template>
  <div class="comment-wrapper">
    <van-notice-bar
      v-if="currentTask"
      wrapable
      color="#1989fa"
      background="#ecf9ff"
      left-icon="info-o"
      style="margin-bottom: 16px"
    >
      当前节点: {{ currentTask.name }}，处理人: {{ currentTask.assignName || '暂未认领' }}，接收时间:
      {{ currentTask.createTime }}
    </van-notice-bar>

    <van-steps v-if="dataList.length !== 0" direction="vertical">
      <van-step v-for="(comment, index) in dataList" :key="`comment_${index}`">
        <van-collapse :model-value="[`collapse_${index}`]">
          <van-collapse-item :name="`collapse_${index}`">
            <template #title>
              <van-row>
                <van-col :span="12">操作：{{ comment.typeLabel }}</van-col>
                <van-col :span="12">{{ comment.time }}</van-col>
                <van-col :span="12">操作人：{{ comment.userName }}</van-col>
                <van-col v-if="comment.laneName" :span="12">
                  <van-tag>
                    {{ comment.laneName }}
                  </van-tag>
                </van-col>
              </van-row>
            </template>

            <van-space direction="vertical" fill>
              <div>任务节点：{{ comment.taskName || comment.typeLabel }}</div>
              <template v-if="!['start', 'resubmit'].includes(comment.type)">
                <div>
                  处理耗时：{{ comment.duration + '分钟' }} (<span title="接收时间">{{ comment.claimTime }}</span> ~
                  <span title="处理时间">{{ comment.endTime }}</span
                  >)
                </div>
                <div>
                  审批意见：
                  <div style="white-space: break-spaces; display: inline" v-html="comment.fullMsg" />
                </div>
                <div v-if="comment.attachmentFileList && comment.attachmentFileList.length > 0">
                  审批附件：
                  <template v-for="(item, i) in comment.attachmentFileList" :key="i">
                    <van-button icon="down" @click="fileDownload(item.accessUrl)" size="small">
                      {{ item.fileName }}
                    </van-button>
                  </template>
                </div>
              </template>
            </van-space>
          </van-collapse-item>
        </van-collapse>
      </van-step>
    </van-steps>

    <van-empty v-else />
  </div>
</template>

<style scoped lang="scss">
.comment-wrapper {
  padding: 6px 0;
}
</style>
