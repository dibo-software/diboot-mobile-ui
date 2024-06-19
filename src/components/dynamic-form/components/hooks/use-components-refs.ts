export interface ComponentsRefsOption {
  getComponentRefKeys: () => string[]
}

export default (option: ComponentsRefsOption) => {
  const componentRefMap: Record<string, any> = {}
  const setComponentRefMap = (el: any, key: string) => {
    if (el && key) {
      componentRefMap[key] = el
    }
  }
  const validate = async () => {
    // 获取所有key列表
    const keys: string[] = option.getComponentRefKeys()
    // 调用组件内部validate方法
    for (const key of keys) {
      if (!key || !componentRefMap[key]) {
        continue
      }
      const componentRef = componentRefMap[key]
      if (componentRef.validate == null) {
        continue
      }
      await componentRef.validate()
    }
  }
  const reset = () => {
    // 获取所有key列表
    const keys: string[] = option.getComponentRefKeys()
    // 调用组件内部reset方法
    for (const key of keys) {
      if (!key || !componentRefMap[key]) {
        continue
      }
      const componentRef = componentRefMap[key]
      if (componentRef.reset == null) {
        continue
      }
      componentRef.reset()
    }
  }
  return {
    componentRefMap,
    setComponentRefMap,
    validate,
    reset
  }
}
