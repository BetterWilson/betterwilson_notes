# Redis Big Keys, Hot Keys, and Expired Keys

## Expired `key` Deletion Mechanism

Let's understand `redis`'s mechanism for deleting expired `key`s.

- Lazy deletion: With lazy deletion, expired data is not deleted automatically when it reaches its expiry time. Instead, the deletion happens when the `key` value is next fetched — at that point a check is made to determine whether the `key` has expired, and only if it has expired is the deletion performed. In other words, the next time you execute `get name`, the function `expirelfNeeded()` runs; that function decides whether the `key` has expired. If it has, `nil` is returned and then the `key` is deleted from memory.
- Periodic deletion: This is implemented by `redis`'s scheduled-task function. The function runs at a certain frequency, and each time it runs it takes a certain number of random `key`s from the keyspace to check, deleting any expired keys it finds. Note: not every scheduled task checks all the `key`s — it randomly checks a fixed number of `key`s. This mechanism is intended to prevent blocking the `redis` main process for too long and causing business blocking, but the trade-off is that expired `key`s free up memory more slowly. The period of periodic deletion is governed by the `hz` parameter.

### The Relationship Between `redis` Scheduled Tasks and the `hz` Parameter

In order to periodically check resource and service status and perform the corresponding operations according to a predefined policy, Redis calls an internal function to execute a variety of background tasks, for example:

- Compute LRU information and remove expired keys.
- Close client connections that have timed out.
- Defragment hash-type data.
- Perform RDB or AOF persistence-related operations.
- Update statistics.

These periodic tasks are what keep the Redis service running normally, and their execution frequency is specified by the value of the `hz` parameter, which defaults to 10, i.e., 10 times per second.

```bash
redis-cli info Server
redis-cli config get hz

# 永久修改该参数的值，可以在其配置文件中指定如下参数：
hz n     # n表示的是一个1~100返回的数值
```

**Typical application scenario**

Redis proactively removes expired keys by running periodic tasks, and the process works as follows:

1. Randomly check 20 keys from the set of keys that have an expiration time set.
2. Delete all expired keys found during the check.
3. If more than 25% of the checked keys have expired, start a new round of the task.

If there are many expired keys, or the number of them grows very quickly, while Redis's proactive cleanup frequency is low, the expired keys will occupy a large amount of memory space and may affect the performance of the Redis service. Appropriately increasing the value of the `hz` parameter to raise the cleanup frequency is a good way to solve this problem.

**Value range and configuration recommendations**

`hz` can take values from 1 to 500. Increasing the value of the `hz` parameter raises the execution frequency of all periodic tasks, but it also increases the CPU usage of the Redis service. The default value of 10 is usually sufficient in general cases. If your business scenario has high requirements on the execution frequency of certain periodic tasks, you can try adjusting the value within 100. Increasing `hz` to above 100 has a relatively large impact on CPU usage, so proceed with caution.

## Big Keys and Hot Keys

Big keys can be divided into two situations:

- The key's Value is large: for example, a String-type key reaching 10MB in size, or the total size of elements of a collection type (Hash, List, Set, etc.) reaching 100MB. Generally, a single String-type key that reaches 10kB, or a collection-type key whose total size reaches 50MB, is defined as a big key.
- The key has many elements: for example, a Hash-type key whose number of elements reaches 10000. Generally, a collection-type key with more than 5000 elements is considered a big key.

A hot key is usually judged by the frequency with which a key is operated and the resources it consumes, for example:

- A shard in a cluster instance processes 10000 requests per second, and 3000 of them operate on the same key.
- The total bandwidth usage of one shard in a cluster instance (inbound bandwidth + outbound bandwidth) is 100Mbits/s, and 80Mbits of it is consumed by executing HGETALL on a Hash-type key.

### What Impact Do Big Keys / Hot Keys Have?

#### Big keys

**Cause specification-change failures.**

During a Redis cluster specification change, data rebalancing is performed (migrating data between nodes). When a single key is too large, it triggers the Redis kernel's migration limit for a single key, causing data migration to time out and fail. The larger the key, the higher the probability of failure; keys larger than 512MB may trigger this problem.

**Cause data migration failures.**

During data migration, if a big key has too many elements, it will block the migration of the keys that follow it. The data of the subsequent keys will be placed in the memory buffer of the migrating machine; if the blocking lasts too long, the migration will fail.

**Easily cause uneven sharding in the cluster.**

- Uneven memory usage across shards. For example, one shard uses a high amount of memory, or even fills up first, causing the keys of that shard to be evicted, while also wasting resources on other shards.
- Uneven bandwidth usage across shards. For example, one shard is frequently rate-limited while the other shards are not.

**The latency of client commands increases.**

Slow operations on big keys cause subsequent commands to be blocked, resulting in a series of slow queries.

**Cause instance rate-limiting.**

High-frequency reads of a big key can saturate the instance's outbound bandwidth, leading to rate-limiting, a large number of command timeouts or slow queries, and harm to the business.

**Cause master/replica switchover.**

Performing the dangerous DEL operation on a big key may block the master node for a long time, causing a master/replica switchover.

#### Hot keys

**Easily cause uneven sharding in the cluster.**

The shard where the hot key resides receives a large amount of business access while the other shards are under low pressure. This not only easily creates a performance bottleneck on a single shard, but also wastes the computing resources of the other shards.

**Cause CPU to spike.**

A large number of operations on a hot key can cause the CPU to spike. If this is reflected in a single shard of the cluster, you can clearly see that the CPU usage of the shard hosting the hot key is high. This affects other requests, producing slow queries and harming overall performance. In a sudden business-traffic spike scenario it can even cause a master/replica switchover.

**Easily cause cache breakdown.**

When the request pressure on a hot key is too great and exceeds what Redis can bear, cache breakdown is likely to occur — that is, a large number of requests are directed straight to the backend database, causing the database access volume to surge or even the database to go down, thereby affecting other businesses.

### What Usage Recommendations Are There to Reduce Big Keys and Hot Keys?

- Keep **string-type keys within 10KB**, and keep the number of elements in hash, list, set, and zset **under 5000 as much as possible**.
- The key naming prefix should be a business abbreviation, and special characters (such as spaces, newlines, single/double quotes, and other escape characters) are forbidden.
- Redis transactions are weak, so it is not recommended to use them excessively.
- Short-lived connections have poor performance; a client with a connection pool is recommended.
- If Redis is only used as a data cache and data loss is tolerable, it is recommended to disable persistence.

#### About big keys

**Split the big key.**

This can be divided into the following scenarios:

- **The object is a String-type big key:** try splitting the object into several key-value pairs, and use MGET or a pipeline of multiple GETs to fetch the values, spreading out the pressure of a single operation. For a cluster, this spreads the operation pressure across multiple shards, reducing the impact on a single shard.
- **The object is a collection-type big key and must be stored/retrieved as a whole:** such a scenario is strictly forbidden in design, because it cannot be split. An effective approach is to remove the big key from Redis and store it separately on another storage medium.
- **The object is a collection-type big key, and only some elements need to be operated on each time:** split the elements of the collection type. Taking the Hash type as an example, the client can define a number N of split keys; each time, compute a hash value of the field for HGET and HSET operations and take the modulus N to determine which key the field falls on. This implementation is similar to how Redis Cluster computes slots.

**Transfer the big key separately to another storage medium.**

For big keys that cannot be split, this approach is recommended: store the data that does not fit Redis's capabilities on another storage medium, such as [SFS](https://www.huaweicloud.com/intl/zh-cn/product/sfs.html) or another NoSQL database, and delete the big key from Redis.

Note: deleting a big key directly with DEL is forbidden — it may cause Redis to block or even trigger a master/replica switchover.

**Set expiration times reasonably and clean up expired data periodically.**

Set expiration times reasonably to avoid historical data piling up in Redis. Because of Redis's lazy deletion policy, expired data may not be cleaned up in a timely manner; check whether the cleanup of expired Redis keys is slow.

#### About hot keys

**Use read/write separation.**

If a hot key is mainly caused by heavy read traffic, you can enable read/write separation on the client to reduce the impact on the master node. You can also add more replicas to satisfy read demand. However, having too many replicas has its own side effects: DCS master/replica nodes use star-shaped replication, meaning all replica nodes synchronize directly with the master node. This ensures the replicas are independent of each other and that replication latency is low, but the drawback is that when there are many replicas, the CPU and network load on the master node will be high.

**Use client-side caching / local caching.**

This approach requires knowing in advance which keys are the business's hot keys. Design a two-level cache architecture of client/local cache plus remote Redis: hot data is fetched from the local cache first, and writes update both at the same time. This can absorb most of the read pressure on hot data. The drawback is that it requires modifying the client architecture and code, and the cost of the refactor is relatively high.

**Design circuit-breaking / degradation mechanisms.**

Hot keys very easily cause cache breakdown. During peak hours requests pass straight through to the backend database, leading to a business avalanche. Therefore, optimizing hot keys must include designing circuit-breaking/degradation mechanisms in the system, so that in a breakdown scenario you can rate-limit and degrade services to protect system availability.

### How to Root Out Big Keys and Hot Keys

Starting with `Redis4.0`, you can use the `bigkeys` and `hotkeys` parameters of `redis-cli` to find big keys and hot keys.

Related commands:

```bash
redis-cli --bigkeys
redis-cli --memkeys
redis-cli --hotkeys
```

## Memory Eviction Policy

```bash
[root@cs ~]# redis-cli config get maxmemory-policy
1) "maxmemory-policy"
2) "noeviction"
```

| Policy             | Description                                                                                                                                                                                                                                                  |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `noeviction`       | No keys are evicted. When memory is full, further writes return an error, while reads are unaffected.                                                                                                                                                        |
| `allkeys-lru`      | Least recently used. When memory is full, evicts the least recently used keys (the keys that have not been accessed for the longest time). If there are no keys to delete, it falls back to the `noeviction` policy.                                          |
| `volatile-lru`     | Similar to LRU, but when memory is full, it evicts the least recently used keys among the keys that have an expiration time set.                                                                                                                             |
| `allkeys-lfu`      | Least frequently used. When memory is full, evicts the keys that have been accessed the fewest times.                                                                                                                                                        |
| `volatile-lru`     | Similar to the above, but when memory is full, it evicts the least frequently accessed keys among the keys that have an expiration time set.                                                                                                                 |
| `allkeys-random`   | When memory is full, evicts keys from memory at random. It can be any key, whether frequently used or not.                                                                                                                                                   |
| `volatile-random`  | Similar, but when memory is full, it randomly evicts keys among the keys that have an expiration time set.                                                                                                                                                   |
| `volatile-ttl`     | Among the keys that have an expiration time set, evicts the keys that are about to expire.                                                                                                                                                                   |
