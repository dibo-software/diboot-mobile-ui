<script setup lang="ts" name="SubFormAction">
import useComponentAction from '../hooks/use-component-action'
import useDataChange from '../hooks/use-data-change'
import { extractFields } from '../../utils/formFieldsExtractor'
import type { FormField } from '../../utils/type'
import { getMappingResultValue } from '../../utils/formModel/fieldsMappingConvertor'
import IconTooltip from '@/components/icon-tooltip/index.vue'

type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const configMap = inject('config-map', {})
const appModule = inject('app-module', '')
// 动态导入指定位置处的所有动态组件
const componentMap: Record<string, any> = inject('component-map', {})

const { model, modelValue, disabledValue, config, labelWidth, showLabel } = useComponentAction({
  id: props.id,
  config: props.config
})

const { invokeDataChangeEvent, dataList } = useDataChange({
  id: props.id,
  config: props.config,
  modelValue,
  model: model.value
})

const activeNames = ref<string[]>([])

if (!modelValue.value) {
  config.fieldName = config.formKey
  modelValue.value = []
}

const loadFormFields = () => {
  const fields: FormField[] = extractFields(config.components, configMap, true)
  return fields
}

// 定义隐藏字段id列表数组
type DisplayControlInfo = {
  hiddenIdsList: string[][]
}
const displayControlInfo = reactive<DisplayControlInfo>({ hiddenIdsList: [] })

// 用于渲染的表格列
const invisibleProps: string[] = inject('invisible-props', [])
const formColumns = computed(() => {
  const formFields: FormField[] = loadFormFields()
  let colWidth: string | number = ''
  const showOperate = false
  const { mode: widthMode, wList, width } = config.colWidth
  if (widthMode === 'percent') {
    const sumColCount = formFields.length
    const allWidth = showOperate ? 90 : 100
    colWidth = `${allWidth / sumColCount}%`
  } else if (widthMode === 'fixed') {
    colWidth = width
  }
  let columns = formFields.map((field, index: number) => {
    let currentWidth: string | number = colWidth
    if ('custom' === widthMode) {
      currentWidth = wList[index]
    }
    return {
      field,
      width: currentWidth
    }
  })
  // 如果具有字段权限，则通过子表单不可见权限进行组件过滤
  columns = columns.filter((col: Record<string, any>) => {
    const { key } = col.field
    const permissionFieldName = `${config.formKey}.${key}`
    return !invisibleProps || !invisibleProps.includes(permissionFieldName)
  })
  return columns
})

// 是否具有添加权限
const hasAppendPermission = computed(() => {
  return !invisibleProps || !invisibleProps.includes(`${config.formKey}.APPEND_FLAG__`)
})
// 是否具有删除权限
const hasRemovePermission = computed(() => {
  return !invisibleProps || !invisibleProps.includes(`${config.formKey}.REMOVE_FLAG__`)
})

// 是否允许进行添加/删除操作
const allowAddItem = computed(() => {
  const { maxLineCount } = config
  const count = modelValue.value && modelValue.value.length > 0 ? modelValue.value.length : 0
  return maxLineCount == null || count < maxLineCount
})

const allowRemoveItem = computed(() => {
  const { minLineCount } = config
  const count = modelValue.value && modelValue.value.length > 0 ? modelValue.value.length : 0
  return minLineCount == null || count > minLineCount
})

const addItem = () => {
  if (!allowAddItem.value) {
    showNotify({ type: 'warning', message: '已达最大条数，不可添加' })
    return false
  }
  // 先添加显隐控制信息
  displayControlInfo.hiddenIdsList.push([])
  const item: Record<string, any> = {}
  dataList.value.push(item)
}
const removeItem = (index: number) => {
  if (!allowRemoveItem.value) {
    showNotify({ type: 'warning', message: '已达最小条数，不可删除' })
    return false
  }
  dataList.value.splice(index, 1)
  // 移除显隐控制信息
  displayControlInfo.hiddenIdsList.splice(index, 1)
}

const copyItem = (index: number) => {
  if (disabledValue.value) {
    return false
  }
  if (!allowAddItem.value) {
    showNotify({ type: 'warning', message: '已达最大条数，不可复制行' })
    return false
  }
  const item = dataList.value[index]
  if (item == null) {
    showNotify({ type: 'warning', message: '复制行失败' })
    return false
  }
  const newItem = _.cloneDeep(item)
  if (newItem.id) {
    delete newItem.id
  }
  // 先添加显隐控制信息
  displayControlInfo.hiddenIdsList.push([])
  dataList.value.push(newItem)
}

const initDataList = () => {
  const { defaultLineCount } = config
  if (modelValue && modelValue?.value == null) {
    modelValue.value = []
  }
  if (dataList.value.length > 0) {
    initDisplayControlInfo(dataList.value.length)
    return false
  }
  for (let i = 0; i < defaultLineCount; i++) {
    addItem()
  }
}

const formRef = ref()
const validate = async () => {
  return await validateForm()
}
const validateForm = () => {
  return new Promise((resolve, reject) => {
    formRef.value
      ?.validate()
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        const resultObj = formRef.value?.getValidationStatus()
        const invalidFields: string[] = Object.keys(resultObj).reduce((prevArr: string[], curKey: string) => {
          if (resultObj[curKey] === 'failed') {
            prevArr.push(curKey)
          }
          return prevArr
        }, [])
        let invalidIndex: string[] = invalidFields.map(fieldName => {
          return fieldName.split('.')[0]
        })
        // 将对应序号的子表单数据自动展开
        activeNames.value = invalidIndex
        reject('子表单校验失败')
      })
  })
}

const showCollapse = ref<boolean>(false)
const tableWidth = ref<number>(600)
const setTableWidth = () => {
  const width = document.querySelector(`#form-${config.id}`)?.clientWidth
  tableWidth.value = width ?? 600
}
onMounted(async () => {
  initDataList()
  setTableWidth()
  await nextTick()
  showCollapse.value = true
  if (tableWidth.value === 0) {
    await nextTick()
    setTableWidth()
  }
})
const reset = () => {
  formRef.value?.resetFields()
  modelValue.value = []
  initDataList()
}

const importDataSuccess = (list = []) => dataList.value.push(...list)

provide('form-scope-id', config.id)
defineExpose({
  validate,
  reset
})

const relationValueImportFlag = ref(true)
const setFormDataMonitor = () => {
  if (!config.autoImport) {
    return false
  }
  const { relationKey, importFieldsApi, queryListApi, relations } = config.autoImport
  if (!relationKey || !importFieldsApi || !queryListApi || !relations || relations.length === 0) {
    return false
  }
  // 对于配置关联字段自动导入的场景，对关联字段数据进行监视
  watch(
    () => model.value?.[config.autoImport?.relationKey],
    async (val, oldVal) => {
      if (val === oldVal) {
        return false
      }
      // 针对未导入且oldVal为空，且当前数据列表为空的情况，不执行导入
      if (!relationValueImportFlag.value && !oldVal && dataList.value?.length > 0) {
        relationValueImportFlag.value = true
        return false
      }
      if (val) {
        await autoImportRelationDataList(val, config.autoImport)
      }
    }
  )
}

setFormDataMonitor()

const requestData = inject('request-data', {})

const autoImportRelationDataList = async (value: string, autoImportConfig: any) => {
  const { queryListApi, relations } = autoImportConfig
  const apis = queryListApi.split('__')
  let apiMethod = apis.length === 2 ? apis[0] : 'POST'
  apiMethod = apiMethod.toLowerCase()
  const apiUri = apis.length === 2 ? apis[1] : queryListApi
  try {
    const res = await (apiMethod === 'post'
      ? api.post(apiUri, { value, ...requestData })
      : api.get(apiUri, { value, ...requestData }))
    setResData2DataList(res.data, relations)
  } catch (e: any) {
    console.log('err', e)
    showNotify({ type: 'warning', message: e.msg || '自动导入子表单数据列表出错' })
  }
}

const setResData2DataList = (list: any[], relations: any[]) => {
  if (!list || !relations || relations.length === 0) {
    return false
  }
  // 如果导入标记已为false，则不导入
  if (!relationValueImportFlag.value) {
    relationValueImportFlag.value = true
    return false
  }
  // 初始化显隐控制信息
  initDisplayControlInfo(list.length)
  // 将转换后的result数据设置到子表单列表中
  dataList.value = list.map(item => {
    const obj: Record<string, any> = {}
    for (const rel of relations) {
      const { origin, target, convertor } = rel
      if (!origin || !target) {
        continue
      }
      obj[target] = getMappingResultValue(item[origin], convertor)
    }
    return obj
  })
}

// 初始化每列隐藏字段列表的定义列表
const initDisplayControlInfo = (len: number) => {
  displayControlInfo.hiddenIdsList = Array(len).fill([])
}
</script>

<template>
  <van-field v-if="showLabel">
    <template #label>
      <span class="label-span">
        <span>{{ showLabel }}</span>
        <icon-tooltip v-if="props.config.fieldTips">
          <template #tip>
            <pre>{{ props.config.fieldTips }}</pre>
          </template>
        </icon-tooltip>
      </span>
    </template>
    <template #input> </template>
  </van-field>
  <van-form ref="formRef" :scroll-to-error="true">
    <van-collapse v-model="activeNames" v-if="showCollapse">
      <van-collapse-item
        :key="index"
        :name="`${index}`"
        :lazy-render="false"
        :title="`${index + 1}、${config.formName}`"
        v-for="(record, index) in dataList"
      >
        <template v-for="col in formColumns" :key="col.field.key">
          <template
            v-if="
              displayControlInfo.hiddenIdsList[index] &&
              displayControlInfo.hiddenIdsList[index].includes(col.field.meta?.id)
            "
          >
          </template>
          <template v-else>
            <component
              :key="dataList[index]"
              :is="componentMap[col.field.meta?.element]"
              :id="col.field.meta?.id"
              v-model:hidden-component-ids="displayControlInfo.hiddenIdsList[index]"
              :config="configMap[col.field.meta?.id]"
              :model="dataList[index]"
              :model-index="index"
            />
          </template>
        </template>
        <van-button
          v-if="!disabledValue && hasAppendPermission"
          icon="description"
          type="success"
          size="small"
          plain
          style="width: 100%"
          @click="copyItem(index)"
          :style="{ marginBottom: '8px' }"
          >复制</van-button
        >
        <van-button
          v-if="!disabledValue && (hasRemovePermission || !record.id)"
          icon="delete-o"
          type="danger"
          size="small"
          plain
          style="width: 100%"
          @click="removeItem(index)"
          >删除</van-button
        >
      </van-collapse-item>
    </van-collapse>
  </van-form>
  <p style="width: 100%; text-align: center">
    <van-button
      v-if="!disabledValue && hasAppendPermission"
      icon="plus"
      type="primary"
      plain
      size="small"
      @click="addItem"
      style="width: calc(100% - 20px)"
    >
      添加
    </van-button>
  </p>
</template>

<style lang="scss" scoped>
.form-container {
  width: 100%;
}
.table-wrapper {
  width: 100%;
}
</style>
