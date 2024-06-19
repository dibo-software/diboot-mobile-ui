<script setup lang="ts" name="SubFormActionForOneRel">
import useComponentAction from '../hooks/use-component-action'
import ActionView from '../../render/ActionView.vue'
import IconTooltip from '@/components/icon-tooltip/index.vue'
import type { FormInstance } from 'vant'
type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const formConfig: Record<string, any> = inject('form-config', {})

const { modelValue, config, showLabel } = useComponentAction({
  id: props.id,
  config: props.config
})
if (!modelValue.value) {
  config.fieldName = config.formKey
  modelValue.value = {}
}

const formRef = ref<FormInstance>()
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
        reject('子表单校验失败')
      })
  })
}

const reset = () => {
  formRef.value?.resetFields()
  modelValue.value = {}
}

// 分发字段权限属性列表
const getSubProps = (currentProps: string[]) => {
  return currentProps?.filter(item => item.indexOf(`${config.formKey}.`) === 0).map(item => item.split('.')[1])
}
const invisibleProps: string[] = inject('invisible-props', [])
const subInvisibleProps: string[] = getSubProps(invisibleProps)

provide('form-scope-id', config.id)
provide('model', modelValue)
provide('invisible-props', subInvisibleProps)
defineExpose({
  validate,
  reset
})
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
  <van-form ref="formRef" :label-align="formConfig?.layout === 'top' ? 'top' : 'left'" :scroll-to-error="true">
    <action-view ref="actionViewRef" :components="config.components" :model-key="config.formKey" />
  </van-form>
</template>

<style lang="scss" scoped></style>
