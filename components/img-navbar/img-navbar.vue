<template>
	<view class="img-navbar">
		<view class="opacity-bar" :style="{opacity: opacity, height: fixedHeight + 'px', lineHeight: navbarHeight + 'px', paddingTop: statusBarHeight + 'px'}">
			{{title}}
		</view>
		<view class="custom-slot" v-if="!image">
			<slot></slot>
		</view>
		<view v-else class="image-container">
			<image class="image-bg" :style="{height: imageHeight + 'px'}" :src="image"></image>
			<image v-if="logo" class="image-logo" :src="logo" :style="{top: (statusBarHeight + menuPadding) + 'px', height: navbarHeight + 'px', width: navbarHeight + 'px'}"></image>
			<template v-if="intro">
				<view class="image-bar-bgc"></view>
				<view class="image-bar-text">
					<text>{{intro}}</text>
				</view>
			</template>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 手机状态栏高度
				statusBarHeight: 20,
				// navbar 实际宽度(小程序会有胶囊占据位置，需要减少)
				windowWidth: 325,
				// navbar实际高度
				navbarHeight: 45,
				// 胶囊padding
				menuPadding: 0
			};
		},
		computed:{
			/**
			 * 计算透明度
			 */
			opacity() {
				let tempOpacity = this.scrollTop / this.fixedHeight
				return tempOpacity >= 1 ? 1 : tempOpacity
			},
			/**
			 * 固定高度
			 */
			fixedHeight() {
				return this.navbarHeight + this.statusBarHeight
			}
		},
		created() {
			//获取系统的详细日志
			const systemInfo = uni.getSystemInfoSync()
			//设置当前设备的状态栏高度 和容器宽度
			this.statusBarHeight = systemInfo.statusBarHeight
			this.windowWidth = systemInfo.windowWidth
			//以下代码H5 app 支付宝小程序不支持
			
			//#ifndef H5 || APP-PLUS || MP-ALIPAY
			//处理小程序胶囊菜单（https://uniapp.dcloud.io/api/ui/menuButton）
			//获取胶囊的位置信息
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
			console.log(menuButtonInfo)
			this.menuPadding = menuButtonInfo.top - this.statusBarHeight
			//navbar实际高度
			this.navbarHeight = (menuButtonInfo.bottom  - this.statusBarHeight) + 2 * this.menuPadding
			//胶囊左侧宽度
			this.windowWidth = menuButtonInfo.left
			//#endif
		},
		props:{
			/**
			 * 向上滚动的距离
			 */
			scrollTop: {
				type: Number,
				default: 0
			},
			/**
			 * navbar标题
			 */
			title: {
				type: String,
				default: ''
			},
			/**
			 * 图片
			 */
			image: {
				type: String,
				rqueired: true
			},
			/**
			 * 图片
			 */
			logo: {
				type: String,
				default: ''
			},
			/**
			 * 图片
			 */
			imageHeight: {
				type: Number | String,
				default: 200
			},
			intro: {
				type: String
			}
		}
	}
</script>

<style lang="scss">
.img-navbar {
	background: #f6f7fc;
	.image-container {
		position: relative;
		.image-bg {
			width: 100%;
		}
		.image-logo {
			position: absolute;
			left: 15px;
		}
		.image-bar-bgc {
			background-color: #a9abab;
			opacity: 0.6;
			position: absolute;
			width: 100%;
			height: 45px;
			bottom: 5px;
		}
		.image-bar-text {
			color: #fff;
			position: absolute;
			bottom: 5px;
			padding: 0 10rpx;
			display: flex;
			align-items: center;
			font-weight: bold;
			line-height: 45px;
			width: 100%;
			justify-content: center;
		}
	}
	
	.opacity-bar {
		width: 100%;
		position: fixed;
		top: 0;
		background-color: #fff;
		z-index: 9999;
		text-align: center;
	}
}
</style>
