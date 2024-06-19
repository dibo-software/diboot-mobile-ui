<script setup lang="ts" name="LinkElementIndex">
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
const { config, labelWidth, showLabel } = useComponentAction({
  id: props.id,
  config: props.config,
  model: props.model,
  modelIndex: props.modelIndex,
  hideFieldName: props.hideFieldName
})

const requestData = inject('request-data')
const visible = ref(false)
const url = ref(config.defaultValue)

const init = async () => {
  const { mode, api: apiUrl, key } = config.defaultValueSource ?? {}
  if (mode === 'api') {
    const apis = apiUrl.split('__')
    const apiMethod = apis.length === 2 ? apis[0] : 'POST'
    const apiUri = apis.length === 2 ? apis[1] : apiUrl
    let res
    if (apiMethod.toLowerCase() === 'post') {
      res = await api.post(apiUri, requestData)
    } else {
      res = await api.get(apiUri, requestData)
    }
    url.value = key ? res.data[key] : res.data
  }

  let requestParams = ''
  if (url.value && requestData) {
    for (const key of Object.keys(requestData)) {
      requestParams += `&${key}=${requestData[key as keyof typeof requestData]}`
    }
    if (url.value.indexOf('?') !== -1) {
      url.value += requestParams
    } else {
      url.value += `?${requestParams.slice(1)}`
    }
  }
}

init()

const openWindow = async () => {
  if (!url.value) {
    showNotify({ type: 'warning', message: '无链接，跳转失败' })
    return false
  }
  visible.value = true
}
const closeWindow = () => {
  visible.value = false
}
</script>

<template>
  <van-field>
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
      <van-button :type="config.butStyle.type ? config.butStyle.type : 'default'" size="small" @click="openWindow">{{
        config.placeholder || '点击跳转'
      }}</van-button>
    </template>
  </van-field>

  <van-popup v-model:show="visible" position="bottom" :style="{ width: '100%', height: '90%' }">
    <van-nav-bar :title="showLabel" right-text="关闭" @click-right="closeWindow()" />
    <div class="iframe-wrapper">
      <iframe :key="url" :src="url" />
    </div>
  </van-popup>
</template>

<style lang="scss" scoped>
.iframe-wrapper {
  width: 100%;
  height: calc(100% - 46px);
  overflow-y: auto;
  iframe {
    border: 0;
    width: 100%;
    height: calc(100% - 3px);
  }
}
</style>
