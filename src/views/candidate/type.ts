/**
 * 候选人经验
 */
export interface CandidateExperience {
  // 唯一标识
  id?: string
  // 候选人id
  candidateId?: string
  candidateIdLabel?: string
  // 开始时间
  startDate?: string
  // 结束时间
  endDate?: string
  // 工作内容
  duty?: string
  // 创建人
  createBy?: string
  createByLabel?: string
  // 创建时间
  createTime?: string
  // 更新人
  updateBy?: string
  updateByLabel?: string
  // 更新时间
  updateTime?: string
}

/**
 * 候选人
 */
export interface Candidate {
  // 唯一标识
  id?: string
  // 流程实例id
  processInstanceId?: string
  // 流程定义
  processDefinitionId?: string
  // 绑定的业务key
  businessKey?: string
  // 流程状态
  processStatus?: string
  processStatusLabel?: LabelValue
  // 流程标题
  processTitle?: string
  // 姓名
  name?: string
  // 年龄
  age?: number
  // 备注
  description?: string
  // 创建人
  createBy?: string
  createByLabel?: string
  // 创建时间
  createTime?: string
  // 更新人
  updateBy?: string
  updateByLabel?: string
  // 更新时间
  updateTime?: string

  // candidateExperienceSubList
  candidateExperienceSubList?: CandidateExperience[]
}
