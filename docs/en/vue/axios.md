# axios component

## Installation and configuration

`npm install axios`

Create `plugins/axios.js`

```js
import axios from "axios";

let config = {
	baseURL: "https://api.betterwilson.com",
	timeout: 20,
}
const _axios = axios.create(config)

// Request interceptor
_axios.interceptors.request.use(function (config) {
	console.log("Before request", config)
	// 1. Read the current user's token from Pinia
	// 2. Include the token when sending the request
	if(config.params) {		// Original request has parameters; append to them
		config.params['token'] = "xxxxxxxx"
	} else {	// Original request has no parameters; create a new params object
		config.params = {token: "xxxxxxxx"}
	}
	return config;
})

export default _axios;
```

## Basic usage

```js
import _axios from "../../plugins/axios.js";

_axios.get("/demo").then((res) => {		// https://api.betterwilson.com/demo (URL concatenation)
    console.log(res.data)
  })
```

