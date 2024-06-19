<script setup lang="ts">
import ProcessDetail from './components/Detail.vue'
import type { FormPermission, FormPermissionProperty } from '@/views/process/type'
import { getFormIdsDenyFields } from '@/components/di/utils'
const formPermission = ref<FormPermission>()
const activityId = ref()
const loadFieldPermission = () => {
  console.log(router.currentRoute)
  api
      .get<any>(`/process-center/history/field-permission`, {
        instanceId: router.currentRoute.value.params.procInstId,
        taskId: router.currentRoute.value.params.taskId
      })
      .then(async res => {
        activityId.value = res.data.activityId
        const fieldsPermission: FormPermissionProperty[] = JSON.parse(res.data.fieldsPermission ?? '[]')
        const formIds = fieldsPermission.map(e => e.formId)
        // 是否是动态模型
        const isDynamicModel = formIds.length > 0 && !formIds[0].startsWith('CUSTOM:')
        // 静态表单，不做安全字段相关处理
        const denyFieldsMap = isDynamicModel ? await getFormIdsDenyFields(...formIds) : {}
        formPermission.value = fieldsPermission.reduce((map: FormPermission, item: FormPermissionProperty) => {
          // 处理主表单只读字段与不显示字段
          const disabledProps = [...item.readonlyFields]
          const invisibleProps = [...item.invisibleFields]
          if (denyFieldsMap[item.formId]?.length) invisibleProps.push(...denyFieldsMap[item.formId])
          // 处理子表单只读字段与不显示字段
          const {relations} = item
          const visibleRelations: string[] = []
          if (relations && relations.length > 0) {
            for (const relationItem of relations) {
              if (relationItem.readonlyFields && relationItem.readonlyFields.length > 0) {
                disabledProps.push(...relationItem.readonlyFields.map(fieldName => `${relationItem.formId}.${fieldName}`))
              }
              if (relationItem.invisibleFields && relationItem.invisibleFields.length > 0) {
                invisibleProps.push(
                    ...relationItem.invisibleFields.map(fieldName => `${relationItem.formId}.${fieldName}`)
                )
              }
              if (denyFieldsMap[relationItem.formId]?.length)
                invisibleProps.push(
                    ...denyFieldsMap[relationItem.formId].map(fieldName => `${relationItem.formId}.${fieldName}`)
                )
              // 收集具有授权的关联子表单表单编码
              if (relationItem.formId) {
                visibleRelations.push(relationItem.formId)
              }
            }
          }
          map[item.formId] = {disabledProps, invisibleProps, visibleRelations}
          return map
        }, {})
      })
      .catch(err => showFailToast(err.msg || err.message || '获取表单配置失败'))
}
const router = useRouter()
const keepAlive = router.currentRoute.value.meta.keepAlive

if (keepAlive) onActivated(loadFieldPermission)
else loadFieldPermission()


</script>

<template>
  <process-detail :proc-inst-id="$route.params.procInstId as string" :forms="formPermission" :activity-id="activityId" :category="$route.query.category" preview/>
</template>
