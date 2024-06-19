<script setup lang="ts">
defineProps<{
  label: string
  tags?: string[]
  type?: 'primary' | 'success' | 'danger' | 'warning'
}>()
</script>

<template>
  <span v-if="tags">
    <br />
    {{ label }}：
    <van-tag
        v-for="(item, index) in tags || []"
        :key="`tag-list_${index}`"
        size="medium"
        style="margin-right: 3px"
        :type="type || 'success'"
    >
      {{ item }}
    </van-tag>
  </span>
</template>
