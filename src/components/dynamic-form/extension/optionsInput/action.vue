<script setup lang="ts" name="OptionsInputAction">
import useComponentAction from '../../components/hooks/use-component-action'
import IconTooltip from '@/components/icon-tooltip/index.vue'

type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
}
const props = defineProps<Props>()
const { modelValue, config, showLabel, disabledValue, isRequired, propName } = useComponentAction({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex,
  hideFieldName: props.hideFieldName
})

const __OTHER = '__OTHER'
const radioValue = computed({
  get: () => {
    if (modelValue.value == null) {
      return ''
    }
    if (config.options.includes(modelValue.value)) {
      return modelValue.value
    } else {
      return __OTHER
    }
  },
  set: (val: string) => {
    if (val !== __OTHER) {
      modelValue.value = val
    } else {
      modelValue.value = ''
    }
  }
})
</script>

<template>
  <van-field
    :required="isRequired"
    :name="propName"
    v-model="modelValue"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
  >
    <template #label v-if="showLabel">
      <span class="label-span">
        <span>{{ showLabel }}</span>
        <icon-tooltip v-if="config.fieldTips">
          <template #tip>
            <pre>{{ config.fieldTips }}</pre>
          </template>
        </icon-tooltip>
      </span>
    </template>
    <template #input>
      <div class="options-wrapper">
        <van-radio-group v-model="radioValue" :disabled="disabledValue" direction="horizontal">
          <van-radio :name="item" v-for="(item, index) in config.options" :key="index">{{ item }}</van-radio>
          <van-radio name="__OTHER">{{ config.inputLabel }}</van-radio>
        </van-radio-group>
        <van-field
          v-if="radioValue === '__OTHER'"
          v-model="modelValue"
          :disabled="disabledValue"
          :placeholder="config.inputPlaceholder"
          :clearable="config.clearable"
        />
      </div>
    </template>
  </van-field>
</template>

<style lang="scss" scoped>
.options-wrapper {
  :deep(.van-radio) {
    margin-bottom: 6px;
  }
}
</style>
