<script setup lang="ts" name="TableLayoutIndex">
import useComponentAction from '../hooks/use-component-action'
import ActionView from '../../render/ActionView.vue'
import useComponentsRefs from '../hooks/use-components-refs'

type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const formConfig = inject('form-config', {})
const { config, labelWidth, showLabel, isRequired } = useComponentAction({ id: props.id, config: props.config })

// 向内部组件传递系列自定义方法
const getComponentRefKeys = () => {
  const keys = []
  for (const rowIndex in config.rows) {
    const row = config.rows[rowIndex]
    for (const colIndex in row.cols) {
      keys.push(`${rowIndex}_${colIndex}`)
    }
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
  <div class="table-container">
    <div v-for="(row, rowIndex) in config.rows" :key="row.uid">
      <div v-for="(col, colIndex) in row.cols" :key="col.uid">
        <action-view
          v-if="col.visible"
          :ref="el => setComponentRefMap(el, `${rowIndex}_${colIndex}`)"
          :components="col.components"
          :model-key="formConfig.formKey"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
