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
# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
# Set the cache config entry corresponding to where sessions are stored
SESSION_CACHE_ALIAS = 'session'
# Expiration time
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7
```

## Configuration for Use as a Cache Backend

```python
# Cache configuration
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# Password; if no password is set, this parameter can be commented out
        }
    }
}
```

You can configure multiple different connection objects for finer-grained functional partitioning.

```python
# Cache configuration
CACHES = {
    # Default cache
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        # When deploying to production, adjust the path here
        # "LOCATION": "redis://:password@host:port/db_index",
        "LOCATION": "redis://127.0.0.1:6379/0",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# Password; if no password is set, this parameter can be commented out
        }
    },
    # Session storage for the admin site
    "session": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://:@127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# Password; if no password is set, this parameter can be commented out
        }
    },
    # Storage for SMS verification codes
    "sms_code":{
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://:@127.0.0.1:6379/2",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {"max_connections": 100},
            "PASSWORD": "",		# Password; if no password is set, this parameter can be commented out
        }
    }
}

```

## Django's Global Cache Object cache (Not Recommended)

After using redis as the cache in Django, you can use Django's global cache object `cache` in the project.

```python
# Import Django's global cache object. It reads from the 'default' entry in CACHES in settings.
# If 'default' is not configured, this cache object won't work out of the box.
from django.core.cache import cache

# The reason its capabilities are limited is that it's really not very usable.
# Here are two quick examples; I haven't tried other approaches, so take this with a grain of salt.
# Set a key-value pair, optionally with a timeout
cache.set("k1", "v1", timeout=25)
print(cache.get("k1"))
print(cache.ttl("k1"))
"""
ttl return values
    0    means the key does not exist
    300  means the key exists but has no expiry set, or has already expired
    or a specific remaining timeout value
"""
# If a key was set without a timeout initially, we can manually set one via expire
cache.set("k2", "v2")
cache.expire("k2", timeout=25)
print(111, cache.ttl("k2"))


# It looks usable, but try doing anything else with it, like operating on lists or sets... and it errors out
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

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '6666.settings')	# Project settings path
django.setup()  # Initialize Django

# Import
from django_redis import get_redis_connection

# Get a Redis connection object via alias using get_redis_connection(alias)
# alias: one of the cache aliases configured in CACHES in Django's settings
# conn = get_redis_connection()  # No argument; uses 'default' by default
conn = get_redis_connection('sms_code')  # Or explicitly use a specific alias

# Most basic usage: get a connection object, set a value, and specify an expiration time (in seconds)
conn.set('18888888888, '8842', ex=10)
# Retrieve the value wherever needed via the connection object
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
django.setup()  # Fake it to make Django boot up

from django_redis import get_redis_connection

# Get the connection object
conn = get_redis_connection('sms_code')
# Use a pipeline
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
django.setup()  # Fake it to make Django boot up


from django_redis import get_redis_connection
conn = get_redis_connection('default')

# Specify expiration time when setting a key-value pair
conn.set('k2', 'v2', ex=25)
print(conn.get("k2"))
print(conn.ttl("k2"))
"""
Return value of conn.ttl("k111")
    If it returns a specific number, it indicates the remaining TTL of the key
    If it returns -2       it indicates the key does not exist
    If it returns -1       it indicates the key exists but has no expiration time set
"""
# If a key did not have a timeout set initially, we can manually set one via expire
conn.set('k3', 'v3')
conn.expire('k3', 20)  # Set expiration time
print(conn.ttl("k3"))
conn.persist('k3')    # Remove expiration time
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
django.setup()  # Fake it to make Django boot up


from django_redis import get_redis_connection
conn = get_redis_connection('default')

# Other data type operations follow the same usage as described in the redis-py module
# ------------------ hash ------------------
# data = {"id": 1, "user": "zhangkai", 'age': 18}
#
# # conn.hmset('user1', mapping=data)  # This syntax has issues
# conn.hset(name='user2', key="name", value='zhangkai')  # This syntax is fine
# # conn.hset(name='user3', mapping=data)  # This syntax has issues
# print(conn.hget('user2', 'name'))

# ------------------ list ------------------
# l1 = ['a', 'b', 'c', 'd']
# # conn.lpush('l1', 'a', 'b', 'c')
# # Batch insert into a list
# conn.lpush('l1', *l1)
# print(conn.lrange('l1', 0, 2))

# ------------------ set ------------------
# # Declare set s1 and add multiple elements; can also be a single element, or batch add
# conn.sadd('s1', 'a')
# # Integers are also converted to str; elements must be unique and are unordered
# conn.sadd('s1', 'a', 'b', 'c', 1, 2, 3, 1)
# # Return all elements in s1
# print(conn.smembers('s1'))

# ------------------ zset ------------------
# # Add
# score = {
#     "zhangkai": 108,
#     "likai": 99,
#     "wangkai": 100,
#     "zhaokai": 102,
# }
# conn.zadd('score', mapping=score)
# # Query; withscores is an optional parameter that also returns all members and their scores
# print(conn.zrange('score', 0, -1))
# print(conn.zrange('score', 0, -1, withscores=True))
```
