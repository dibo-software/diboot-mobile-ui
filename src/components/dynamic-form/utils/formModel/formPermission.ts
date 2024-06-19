import { isLayoutComponents, isSubFormComponents } from '../componentsExtractor'

const getVisibleComponents = (
  components: any[],
  configMap: Record<string, any>,
  invisibleProps: string[],
  visibleRelations: string[],
  subFormKey?: string
): any[] => {
  return components.filter(component => {
    if (!isSubFormComponents(component) && (!invisibleProps || invisibleProps.length === 0)) {
      return true
    }
    const id = component.id
    const config = configMap[id]
    if (!config) {
      console.log('配置数据错误，请检查！ID: ', id)
      return false
    }
    if (isSubFormComponents(component)) {
      return visibleRelations === undefined || visibleRelations.includes(config.formKey)
    } else if (!invisibleProps || invisibleProps.length === 0) {
      return true
    } else if (isLayoutComponents(component)) {
      // 属于布局组件，则对其关联属性进行判定(布局组件只应用于主表单，不必对子表单字段进行判断)
      if (!config.relPermissionFields || config.relPermissionFields.length === 0) {
        return true
      }
      const visible = config.relPermissionFields.some((fieldName: string) => !invisibleProps.includes(fieldName))
      return visible
    } else {
      // 其他组件，获取其fieldName属性，验证是否属于不可见字段
      let propName = subFormKey ? `${subFormKey}.` : ''
      if (!config.fieldName) {
        console.log('未获取到字段名，忽略检查该动态表单组件权限！ID：', id, config)
        return true
      } else {
        propName += config.fieldName
      }
      return !invisibleProps.includes(propName)
    }
  })
}

export { getVisibleComponents }
