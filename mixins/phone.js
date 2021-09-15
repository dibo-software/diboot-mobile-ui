export default {
	data() {
		return {
			phone: '',
			userInfo: JSON.parse(uni.getStorageSync('userInfo') || '{}')
		}
	},
	methods: {
		/**
		 * 存储手机号
		 * 
		 * @param {Object} data
		 * sessionKey, openid, signature, rawData, encryptedData, iv
		 */
		async getPhonenumber(data) {
			const entity = {
				encryptedData: data.detail.encryptedData,
				iv: data.detail.iv,
				sessionKey: uni.getStorageSync("sessionKey"),
				openid: this.userInfo.openid,
			}
			const res = await this.$dibootApi.post('/wx/phone', entity)
			if(res.code === 0 ) {
				uni.setStorageSync("userInfo", JSON.stringify(res.data))
				this.afterGetPhonenumber(res.data.phone)
			} else {
				this.$refs.uToast.show({
					title: '获取手机号失败，请重试',
					type: 'error'
				})
			}
		},
		/**
		 * 获取手机数据
		 * @param {Object} phone
		 */
		afterGetPhonenumber(phone) {
			
		}
	}
}