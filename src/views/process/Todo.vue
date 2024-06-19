<script setup lang="ts">
import type { ActRuTask } from './type'
import type { TagType } from 'vant'

const { dataList, loading, refreshing, pagination, queryParam, onSearch, refreshList, nextPage, resetFilter } = useList<
  ActRuTask,
  ActRuTask & { instanceName: string; taskCategory: string }
>({
  baseApi: '/process-center/task/run',
  initQueryParam: { category: 'todo' }
})

const finished = computed(() => dataList.length === pagination.total)

const categoryMap = {
  todo: {
    label: '待办',
    type: 'primary'
  },
  hold: {
    label: '暂存',
    type: 'warning'
  },
  cc: {
    label: '抄送',
    type: 'success'
  }
}

const router = useRouter()

const openProcessOperate = ({ id, procInstId, category }: ActRuTask) => {
  router.push({
    name: 'ProcessOperate',
    params: { procInstId, taskId: id },
    query: { category }
  })
}

/**
 * 认领并打开执行界面
 */
const handleClaimAndExecuteTask = async (task: ActRuTask) => {
  loading.value = true
  api
    .put('/process-center/task/operate', {
      taskId: task.id,
      taskOperate: 'claim'
    })
    .then(() => openProcessOperate(task))
    .catch(err => showFailToast(err.msg || err.message || '认领失败'))
    .finally(() => (loading.value = false))
}
</script>

<template>
  <van-search
    v-model="queryParam.instanceName"
    show-action
    shape="round"
    placeholder="请输入搜索关键词"
    @search="onSearch"
    @blur="onSearch"
    @clear="resetFilter"
    @cancel="resetFilter"
  />
  <van-pull-refresh
    class="listBgColor"
    v-model="refreshing"
    style="height: calc(100% - 55px); overflow-y: auto"
    @refresh="refreshList"
  >
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="nextPage">
      <van-swipe-cell v-for="item in dataList" :key="item.id">
        <van-cell-group inset style="margin-top: 10px">
          <van-cell
            :border="false"
            :title="item.processInstanceName"
            @click="item.assignee ? openProcessOperate(item) : handleClaimAndExecuteTask(item)"
          >
            <template #value v-if="categoryMap[item.category as keyof typeof categoryMap]">
              <van-tag v-if="!item.assignee" plain style="margin-right: 10px">未认领</van-tag>
              <van-tag plain :type="categoryMap[item.category as keyof typeof categoryMap].type as TagType">
                {{ categoryMap[item.category as keyof typeof categoryMap].label }}
              </van-tag>
            </template>
            <template #label>
              <div>节点名称：{{ item.name }}</div>
              <div>开始时间：{{ item.createTime }}</div>
            </template>
          </van-cell>
        </van-cell-group>
      </van-swipe-cell>
    </van-list>
  </van-pull-refresh>
</template>

<style scoped lang="scss">
:deep(.van-cell__title),
:deep(.van-cell__value) {
  flex: auto;
}

.fh {
  height: 100%;
}
.listBgColor {
  background: var(--van-gray-3);
}
</style>
