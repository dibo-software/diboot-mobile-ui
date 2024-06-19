<script setup lang="ts">
import Viewer from 'bpmn-js/lib/Viewer'
import type Canvas from 'diagram-js/lib/core/Canvas'
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry'
import type { InternalEvent } from 'diagram-js/lib/core/EventBus'
import type EventBus from 'diagram-js/lib/core/EventBus'
import type Overlays from 'diagram-js/lib/features/overlays/Overlays'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'
import TouchModule from 'diagram-js/lib/navigation/touch'
import type ZoomScroll from 'diagram-js/lib/navigation/zoomscroll/ZoomScroll'
import type { FlowNodeDetail } from './type'
import TagList from './TagList.vue'
import { ref, onMounted, defineProps, nextTick, markRaw, watch } from 'vue'

type DiagramType = {
  viewerXml: string
  historyElementIdList?: string[] //历史元素id
  activeElementIdList?: string[] // 激活中的元素id
}
const props = defineProps<{
  diagram: DiagramType // 流程对象
  renderMore: boolean // 是否渲染更多： 渲染颜色，增加事件等
  processInstanceId?: string // 流程实例id
}>()

const executeStateMap: Record<number, string> = {
  0: '（正在执行）',
  1: '（已执行）',
  2: '（未执行）'
}
const flowViewerCanvas = ref<HTMLElement>()
const bpmnViewer = ref<Viewer>()
onMounted(() => {
  initBpmnViewer()
})
const initBpmnViewer = () => {
  bpmnViewer.value = new Viewer({
    container: flowViewerCanvas.value as HTMLElement,
    additionalModules: [ZoomScrollModule, MoveCanvasModule, TouchModule]
  })
}
// 缩放
const zoom = (zoomIn: boolean) => {
  bpmnViewer.value!.get<ZoomScroll>('zoomScroll')!.zoom(zoomIn ? 1 : -1, {})
}
/**
 * 获取xml中的属性
 * @param source
 * @param element
 * @param attr
 * @returns {*[]}
 */
const getXMLAttr = (source: string, element: string, attr: string) => {
  const result: string[] = []
  const reg = '<' + element + '[^<>]*?\\s' + attr + '=[\'"]?(.*?)[\'"]?\\s.*?>'
  const matched = source.match(new RegExp(reg, 'gi'))
  matched && matched.forEach(item => item && result.push(item))
  return result
}
// 设置流程图颜色
const setColor = (markBpmnViewer: Viewer) => {
  // 获取流程
  const canvas = markBpmnViewer!.get<Canvas>('canvas')
  // 获取到全部节点
  const allShapes = markBpmnViewer!.get<ElementRegistry>('elementRegistry').getAll()
  // 循环节点添加颜色
  allShapes.forEach(element => {
    const { businessObject } = element
    const shapeId = businessObject.id
    // 添加class
    // 如果是是连线
    if (businessObject.$type === 'bpmn:SequenceFlow') {
      if (props.diagram.historyElementIdList!.includes(shapeId)) {
        canvas.addMarker(shapeId, 'highlight-history')
        canvas.addMarker(shapeId, 'highlight-history-line')
      }
    } else {
      if (props.diagram.historyElementIdList!.includes(shapeId)) canvas.addMarker(shapeId, 'highlight-history')
      if (props.diagram.activeElementIdList!.includes(shapeId)) canvas.addMarker(shapeId, 'highlight-active')
    }
  })
}
const nodeDetailMap = ref<Record<string, FlowNodeDetail>>({}) // 存储节点详情
const hoverNode = ref<Partial<FlowNodeDetail>>({}) //停悬按钮
// 节点增加事件
const addEventBusListener = (markBpmnViewer: Viewer) => {
  // 获取事件注册总线
  const eventBus = markBpmnViewer!.get<EventBus>('eventBus')
  // 获取展示
  const overlays = markBpmnViewer!.get<Overlays>('overlays')
  // 移入用户任务，则展示当前节点相关数据
  eventBus.on('element.click', async e => {
    const { type, id } = e.element
    if (type === 'bpmn:UserTask') {
      if (props.processInstanceId) {
        const nodeDetail = nodeDetailMap.value[id]
        if (nodeDetail) {
          overlaysNodeDetail(e, nodeDetail, overlays)
        } else {
          // 如果是当前激活节点（激活节点可能存在候选人/候选组的情况，这种标记为待认领），或者是历史节点，动态从数据库取数据展示，否则展示默认属性
          if (isActiveNode(id) || isHistoryNode(id)) {
            const nodeData = await getNodeDetail(id)
            if (nodeData) {
              nodeData['id'] = id
              nodeDetailMap.value[id] = nodeData
              overlaysNodeDetail(e, nodeDetailMap.value[id], overlays)
            }
          }
        }
      }
    }
  })
  eventBus.on('element.out', () => {
    // 移除
    overlays && overlays.clear()
  })
}
/**
 * 展示节点的细节
 */
const overlaysNodeDetail = async (e: InternalEvent, nodeDetail: FlowNodeDetail, overlays: Overlays) => {
  hoverNode.value = nodeDetail
  await nextTick()
  const hoverDiv = document.createElement('div')
  const hoverElement = document.querySelector('.hover-detail')
  const time = setTimeout(() => {
    hoverDiv.innerHTML = hoverElement?.innerHTML || ''
    hoverDiv.className = 'tip-detail van-popup van-popover van-popover--light'
    overlays.add(e.element, 'node-tip', {
      position: { top: e.element.height - 15, right: 0 },
      html: hoverDiv
    })
    clearTimeout(time)
  }, 16)
}
// 根据节点id获取节点详细信息
const getNodeDetail = async (activityId: string) => {
  try {
    const res = await api.get<FlowNodeDetail>(
        `/process-center/diagram/node-detail/${props.processInstanceId}/${activityId}`
    )
    return res.data
  } catch (e) {
    console.log(e)
  }
}

// 是否是历史节点
const isHistoryNode = (id: string) => {
  return props.diagram && props.diagram.historyElementIdList && props.diagram.historyElementIdList.includes(id)
}
// 是否是执行中节点
const isActiveNode = (id: string) => {
  return props.diagram && props.diagram.activeElementIdList && props.diagram.activeElementIdList.includes(id)
}
// 创建流程图
const createNewDiagram = async () => {
  const { viewerXml } = props.diagram
  if (!viewerXml) return
  try {
    // 流程图预览时，排他网关需要在网关对应的<bpmndi:BPMNShape>节点上添加属性isMarkerVisible="true"
    // 否则 显示的排他网关没有X标记
    const gatewayIds = getXMLAttr(viewerXml, 'exclusiveGateway', 'id')
    let modelXmlTemp = viewerXml
    if (gatewayIds && gatewayIds.length > 0) {
      gatewayIds.forEach((item: string) => {
        const result = new RegExp('id="(.+?)"').exec(item)
        if (result && result[1]) {
          modelXmlTemp = modelXmlTemp.replace(
              'bpmnElement="' + result[1] + '"',
              'bpmnElement="' + result[1] + '" isMarkerVisible="true"'
          )
        }
      })
    }
    const markBpmnViewer = markRaw(bpmnViewer.value as Viewer)
    await markBpmnViewer!.importXML(modelXmlTemp)
    const canvas = markBpmnViewer!.get<Canvas>('canvas')
    canvas.zoom('fit-viewport', 'auto')
    if (props.renderMore) setColor(markBpmnViewer)
    addEventBusListener(markBpmnViewer)
  } catch (err) {
    console.log(err)
  }
}
watch(
    () => props.diagram,
    () => {
      if (!bpmnViewer.value) initBpmnViewer()
      createNewDiagram()
    },
    { deep: true, immediate: true }
)
const popoverShow = ref(true)
</script>

<template>
  <div class="flow-viewer">
    <div style="display: flex; justify-content: flex-end;padding: 0 10px;">
      <van-button size="small" icon="plus" @click="zoom(true)"/>
      <van-button size="small" icon="minus" @click="zoom(false)"/>
    </div>
    <div id="flowViewerCanvas" ref="flowViewerCanvas" class="flow-viewer_canvas" />
    <van-popover
        ref="hoverDetail"
        class="hover-detail"
        :show-arrow="false"
        v-model:show="popoverShow"
    >
      <div style="padding: 5px">
        <div style="font-weight: bold"> {{`${hoverNode.title || ''} ${(hoverNode.executeState !== undefined && executeStateMap[hoverNode.executeState]) || '(未知进度)'}`}}</div>
        <p
            v-if="
          hoverNode.candidateGroupPositionList || hoverNode.candidateGroupRoleList || hoverNode.candidateGroupOrgList
        "
        >
          <tag-list label="候选组-岗位" :tags="hoverNode.candidateGroupPositionList" />
          <tag-list label="候选组-角色" :tags="hoverNode.candidateGroupRoleList" />
          <tag-list label="候选组-部门" :tags="hoverNode.candidateGroupOrgList" />
        </p>
        <p v-if="hoverNode.candidateUserList">
          <tag-list label="候选人" :tags="hoverNode.candidateUserList" />
        </p>
        <p>
          <tag-list v-if="hoverNode.executeUserList" label="执行人" :tags="hoverNode.executeUserList" />
          <template v-else>-</template>
        </p>
        <p>任务类型：{{ hoverNode.category }}</p>
        <p>开始时间：{{ hoverNode.startTime || '-' }}</p>
        <p>结束时间：{{ hoverNode.endTime || '-' }}</p>
        <template v-if="hoverNode.duration">
          <p>持续时长：{{ hoverNode.duration }}</p>
        </template>
      </div>
    </van-popover>
  </div>
</template>

<style lang="scss">
.bjs-breadcrumbs,
.bjs-powered-by {
  display: none;
}
.bjs-element {
  touch-action: manipulation;
}

.custom-dialog {
  .el-dialog__body {
    padding: 0 5px;
    height: 60vh;
  }
}

.flow-viewer {
  height: 100%;
  width: 100%;

  &_canvas {
    width: 100%;
    height: 100%;
    .bjs-container,
    .djs-container,
    svg {
      min-height: 400px;
    }
  }
}

.hover-detail {
  display: none;
}

.highlight-history .djs-visual > :nth-child(1) {
  stroke: #72cb4f !important;
  fill: rgba(114, 203, 79, 0.2) !important;
}

.highlight-history-line .djs-visual > :nth-child(1) {
  fill: none !important;
}

.highlight-active .djs-visual > :nth-child(1) {
  stroke: #fcd37fff !important;
  fill: rgba(252, 211, 127, 0.2) !important;
  stroke-dasharray: 5, 5;
  stroke-dashoffset: 500;
  animation: draw 0.8s infinite linear;
}

.tip-detail {
  width: 300px;
  border-radius: 4px;

  .el-popover__title {
    font-weight: bold;
    font-size: 14px;
  }

  p {
    margin: 0;
    padding: 0;
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
