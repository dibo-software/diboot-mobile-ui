<script setup lang="ts" name="DiForm">
defineOptions({ name: 'DiForm' })
import type { FormConfig, FormItem, ListConfig, ModelRelated } from './type'
import { buildGetRelatedData, buildOptionProps } from './utils'
import DynamicForm from '@/components/di/DynamicForm.vue'
import type { ConcreteComponent } from 'vue'
import type { FormInstance } from 'vant'
import DiForm from './Form.vue'

const currentUserId = inject('current-user-id', void 0)
const currentUserOrg = inject('current-user-org', void 0)

interface FormProps extends /* @vue-ignore */ FormConfig {
  baseApi: string
  inside?: boolean
  // 禁用表单内的所有组件
  disabled?: boolean
  // 禁用属性列表（只读不可输入）
  disabledProps?: string[]
  // 不可见属性列表（忽略不加载）
  invisibleProps?: string[]
  // 可见子表单 （未指定时都可见）
  visibleRelations?: string[]

  // vue语法限制导致只能在当前文件中再次定义
  // https://cn.vuejs.org/guide/typescript/composition-api.html#typing-component-props
  labelWidth?: string // 默认 80px
  column?: number
  propList: FormItem[]
  relateds?: ModelRelated[]
}

const props = defineProps<FormProps>()

const optionProps = ref(buildOptionProps(props?.propList))
const { initRelatedData, relatedData, handleLinkage, loadRelatedData, remoteRelatedDataFilter } = useOption(
  optionProps.value
)

/**
 * 获取选项
 * @param prop
 * @return LabelValue[]
 */
const getRelatedData = buildGetRelatedData(relatedData)

// 表单异步选项回显
const formAsyncOptionEcho = (model: Record<string, unknown>) => {
  const keys = Object.keys(optionProps.value.asyncLoad ?? {})
  for (const key of keys) {
    const fieldInfo = props?.propList?.find(e => e['prop' as keyof typeof e] === key) as FormItem
    const loader = optionProps.value.asyncLoad![key]
    if (model[key])
      if (loader.parent) {
        if (loader.parentPath)
          loadRelatedData({
            ...loader,
            parent: undefined,
            ext: loader.parentPath,
            conditions: [
              ...(loader.conditions || []),
              { field: 'id', comparison: Array.isArray(model[key]) ? 'IN' : 'EQ', value: model[key] }
            ]
          })
            .then(dataList => {
              const ids = dataList
                .map(e => (e.ext ? `${e.ext}`.split(',') : []))
                .reduce((list, items) => list.concat(items))
              Array.isArray(model[key]) ? ids.concat(model[key] as Array<string>) : ids.push(model[key] as string)
              loadRelatedData({
                ...loader,
                lazyChild: false,
                conditions: [...(loader.conditions || []), { field: 'id', comparison: 'IN', value: ids }]
              })
                .then(tree => {
                  if (relatedData[key]) {
                    for (const node of tree) {
                      const rootNode = relatedData[key].find(e => e.value === node.value)
                      if (rootNode) rootNode.children = node.children
                      else relatedData[key].push(node)
                    }
                  } else relatedData[key] = tree
                })
                .catch(e => e)
            })
            .catch(e => e)
        else loadRelatedData({ ...loader, lazyChild: false }).then(dataList => (relatedData[key] = dataList))
      } else if (
        Array.isArray(model[key]) &&
        (model[key] as Array<string>).length ===
          (model[fieldInfo['labelProp' as keyof FormItem] as string] as Array<string>)?.length
      )
        relatedData[key] = (model[key] as Array<string>).map((id, index) => ({
          value: `${id}`,
          label: `${(model[fieldInfo['labelProp' as keyof FormItem] as string] as Array<string>)[index]}`
        }))
      else if (!Array.isArray(model[key]) && model[fieldInfo['labelProp' as keyof FormItem] as string])
        relatedData[key] = [
          { value: `${model[key]}`, label: `${model[fieldInfo['labelProp' as keyof FormItem] as string]}` }
        ]
      else
        loadRelatedData({
          ...loader,
          conditions: [
            ...(loader.conditions || []),
            { field: 'id', comparison: Array.isArray(model[key]) ? 'IN' : 'EQ', value: model[key] }
          ]
        }).then(dataList => (relatedData[key] = dataList))
  }
  Object.keys(optionProps.value.linkageControl ?? {}).forEach(key => handleLinkage(model[key] as string, key))
}

const initData = props.propList
  .filter(e => !props.invisibleProps?.includes(e.prop))
  .filter(e => !['year', 'month', 'date', 'datetime', 'week', 'daterange', 'datetimerange', 'time'].includes(e.type))
  .reduce((model: Record<string, unknown>, item: FormItem) => {
    if (item.defaultVal)
      model[item.prop] =
        '${CURRENT_USER}' === item.defaultVal
          ? currentUserId
          : '${CURRENT_ORG}' === item.defaultVal
            ? currentUserOrg
            : item.defaultVal
    return model
  }, {})

const { loadData, loading, model } = useDetail<Record<string, unknown>>(props.baseApi, initData)

watch(loading, value =>
  value ? showLoadingToast({ message: '加载中...', forbidClick: true, duration: 0 }) : closeToast()
)

const emit = defineEmits<{
  (e: 'complete', id?: string): void
  (e: 'submitting', submitting: boolean): void
}>()

const { submitting, submit } = useForm({
  baseApi: props.baseApi,
  successCallback: id => emit('complete', id)
})
watch(submitting, value => emit('submitting', value))

// 表单
const formRef = ref<FormInstance>()

const validate = (callback?: (isValid: boolean) => void): Promise<boolean> =>
  Promise.all(
    [formRef.value, ...Object.values(relatedRefMap)]
      .map(e =>
        e
          ?.validate?.()
          .then(() => {
            callback?.(true)
            return Promise.resolve(true)
          })
          .catch(() => {
            callback?.(false)
            return Promise.resolve(false)
          })
      )
      .filter(e => !!e)
  )
    .then(arr => arr.every(e => e))
    .catch(() => false)

defineExpose({
  // getAnchors: (): LabelValue[] => relatedRefs.value?.map(e => ({ label: e.label, value: `#${e.modelKey}` })) ?? [],
  init: (id?: string, refresh = true, initData?: Record<string, unknown>) => {
    initRelatedData()
    if (model.value.id === id && !refresh) return
    loadData(id).then(() => {
      if (!id) {
        if (initData) Object.keys(initData).forEach(key => (model.value[key] = initData[key]))
        const now = new Date()
        const pad0 = (number: number) => number.toString().padStart(2, '0')
        const nowDate = now.getFullYear() + '-' + pad0(now.getMonth() + 1) + '-' + pad0(now.getDate())
        const nowDateTime =
          nowDate + ' ' + pad0(now.getHours()) + ':' + pad0(now.getMinutes()) + ':' + pad0(now.getSeconds())
        props.propList
          .filter(e => !props.invisibleProps?.includes(e.prop))
          .forEach((item: FormItem) => {
            if (!model.value[item.prop] && item.defaultVal)
              if ('${CURRENT_DATE}' === item.defaultVal) model.value[item.prop] = nowDate
              else if ('${CURRENT_TIME}' === item.defaultVal)
                model.value[item.prop] = pad0(now.getHours()) + ':' + pad0(now.getMinutes())
              else if ('${CURRENT_DATETIME}' === item.defaultVal) model.value[item.prop] = nowDateTime
          })
      }
      formAsyncOptionEcho(model.value)
    })
  },
  validate,
  getData: async () => {
    const data = _.cloneDeep(model.value)
    for (const modelKey in relatedRefMap) {
      let prop = modelKey.charAt(0).toLowerCase() + modelKey.slice(1)
      if (relatedRefs.value?.find(e => e.modelKey === modelKey)?.relType === 'many') prop += 'List'
      data[prop] = await relatedRefMap[modelKey]?.getData()
    }
    return data
  },
  submit: async () => {
    if (!(await validate((valid: boolean) => !valid && showNotify({ type: 'danger', message: '表单校验不通过' }))))
      return
    const data = _.cloneDeep(model.value)
    for (const modelKey in relatedRefMap) {
      let prop = modelKey.charAt(0).toLowerCase() + modelKey.slice(1)
      if (relatedRefs.value?.find(e => e.modelKey === modelKey)?.relType === 'many') prop += 'List'
      data[prop] = await relatedRefMap[modelKey]?.getData()
    }
    return await submit(data, formRef.value)
  },
  reset: () => {
    model.value = props.propList.reduce((data: Record<string, unknown>, item) => {
      if (['input', 'textarea', 'rich', 'input-number'].includes(item.type) && item.prop in initData)
        data[item.prop] = initData[item.prop]
      else if (['year', 'month', 'week', 'date', 'datetime', 'time'].includes(item.type) && item.defaultVal)
        data[item.prop] = model.value[item.prop]
      return data
    }, {})
    formRef.value?.resetValidation()
    Object.keys(relatedRefMap).forEach(async key => await relatedRefMap[key]?.reset())
  }
})

const getFileList = (item: FormItem) => model.value[item['files' as keyof FormItem] as string] as FileRecord[]

type FormRelatedRef = ModelRelated & {
  dataId?: unknown
  refFu: (el: ConcreteComponent) => undefined
  component?: ConcreteComponent
}

const relatedRefs = ref<FormRelatedRef[]>()
const relatedRefMap: Record<string, InstanceType<typeof DiForm>> = {}

const loadRelated = () => {
  if (props.inside || !props.relateds?.length) {
    relatedRefs.value = undefined
    return
  }
  const dataBaseApi = inject<string>('data-base-api', '/dynamic-api')
  api
    .post<Record<string, ListConfig | string | FormConfig | string[]>>(
      `/model-center/model-view`,
      props.relateds.reduce((map: Record<string, string>, e: ModelRelated) => {
        map[e.modelKey] = 'FORM'
        return map
      }, {})
    )
    .then(res => {
      relatedRefs.value = _.cloneDeep(props.relateds)
        ?.filter(e => {
          if (typeof res.data[e.modelKey] === 'string') throw new Error('不支持 自定义 子表单')
          if (res.data[`${e.modelKey}-FormMode`] === 'DESIGN') throw new Error('不支持 设计类型 子表单')
          return true
        })!
        .map(e => {
          const baseApi = `/${e.appModule}${dataBaseApi}/${e.modelKey}`
          const filterProps = (arr: string[] = []) =>
            arr.filter(item => item.startsWith(`${e.modelKey}.`)).map(item => item.replace(`${e.modelKey}.`, ''))
          const invisibleProps = [...((res.data[e.modelKey + '-DenyFields'] as string[]) ?? [])]
          invisibleProps.push(e.fieldKey, ...filterProps(props.invisibleProps))
          const component = res.data[e.modelKey]
            ? e.relType === 'many'
              ? h(DynamicForm as ConcreteComponent, {
                  baseApi,
                  invisibleProps,
                  formName: e.label,
                  disabled: props.disabled,
                  form: h(DiForm as ConcreteComponent, {
                    baseApi,
                    disabled: props.disabled,
                    invisibleProps,
                    disabledProps: filterProps(props.disabledProps),
                    ...(res.data[e.modelKey] as FormConfig),
                    inside: true
                  })
                })
              : h(DiForm as ConcreteComponent, {
                  baseApi,
                  disabled: props.disabled,
                  invisibleProps,
                  disabledProps: filterProps(props.disabledProps),
                  ...(res.data[e.modelKey] as FormConfig),
                  inside: true
                })
            : undefined
          return {
            ...e,
            refFu: (el: ConcreteComponent) => {
              if (!el) return
              relatedRefMap[e.modelKey] = el as InstanceType<typeof DiForm>
              const find = relatedRefs.value!.find(item => item.modelKey === e.modelKey)
              if (find!.dataId !== model.value.id && model.value[e.valueFromField])
                e.relType === 'many'
                  ? (el as InstanceType<typeof DynamicForm>).addCondition(
                      e.fieldKey,
                      model.value[e.valueFromField],
                      true
                    )
                  : (el as InstanceType<typeof DiForm>).init(`${e.fieldKey}/${model.value[e.valueFromField]}`)
              find!.dataId = model.value.id
            },
            component
          } as FormRelatedRef
        })
    })
    .catch(err => showNotify({ type: 'danger', message: err.msg || err.message || '获取配置信息异常' }))
}

if (props.relateds?.length) loadRelated()
</script>

<template>
  <van-form ref="formRef" :model="model" :disabled="!!disabled" :label-width="labelWidth ?? '80px'">
    <template v-for="item in propList" :key="JSON.stringify(item)">
      <di-input
        v-if="!invisibleProps?.includes(item.prop)"
        v-model="model[item.prop]"
        :disabled="(optionProps.asyncLoad ?? {})[item.prop]?.disabled || disabledProps?.includes(item.prop) || disabled"
        :config="item"
        :file-list="getFileList(item)"
        :related-datas="getRelatedData(item)"
        :base-api="baseApi"
        :get-id="() => model.id as string"
        @change="
          (value?: unknown) =>
            (optionProps.linkageControl ?? {})[item.prop] && handleLinkage(value as string, item.prop, model)
        "
        @remote-filter="(value?: string) => remoteRelatedDataFilter(item.prop, value)"
      />
    </template>
  </van-form>

  <template v-for="(item, index) in relatedRefs" :key="index">
    <div v-if="!visibleRelations || visibleRelations.includes(item.modelKey)" class="label">
      <div :id="item.modelKey" style="margin: 12px">{{ item.label }}</div>
      <component :is="item.component" v-if="item.component" :key="model.id" :ref="item.refFu" />
    </div>
  </template>
</template>
