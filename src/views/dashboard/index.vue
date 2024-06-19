<script setup lang="ts">
// import workflow from '@/assets/image/diboot-workflow.png'
import lowCode from '@/assets/image/low-code.png'
import type { ActReProcdef } from '@/views/process/type'

const headerData = ref<Partial<Record<string, number>>>({})
// 获取统计数据
api
  .get<Record<string, number>>('/process-center/task/count')
  .then(res => (headerData.value = res.data))
  .catch(err => showFailToast(err.msg || err.message || '获取流程统计数据失败'))

const loading = ref(false)
const finished = ref(false)

const commonlyUsed = ref<ActReProcdef[]>()
// 获取常用流程列表
const onLoad = () =>
  api
    .get<ActReProcdef[]>('/process-center/definition/common')
    .then(res => (commonlyUsed.value = res.data))
    .catch(err => showFailToast(err.msg || err.message || '获取常用流程列表失败'))
    .finally(() => {
      loading.value = false
      finished.value = true
    })
</script>

<template>
  <van-space direction="vertical" size="16px">
    <van-image width="calc(100% - 40px)" class="cover" :src="lowCode" />

    <van-notice-bar
      color="#558cda"
      background="#e2ecf9"
      style="height: 35px; border-radius: 10px; margin: 0 20px; padding: 0 10px; letter-spacing: 1px; font-size: 13px"
    >
      <template #left-icon>
        <Icon name="Notice" size="28" style="margin-right: 6px" />
      </template>
      先进的工作流体系、延申至微服务场景
    </van-notice-bar>

    <div>
      <div class="title" style="background-color: var(--van-cell-background)">业务服务</div>

      <van-grid style="padding: 0 15px; background-color: var(--van-background-2)">
        <van-grid-item icon="photo-o" text="发起流程" @click="$router.push({ name: 'ProcessInitiate' })">
          <template #icon>
            <Icon name="ProcessInitiate" size="var(--van-grid-item-icon-size)" />
          </template>
        </van-grid-item>
        <van-grid-item icon="photo-o" text="我发起的" @click="$router.push({ name: 'ProcessHistory' })">
          <template #icon>
            <Icon name="ProcessInitiated" size="var(--van-grid-item-icon-size)" />
          </template>
        </van-grid-item>
        <van-grid-item
          icon="records"
          icon-color="#436ef6"
          text="我的待办"
          :badge="Number(headerData['todo'] ?? 0) + Number(headerData['notice'] ?? 0)"
          :badge-props="{ showZero: false }"
          @click="$router.push({ name: 'ProcessTodo' })"
        >
          <template #icon>
            <Icon name="ProcessTodo" size="var(--van-grid-item-icon-size)" />
          </template>
        </van-grid-item>
        <van-grid-item icon="photo-o" text="我的已办" @click="$router.push({ name: 'ProcessDone' })">
          <template #icon>
            <Icon name="ProcessDone" size="var(--van-grid-item-icon-size)" />
          </template>
        </van-grid-item>
      </van-grid>
    </div>

    <div>
      <div class="title" style="padding: 10px 0; border-bottom: 0.3px solid #cccccc50">常用流程</div>

      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
        style="letter-spacing: 1px"
      >
        <van-cell
          v-for="item in commonlyUsed"
          :key="item.id"
          :title="item.name"
          :to="{ name: 'ProcessStart', params: { procDefId: item.id } }"
          style="padding: var(--van-cell-vertical-padding) 24px"
        >
          <template #icon>
            <Icon name="ProcessStart" size="24px" style="margin-right: 5px" />
          </template>
          <template #title>
            <van-text-ellipsis :content="item.name" />
          </template>
        </van-cell>
      </van-list>
    </div>
  </van-space>
</template>

<style scoped lang="scss">
.van-space {
  height: 100%;

  .cover {
    display: block;
    margin: 15px 20px 0 20px;
    box-shadow: 1px 1px 5px 1px #ccc;

    &,
    :deep(img) {
      border-radius: 10px;
    }
  }

  .van-hairline--top,
  .van-grid-item {
    &,
    :deep(.van-hairline) {
      position: static;
    }
  }

  :deep(.van-space-item:nth-child(3)) {
    padding-bottom: 12px;
    margin-bottom: 0 !important;
    background-color: var(--van-background);
  }

  .title {
    height: 20px;
    display: flex;
    align-items: center;
    font-weight: bold;

    &:before {
      width: 3px;
      height: 100%;
      margin: 0 10px;
      border-radius: 2px;
      background-color: #3868ad;
      content: ' ';
    }
  }
}
</style>
