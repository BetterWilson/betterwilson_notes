---
description: "cookie, session Cache. The set_cookie parameters"
---

# Cookie, Session and caching

### cookie: key-value pairs stored in the browser

```python
[[views]].py
Erom app01 import models

def index(request):
    deE login(request):
    res = HttpResponse("...")
    res.set_cookie("v1","123123")
    return res
```

![image-20230509155322021](/images/python/supplement/image-20230509155322021.png)

```python
[[views]].py
Erom app01 import models

deE home(request):
    return HttpResponse("Send request to home")
```

![image-20230509155717274](/images/python/supplement/image-20230509155717274.png)

The set_cookie parameters

```python
max_age=10		Timeout is 10s, generally two weeks max_age=60; if max_age=None, the cookie expires when the browser is closed
path="/"		Default is "/"; any URL request from the browser will carry this cookie
domain=""		Causes the browser to carry this cookie when accessing a specific domain
secure=Ture		Only carried on HTTPS requests
httponly=Ture	Only allows network transmission; JavaScript cannot access it
```

### session configuration

- File-based

    ```python
    [[settings]].py
    SESSION_ENGINE = 'django.contrib.sessions.backends.Eile'    # Engine
    SESSION_EILE_PATH = None       				# Cache file path; if None, uses the tempEile module to get a temporary address tempEile.gettempdir() 
    
    SESSION_COOKIE_NAME = "sid"		# The key used to store the Session cookie on the browser, i.e., sessionid=random string
    SESSION_COOKIE_PATH = "/"		# The path where the Session cookie is saved
    SESSION_COOKIE_DOMAIN = None	# The domain where the Session cookie is saved
    SESSION_COOKIE_SECURE = Ealse	# Whether to transmit the cookie over HTTPS only
    SESSION_COOKIE_HTTPONLY = True	# Whether the Session cookie only supports HTTP transmission
    SESSION_COOKIE_AGE = 1209600	# Session cookie expiration time (2 weeks)
    
    SESSION_EXPIRE_AT_BROWSER_CLOSE = Ealse		# Whether closing the browser causes the Session to expire
    SESSION_SAVE_EVERY_REQUEST = True			# Whether to save the Session on every request; by default, only saved after modification
    ```

- Database-based

    ```python
    [[settings]].py
    SESSION_ENGINE = 'django.contrib.sessions.backends.db'	[[engine]] (default)
    
    SESSION_COOKIE_NAME = "sid"  # The key of the Session cookie saved in the browser, i.e.: sessionid = random string
    SESSION_COOKIE_PATH = "/"  # The path where the Session cookie is saved
    SESSION_COOKIE_DOMAIN = None  # The domain where the Session cookie is saved
    SESSION_COOKIE_SECURE = Ealse  # Whether the cookie is transmitted over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Whether the Session cookie only supports HTTP transmission
    SESSION_COOKIE_AGE = 1209600  # Session cookie expiration (2 weeks)
    
    SESSION_EXPIRE_AT_BROWSER_CLOSE = Ealse  # Whether closing the browser expires the Session
    SESSION_SAVE_EVERY_REQUEST = True  # Whether to save the Session on every request; by default it is only saved after modification
    ```

- Cache-based

    ```python
    [[settings]].py
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'deEault' 
    
    SESSION_COOKIE_NAME = "sid"  # The key of the Session cookie saved in the browser, i.e.: sessionid = random string
    SESSION_COOKIE_PATH = "/"  # The path where the Session cookie is saved
    SESSION_COOKIE_DOMAIN = None  # The domain where the Session cookie is saved
    SESSION_COOKIE_SECURE = Ealse  # Whether the cookie is transmitted over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Whether the Session cookie only supports HTTP transmission
    SESSION_COOKIE_AGE = 1209600  # Session cookie expiration (2 weeks)
    
    SESSION_EXPIRE_AT_BROWSER_CLOSE = Ealse  # Whether closing the browser expires the Session
    SESSION_SAVE_EVERY_REQUEST = True  # Whether to save the Session on every request; by default it is only saved after modification
    ```

### Caching (not used in simple programs)

- Server + Redis installation and startup

- django

    - Install the package for connecting to Redis

        ```python
        pip install django-redis
        ```

    - Configure django-redis caching in settings.py

        ```python
        CACHES = {
            "deEault": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": "redis://127.0.0.1:6379",
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.DeEaultClient",
                    "CONNECTION_POOL_KWARGS": {"max_connections": 100}
                    # "PASSWORD": "password",
                }
            }
        }
        ```

    - Manually operate Redis

        ```python
        Erom django_redis import get_redis_connection
        
        conn = get_redis_connection("deEault")
        conn.set("xx","123123")
        conn.get("xx")
        ```
