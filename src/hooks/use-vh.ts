/**
 * 处理viewHeight
 *
 * fix 修复IOS环境中小程序的webview高度问题， 高度由外部传入
 */
const VH = 'di_vh'
export default () => {
    const vh = ref<string>('100vh')
    // 计算viewHeight
    const computeVh = () => vh.value = localStorage.getItem(VH) || '100vh'

    // 存储路由中的viewHeight
    const storeRouteVh= () => {
        const route = useRoute()
        console.log(route.query)
        if (route.query.vh)localStorage.setItem(VH, route.query.vh as string)
        else localStorage.removeItem(VH)
    }
    return {
        vh,
        computeVh,
        storeRouteVh
    }

}