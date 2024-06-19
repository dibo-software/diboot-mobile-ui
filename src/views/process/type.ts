export interface BpmnModel {
  id: string
  /**
   * 版本号
   */
  rev: number
  /**
   * 名称
   */
  name: string
  /**
   * 标识编码
   */
  key: string
  /**
   * 分类
   */
  category: string
  categoryName?: string

  /**
   * 版本
   */
  version: number
  /**
   * 元数据（json保存流程定义信息）
   */
  metaInfo: string
  /**
   * 部署ID
   */
  deploymentId?: string
  /**
   * 二进制文件id（原始信息）
   */
  editorSourceValueId: string
  /**
   * 二进制文件id（扩展信息）
   */
  editorSourceExtraValueId: string
  /**
   * 创建时间
   */
  createTime: string
  /**
   * 最后更新时间
   */
  lastUpdateTime: string
  /**
   * 描述
   */
  description?: string
}

/**
 * 流程定义
 */
export interface ActReProcdef {
  id: string
  /**
   * 版本
   */
  rev: string
  /**
   * 分类
   */
  category: string
  categoryName?: string
  /**
   * 名称
   */
  name: string
  /**
   * 标识编码
   */
  key: string
  /**
   * 版本
   */
  version: number
  /**
   * 部署ID
   */
  deploymentId: string
  /**
   * RESOURCE_NAME_
   */
  resourceName: string
  /**
   * DGRM_RESOURCE_NAME_
   */
  dgrmResourceName: string
  /**
   * DESCRIPTION_
   */
  description: string
  /**
   * HAS_START_FORM_KEY_
   */
  hasStartFormKey: boolean
  /**
   * HAS_GRAPHICAL_NOTATION_
   */
  hasGraphicalNotation: boolean
  /**
   * SUSPENSION_STATE_
   */
  suspensionState: number
  suspended?: boolean
  /**
   * ENGINE_VERSION_
   */
  engineVersion: string
  /**
   * DERIVED_FROM_
   */
  derivedFrom: string
  /**
   * DERIVED_FROM_ROOT_
   */
  derivedFromRoot: string
  /**
   * DERIVED_VERSION_
   */
  derivedVersion: string
  /**
   * 创建时间
   */
  createTime: string
}

/**
 * 流程配置
 */
export interface ProcessConfig {
  id: string
  /**
   * 流程模型
   */
  modelId: string

  /**
   * 流程部署ID
   */
  deploymentId: string

  /**
   * 表单IDs
   */
  formIds: string[]

  /**
   * 表单模式
   */
  formMode: string

  /**
   * 流程管理员
   */
  managerId: string

  /**
   * 功能范围
   */
  functionScopes: string

  /**
   * 可见范围
   */
  authScopeUsers: string
  authScopeOrgs: string
  authScopeRoles: string
  authScopePositions: string

  /**
   * 模板文件
   */
  templateId: string

  /**
   * 扩展配置
   */
  extension: Record<string, unknown>

  /**
   * 创建人
   */
  createBy: string

  /**
   * 更新时间
   */
  updateTime: string
}

/**
 * 流程发起
 */
export interface ProcessStart {
  /**
   * 发起流程标题
   */
  title: string
  /**
   * 流程定义id
   */
  processDefinitionId: string
  /**
   * 业务key
   */
  businessKey: string
  /**
   * 表单值
   */
  formValues: Record<string, Record<string, unknown>>
  /**
   * 抄送人
   */
  ccToList: Array<{
    /**
     * 抄送人id
     */
    userIdAndType: string
    /**
     * 抄送人名称
     */
    displayName: string
  }>
  /**
   * 实例id
   */
  processInstanceId?: string
  /**
   * 是否以暂存方式提交
   */
  hold?: boolean
  /**
   * 暂存id
   */
  holdId?: string
  /**
   * 扩展变量
   */
  extensionVariables?: Record<string, unknown>
}

/**
 * 流程处理操作
 */
export interface ProcessOperate {
  /**
   * 任务id
   */
  taskId: string
  /**
   * 流程实例id
   */
  processInstanceId: string
  /**
   * 转办/委派 人
   */
  userId: string
  /**
   * 操作备注
   */
  message: string
  /**
   * 节点变量值
   */
  values: Record<string, unknown>
  /**
   * 表单值
   */
  formValues: Record<string, Record<string, unknown>>
  /**
   * 抄送人
   */
  ccToVos: Array<{
    /**
     * 抄送人id
     */
    userIdAndType: string
    /**
     * 抄送人名称
     */
    displayName: string
  }>
  /**
   * 任务操作类型
   */
  taskOperate: string
  // ====== 退回/加签时候使用 ===========
  /**
   * 目标节点
   */
  activityId: string
  /**
   * 目标节点名称
   */
  activityName: string
  /**
   * 加签使用
   */
  userIdList: string[]
  /**
   * 多表单数据
   */
  formData: Record<string, Record<string, unknown>>
  /**
   * 多实例审核是否通过(true)
   */
  auditPass: boolean
  /**
   * 是否支持自动驳回(false)
   */
  supportRebutTargetActivityIds: boolean
  /**
   * 是否是流程管理员操作(false)
   */
  manager: boolean
  /**
   * 指定的下一节点执行人ID
   */
  nextNodeExecutor: string
  /**
   * 需要减签的流程执行id
   */

  deleteExecutionIdList: string[]

  attachment: string

  validTask: boolean
}

/**
 * 流程执行任务
 */
export interface ProcessExecuteTask {
  /**
   * 当前用户的发起人
   */
  startUserId: string
  /**
   * 当前用户的发起人名称
   */
  startUserName: string
  /**
   * 任务的from表单
   */
  taskFormKey: string
  /**
   * 任务的form配置
   */
  taskFormConfig: Record<string, unknown>
  /**
   * 变量
   */
  variables: Record<string, unknown>
  /**
   * 是否是提交人
   */
  initiator: boolean

  /**
   * 所具有的按钮权限
   */
  buttons: string[]

  /**
   * 所具有的按钮配置
   */
  buttonExtension: Record<
    string,
    { rename: string; formRules: Record<string, unknown>[]; variableRules: Record<string, unknown>[] }
  >

  /**
   * 多表单表单数据
   */
  multiFormData: Record<string, Record<string, unknown>>

  /**
   * 所具有的字段权限JSON字符串
   */
  fieldsPermission: string

  /**
   * 是否是多实例
   */
  hasMultiInstanceLoopCharacteristics: boolean

  /**
   * 消息边界事件配置
   */
  messageBoundaryEventVO: unknown
  hasMsgEvent?: boolean

  /**
   * 动态分配对应的条件value
   */
  dynamicAssignConditionValue?: number | string
  /**
   * 动态分配的策略
   */
  assignExecutorStrategy: string

  /**
   * 驳回是否允许驳回到指定节点
   */
  supportRebutTargetActivityIds: boolean

  activityId: string
}

/**
 * 流程实例
 */
export interface ActHiProcinst {
  id: string
  /**
   * 版本
   */
  rev: number
  /**
   * 流程实例ID
   */
  procInstId: string
  /**
   * 业务标识
   */
  businessKey: string
  /**
   * 流程定义ID
   */
  procDefId: string
  /**
   * 开始时间
   */
  startTime: string
  /**
   * 结束时间
   */
  endTime: string
  /**
   * 耗时
   */
  duration: string
  durationLabel: string
  /**
   * 流程发起人ID
   */
  startUserId: string
  /**
   * 开始节点ID
   */
  startActId: string
  /**
   * 结束节点ID
   */
  endActId: string
  /**
   * 父流程实例ID
   */
  superProcessInstanceId: string
  /**
   * 删除原因
   */
  deleteReason: string
  /**
   * 名称
   */
  name: string
  /**
   * 回调id
   */
  callbackId: string
  /**
   * 回调类型
   */
  callbackType: string
  /**
   * 关联id
   */
  referenceId: string
  /**
   * 关联类型
   */
  referenceType: string

  statusLabel: string
  processDefinitionName: string
}

export interface ActHiTaskinst {
  id: string
  /**
   * 版本号
   */
  rev: number
  /**
   * 流程定义
   */
  procDefId: string
  /**
   * 任务节点定义Id
   */
  taskDefId?: string
  /**
   * 任务节点定义key
   */
  taskDefKey: string
  /**
   * 流程实例
   */
  procInstId: string
  /**
   * 执行实例
   */
  executionId: string
  /**
   * 任务名称
   */
  name: string
  /**
   * 父任务节点
   */
  parentTaskId?: string
  /**
   * 描述
   */
  description: string
  /**
   * 被代理人
   */
  owner: string
  /**
   * 经办人
   */
  assignee: string
  /**
   * 开始时间
   */
  startTime: string
  /**
   * 创建时间
   */
  createTime: string
  /**
   * 签收时间
   */
  claimTime: string
  /**
   * 结束时间
   */
  endTime: string
  /**
   * 耗时
   */
  duration: string
  /**
   * 优先级
   */
  priority: number
  /**
   * 截止时间
   */
  dueDate: string
  /**
   * 分类
   */
  category: string
  /**
   * 删除原因
   */
  deleteReason?: string
  /**
   * FORM表单的KEY
   */
  formKey?: string
  /**
   * 更新时间
   */
  lastUpdatedTime?: string

  /**
   * 工作耗时
   */
  workTimeInMillis?: string
  /**
   * 流程实例名称
   */
  processInstanceName: string
  /**
   * 处理人
   */
  assignName?: string
  /**
   * 是否允许退回
   */
  allowBack?: boolean
}

/**
 * 流程任务
 */
export interface ActRuTask {
  id: string
  /**
   * 版本号
   */
  rev: number
  /**
   * 执行实例
   */
  executionId: string
  /**
   * 流程实例
   */
  procInstId: string
  /**
   * 流程定义
   */
  procDefId: string
  /**
   * 名称
   */
  name: string
  /**
   * 父任务
   */
  parentTaskId: string
  /**
   * 描述
   */
  description: string
  /**
   * 任务定义标识
   */
  taskDefKey: string
  /**
   * 被代理人
   */
  owner: string
  /**
   * 经办人
   */
  assignee: string
  /**
   * 委托状态
   */
  delegation: string
  /**
   * 优先级
   */
  priority: number
  /**
   * 创建时间
   */
  createTime: string
  /**
   * 截止时间
   */
  dueDate: string
  /**
   * 分类
   */
  category: string
  /**
   * 挂起状态
   */
  suspensionState: number
  /**
   * 表单标识
   */
  formKey: string
  /**
   * 签收时间
   */
  claimTime: string

  /**
   * 是否挂起
   */
  suspended?: boolean
  /**
   * 委派状态
   */
  delegationState?: string
  /**
   * 流程实例名称
   */
  processInstanceName: string
  /**
   * 处理人
   */
  assignName: string
}

/**
 * 审核备注
 */
export interface ActHiComment {
  id: string
  /**
   * 类型
   */
  type: string
  typeLabel?: string
  /**
   * 时间
   */
  time: string
  /**
   * 用户ID
   */
  userId: string
  /**
   * 任务ID
   */
  taskId: string
  /**
   * 流程实例ID
   */
  procInstId: string
  /**
   * 行为类型
   */
  action: string
  /**
   * 审批意见
   */
  message: string
  /**
   * 全部内容
   */
  fullMsg: string

  /**
   * 用户名
   */
  userName?: string
  /**
   * 任务名称
   */
  taskName?: string
  /**
   * 泳道名称
   */
  laneName?: string

  /**
   * 拥有历史数据快照的formKeys
   */
  snapshotFormKeys?: string[]

  /**
   * 任务开始时间
   */
  startTime?: string
  /**
   * 任务结束时间
   */
  endTime: string
  /**
   * 任务认领时间，如果没有认领时间，那么时间与开始时间一致
   *
   */
  claimTime?: string
  /**
   * 任务处理时长
   *
   */
  duration?: string

  /**
   *  附件列表
   */
  attachmentFileList?: FileRecord[]
}

/**
 * 表单权限
 */
export type FormPermission = Record<
  string,
  { disabledProps: string[]; invisibleProps: string[]; visibleRelations: string[] }
>

export type FormPermissionProperty = {
  formId: string
  wrFields: string[]
  readonlyFields: string[]
  invisibleFields: string[]
  relations?: FormPermissionProperty[]
}


