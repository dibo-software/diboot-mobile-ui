<script setup lang="ts" name="GroupLayoutIndex">
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
  return ['0']
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
  <div class="group-layout-container" :style="config.boxStyleContent">
    <action-view
      :ref="el => setComponentRefMap(el, '0')"
      :components="config.components"
      :model-key="formConfig.formKey"
    />
    <div v-if="config.title" class="title" :style="config.titleStyleContent">
      <span :style="config.titleSpanStyleContent">{{ config.title }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group-layout-container {
  --el-border-color: #dcdfe6;
  position: relative;
  width: 100%;
  height: auto;
  box-sizing: border-box;
  .title {
    --el-text-color-primary: #303133;
    --el-text-color-regular: #606266;
    --el-text-color-secondary: #909399;
    position: absolute;
    width: 100%;
    line-height: 26px;
    top: -16px;
    left: 0;
    text-align: left;
    box-sizing: border-box;
    padding: 0 15px;
    span {
      background: #fff;
      padding: 0 5px;
    }
  }
}
</style>
