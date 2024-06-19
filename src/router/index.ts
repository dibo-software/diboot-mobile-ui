import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/redirect/:path(.*)*',
      name: 'Redirect',
      redirect: to => {
        const path = to.params.path
        return { path: `/${Array.isArray(path) ? path.join('/') : path}`, query: to.query, replace: true }
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' }
    },
    {
      path: '',
      component: Layout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', hideBack: true, showTabbar: true }
        },
        {
          path: 'process/initiate',
          name: 'ProcessInitiate',
          component: () => import('@/views/process/Initiate.vue'),
          meta: { title: '发起申请' }
        },
        {
          path: 'process/start/:procDefId',
          name: 'ProcessStart',
          component: () => import('@/views/process/Start.vue'),
          meta: { title: '发起流程' }
        },
        {
          path: 'process/history',
          name: 'ProcessHistory',
          component: () => import('@/views/process/History.vue'),
          meta: { title: '我发起的' }
        },
        {
          path: 'process/todo',
          name: 'ProcessTodo',
          component: () => import('@/views/process/Todo.vue'),
          meta: { title: '我的待办' }
        },
        {
          path: 'process/operate/:procInstId/:taskId',
          name: 'ProcessOperate',
          component: () => import('@/views/process/Operate.vue'),
          meta: { title: '任务办理' }
        },
        {
          path: 'process/done',
          name: 'ProcessDone',
          component: () => import('@/views/process/Done.vue'),
          meta: { title: '我的已办' }
        },
        {
          path: 'process/detail/:procInstId/:taskId?',
          name: 'ProcessDetail',
          component: () => import('@/views/process/Detail.vue'),
          meta: { title: '流程明细' }
        }
        // 首页相关页面
      ]
    },
    {
      path: '/business',
      component: Layout,
      children: [
        {
          path: '',
          name: 'Business',
          component: () => import('@/views/business/index.vue'),
          meta: { title: '业务组件', showTabbar: true }
        },
        {
          path: '/list',
          name: 'ListExample',
          component: () => import('@/views/business/example/listExample.vue'),
          meta: { title: '列表示例' }
        },
        {
          path: '/form',
          name: 'FormExample',
          component: () => import('@/views/business/example/formExample.vue'),
          meta: { title: '表单示例' }
        },
        {
          path: '/detail',
          name: 'DetailExample',
          component: () => import('@/views/business/example/detailExample.vue'),
          meta: { title: '详情示例' }
        }
      ]
    },
    {
      path: '/mine',
      component: Layout,
      children: [
        {
          path: '',
          name: 'Mine',
          component: () => import('@/views/mine/index.vue'),
          meta: { title: '我的', showTabbar: true }
        }
        // 我的 相关页面 (相对路由)
      ]
    }
  ]
})

export default router
