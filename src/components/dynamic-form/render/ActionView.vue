<script setup lang="ts">
import { getVisibleComponents } from '../utils/formModel/formPermission'
import useComponentsRefs from '../components/hooks/use-components-refs'
type Props = {
  type?: string
  components: any[]
  modelKey: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false
})
const formConfig: Record<string, any> = inject('form-config', ref({}))
const configMap: Record<string, any> = inject('config-map', {})
const invisibleProps: string[] = inject('invisible-props', [])
const visibleRelations: string[] = inject('visible-relations', [])
const hiddenComponentIds = inject('hidden-component-ids', ref<string[]>([]))

// 动态导入指定位置处的所有动态组件
const componentMap: Record<string, any> = inject('component-map', {})
if (Object.keys(componentMap).length === 0) {
  const resourceComponentMap = import.meta.glob('../components/**/action.vue')
  // 合并所有自定义组件的渲染模块
  const extComponentMap = import.meta.glob('../extension/**/action.vue')
  if (resourceComponentMap && extComponentMap && Object.keys(extComponentMap).length > 0) {
    Object.assign(resourceComponentMap, extComponentMap)
  }
  for (const path in resourceComponentMap) {
    const matchResult = path.match(/.*\/(.+)\/action.vue$/)
    if (matchResult) {
      const componentName = matchResult[1]
      const component = resourceComponentMap[path]
      componentMap[componentName] = defineAsyncComponent(component as any)
    }
  }
  console.log('componentMap', componentMap)
}

// 获取可用表单组件
const visibleComponents = computed(() => {
  // 根据权限过滤可见组件列表
  console.log('props.components', props.components)
  let result = getVisibleComponents(props.components, configMap, invisibleProps, visibleRelations)
  console.log('result', result)
  // 根据显隐控制过滤可见组件列表
  result = result.filter((item: Record<string, any>) => {
    return !hiddenComponentIds.value.includes(item.id)
  })
  return result
})
// 向内部组件传递系列自定义方法
const getComponentRefKeys = () => {
  const keys = []
  for (const i in visibleComponents.value) {
    keys.push(`${i}`)
  }
  return keys
}
const { setComponentRefMap, validate, reset } = useComponentsRefs({
  getComponentRefKeys
})
provide('component-map', componentMap)
defineExpose({
  validate,
  reset
})
</script>

<template>
  <div class="action-view" :class="{ root: props.type === 'root' }">
    <div class="action-view-wrapper">
      <div v-for="(element, index) in visibleComponents" :key="element.id" class="item">
        <component
          :is="componentMap[element.element]"
          :id="element.id"
          :key="element.id"
          :ref="(el: any) => setComponentRefMap(el, `${index}`)"
          :config="configMap[element.id]"
          class="element-item"
        />
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.action-view {
  width: 100%;
  height: auto;
  padding: 0;
  box-sizing: border-box;
  &-wrapper {
    width: 100%;
    height: auto;
    .item {
      margin-bottom: 0;
      :deep(.van-cell:last-child:after, .van-cell--borderless:after) {
        display: unset;
      }
    }
    .item:last-child {
      :deep(.van-cell:last-child:after, .van-cell--borderless:after) {
        display: none;
      }
    }
  }
  &.root {
    padding: 5px;
    & > .action-view-wrapper > .item {
      margin-bottom: 12px;
    }
  }
}
</style>
