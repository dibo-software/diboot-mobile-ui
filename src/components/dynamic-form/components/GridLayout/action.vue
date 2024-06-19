<script setup lang="ts" name="GridLayoutIndex">
import useComponentAction from '../hooks/use-component-action'
import ActionView from '../../render/ActionView.vue'
import useComponentsRefs from '../hooks/use-components-refs'

type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const formConfig = inject('form-config', {})

const { config, labelWidth, showLabel, isRequired } = useComponentAction({
  id: props.id,
  config: props.config
})
// 向内部组件传递系列自定义方法
const getComponentRefKeys = () => {
  const keys = []
  for (const i in config.colList) {
    keys.push(`${i}`)
  }
  return keys
}
const { setComponentRefMap, validate, reset } = useComponentsRefs({
  getComponentRefKeys
})
defineExpose({
  validate,
  reset
})
</script>
<template>
  <template v-for="(col, index) in config.colList" :key="index">
    <action-view
      :ref="el => setComponentRefMap(el, `${index}`)"
      :components="col.components"
      :model-key="formConfig.formKey"
    />
  </template>
</template>

<style lang="scss" scoped></style>
