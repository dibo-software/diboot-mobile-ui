<script setup lang="ts" name="SubFormAction">
import actionForManyRel from './actionForManyRel.vue'
import actionForOneRel from './actionForOneRel.vue'
type Props = {
  id: string
  config: any
}
const props = defineProps<Props>()

const isOneRelType = (relType: string) => relType === 'one'
const actionForManyRelRef = ref()
const actionForOneRelRef = ref()

const validate = async () => {
  if (!isOneRelType(props.config.relType)) {
    return await actionForManyRel.value?.validate()
  } else {
    return await actionForOneRelRef.value?.validate()
  }
}
const reset = async () => {
  if (!isOneRelType(props.config.relType)) {
    return await actionForManyRel.value?.reset()
  } else {
    return await actionForOneRelRef.value?.reset()
  }
}
defineExpose({
  validate,
  reset
})
</script>

<template>
  <action-for-many-rel
    v-if="!isOneRelType(config.relType)"
    :id="props.id"
    ref="actionForManyRelRef"
    :config="props.config"
  />
  <action-for-one-rel v-else :id="props.id" ref="actionForOneRelRef" :config="props.config" />
</template>

<style lang="scss" scoped></style>
