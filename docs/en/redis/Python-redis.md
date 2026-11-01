---
description: "Connecting Redis with Python. Normally, when we operate redis, we go through the process of creating and establishing a connection object, executing the redis operation,"
---

# Python Connects to Redis

Install redis

```python
pip install redis
```

Quick start:

```python
import redis

# Create a connection object; all subsequent operations are performed through it, method 1
conn1 = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# Create a connection object; all subsequent operations are performed through it, method 2
conn2 = redis.Redis.from_url("redis://:1234@127.0.0.1:6379/0")
conn1.set('k1', 'v1')
print(conn1.get('k1'))

conn2.set('k2', 'v2')
print(conn2.get('k2'))
```

## Connection Pool

Normally, when we operate redis, we go through the process of creating and establishing a connection object, executing the redis operation, and then releasing the connection after the operation is complete.

In general, this is fine, but when the concurrency is relatively high, frequent connection creation and release can have a significant impact on performance.

So, in high-concurrency scenarios, we use a connection pool.

The principle is to pre-create multiple connections. When performing a redis operation, you directly grab an already-created connection to operate on, and after the operation completes, the connection is not released; it is kept for subsequent redis operations. This avoids the frequent creation and release of redis connections and improves performance.

```python
import redis

pool = redis.ConnectionPool(
    host="127.0.0.1",
    port=6379,
    password="1234",
    db=0,
    max_connections=100,
    decode_responses=True  # If using this parameter, it must be declared in the connection pool
)
conn = redis.Redis(connection_pool=pool)
conn.set('k1', 'v1')
print(conn.get('k1'))
conn.close()
```

Briefly, about the principle of the connection pool: in the `ConnectionPool` class, the main things maintained are:

- `_available_connections` — the list of available connections.
- `_in_use_connections` — the set of connections currently in use.

When performing an operation, getting a connection calls the `get_connection` method, in which the process of obtaining a connection is:

- Try to get a connection from the available-connections list; if none is available, generate a connection object and add it to the available-connections list.
- Add the obtained (or newly generated) connection object to the in-use-connections set.

So how is the connection object handled after the operation completes? In the `release` method, the connection is taken out of the `_in_use_connections` in-use set and put back into the available-connections list, so that subsequent connections can reuse it.

## Common Operations

```python
import time
import redis

# Create a connection object; all subsequent operations are performed through it, method 1
conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)



# ------------------ General operations ------------------
print(conn.keys("*"))  # Get all keys in the current database; avoid using this in production whenever possible

# Return the value type of k1
print(conn.type('k1'))  # string

# Check if the key exists
print(conn.exists('k1'))  # 1
print(conn.exists('k8888'))  # 0

# Rename
conn.rename('k1', 'k11')
print(conn.get('k11'))

# Delete a key; returns 0 if the key doesn't exist, returns 1 if the key exists and is deleted successfully
print(conn.delete('k2'))

# Set expiration time
conn.set('k1', 'v1')  # Initially there is no expiration time
time.sleep(5)
conn.expire('k1', 10)  # Set the expiration time for it
conn.persist('k3')    # Remove the expiration time

# Return the remaining TTL of the key
conn.set('k1', 'v1')
print(conn.ttl('k1'))  # -1 means no expiration time has been set
conn.set('k1', 'v1', ex=10)
print(conn.ttl('k1'))  # 10
time.sleep(2)
print(conn.ttl('k1'))  # 8

# Return the number of keys in the database; safe for production use
print(conn.dbsize())

# Flush all keys from the database; never use this in production
print(conn.flushall())  # True
print(conn.dbsize())    # 0
```

## String

#### Basic Operations

```python
import redis

# Create a connection object; all subsequent operations are performed through it, method 1
conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)



# ------------------ String operations ------------------

# Set a value
conn.set('k1', 'v1')  # No expiration time limit
conn.set('k1', 'v1', ex=10)  # ex: expiration time in seconds

# Set a value with expiration time
conn.setex('k2', 10, 'v1')  # expiration time: seconds

# get first, return None if not exists, return previous value if exists, then set a new value
print(conn.getset('k1', 'v11'))
print(conn.get('k1'))

# If key does not exist, set a key:value; if key exists, do nothing
conn.setnx('k3', 'v3')
print(conn.get('k3'))

# Batch set and get values
d = {'k1': "v1", "k2": "v2"}
conn.mset(mapping=d)
conn.set('k3', 'v3')
print(conn.mget('k1', 'k2'))  # Batch get
print(conn.mget(d.keys()))  # Batch get
print(conn.keys("*"))  # Get all keys in the current database

# If key exists, return value length, otherwise return 0
print(conn.strlen('k3'))

# Read
conn.set('k1', 'v1')  # No expiration time limit
conn.set('k2', 'v2')  # No expiration time limit
print(conn.get('k1'))  # v1
print(conn.keys('*'))
# Delete
conn.set('k1', 'v1')  # No expiration time limit
print(conn.get('k1'))  # v1
conn.delete('k1')
print(conn.get('k1'))  # None

# Update, essentially just reassign
conn.set('k1', 'v1')
print(conn.get('k1'))  # v1
conn.set('k1', 'v111')
print(conn.get('k1'))  # v111
```

#### Counter Functionality

```python
import redis

# Create a connection object; all subsequent operations are performed through it, method 1
conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ String counter functionality ------------------
# Each incr call increments num by one
conn.set('num', 1)
print(conn.get('num'))
for i in range(5):
    print(conn.incr('num'))

# Increment by a specified number at once
conn.set('num', 1)
print(conn.incrby('num', 1000))  # 1001
print(conn.get('num'))  # 1001

# decr decrements num by one
conn.set('num', 10)
for i in range(5):
    print(conn.decr('num'))
print(conn.get('num'))  # 5

# Decrement by a specified number at once
conn.set('num', 10)
print(conn.decrby('num', 8))  # 2
print(conn.get('num'))  # 2
```

## Hash

Similar to a Python dictionary, but members can only be strings; it is specifically used for structured data.

```python
import redis

conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ hash ------------------
data = {"id": 1, "user": "zhangsan", 'age': 18}

conn.hmset('user1', mapping=data)
conn.hset(name='user2', key="name", value='zhangsan')  # This way of writing is fine
conn.hset(name='user3', mapping=data)  # This way of writing has issues
print(conn.hget('user3', 'name'))
"""
About conn.hset(name='user3', mapping=data):
    hmset:
        Compatible with low Redis versions (redis3.2.100) and high versions (redis5.0.7+)    
        Not recommended for high versions, works but produces warnings
        High version Redis recommends using hset instead of hmset
        If low version Redis shows warnings with hmset, please ignore
    hset
        Low version Redis (redis3.2.100) throws error: redis.exceptions.ResponseError: wrong number of arguments for 'hset' command
        But high version Redis does not throw error
    Final: if using low Redis version like Redis3, use hmset; if using high version like Redis5, use hset
"""

# Get the value of a specified field
print(conn.hget('user1', 'id'))
# Get values of multiple fields
print(conn.hmget('user1', "id", "user"))
# Return all fields and values
print(conn.hgetall('user1'))

# Return all fields in the key
print(conn.hkeys('user1'))
# Return all field values in the key
print(conn.hvals('user1'))
# Check if specified field exists, return 1 if exists, otherwise 0
print(conn.hexists('user1', 'id'))
# Return the number of fields in the key
print(conn.hlen('user1'))
# Add a fixed number to an integer field
print(conn.hincrby('user1', "age", 10))
# Reassign a value to a specified field
print(conn.hset('user1', "age", 12))
print(conn.hget('user1', 'age'))

# When key does not exist, create it and set specified field and value
print(conn.hgetall('user5'))
print(conn.hsetnx('user5', 'addr2', "beijing2"))
print(conn.hgetall('user5'))

# When key exists, if the field and value to be set already exist, it has no effect
print(conn.hgetall('user1'))
print(conn.hsetnx('user1', 'addr', "beijing"))
print(conn.hgetall('user1'))
# When key exists, if the field value to be set does not exist, set it
print(conn.hsetnx('user4', 'age', 30))
print(conn.hgetall('user1'))
print(conn.hsetnx('user1', 'addr2', "beijing2"))
print(conn.hgetall('user1'))

```

#### **Setting an Expiration Time for a Hash Key**

Note that this sets the expiration time for the hash key as a whole — you cannot set an expiration time for an individual field:

```python
import time
import redis

conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ hash ------------------
data = {"id": 1, "user": "zhangsan", 'age': 18}
conn.hmset('user1', mapping=data)
print(conn.hgetall('user1'))
conn.expire('user1', 8)  # expiration time: seconds
time.sleep(10)
print(conn.hgetall('user1'))
```

## List

```python
import redis

conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ list ------------------
l1 = ['a', 'b', 'c', 'd']
# conn.lpush('l1', 'a', 'b', 'c')
# Batch insert into list
conn.lpush('l1', *l1)
# If key exists then insert, otherwise do nothing
conn.lpushx('l1', 'd')
conn.lpushx('l2', 'w')

# Find element a from the left side of the list, i.e. do not search further, then insert an element before/after a
conn.linsert('l1', 'before', 'c', 'x')
conn.linsert('l1', 'after', 'c', 'z')

# Append element 1 to the tail of the list. Note: integer elements will also be converted to str
print(conn.lrange('l1', 0, -1))
# conn.rpush('l1', 1)
# First append 2 then append 3 to the tail
conn.rpush('l1', 2, 3)
print(conn.lrange('l1', 0, -1))
# If list l1 exists, append element 4 to the tail; if not, do nothing
conn.rpushx('l1', 4)

# Return element by index
print(conn.lindex('l1', 1))
# From index 0 to -1, i.e. from head to tail, get all elements in the list
print(conn.lrange('l1', 0, -1))
# Get elements at indexes 0 1 2
print(conn.lrange('l1', 0, 2))
# Get element at index 2
print(conn.lrange('l1', 2, 2))
# If index is out of range, return empty
print(conn.lrange('l1', 8, 9))
# Return list length
print(conn.llen('l1'))

# Pop head/tail element from list
print(conn.lpop('l1'))
print(conn.rpop('l1'))

# Pop tail element from l1 and add to l2; l2 is auto-created if it does not exist
conn.rpoplpush('l1', 'l2')

# From left to right, delete specified count of element a1. In this example, if there is 1 a1, delete one; if there are 3 or more, still delete 2
l3 = ['a1', 'a2', 'a1', 'a3', 'a1', 'a4', 'a5']
conn.lpush('l3', *l3)
print(conn.lrem('l3', 2, 'a1'))
print(conn.lrange('l3', 0, -1))
# Keep elements at indexes 2-4, delete the rest
conn.ltrim('l3', 2, 4)
print(conn.lrange('l3', 0, -1))


# Modify element at index 0 to specified value; error if index does not exist
l1 = ['a', 'b', 'c', 'd']
conn.lpush('l1', *l1)
print(conn.lrange('l1', 0, -1))
conn.lset('l1', 0, 'w')
print(conn.lrange('l1', 0, -1))


# Delete list
conn.delete('l1')
```

## Set

```python
import redis

conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ set ------------------
# Add
# Declare set s1 and add multiple elements; can be one element or batch add
conn.sadd('s1', 'a')
# Integers are also converted to str, elements must be unique, and order is not guaranteed
conn.sadd('s1', 'a', 'b', 'c', 1, 2, 3, 1)

# Read
conn.sadd('s1', *{'a', 'b', 'c', 1, 2, 3, 1})
# Return all elements in s1
print(conn.smembers('s1'))
# Return the count of elements in s1
print(conn.scard('s1'))
# Randomly return an element from the set
print(conn.srandmember('s1'))
# Check if element a exists
print(conn.sismember('s1', 'a'))

# Delete
conn.sadd('s1', *{'a', 'b', 'c', 1, 2, 3, 1})
# Randomly delete an element and return it
print(conn.spop('s1'))
# Delete entire set
print(conn.delete('s1'))


# Move
# Move element a from s1 to s2; if s2 does not exist, create it first then move
conn.sadd('s1', *{'a', 'b', 'c', 1, 2, 3, 1})
print(conn.smove('s1', 's2', 'w'))  # If s1 does not have this element, do nothing and return False
print(conn.smove('s1', 's2', 'a'))
print(conn.smembers('s1'))
print(conn.smembers('s2'))
```

## Sorted Set (zset)

```python
import redis

conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8', decode_responses=True, db=0)

# ------------------ zset ------------------
# Add
score = {
    "zhangsan": 108,
    "likai": 99,
    "wangkai": 100,
    "zhaokai": 102,
}
conn.zadd('score', mapping=score)

# Read, withscores is optional, indicates returning all members and scores
print(conn.zrange('score', 0, -1))
print(conn.zrange('score', 0, -1, withscores=True))
# Return members and scores in ascending/descending order
print(conn.zrange('score', 0, -1, withscores=True))
print(conn.zrevrange('score', 0, -1, withscores=True))

# Return index of member in sorted set; return None if member does not exist
print(conn.zrank('score', 'zhangsan'))
print(conn.zrank('score', 'w'))  # None

# Return total number of members
print(conn.zcard('score'))

# Return all members and scores in ascending order
print(conn.zrangebyscore('score', '-inf', '+inf', withscores=True))
# # Plus/minus cannot be swapped
print(conn.zrangebyscore('score', '+inf', '-inf', withscores=True))

# Return members/scores in ascending order where 100 <= score <= 200
print(conn.zrangebyscore('score', 100, 200))
print(conn.zrangebyscore('score', 100, 200, withscores=True))

# Return count of members in score where 100 <= score <= 200
print(conn.zcount('score', 100, 200))

# Return all members/scores sorted by index from large to small
print(conn.zrevrange('score', 0, -1, withscores=True))

# Return members in descending sorted set score within index range 0 <= index <= 2
print(conn.zrevrange('score', 0, 2))


# Return members in score within score range 120 >= score >= 100, sorted descending
# Note: min and max positions in source code differ from other methods; others are min,max, this one is max,min
# So, as written below, put the larger value first
print(conn.zrevrangebyscore('score', 120, 100, withscores=True))
# Or write it this way, explicitly passing values also works
print(conn.zrevrangebyscore('score', min=100, max=120, withscores=True))

# Update
# Reassign value to specified member
print(conn.zrevrange('score', 0, -1, withscores=True))
print(conn.zadd('score',  mapping={"zhangsan": 110}))  # Modify its score; can modify multiple at once
print(conn.zadd('score',  mapping={"zhangsan": 120, 'sunkai': 12}))  # Modify its score; can modify multiple at once,or add new members
print(conn.zrevrange('score', 0, -1, withscores=True))



# Add specified score to a member and return the new score
print(conn.zscore('score', 'zhangsan'))
print(conn.zincrby('score',  5, 'zhangsan'))
print(conn.zscore('score', 'zhangsan'))

# Delete
# Delete members with scores in specified range (inclusive) and return count of deleted members
print(conn.zrange('score', 0, -1, withscores=True))
print(conn.zremrangebyscore('score', 90, 100))
print(conn.zrange('score', 0, -1, withscores=True))


# Delete members in score within specified index range 0 <= index <= 2 and return count
print(conn.zrange('score', 0, -1, withscores=True))
print(conn.zremrangebyrank('score', 0, 2))
print(conn.zrange('score', 0, -1, withscores=True))

# Delete one or more members in score, return actual count deleted
print(conn.zrange('score', 0, -1, withscores=True))
print(conn.zrem('score', *{"zhangsan", 'likai'}))
print(conn.zrange('score', 0, -1, withscores=True))

# Delete key
conn.delete('score')
```

## Queue Operations

Message queues

A message queue is a messaging pattern that delivers messages from a sender to one or more receivers without requiring them to be explicitly connected to each other. The benefit is that it decouples the sender from the receivers.

Redis implements message queues with the `list` type, which supports adding and removing queue elements, and the queue structure is first-in, first-out (FIFO).

**Drawback: multiple consumers cannot consume the same message.**

#### Example 1

```python
import redis

# Create a connection object; all subsequent operations are performed through it
conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', encoding='utf-8')

conn.lpush('my_queue', 'root')
conn.lpush('my_queue', 'admin')

# Get value
q1 = conn.brpop('my_queue', timeout=5)
print(q1)  # (b'my_queue', b'root')
print(q1[-1])  # b'root'
print(q1[-1].decode('utf8'))  # root

q2 = conn.brpop('my_queue', timeout=5)
print(q2)  # (b'my_queue', b'admin')

# Since queue has no elements, it will wait 5 seconds, then stop waiting and return None
q3 = conn.brpop('my_queue', timeout=5)
print(q3)  # None
```

#### Example 2

**It is better to use `rpop`**

```python
import time
import random
import redis
from concurrent.futures import ThreadPoolExecutor

pool = redis.ConnectionPool(
    host="127.0.0.1",
    port=6379,
    password="1234",
    db=0,
    max_connections=2,
    decode_responses=True  # This parameter must be declared in the connection pool
)
conn = redis.Redis(connection_pool=pool)


def producer():
    """ Producer """
    count = 0
    while True:
        conn.lpush('my_queue', count)
        time.sleep(random.randrange(1, 10))
        count += 1


def customer1():
    while True:
        res = conn.rpop('my_queue')
        if res:
            print('\nConsumer rpop, consumed: ', res)
        print('\rConsumer rpop got nothing, default returns {} {}'.format(res, '.' * random.randrange(1, 6)), end='')
        """
        From the print output above, we can see that conn.rpop continuously tries to get values
        If no value is retrieved, it immediately tries again after returning None; avoid in production as it wastes performance
        """


def customer2():
    while True:
        res = conn.brpop('my_queue', timeout=5)
        print('Consumer brpop, consumed: ', res)
        """
        brpop can set blocking time, e.g. 5 seconds in this example
        Execution logic is as follows:
            Get value; if retrieved, consume it (assign to res), then we can process it
            If no value retrieved, block for 5 seconds; if value retrieved within 5s, consume it and start next blocking get
            If no value retrieved within 5s blocking, return None and start next blocking get
        More commonly used in actual development
        """


if __name__ == '__main__':
    with ThreadPoolExecutor(2) as t:
        # for i in [producer, customer1]:
        for i in [producer, customer2]:
            t.submit(i)
```

## Publish/Subscribe

```python
import time
import datetime
import random
import redis
from concurrent.futures import ThreadPoolExecutor


class Product(object):
    def __init__(self):
        # In this example, multiple subscribers should use multiple independent connection objects, so a shared pool cannot be used; one subscriber per script file is fine
        # self.conn = redis.Redis(connection_pool=pool)
        self.conn = redis.Redis(host='127.0.0.1', port=6379, password='1234', decode_responses=True)
        """
        # Publish message to specified channel
        self.conn.publish(channel, message)

        # Use the following three lines together
        self.pub = self.conn.pubsub()  # Turn on the radio
        self.pub.subscribe(channel)   # Specify one or more channels as a list
            channel: specify one or more channels as a list ['fm97.5', 'fm80.5', 'fm77.5']
                     If the channel has messages, they will all be received
        res = self.pub.listen()  # Prepare to receive messages
        for msg in res:  # Get the latest message from these monitored channels
            print(res)

        # Unsubscribe from specified channel
        self.pub.unsubscribe(channel)
            channel: unsubscribe from one or more channels ['fm97.5', 'fm80.5', 'fm77.5']
        """

    def add_channel_msg(self):
        """ Simulate publishing messages: add messages to different channels """
        # Channel list
        self.pub_list = ['fm97.5', 'fm80.5', 'fm77.5']
        while True:
            channel = random.choice(self.pub_list)  # Randomly select a channel
            msg = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Process message
            print(f"{channel}, published message {msg}")
            self.conn.publish(channel, msg)  # Publish message to specified channel
            time.sleep(random.randrange(1, 3))

    def subscribe(self, channel):
        """
        Different consumers subscribe to messages on the channel by passing different channel numbers
        channel: ['fm97.5', 'fm77.5']
        """
        # 1. Turn on the radio
        self.pub = self.conn.pubsub()
        # 2. Tune frequency
        self.pub.subscribe(channel)
        # 3. Listen to subscribed channels (can be multiple)
        return self.pub.listen()  # Prepare to receive messages, can then loop to receive messages published to this channel


    def get(self, user, channel):
        # Continuously receive messages from specified (multiple) channels
        for msg in self.subscribe(channel):  # channel = ['fm97.5', 'fm77.5']
            print(f"User {user} received message from {msg['channel']}: {msg}")
            time.sleep(1)


if __name__ == '__main__':

    with ThreadPoolExecutor(4) as t:
        # The entire connection object is dedicated to publishing messages
        t.submit(Product().add_channel_msg)
        user_dict = {
            "zhangsan": {'get': Product().get, 'channel': ['fm97.5', 'fm77.5']},
            "lisi": {'get': Product().get, 'channel': ['fm80.5']},
            "wangwu": {'get': Product().get, 'channel': ['fm97.5']},
        }
        # Simulate three subscribers subscribing to specified channel messages
        for k, v in user_dict.items():
            t.submit(v['get'], k, v['channel'])
```

#### Pros and Cons of Redis Publish/Subscribe

Advantages:

Redis's publish/subscribe supports multiple producers/consumers producing and consuming messages at the same time. The great advantage is that it is very simple, because its implementation principle is nothing more than establishing a "data forwarding channel" for producers and consumers, forwarding data that matches the rules from one end to the other.

Disadvantages:

The publish/subscribe pattern is a "fire-and-forget" working mode: if a subscriber goes offline, it cannot consume historical messages after reconnecting.
Messages cannot be persisted; if the Redis server crashes or restarts, all messages will be lost.
Backlogged messages cannot be too many, otherwise data will be lost (this can be configured via the `client-output-buffer-limit` parameter).
Summary: for very simple publish/subscribe scenarios, Redis's publish/subscribe can be considered, but for complex scenarios, it is better to use professional message-queue software.

## Pipeline

By default, each redis operation creates (requests a connection from the pool) and disconnects (returns the connection to the pool) a connection. If you want to issue multiple commands in a single request, you can use a pipeline to issue multiple commands in one request, thereby improving performance.

![image-20240316211441093](/images/redis/image-20240316211441093.png)

Pipeline technology is a batch-processing technique provided by the client, used to process multiple Redis commands at once, thereby improving the performance of the whole interaction.

Pipeline technology solves the problem of wasted network resources when multiple commands are requested together, speeds up Redis's response, and lets Redis run faster. But note one thing: pipeline technology is essentially a client-side feature, not a Redis server-side feature.

Points to note:

The number of commands sent is not limited, but the input buffer, i.e., the maximum storage volume of commands, is 1GB. When the commands sent exceed this limit, the commands will not be executed, and the Redis server will disconnect the connection.
If the pipeline has too much data, the client wait time may become too long, causing network blocking.
Some clients have their own buffer-size settings. If pipeline commands are not executed or are executed incompletely, you can check this situation, or reduce the number of commands in the pipeline and retry.

```python
import redis

pool = redis.ConnectionPool(
    host="127.0.0.1",
    port=6379,
    password="1234",
    db=0,
    max_connections=2,
    decode_responses=True  # This parameter must be declared in the connection pool
)
conn = redis.Redis(connection_pool=pool)
# ------------------ Pipeline basic usage ------------------
# Before executing multiple commands, create the pipeline
pipe = conn.pipeline()
# Style 1 (recommended)
pipe.set('k1', 'v1')
pipe.set('k2', 'v2')

# Style 2
pipe.set('k3', 'v3').set('k4', 'v4')

# Execute multiple commands in batch, but note that the return value is the execution status of these commands
res = pipe.execute()
print(res)  # [True, True, True, True]

pipe = conn.pipeline()
pipe.get('k1')
pipe.get('k2')
pipe.get('k3').get('k4')
res = pipe.execute()
print(res)  # ['v1', 'v2', 'v3', 'v4']

# ------------------ Manage pipeline with with ------------------
with conn.pipeline() as pipe:
    pipe.get('k1')
    pipe.get('k2')
    pipe.get('k3').get('k4')
    res = pipe.execute()
    print(res)  # ['v1', 'v2', 'v3', 'v4']
```

**Supplement: view the client's connection count with `info clients` (the client itself will have one)**

**View the maximum connection count with `CONFIG GET MAXCLIENTS`**
