export interface FormField {
  key: string
  label: string
  dataType: string
  dataLength: number
  required: boolean
  unique: boolean
  defaultVal: string
  // 模型字段扩展配置
  extension: Record<string, any>
  // 表单组件基础信息
  meta?: Record<string, any>
  // 表单附加配置数据
  config?: Record<string, any>
}
