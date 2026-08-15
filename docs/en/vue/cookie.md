# vue-cookie component

Official website: [GitHub - KanHarI/vue3-cookies: A simple Vue.js plugin for handling browser cookies](https://github.com/KanHarI/vue3-cookies)

## Installation and configuration

`npm install vue3-cookies`

After installation, you need to register it in the `main.js` file:

```js
import {createApp} from 'vue'
import {createPinia} from 'pinia'


import App from './App.vue'
import router from './router'
import VueCookies from "vue3-cookies";

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueCookies)

app.mount('#app')
```

## Basic operations

```js
import {useCookies} from "vue3-cookies";
const {cookies} = useCookies()

cookies.set("key", "value", 30)	//30s是有效期
cookies.get("key")
cookies.remove("key")
```

## Rewriting the login logic with cookies

store/counter.js

```js
import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import {useCookies} from "vue3-cookies";

const {cookies} = useCookies()

export const useInfoStore = defineStore('useInfoStore', () => {
	const userDict = ref(cookies.get("info"))

	const userID = computed(() => userDict.value ? userDict.value.id : null)
	const userName = computed(() => userDict.value ? userDict.value.name : null)
	const userToken = computed(() => userDict.value ? userDict.value.token : null)

	function doLogin(info) {
		// info={id:1, name:"wilson", token:"xxx"}
		// 登录成功后，用户信息写到cookie中
		cookies.set("info", JSON.stringify(info), 60 * 60 * 24 * 7)	// 7天的有效期
		userDict.value = info
	}

	function doLogout() {
		cookies.remove("info")
		userDict.value = null
	}

	return {userString, userID, userName, userToken, doLogin, doLogout}
})
```

