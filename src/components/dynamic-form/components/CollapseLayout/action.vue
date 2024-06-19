<script setup lang="ts" name="CollapseLayoutIndex">
import useComponentAction from '../hooks/use-component-action'
import ActionView from '../../render/ActionView.vue'
import useComponentsRefs from '../hooks/use-components-refs'
import { extractFields } from '@/components/dynamic-form/utils/formFieldsExtractor'
type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const formConfig = inject('form-config', {})
const configMap = inject('config-map', {})
const invalidFieldNames = inject('invalid-field-names', ref<string[]>([]))

const { config, labelWidth, showLabel, isRequired } = useComponentAction({
  id: props.id,
  config: props.config
})
// 向内部组件传递系列自定义方法
const getComponentRefKeys = () => {
  return ['0']
}
const {
  setComponentRefMap,
  validate: superValidate,
  reset
} = useComponentsRefs({
  getComponentRefKeys
})

const activeNames = ref(['1'])

// 对折叠布局自定义校验方法
const validate = async () => {
  try {
    await superValidate()
  } catch (e) {
    activeNames.value = ['1']
    console.log('折叠布局校验失败', e)
    throw e
  }
  // 判断当前tab栏下是否具有不可用字段，如果具有，则切换至该tab栏
  if (invalidFieldNames?.value && invalidFieldNames.value.length > 0) {
    // 解析当前tab栏下所有字段属性
    const tabFields = extractFields(config.components, configMap, false)
    if (tabFields && tabFields.length > 0) {
      const hasInvalidFieldName = tabFields.some(field => invalidFieldNames.value.includes(field.key))
      if (hasInvalidFieldName) {
        activeNames.value = ['1']
        console.log(`折叠布局检测到校验错误信息`)
      }
    }
  }
}

defineExpose({
  validate,
  reset
})
</script>
<template>
  <van-collapse v-model="activeNames">
    <van-collapse-item :title="config.title" name="1">
      <action-view
        :ref="el => setComponentRefMap(el, '0')"
        :components="config.components"
        :model-key="formConfig.formKey"
      />
    </van-collapse-item>
  </van-collapse>
</template>

<style lang="scss" scoped></style>
