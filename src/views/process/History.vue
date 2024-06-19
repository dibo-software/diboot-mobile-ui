<script setup lang="ts">
import type { ActHiProcinst } from './type'
import type { TagType } from 'vant'

const { dataList, loading, refreshing, pagination, queryParam, onSearch, refreshList, nextPage, resetFilter } =
  useList<ActHiProcinst>({
    baseApi: '/process-center/history'
  })

const finished = computed(() => dataList.length === pagination.total)

const statusColorMap: Record<string, TagType> = {
  已完成: 'success',
  进行中: 'warning',
  已撤销: 'default',
  不通过: 'danger'
}

// 撤销
const handleRevoke = (processInstanceId: string, taskOperate: string) => {
  showConfirmDialog({ title: '您确定撤回本次流程吗？', message: '撤回后当前流程自动结束！' }).then(() => {
    loading.value = true
    api
      .put('/process-center/task/operate', { processInstanceId, taskOperate, validTask: false })
      .then(() => {
        showSuccessToast('操作成功')
        return onSearch()
      })
      .catch(err => showFailToast(err.msg || err.message || '操作失败'))
      .finally(() => (loading.value = false))
  })
}

const router = useRouter()

/**
 * 重新发起
 */
const handleRestartProcess = (instance: ActHiProcinst) =>
  router.push({
    name: 'ProcessStart',
    params: { procDefId: instance.procDefId },
    query: { procInstId: instance.id }
  })

/**
 * 催办
 * @param id
 */
const handleUrge = (id: string) =>
  api
    .post(`/process-center/task/urge/${id}`)
    .then(res => showSuccessToast(res.msg))
    .catch(err => showFailToast(err.msg || err.message || '操作失败'))

const openProcessDetail = ({ id }: ActHiProcinst) => {
  router.push({
    name: 'ProcessDetail',
    params: { procInstId: id }
  })
}
</script>

<template>
  <van-search
    v-model="queryParam.name"
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
          <van-cell :border="false" :title="item.name" @click="openProcessDetail(item)">
            <template #value>
              <van-tag plain :type="statusColorMap[item.statusLabel]">{{ item.statusLabel }}</van-tag>
            </template>
            <template #label>
              <div>流程名称：{{ item.processDefinitionName }}</div>
              <div>开始时间：{{ item.startTime }}</div>
              <div>结束时间：{{ item.endTime }}</div>
              <div>流程耗时：{{ item.durationLabel }}</div>
            </template>
          </van-cell>
          <template #right>
            <van-button
              v-if="['已撤销', '不通过'].includes(item.statusLabel)"
              square
              type="primary"
              text="重新发起"
              class="fh"
              @click="handleRestartProcess(item)"
            />
            <template v-if="item.endTime == null">
              <van-button square type="warning" text="催办" class="fh" @click="handleUrge(item.id)" />
              <van-button square type="danger" text="撤销" class="fh" @click="handleRevoke(item.id, 'cancel')" />
            </template>
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
