<script setup lang="ts">
import type { ActHiTaskinst } from './type'
import { showSuccessToast } from 'vant'

const defaultOrderBy = 'endTime:DESC'

const {
  dataList,
  loading,
  refreshing,
  pagination,
  buildQueryParam,
  queryParam,
  onSearch,
  refreshList,
  nextPage,
  resetFilter
} = useList<
  ActHiTaskinst,
  ActHiTaskinst & { instanceName: string; taskCategory: string; findByCurrentUserId: boolean }
>({
  baseApi: '/process-center/task',
  initQueryParam: {
    taskCategory: 'done',
    findByCurrentUserId: true
  }
})
pagination.orderBy = defaultOrderBy
buildQueryParam()

const finished = computed(() => dataList.length === pagination.total)

const handleTakeBack = (taskId: string, activityId: string) => {
  showConfirmDialog({ title: '您确定取回重新处理吗？', message: '取回后请前往 "我的待办" 查看并处理！' }).then(() => {
    loading.value = true
    api
      .put('/process-center/task/operate', { taskId, activityId, taskOperate: 'takeBack' })
      .then(() => {
        showSuccessToast('操作成功')
        return onSearch()
      })
      .catch(err => showFailToast(err.msg || err.message || '操作失败'))
      .finally(() => (loading.value = false))
  })
}

const router = useRouter()

const openProcessDetail = ({ procInstId, id }: ActHiTaskinst) => {
  router.push({
    name: 'ProcessDetail',
    params: { procInstId, taskId: id }
  })
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
          <van-cell :border="false" :title="item.processInstanceName" @click="openProcessDetail(item)">
            <template #value v-if="item.allowBack && item.category !== 'cc'">
              <van-tag>可取回</van-tag>
            </template>
            <template #label>
              <div>节点名称：{{ item.name }}</div>
              <div>开始时间：{{ item.startTime }}</div>
              <div>结束时间：{{ item.endTime }}</div>
            </template>
          </van-cell>
          <template #right v-if="item.allowBack && item.category !== 'cc'">
            <van-button
              square
              type="warning"
              text="取回"
              class="fh"
              @click="handleTakeBack(item.id, item.taskDefKey)"
            />
          </template>
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
