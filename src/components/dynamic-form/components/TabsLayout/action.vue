<script setup lang="ts" name="TabsLayoutIndex">
import useComponentAction from '../hooks/use-component-action'
import ActionView from '../../render/ActionView.vue'
import useComponentsRefs from '../hooks/use-components-refs'
import { extractFields } from '../../utils/formFieldsExtractor'

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
// 用于第一次进入某个tabs时，刷新其view
const refreshKeys = reactive<boolean[]>(config.tabItems.map(() => false))
const activeName = ref<number>(0)
const tabChange = (tabName: string) => {
  const index = parseInt(tabName)
  if (!refreshKeys[index]) {
    refreshKeys[index] = true
  }
}
// 向内部组件传递系列自定义方法
const getComponentRefKeys = () => {
  const keys = []
  for (const i in config.tabItems) {
    keys.push(`${i}`)
  }
  return keys
}
const { setComponentRefMap, componentRefMap, reset } = useComponentsRefs({
  getComponentRefKeys
})
// 对标签布局自定义校验方法
const validate = async () => {
  for (let i = 0; i < config.tabItems.length; i++) {
    const componentRef = componentRefMap[`${i}`]
    if (componentRef) {
      if (componentRef && componentRef.validate != null) {
        try {
          await componentRef.validate()
        } catch (e) {
          activeName.value = i
          console.log('标签布局校验失败', e)
          throw e
        }
      }
    }
    // 判断当前tab栏下是否具有不可用字段，如果具有，则切换至该tab栏
    if (invalidFieldNames?.value && invalidFieldNames.value.length > 0) {
      // 解析当前tab栏下所有字段属性
      const tabFields = extractFields(config.tabItems[i].components, configMap, false)
      if (tabFields && tabFields.length > 0) {
        const hasInvalidFieldName = tabFields.some(field => invalidFieldNames.value.includes(field.key))
        if (hasInvalidFieldName) {
          activeName.value = i
          console.log(`第${i}个标签检测到校验错误信息`)
          break
        }
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
  <van-tabs v-model:active="activeName" :lazy-render="false" :type="config.type ? 'card' : 'line'">
    <van-tab v-for="(item, index) in config.tabItems" :key="index" :title="item.title" :name="index">
      <action-view
        :key="index"
        :ref="el => setComponentRefMap(el, `${index}`)"
        :components="item.components"
        :model-key="formConfig.formKey"
      />
    </van-tab>
  </van-tabs>
</template>

<style lang="scss" scoped></style>
