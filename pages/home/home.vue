<template>
	<view class="home" @touchend="bindtouchend">
		<img-navbar 
		title="首页"
		:scroll-top='scrollTop' 
		:image="navbarIamge"  
		:image-height="240"
		intro="欢迎使用diboot移动端"
		/>
		<view class="body">
			首页
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				currentTab: 0,
				tabs: [
					{
						name: '地图类'
					},
					{
						name: '咨询类'
					}
				],
				visitCount: 0,
				navbarIamge: require('@/static/images/navbar.png'),
				logo: require('@/static/logo.png'),
				miniContent: null,
				searchKey: '',
				scrollTop: 0,
			}
		},
		onShow() {
			uni.pageScrollTo({
			        scrollTop: 0
			})
		},
		onPageScroll(object) {
			this.scrollTop = object.scrollTop
		},
		methods: {
			/**
			 * 触碰结束
 			 */
			bindtouchend() {
				uni.pageScrollTo({
				        scrollTop: 0
				})
			}
		}
	}
</script>

<style lang="scss">
page{
	height: 100%;
}
.home {
	height: 100%;
	.body {
		height: 100%;
	}
}
</style>
