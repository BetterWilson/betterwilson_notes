# Django Connects to Redis

**The relationship between django-redis, the redis software, and the redis-py module**

To operate the redis software directly from Python, you need to use the redis-py module; django-redis is a wrapper built on top of the redis-py module to make it convenient to use in Django projects.

Install

```python
pip install django-redis
# pip install django-redis==5.3.0
```

## Configuration for Use as a Session Backend

In Django's `settings.py`, you can configure django-redis so that it better supports Django's session component.

```python
# session配置
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
# 设置session保存的位置对应的缓存配置项
SESSION_CACHE_ALIAS = 'session'
# 过期时间
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7
```

## Configuration for Use as a Cache Backend

```python
# cache缓存
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# 密码，如果没有设置密码，这个参数可以注视掉
        }
    }
}
```

You can configure multiple different connection objects for finer-grained functional partitioning.

```python
# cache缓存
CACHES = {
    # 默认缓存
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        # 项目上线时,需要调整这里的路径
        # "LOCATION": "redis://:密码@IP地址:端口/库编号",
        "LOCATION": "redis://127.0.0.1:6379/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# 密码，如果没有设置密码，这个参数可以注视掉
        }
    },
    # 提供给admin运营站点的session存储
    "session": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://:@127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# 密码，如果没有设置密码，这个参数可以注视掉
        }
    },
    # 提供存储短信验证码
    "sms_code":{
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://:@127.0.0.1:6379/2",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# 密码，如果没有设置密码，这个参数可以注视掉
        }
    }
}

```

## Django's Global Cache Object cache (Not Recommended)

After using redis as the cache in Django, you can use Django's global cache object `cache` in the project.

```python
# 这么导入Django提供的全局缓存对象cache，它默认读取的是settings文件中CACHES中的 'default' ，如果没没有配置default，这个cache默认是用不了的
from django.core.cache import cache

# 之所以说它能干的事情有限，是因为它真的不好用，我随手举两个例子，其它的姿势我没尝试，所以就看看就完了
# 设置键值对，同时也可以指定超时时间
cache.set("k1", "v1", timeout=25)
print(cache.get("k1"))
print(cache.ttl("k1"))
"""
ttl返回值
    0    表示 key 不存在
    300  表示 key 存在但没有设置过期或者已经过期了
    或者返回一个具体的超时时间
"""
# 如果一个key最开始没有设置超时时间，那么，我们可以手动通过expire给它设置一个超时时间
cache.set("k2", "v2")
cache.expire("k2", timeout=25)
print(111, cache.ttl("k2"))


# 看着也能用，但是你用它搞点其它的，比如操作列表和集合......就报错了
cache.sadd('s1', 'a', 'b', 'c', 1, 2, 3, 1)  # AttributeError: 'RedisCache' object has no attribute 'sadd'. Did you mean: 'add'?
print(cache.smembers('s1'))
cache.lpush('l1', 1, 2, 3)   # AttributeError: 'RedisCache' object has no attribute 'lpush'
print(cache.lrange('l1', 0, -1))
```

## Using the Native Redis Object (Commonly Used)

### Basic Usage

```python
import os
import sys
import django

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '6666.settings')	# 项目setting路径
django.setup()  # 伪造让django启动

# 导包
from django_redis import get_redis_connection

# 先通过别名拿到Redis连接对象，get_redis_connection(alias)
# alias：可以是Django的settings中CACHES中配置的多个别名
# conn = get_redis_connection()  # 不传值，默认使用的是default
conn = get_redis_connection('sms_code')  # 或者显示的使用某个别名

# 最基本的用法，获取连接对象，并设置值，同时指定过期时间，单位: 秒
conn.set('18888888888, '8842', ex=10)
# 在需要的地方在通过连接对象获取值
print(conn.get("18888888888"))
```

### Using Pipelines

```python
import os
import sys
import django

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'day06.settings')
django.setup()  # 伪造让django启动

from django_redis import get_redis_connection

# 获取连接对象
conn = get_redis_connection('sms_code')
# 使用管道
pipe = conn.pipeline()
pipe.set('k1', 'v1')
pipe.set('k2', 'v2')
pipe.set('k3', 'v3')
res = pipe.execute()
print(res)
```

### TTL-Related Operations

```python
import os
import sys
import django

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'day06.settings')
django.setup()  # 伪造让django启动


from django_redis import get_redis_connection
conn = get_redis_connection('default')

# 设置键值对的时候，同时指定过期时间
conn.set('k2', 'v2', ex=25)
print(conn.get("k2"))
print(conn.ttl("k2"))
"""
conn.ttl("k111")的返回值
    如果返回 具体的数字 表示该key的剩余过期时间
    如果返回 -2       表示key不存在
    如果返回 -1       表示key存在，但没有设置过期时间
"""
# 如果一个key最开始没有设置超时时间，那么，我们可以手动通过expire给它设置一个超时时间
conn.set('k3', 'v3')
conn.expire('k3', 20)  # 设置过期时间
print(conn.ttl("k3"))
conn.persist('k3')    # 取消过期时间
print(conn.ttl("k3"))
```

### Other Usage

```python
import os
import sys
import django

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'day06.settings')
django.setup()  # 伪造让django启动


from django_redis import get_redis_connection
conn = get_redis_connection('default')

# 其它数据类型操作就按照redis-py模块中讲的那样操作就好了
# ------------------ hash ------------------
# data = {"id": 1, "user": "zhangkai", 'age': 18}
#
# # conn.hmset('user1', mapping=data)  # 这种写法，有问题
# conn.hset(name='user2', key="name", value='zhangkai')  # 这种写法没问题
# # conn.hset(name='user3', mapping=data)  # 这种写法，有问题
# print(conn.hget('user2', 'name'))

# ------------------ list ------------------
# l1 = ['a', 'b', 'c', 'd']
# # conn.lpush('l1', 'a', 'b', 'c')
# # 批量插入列表
# conn.lpush('l1', *l1)
# print(conn.lrange('l1', 0, 2))

# ------------------ set ------------------
# # 声明集合s1，并添加多个元素，也可以是一个元素，也可以批量添加多个元素
# conn.sadd('s1', 'a')
# # 对于整型同样转为str, 且元素不能重复，且是无序的
# conn.sadd('s1', 'a', 'b', 'c', 1, 2, 3, 1)
# # 返回 s1 中所有元素
# print(conn.smembers('s1'))

# ------------------ zset ------------------
# # 增
# score = {
#     "zhangkai": 108,
#     "likai": 99,
#     "wangkai": 100,
#     "zhaokai": 102,
# }
# conn.zadd('score', mapping=score)
# # 查, withscores是可选参数,表示同时返回所有成员和分数
# print(conn.zrange('score', 0, -1))
# print(conn.zrange('score', 0, -1, withscores=True))
```
