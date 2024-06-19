<script setup lang="ts">
import type { ActReProcdef } from './type'

const { dataList, loading, refreshing, pagination, queryParam, onSearch, refreshList, nextPage, resetFilter } =
  useList<ActReProcdef>({
    baseApi: '/process-center/definition/authorized-proc-def'
  })

const finished = computed(() => dataList.length === pagination.total)

const router = useRouter()

// 发起流程
const handleStartProcess = (definition: ActReProcdef) =>
  router.push({ name: 'ProcessStart', params: { procDefId: definition.id } })
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
  <van-pull-refresh v-model="refreshing" style="height: calc(100% - 55px); overflow-y: auto" @refresh="refreshList">
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="nextPage">
      <van-swipe-cell v-for="item in dataList" :key="item.id">
        <van-cell :border="false" :title="item.name" @click="handleStartProcess(item)" />
        <template #right>
          <van-button square type="warning" text="流程图" />
        </template>
      </van-swipe-cell>
    </van-list>
  </van-pull-refresh>
</template>
