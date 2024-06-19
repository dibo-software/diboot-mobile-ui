<!--
构建webview url，传入可视高度
-->
<template>
  <web-view :src="src"></web-view>
</template>

<script lang="ts" setup>
	const systemInfo = wx.getSystemInfoSync()
	const src = ref('')
	onLoad(() => {
		// 判断是否是安卓操作系统 （标题栏苹果为44px,安卓为48px）
		let titleHeight = 44
		if(systemInfo.system && systemInfo.system.indexOf('Android') > 0) titleHeight = 48
		const realHeight = systemInfo.safeArea.bottom > 0 ?  systemInfo.safeArea.bottom : systemInfo.windowHeight
		const height = realHeight - titleHeight - systemInfo.statusBarHeight
		src.value = `http://192.168.110.232:5120/login?vh=${height}px`
	})
	
</script>
<style lang="scss"></style>
