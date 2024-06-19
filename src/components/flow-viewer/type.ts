export interface FlowNodeDetail {
  id?: string
  title: string
  executeState: number
  executeUserList: string[]
  candidateUserList: string[]
  candidateGroupPositionList: string[]
  candidateGroupRoleList: string[]
  candidateGroupOrgList: string[]
  category: string
  startTime: string
  endTime: string
  duration: number
}
