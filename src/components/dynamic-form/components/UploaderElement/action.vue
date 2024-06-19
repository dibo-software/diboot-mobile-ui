<script setup lang="ts" name="UploaderElementIndex">
import useComponentAction from '../hooks/use-component-action'
import useUploadFile from '@/hooks/use-upload-file'
import iconLoad from '@/utils/icon-loader'
import IconTooltip from '@/components/icon-tooltip/index.vue'
type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}
const props = defineProps<Props>()
const { model, modelValue, disabledValue, config, labelWidth, showLabel, isRequired, rules, propName } =
  useComponentAction({
    id: props.id,
    config: props.config,
    model: props.model,
    modelIndex: props.modelIndex,
    hideFieldName: props.hideFieldName
  })
// Build Icon
const getDynamicIcon = (iconVal: string) => iconLoad(iconVal)
const multiple: boolean = config.maxFileCount > 1

// 文件上传处理
const imageUrl = ref<string>()
const modelFileList = computed(() => {
  const { fieldName } = config
  return model.value[`${fieldName}Files`] ?? []
})

const { uploadFileHandle, fileList, onRemove } = useUploadFile(
  fileIds => (modelValue.value = fileIds),
  () => modelFileList.value
)

const checkFileHandle = (file: File) => {
  // 文件校验
  file.type
  return true
}
const onOversize = () => showFailToast(`文件大小不能超过 ${props.config.size}MB`)
</script>
<template>
  <van-field
    :required="isRequired"
    :rules="rules"
    :name="propName"
    v-model="modelValue"
    :placeholder="config.placeholder"
  >
    <template #label v-if="showLabel">
      <span class="label-span">
        <span>{{ showLabel }}</span>
        <icon-tooltip v-if="config.fieldTips">
          <template #tip>
            <pre>{{ config.fieldTips }}</pre>
          </template>
        </icon-tooltip>
      </span>
    </template>
    <template #input>
      <van-uploader
        v-model="fileList"
        :disabled="disabledValue"
        :accept="config.accept ?? ''"
        :max-size="config.maxFileSize ? 1024 * 1024 * config.maxFileSize : undefined"
        :max-count="config.maxFileCount"
        :before-read="checkFileHandle"
        :after-read="uploadFileHandle"
        @oversize="onOversize"
        @delete="onRemove"
      >
        <template #default v-if="config.type === 'file_upload'">
          <van-button icon="plus" size="small" type="primary">{{ config.uploaderTitle }}</van-button>
        </template>
      </van-uploader>
    </template>
  </van-field>
</template>
<style scoped lang="scss">
.upload-plus-hide :deep(.el-upload--picture-card) {
  display: none;
}
.upload-plus-disabled :deep(.el-upload--picture-card) {
  cursor: not-allowed;
}
</style>
