<script setup lang="ts" name="TextContentIndex">
import useComponentAction from '../hooks/use-component-action'

type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()
const { config, labelWidth, showLabel, isRequired } = useComponentAction({
  id: props.id,
  config: props.config
})
</script>
<template>
  <div
    v-if="config.type === 'title_text'"
    :id="`anchor_${config.id}`"
    :name="`anchor_${config.id}`"
    class="text-container"
  >
    <div :style="config.styleContent">
      {{ config.content }}
    </div>
  </div>
  <div v-else-if="config.type === 'description_text'" class="text-container">
    <div :style="config.styleContent" :class="{ required: config.required }">
      <pre style="margin: 0" v-html="config.content" />
    </div>
  </div>
</template>
<style lang="scss">
.text-container {
  box-sizing: border-box;
  padding: 0 10px;
  pre {
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
  }
  .required ::before {
    content: '* ';
    color: var(--el-color-danger);
  }
}
</style>
