<template>
	<view class="wrap">
		<view class="top"></view>
		<view class="content">
			<view class="title">diboot移动端开发框架</view>
			<u-form :model="form" ref="uForm" :error-type="['message']">
				<u-form-item prop="username">
					<u-input type="text" v-model="form.username" placeholder="请输入账号"/>
				</u-form-item>
				<u-form-item prop="password">
					<u-input type="password" v-model="form.password" placeholder="请输入密码"/>
				</u-form-item>
			</u-form>
			<view class="login">
				<u-button @click="submit" size="medium" :custom-style="customStyle" type="success">登陆</u-button>
			</view>
			<view class="function-tip">
				<view class="forget">忘记密码</view>
			</view>
		</view>
		<view class="bottom">
			<view class="loginType">
				<view class="item">
					<view class="icon" @click="weiLogin"><u-icon size="70" name="weixin-fill" color="rgb(83,194,64)"></u-icon></view>
				</view>
				<view class="other-login">
					其他登陆方式
				</view>
			</view>
		</view>
		<u-top-tips ref="uTips"></u-top-tips>
	</view>
</template>

<script>
export default {
	data() {
		return {
			form: {
				username: '',
				password: '',
			},
			rules: {
				username: [
					{
						required: true,
						message: '请输入账号',
						// 可以单个或者同时写两个触发验证方式
						trigger: ['change','blur']
					}
				],
				password: [
					{
						required: true,
						message: '请输入密码',
						trigger: ['change','blur']
					}
				]
			},
			customStyle: {
				width: '100%'
			}
		}
	},
	// 必须要在onReady生命周期，因为onLoad生命周期组件可能尚未创建完毕
	onReady() {
		this.$refs.uForm.setRules(this.rules)
	},
	methods: {
		async submit() {
			// 校验
			const r = await this.validated()
			console.log(r)
			// 密码登陆
			this.$pwdLogin
				// .setTip(this.$refs.uTips)
				.go(this.form)
				.then(() => {
					// 跳转到首页
					uni.switchTab({
						url: '/pages/home/home'
					})
				})
		},
		/**
		 * 校验
		 */
		validated() {
			return new Promise((resolve, reject) => {
				this.$refs.uForm.validate(valid => valid ? resolve(true) : reject(false));
			})
		},
		/**
		 * 微信登陆：
		 */
		weiLogin() {
			// 小程序登陆
			// #ifdef MP-WEIXIN
			this.$miniLogin.setTip(this.$refs.uTips).setUrlPath('/pages/home/home').go()
			//#endif
			// 微信公众号登陆
			// #ifdef H5
			this.$mpLogin.redirect()
			//#endif
		}
	}
};
</script>

<style lang="scss" scoped>
.wrap {
	font-size: 28rpx;
	.content {
		width: 600rpx;
		margin: 80rpx auto 0;

		.title {
			text-align: center;
			font-size: 40rpx;
			font-weight: blod;
			margin-bottom: 200rpx;
		}
		.login {
			margin-top: 50rpx
		}
		.login-btn {
			width: 100%;
		}
		.function-tip {
			color: $u-tips-color;
			display: flex;
			margin-top: 30rpx;
		}
		/deep/.u-form-item__message {
			padding-left: unset !important;
		}
	}
	.bottom {
		.loginType {
			display: flex;
			padding: 200rpx 150rpx 150rpx 150rpx;
			flex-direction: column;
			justify-content:center;
			align-items: center;
			.item {
				display: flex;
				flex-direction: row;
				justify-content: center;
				align-items: center;
				.icon + .icon {
					margin-left: 20rpx;
				}
			}
			.other-login {
				margin-top: 20rpx;
				color: $u-tips-color;
			}

		}
	}
}
</style>
