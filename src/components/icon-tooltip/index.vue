<script setup lang="ts">
import type { PopoverPlacement, PopoverTheme } from 'vant'

type PropsType = {
  tip?: string
  theme?: PopoverTheme
  placement?: PopoverPlacement
}
const visible = ref(false)
const props = withDefaults(defineProps<PropsType>(), {
  theme: 'dark',
  placement: 'bottom-start'
})
</script>

<template>
  <van-popover v-model:show="visible" :theme="props.theme" close-on-click-outside :placement="props.placement">
    <div class="tip-wrapper" @click="visible = false">
      <span v-if="props.tip" v-html="props.tip"></span>
      <slot v-else name="tip"></slot>
    </div>
    <template #reference>
      <van-icon name="info" style="padding-left: 15px" />
    </template>
  </van-popover>
</template>

<style scoped>
.tip-wrapper {
  padding: 0 10px;
}
</style>
