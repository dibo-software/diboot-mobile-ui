<script setup lang="ts" name="BusinessObjectDataListSelector">
import type { ListConfig, TreeConfig } from '@/components/di/type'
import PickerToolbar from 'vant/es/picker/PickerToolbar'
import type { ConditionItem } from '@/hooks/use-option'
import type { SelectedRowValue } from '@/components/di/type'

type Props = {
  appModule: string
  dataType: string
  dataLabel: string
  selectedRows: any[]
  multiple?: boolean
  disabled?: boolean
  showToolbar?: boolean
  // 列表数据过滤条件
  conditions?: Array<ConditionItem>
}
const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  disabled: false,
  showToolbar: true
})
const emit = defineEmits<{
  (e: 'confirm', value: SelectedRowValue): void
  (e: 'cancel', value?: SelectedRowValue): void
}>()

const curAppModule = props.appModule || inject('app-module', '')
const { dataList, loading, pagination, queryParam, onSearch, nextPage, resetFilter, getList } = useList<
  Record<string, any>
>({
  baseApi: `/${curAppModule}/dynamic-api/${props.dataType}`,
  initQueryParam: props.conditions?.length ? { _conditions: JSON.stringify(props.conditions) } : {}
})

const refreshing = ref(false)
const finished = computed(() => dataList.length === pagination.total)

const onRefresh = async () => {
  refreshing.value = true
  pagination.current = 1
  await getList(true)
  refreshing.value = false
}
onRefresh()

const config = {
  tree: {} as Omit<TreeConfig, 'sortApi'>,
  list: {} as Omit<ListConfig, 'operation'>,
  existsForm: false,
  invisibleProps: [] as string[]
}

// 当前选中行数据列表
const dynamicSelectedRows = ref<Record<string, any>[]>([])
watch(
  () => props.selectedRows,
  val => {
    dynamicSelectedRows.value = val
  },
  {
    deep: true,
    immediate: true
  }
)
// 获取单选数据值
const radioVal = computed(() => {
  if (props.multiple || dynamicSelectedRows.value.length === 0) {
    return ''
  }
  return dynamicSelectedRows.value[0].id
})
// 获取复选数据值
const checkboxVals = computed(() => {
  if (!props.multiple || dynamicSelectedRows.value.length === 0) {
    return []
  }
  return dynamicSelectedRows.value.map(item => item.id)
})
const onRadioGroupChange = (val: string, item: Record<string, any>) => {
  dynamicSelectedRows.value = [item]
}
const onCheckboxGroupChange = (val: string, item: Record<string, any>) => {
  const value = item.id
  if (checkboxVals.value.includes(value)) {
    dynamicSelectedRows.value = dynamicSelectedRows.value.filter(item => item.id !== value)
  } else {
    dynamicSelectedRows.value.push(item)
  }
}

const removeRow = (index: number) => {
  dynamicSelectedRows.value.splice(index, 1)
}

const onConfirm = () => {
  emit('confirm', {
    selectedRows: dynamicSelectedRows.value,
    selectedValues: dynamicSelectedRows.value.map(item => item.id)
  })
}
const onCancel = () => emit('cancel')

const dataListContainerRef = ref()
onMounted(() => {
  setTimeout(() => {
    const height = dataListContainerRef.value.offsetHeight
    console.log('height', height)
  }, 500)
})

provide('multiple', props.multiple)
</script>
<template>
  <div class="data-list-container" ref="dataListContainerRef">
    <PickerToolbar v-if="props.showToolbar" @cancel="onCancel" @confirm="onConfirm" />
    <div class="tag-container">
      <template v-if="dynamicSelectedRows.length > 0">
        <van-tag
          v-for="(item, index) in dynamicSelectedRows"
          :key="item.value"
          closeable
          size="medium"
          type="primary"
          style="margin-right: 6px; margin-bottom: 6px"
          @close="removeRow(index)"
        >
          {{ item[props.dataLabel] }}
        </van-tag>
      </template>
      <template v-else>
        <div style="padding-bottom: 6px">暂无已选数据</div>
      </template>
    </div>
    <van-search
      v-model="queryParam[props.dataLabel]"
      show-action
      shape="round"
      placeholder="请输入搜索关键词"
      @search="onSearch"
      @blur="onSearch"
      @clear="resetFilter"
      @cancel="resetFilter"
    />
    <div class="list-container">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-checkbox-group v-if="props.multiple" :model-value="checkboxVals" @input="onCheckboxGroupChange">
          <van-cell-group>
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="nextPage">
              <van-cell
                v-for="(item, index) in dataList"
                :title="item[props.dataLabel] as string"
                :key="index"
                clickable
                @click="onCheckboxGroupChange(item.id, item)"
              >
                <template #icon>
                  <van-checkbox shape="square" :name="item.id" />
                </template>
              </van-cell>
            </van-list>
          </van-cell-group>
        </van-checkbox-group>
        <van-radio-group v-else :model-value="radioVal" @input="onRadioGroupChange">
          <van-cell-group>
            <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="nextPage">
              <van-cell
                v-for="(item, index) in dataList"
                :title="item[props.dataLabel] as string"
                :key="index"
                clickable
                @click="onRadioGroupChange(item.id, item)"
              >
                <template #icon>
                  <van-radio :name="item.id" />
                </template>
              </van-cell>
            </van-list>
          </van-cell-group>
        </van-radio-group>
      </van-pull-refresh>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.data-list-container {
  height: 100%;
  & :deep(.van-cell__title) {
    padding-left: 6px;
  }
  .tag-container {
    padding-left: 16px;
    box-sizing: border-box;
  }
  .list-container {
    height: calc(100% - 130px);
    overflow-y: auto;
  }
}
</style>
