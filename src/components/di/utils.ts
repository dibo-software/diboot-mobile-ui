import type { Control, FormItem } from './type'
import type { LinkageControl, RelatedData, RelatedDataOption } from '@/hooks/use-option'
import type { Component } from 'vue'
import { Empty, Skeleton } from 'vant'

/**
 * 构建选项获取参数
 *
 * @param formItemList 表单元素列表
 * @return RelatedDataOption
 */
export const buildOptionProps = (formItemList?: FormItem[]) => {
  if (!formItemList || !formItemList.length) return {}
  const optionProps = formItemList
    .filter(e => e.type !== 'list-selector')
    .filter(e => e['loader' as keyof typeof e])
    .reduce((option: RelatedDataOption, e) => {
      const loader = e['loader' as keyof typeof e] as string | RelatedData
      if (typeof loader === 'string') {
        const dicts = option.dict ? (option.dict as string[]) : (option.dict = [])
        dicts.push(loader)
      } else if (e['remote' as keyof typeof e] || e['lazy' as keyof typeof e]) {
        const asyncLoad = option.asyncLoad ? option.asyncLoad : (option.asyncLoad = {})
        loader.lazyChild = !!e['lazy' as keyof typeof e]
        asyncLoad[e.prop] = loader as RelatedData
      } else {
        loader.lazyChild = false
        const load = option.load ? option.load : (option.load = {})
        load[e.prop] = loader as RelatedData
      }
      return option
    }, {})
  formItemList
    .filter(e => e.type !== 'list-selector')
    .filter(e => e['control' as keyof typeof e])
    .reduce((option: RelatedDataOption, e) => {
      const control: Control = e['control' as keyof typeof e] as any
      if (!(control.prop && control.condition)) {
        // 未完全配置，则不生效
        return option
      }
      const asyncLoad = option.asyncLoad ? option.asyncLoad : (option.asyncLoad = {})
      let isAsyncLoad = !(asyncLoad[e.prop] ?? {}).parent
      if ((option.load ?? {})[e.prop]) {
        isAsyncLoad = false
        asyncLoad[e.prop] = (option.load ?? {})[e.prop]
        delete (option.load ?? {})[e.prop]
      }
      ;(asyncLoad[e.prop] ?? {}).disabled = true // 选项受控 阻止自动加载
      ;(asyncLoad[e.prop] ?? {}).lazyChild = false // tree结构选项受控不支持懒加载
      const linkageControl = option.linkageControl ? option.linkageControl : (option.linkageControl = {})
      const controls = linkageControl[control.prop]
        ? (linkageControl[control.prop] as LinkageControl[])
        : (linkageControl[control.prop] = [])
      controls.push({
        prop: e.prop,
        loader: e.prop,
        condition: control.condition,
        autoLoad: !isAsyncLoad
      })

      return option
    }, optionProps)
  return optionProps
}

// snake_case 转 camelCase
export const line2Hump = (value: string) => {
  if (!value) return value
  if (!/[_-]/.test(value))
    if (value.toLocaleUpperCase() === value) return value.toLocaleLowerCase()
    else return value.charAt(0).toLocaleLowerCase() + value.substring(1)
  let result: string | undefined = undefined
  for (const word of value.split(/[_-]/)) {
    if (!word) continue
    if (result == null) result = word.toLowerCase()
    else result += word.charAt(0).toLocaleUpperCase() + word.substring(1).toLocaleLowerCase()
  }
  if (value.endsWith('_') && result != null) result += '_'
  return result
}

/**
 * 构建获取选项函数
 *
 * @param relatedData
 * @return (prop: FormItem) => LabelValue[]
 */
export const buildGetRelatedData = (relatedData: Record<string, LabelValue[]>) => (prop: FormItem) => {
  const loader = prop['loader' as keyof typeof prop]
  if (!loader) return
  return typeof loader === 'string' ? relatedData[`${line2Hump(loader)}Options`] : relatedData[prop.prop]
}

/**
 * 动态引入异步组件
 */
export const asyncComponent = (path: string) =>
  defineAsyncComponent<Component>({
    loader: () => import(path.replace('@', '/src')),
    // 加载异步组件时使用的组件
    loadingComponent: h(Skeleton, { rows: 5 }),
    // 加载失败后展示的组件
    errorComponent: h(Empty, { description: '无法加载到自定义组件：' + path })
  })

/**
 * 批量获取表单对应不可见字段
 *
 * @param formIds
 */
export const getFormIdsDenyFields = (...formIds: string[]) =>
  new Promise<Record<string, string[]>>((resolve, reject) => {
    if (!formIds.length) resolve({})
    else
      api
        .post<Record<string, string[]>>(`/model-center/dynamic-api/deny-fields-by-design`, formIds)
        .then(res => {
          resolve(res.data ?? {})
        })
        .catch(err => {
          showFailToast(err.msg || err.message || err)
          reject()
        })
  })

/**
 * 提取字符串中类似格式{{ext}}中的变量名ext
 * @param str
 * @returns
 */
export const extractTemplateParams = (str: string): string[] => {
  if (!str) {
    return []
  }
  // 使用正则表达式匹配{{}}中的内容，加上g标志表示全局匹配
  const reg = /\{\{(.+?)}}/g

  // 使用match方法返回匹配结果的数组
  const result = str.match(reg)

  // 如果匹配成功，遍历数组，去掉{{}}，得到变量名
  if (result) {
    // 创建一个空数组，用于存放变量名
    const varNames = []
    // 遍历匹配结果的数组
    for (let i = 0; i < result.length; i++) {
      // 去掉{{}}，得到变量名
      const varName = result[i].slice(2, -2)
      // 将变量名添加到数组中
      varNames.push(varName)
    }
    // 输出变量名数组
    return varNames
  } else {
    // 输出没有匹配到变量名
    return []
  }
}
