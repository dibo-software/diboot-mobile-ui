<script setup lang="ts">
const props = defineProps<{ definitionId: string; businessKey: string }>()

const { onSearch, loading, dataList } = useList<{ processInstanceId: string; updateTime: string }>({
  baseApi: `/process-center/definition/current-user-drafts/${props.definitionId}/${props.businessKey}`
})

watch(loading, value =>
  value ? showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 }) : closeToast()
)

const visible = ref(false)

defineExpose({
  open() {
    visible.value = true
    onSearch()
  }
})

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const handleDraft = (id: string) => {
  emit('select', id)
  visible.value = false
}
</script>

<template>
  <van-popup v-model:show="visible" title="草稿箱" position="bottom" :style="{ height: '80%' }">
    <ul class="draft-list">
      <li
        v-for="(item, index) in dataList"
        :key="index"
        class="draft-list-item"
        @click="handleDraft(item.processInstanceId)"
      >
        <div class="avatar" style="margin: -3px 5px -3px 0">草稿 {{ index }}</div>
        <div class="description">
          <p>保存于 {{ item.updateTime }}， 点击恢复该草稿</p>
        </div>
      </li>
    </ul>
  </van-popup>
</template>

<style scoped lang="scss">
.draft-list {
  margin: 0;
  padding: 0;
  list-style-type: none;

  &-item {
    padding: 10px;
    display: flex;
    cursor: pointer;
    border-bottom: 1px solid #f3f3f3;

    &:hover {
      background-color: rgba(203, 245, 147, 0.1);
    }

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      color: #fff;
      background-color: #8dc63f;
      font-size: 14px;
      font-weight: 400;
      text-align: center;
      line-height: 50px;
    }

    .description {
      color: #a3a3a3;
      font-size: 14px;
    }
  }
}
</style>
