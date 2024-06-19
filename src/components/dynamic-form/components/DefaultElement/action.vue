<script setup lang="ts" name="DefaultElementIndex">
import useComponentAction from '../hooks/use-component-action'
import useDataChange from '../hooks/use-data-change'
import useDisplayControl from '../hooks/use-display-control'
import RichEditor from '@/components/rich/Editor.vue'
import RichRead from '@/components/rich/Read.vue'
import IconTooltip from '@/components/icon-tooltip/index.vue'

type Props = {
  id: string
  config: any
  model?: Record<string, any>
  modelIndex?: number
  hideFieldName?: boolean
  hiddenComponentIds?: string[]
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:hiddenComponentIds', val: string[]): void
}>()
const appModule = inject('app-module', '')
const {
  modelValue,
  disabledValue,
  config,
  labelWidth,
  widthStyleStr,
  showLabel,
  isRequired,
  rules,
  propName,
  setDefaultValue
} = useComponentAction({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex,
  hideFieldName: props.hideFieldName
})
const { invokeDataChangeEvent, executeExpressions } = useDataChange({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex
})
const { executeDisplayControl } = useDisplayControl({
  config,
  hiddenComponentIds: props.hiddenComponentIds,
  updateHiddenComonentIds: (val: string[]) => {
    emit('update:hiddenComponentIds', val)
  }
})
// Build Icon
// const getDynamicIcon = (iconVal: string) => loadIcon(iconVal)
const getDynamicIcon = (iconVal: string) => null

const onDataChange = (val: any) => {
  invokeDataChangeEvent(val)
}

const onDataChangeDebounce = _.debounce(onDataChange, 200)

const numValue = computed(() => {
  if (['slider_number', 'input_number'].includes(config.type) && typeof modelValue.value !== 'number') {
    if (!modelValue.value) {
      return 0
    }
    if (config.decimalPrecision && config.decimalPrecision > 0) {
      return parseFloat(modelValue.value as string)
    }
    return parseInt(modelValue.value as string)
  } else {
    return modelValue.value
  }
})

// 小数数字精度控制
const onDecimalNumberValChange = (val: any) => {
  let v = val
  if (typeof val === 'string') {
    v = parseFloat(val)
  }
  modelValue.value = v.toFixed(config.decimalPrecision)
  onDataChangeDebounce(modelValue.value)
}

watch(
  modelValue,
  val => {
    if (config.type === 'input_number') executeExpressions()
    // 调用显示控制
    if (config.type === 'switch') {
      executeDisplayControl(val)
    }
  },
  {
    immediate: true
  }
)

onMounted(async () => {
  await setDefaultValue()
})
</script>
<template>
  <van-field
    v-if="['input', 'input_textarea', 'input_password'].includes(config.type)"
    :type="config.type === 'input_textarea' ? 'textarea' : config.type === 'input_password' ? 'password' : 'text'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    v-model="modelValue"
    :disabled="disabledValue"
    :placeholder="config.placeholder"
    @update:model-value="onDataChangeDebounce"
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
  </van-field>
  <template v-else-if="config.type === 'input_number'">
    <!-- 允许输入数字，调起带符号的纯数字键盘 -->
    <van-field
      v-if="config.decimalPrecision"
      :required="isRequired"
      :rules="rules"
      :name="propName"
      :disabled="disabledValue"
      :placeholder="config.placeholder"
      :model-value="modelValue"
      type="number"
      @update:model-value="onDecimalNumberValChange"
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
    </van-field>
    <!-- 允许输入正整数，调起纯数字键盘 -->
    <van-field
      v-else
      :required="isRequired"
      :rules="rules"
      :name="propName"
      :disabled="disabledValue"
      :placeholder="config.placeholder"
      v-model="modelValue"
      @update:model-value="onDataChangeDebounce"
      type="digit"
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
    </van-field>
  </template>
  <van-field
    v-else-if="config.type === 'slider_number'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    :disabled="disabledValue"
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
      <van-slider v-model="modelValue" :disabled="disabledValue" />
    </template>
  </van-field>
  <van-field
    v-else-if="config.type === 'rate_number'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    :disabled="disabledValue"
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
      <van-rate
        v-model="modelValue"
        :disabled="disabledValue"
        :allow-half="config.allowHalf"
        :clearable="config.clearable"
      />
    </template>
  </van-field>
  <van-field
    v-else-if="config.type === 'switch'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    :disabled="disabledValue"
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
      <van-switch v-model="modelValue" @change="executeDisplayControl" :disabled="disabledValue" />
    </template>
  </van-field>
  <van-field
    v-else-if="config.type === 'serial_number'"
    :required="isRequired"
    :rules="rules"
    :name="propName"
    v-model="modelValue"
    :disabled="true"
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
  </van-field>
  <template v-else-if="config.type === 'input_rich_editor'">
    <van-field :required="isRequired" v-model="modelValue" :disabled="disabledValue" :rules="rules" :name="propName">
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
      <template #input> </template>
    </van-field>
    <rich-read v-if="disabledValue" :value="`${modelValue ?? ''}`" :style="{ flex: 1, height: `${config.height}px` }" />
    <rich-editor
      v-else
      v-model="modelValue"
      :placeholder="config.placeholder"
      :style="{ height: `${config.height}px` }"
    />
  </template>
</template>
