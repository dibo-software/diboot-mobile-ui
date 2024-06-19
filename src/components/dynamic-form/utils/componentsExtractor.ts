const deepExtractComponents = (components: any[], configMap: Record<string, any>, withoutSubForm?: boolean) => {
  if (components.length === 0) {
    return []
  }
  const results: any[] = []
  results.push(...components)
  for (const item of components) {
    const { id } = item
    if (id && configMap[id]) {
      // 根据各类可嵌套组件（子表单组件 & 各类布局组件）
      const { type, components: defaultComponents, colList, tabItems, rows } = configMap[id]
      // 如果不包含子表单，则忽略子表单内部组件处理
      if (withoutSubForm && isSubFormComponents(components)) {
        continue
      }
      if (defaultComponents != null && defaultComponents.length > 0) {
        results.push(...deepExtractComponents(defaultComponents, configMap, withoutSubForm))
      } else if (type === 'grid_layout' && colList && colList.length > 0) {
        for (const col of colList) {
          const { components: colComponents } = col
          results.push(...deepExtractComponents(colComponents, configMap, withoutSubForm))
        }
      } else if (type === 'table_layout' && rows && rows.length > 0) {
        for (const row of rows) {
          const { cols } = row
          if (cols.length > 0) {
            for (const col of cols) {
              const { components: colComponents, visible } = col
              if (visible) {
                results.push(...deepExtractComponents(colComponents, configMap, withoutSubForm))
              }
            }
          }
        }
      } else if (type === 'tabs_layout' && tabItems && tabItems.length > 0) {
        for (const item of tabItems) {
          const { components: itemComponents } = item
          results.push(...deepExtractComponents(itemComponents, configMap, withoutSubForm))
        }
      }
    }
  }
  return results
}

const attachConfig4Components = (components: any[], configMap: Record<string, any>) => {
  if (components.length === 0) {
    return
  }
  for (const item of components) {
    const { id } = item
    if (!id || !configMap[id]) {
      continue
    }
    const config = configMap[id]
    item.config = config
    // 根据各类可嵌套组件递归绑定配置数据
    const { type, components: defaultComponents, colList, tabItems, rows } = config
    if (type === 'grid_layout' && colList && colList.length > 0) {
      for (const col of colList) {
        const { components: colComponents } = col
        attachConfig4Components(colComponents, configMap)
      }
    } else if (type === 'table_layout' && rows && rows.length > 0) {
      for (const row of rows) {
        const { cols } = row
        if (cols.length > 0) {
          for (const col of cols) {
            const { components: colComponents, visible } = col
            if (visible) {
              attachConfig4Components(colComponents, configMap)
            }
          }
        }
      }
    } else if (type === 'tabs_layout' && tabItems && tabItems.length > 0) {
      for (const item of tabItems) {
        const { components: itemComponents } = item
        attachConfig4Components(itemComponents, configMap)
      }
    } else if (defaultComponents && defaultComponents.length > 0) {
      attachConfig4Components(defaultComponents, configMap)
    }
  }
}

const isLayoutComponents = (component: any) => {
  return [
    'title_text',
    'description_text',
    'grid_layout',
    'table_layout',
    'tabs_layout',
    'group_layout',
    'collapse_layout'
  ].includes(component.type)
}

/**
 * 容器类组件类型列表
 */
const getContainerComponentTypes = (includeSubForm?: boolean) => {
  const types = ['grid_layout', 'table_layout', 'tabs_layout', 'group_layout', 'collapse_layout']
  if (includeSubForm) {
    types.push('sub_form')
  }
  return types
}

/**
 * 是否为容器类组件
 * @param component
 */
const isContainerComponents = (component: any, includeSubForm?: boolean) => {
  return getContainerComponentTypes(includeSubForm).includes(component.type)
}

const isSubFormComponents = (component: any) => {
  return 'sub_form' === component.type
}

export {
  deepExtractComponents,
  attachConfig4Components,
  isLayoutComponents,
  isSubFormComponents,
  getContainerComponentTypes,
  isContainerComponents
}
