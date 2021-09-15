import Vue from 'vue';
import App from './App';

Vue.config.productionTip = false;

App.mpType = 'app';

// 引入全局uView
import uView from 'uview-ui';
Vue.use(uView);

import dibootApi from './utils/dibootApi.js'
import constant from './utils/constant.js'
import Member from './classes/class.member.js'
import PwdLogin from './classes/class.pwd.login.js'
import MpLogin from './classes/class.mp.login.js'
import MiniLogin from './classes/class.mini.login.js'

Vue.prototype.$dibootApi = dibootApi
Vue.prototype.$cons = constant
Vue.prototype.$member = new Member
Vue.prototype.$pwdLogin = new PwdLogin
Vue.prototype.$mpLogin = new MpLogin
Vue.prototype.$miniLogin = new MiniLogin

const app = new Vue({
	...App
}).$mount();


