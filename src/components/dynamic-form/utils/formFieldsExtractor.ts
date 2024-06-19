import type { FormItemValidateRule } from '../utils/formModel/formValidator'
import type { FormField } from './type'
import { deepExtractComponents, isSubFormComponents } from './componentsExtractor'

const extractFields = (components: any[], configMap: Record<string, any>, withConfig: boolean): FormField[] => {
  if (components.length === 0) {
    return []
  }
  return extractFieldsFromComponents(components, configMap, [], withConfig)
}
/** *
 * 从页面模块列表中提取出所有子表单相关的关联结果数据
 * @param components
 * @param configMap
 * @returns {*}
 */
const extractRelations = function (
  components: any[],
  configMap: Record<string, any>,
  displayControlModuleIds?: string[]
) {
  const configs = extractRelationConfigs(components, configMap)
  return extractRelationsFromConfigs(configs, configMap, displayControlModuleIds)
}
const extractRelationConfigs = (components: any[], configMap: Record<string, any>) => {
  if (components.length === 0) return []
  return extractRelationConfigsFromComponents(components, configMap)
}
const extractRelationsFromConfigs = function (
  relationConfigs: any[],
  configMap: Record<string, any>,
  displayControlModuleIds?: string[]
) {
  if (relationConfigs.length === 0) return []
  const relations = relationConfigs.map(cfg => {
    const { tableName, formName, formKey, components } = cfg
    const fields = extractFieldsWithDisplayControl(components, configMap, displayControlModuleIds)
    return {
      required: true,
      maxCount: -1,
      tableName,
      formName,
      formKey,
      key: formKey,
      name: formName,
      fields
    }
  })
  return relations
}

const extractRelationConfigsFromComponents = (components: any[], configMap: Record<string, any>) => {
  const fields: any[] = []
  components.forEach(component => {
    const nowFields = extractRelationConfigsFromComponent(component, configMap)
    fields.push(...nowFields)
  })
  return fields
}

const extractRelationConfigsFromComponent = (component: any, configMap: Record<string, any>) => {
  const configs: any[] = []
  const { id, type } = component
  const config = configMap[id]
  if (config == null) return configs
  // 如果是子表单组件，则直接返回config列表，其他按照对应的处理
  if (type === 'sub_form') {
    return [config]
  } else if (type === 'grid_layout') {
    // 如果是layout组件，则直接解析layout内部的字段列表
    const { colList } = config
    if (colList && colList.length > 0) {
      colList.forEach((col: any) => {
        const { components } = col
        if (components && components.length > 0) {
          const layoutConfigs = extractRelationConfigsFromComponents(components, configMap)
          configs.push(...layoutConfigs)
        }
      })
    }
    return configs
  } else if (['group_layout', 'collapse_layout', 'group_frame'].includes(type)) {
    // 如果是GroupFrame/GroupLay/CollapseLayout组件，则直接解析分组组件内部的字段列表
    const { components } = config
    if (components && components.length > 0) {
      const frameConfigs = extractRelationConfigsFromComponents(components, configMap)
      configs.push(...frameConfigs)
    }
    return configs
  } else if (type === 'table_layout') {
    const { rows } = config
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const { cols } = row
      for (let colIndex = 0; colIndex < cols.length; colIndex++) {
        const col = cols[colIndex]
        const { visible, components } = col
        if (visible) {
          const layoutConfigs = extractRelationConfigsFromComponents(components, configMap)
          configs.push(...layoutConfigs)
        }
      }
    }
    return configs
  } else if (type === 'tabs_layout') {
    // 如果是TabsLayout组件，则直接解析TabsLayout内部的字段列表
    const { tabItems } = config
    if (tabItems && tabItems.length > 0) {
      tabItems.forEach((item: any) => {
        const { components } = item
        if (components && components.length > 0) {
          const layoutConfigs = extractRelationConfigsFromComponents(components, configMap)
          configs.push(...layoutConfigs)
        }
      })
    }
    return configs
  } else {
    // 其他一概返回空列表
    return configs
  }
}
const extractFieldsWithDisplayControl = function (
  components: any[],
  configMap: Record<string, any>,
  displayControlModuleIds?: string[],
  withConfig?: any
) {
  if (components.length === 0) return []
  return extractFieldsFromComponents(components, configMap, displayControlModuleIds, withConfig)
}

const extractFieldsFromComponents = (
  components: any[],
  configMap: Record<string, any>,
  displayControlModuleIds?: string[],
  withConfig?: boolean
): FormField[] => {
  const fields: any[] = []
  components.forEach(componentItem => {
    const nowFields = extractFieldsFromComponent(componentItem, configMap, displayControlModuleIds, withConfig)
    fields.push(...nowFields)
  })
  return fields
}

const extractFieldsFromComponent = (
  componentItem: any[],
  configMap: Record<string, any>,
  displayControlModuleIds?: string[],
  withConfig?: boolean
): FormField[] => {
  const fields: FormField[] = []
  const { id, type } = componentItem as Record<string, any>
  let { fieldType } = componentItem as Record<string, any>
  const config = configMap[id]
  if (config == null) {
    return fields
  }
  // 如果是子表单组件，则直接跳过，不解析当前子表单组件内的字段
  if (type === 'sub_form') {
    return fields
  }
  // 如果是layout组件，则直接解析layout内部的字段列表
  if (type === 'grid_layout') {
    const { colList } = config
    if (colList && colList.length > 0) {
      colList.forEach((col: any) => {
        const { components } = col
        if (components && components.length > 0) {
          const layoutFields = extractFieldsFromComponents(components, configMap, displayControlModuleIds, withConfig)
          fields.push(...layoutFields)
        }
      })
    }
    return fields
  }
  // 如果是GroupLayout/CollapseLayout/GroupFrame组件，则直接解析分组组件内部的字段列表
  if (['group_layout', 'collapse_layout', 'group_frame'].includes(type)) {
    const { components } = config
    if (components && components.length > 0) {
      const frameFields = extractFieldsFromComponents(components, configMap, displayControlModuleIds, withConfig)
      fields.push(...frameFields)
    }
    return fields
  }
  // 如果是TableLayout组件，则直接解析表格布局内部的字段列表
  if (type === 'table_layout') {
    const { rows } = config
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      const { cols } = row
      for (let colIndex = 0; colIndex < cols.length; colIndex++) {
        const col = cols[colIndex]
        const { visible, components } = col
        if (visible) {
          const colFields = extractFieldsFromComponents(components, configMap, displayControlModuleIds, withConfig)
          fields.push(...colFields)
        }
      }
    }
    return fields
  }
  // 如果是TabsLayout组件，则直接解析TabsLayout内部的字段列表
  if (type === 'tabs_layout') {
    const { tabItems } = config
    if (tabItems && tabItems.length > 0) {
      tabItems.forEach((item: any) => {
        const { components } = item
        if (components && components.length > 0) {
          const layoutFields = extractFieldsFromComponents(components, configMap, displayControlModuleIds, withConfig)
          fields.push(...layoutFields)
        }
      })
    }
    return fields
  }

  // 如果是其他不能解析为字段列表的组件，则略过
  if (fieldType == null) {
    return fields
  }

  const { fieldName, fieldLabel, defaultValue, maxLength, validateRules } = config
  // 根据校验规则列表计算必填值
  let required = false
  if (validateRules && validateRules.length > 0) {
    required = validateRules.some((rule: FormItemValidateRule) => rule.type === 'notnull')
  }
  // 如果是datepicker，则根据配置来决定fieldType
  if (type === 'datepicker') {
    const { timeSelected } = config
    if (!timeSelected) {
      fieldType = 'date'
    }
  }
  // 如果是日期区间选择，则解析为两个字段
  if (type === 'date_range') {
    fieldType = 'date'
    const { startFieldName, startFieldLabel, endFieldName, endFieldLabel } = config
    const startField: FormField = {
      key: startFieldName,
      label: startFieldLabel,
      dataType: fieldType,
      required,
      defaultVal: defaultValue,
      unique: false,
      dataLength: maxLength ?? 0,
      extension: {},
      // 组件基础信息
      meta: {},
      // 组件配置信息
      config: {}
    }
    const endField: FormField = {
      key: endFieldName,
      label: endFieldLabel,
      dataType: fieldType,
      required,
      defaultVal: defaultValue,
      unique: false,
      dataLength: maxLength ?? 0,
      extension: {},
      // 组件基础信息
      meta: {},
      // 组件配置信息
      config: {}
    }
    if (withConfig) {
      startField.meta = componentItem
      endField.meta = componentItem
      startField.config = config
      endField.config = config
    }
    fields.push(startField)
    fields.push(endField)
    return fields
  }

  const validation: Record<string, any> = {}
  // Build decimal precision
  if (config.decimalPrecision !== undefined) {
    validation.decimal = config.decimalPrecision
  }
  const field: FormField = {
    key: fieldName,
    label: fieldLabel,
    dataType: fieldType,
    required,
    defaultVal: defaultValue,
    unique: false,
    dataLength: maxLength ?? 0,
    extension: {},
    // 组件基础信息
    meta: {},
    // 组件配置信息
    config: {}
  }
  if (withConfig) {
    field.meta = componentItem
    field.config = config
  }
  fields.push(field)
  return fields
}

const extractSubFormInfoList = (components: any[], configMap: Record<string, any>): Record<string, any>[] => {
  const subFormList: Record<string, any>[] = []
  if (!components || components.length === 0 || !configMap) {
    return subFormList
  }
  // 展开所有布局组件及其内部组件（忽略子表单内部组件）
  const allComponents = deepExtractComponents(components, configMap, true)
  const subFormComponents = allComponents.filter(item => isSubFormComponents(item))
  for (const component of subFormComponents) {
    const { id } = component
    const config: Record<string, any> = configMap[id]
    if (!config) {
      continue
    }
    const { components: innerComponents } = config
    if (!innerComponents || innerComponents.length === 0) {
      continue
    }
    const fields = extractFields(innerComponents, configMap, false)
    // 构建子表单信息
    const subFormInfo: Record<string, any> = {
      formId: config.formKey,
      formLabel: config.formName,
      modelKey: config.formKey,
      fields
    }
    subFormList.push(subFormInfo)
  }
  return subFormList
}

export {
  extractFields,
  extractRelations,
  extractFieldsFromComponents,
  extractFieldsFromComponent,
  extractSubFormInfoList
}
