<script>
	export default {
		onShow: function() {
			if(uni.getStorageSync("authtoken")) {
				this.$member.getMemberInfo()
				// 跳转到首页
				uni.switchTab({
					url: '/pages/home/home'
				})
			} else {
				let redirect = uni.getStorageSync("redirect")
				if(redirect) {
					this.$mpLogin
					.setTip(this.$refs.uTips)
					.go()
					.then(() => {
						// 跳转到首页
						uni.switchTab({
							url: '/pages/home/home'
						})
					})
				} else {
					// 直接redirectTo/reLaunch会导致小程序点击事件无法使用，需要增加延迟
					// reLaunch H5中会导致表单校验失效
					let timer = setTimeout(() => {
						clearTimeout(timer)
					      uni.redirectTo({
					          url: 'pages/login/login'
					      })
					  }, 0)
				}

			}
		}
	}
</script>

<style lang="scss">
@import "uview-ui/index.scss"
</style>
