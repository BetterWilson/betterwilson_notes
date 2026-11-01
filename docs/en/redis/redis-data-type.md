---
description: "Redis Data Types. Commands that apply to all data types. Set the time-to-live (TTL) for a key-value pair: Note: do not set a large number of key-value pairs to expire at the same time,"
---

# Redis Data Types

## Global Commands

Commands that apply to all data types.

```bash
# Dangerous command, disabled in production! Returns all keys in Redis; avoid using in production whenever possible
KEYS *

# Query all keys starting with k2
KEYS k2*

# Return the value of the specified key
KEYS k1

# Return total number of keys in current database; acts like a counter, safe for production
DBSIZE

# Return the type of the specified key value
TYPE k1

# Delete a key; returns 1 if key exists and deletion succeeds, otherwise returns 0
# Delete n keys; returns the count of successfully deleted keys
DEL k1
DEL k1 k2 ...kn

# Check if key exists; returns 0 if key does not exist. For multiple keys e.g. EXISTS k1 k2 k3, returns 3 if all exist
# Returns 0 if none exist; returns 1 or 2 if only one or two keys exist
EXISTS k1
EXISTS k1 k2 ... kn

# Rename
RENAME k1 k11

# View all configuration items
CONFIG GET *                  # Return all configuration items as key-value pairs
CONFIG GET appendonly         # View specified configuration item
CONFIG SET requirepass 1234   # Temporarily set a configuration dynamically; lost after Redis restart. For permanent settings, manually write to config file
CONFIG REWRITE                # Flush a temporarily set configuration to the config file


# Dangerous command, disabled in production! Clears all keys in Redis irreversibly. If used, buy your escape train ticket early
FLUSHALL

# View current client connections on the server
INFO CLIENTS
# View maximum client connections supported by the server
CONFIG GET maxclients
```

Set the time-to-live (TTL) for a key-value pair:

```bash
# Set TTL in seconds/milliseconds
EXPIRE/PEXPIRE    
# Return remaining TTL in seconds/milliseconds
TTL/PTTL   
# Cancel TTL setting within the lifetime
PERSIST              


# Set TTL for k2 to 20 seconds; about return value
# 0 means key does not exist
# 1 means key exists and expiration was set successfully
EXPIRE k2 20

# Return remaining TTL for k2; about return values
# -1 means key exists and never expires
# -2 means key does not exist
# n means key exists and will expire in n seconds
TTL k2

# Cancel expiration setting, or you can re-set k2 v2 (though this method is not ideal)
PERSIST k2
```

**Note: do not set a large number of key-value pairs to expire at the same time, to avoid a cache avalanche!**

## The Upper Limit of Redis Data Storage

Since Redis is an in-memory database, its data is stored in memory, so the size limit of Redis data depends on the size of the memory.

Therefore, when the data in Redis exceeds the available memory, it will start to use swap space or overflow files, which will slow down the system or even cause it to crash. So we need to be aware of the size limit of data in Redis to avoid these problems.

The size limit of a single key-value pair: Redis can store up to 512MB of data, so the size of a single key-value pair cannot exceed 512MB. Exceeding this size will cause data loss or memory interruption.

The size limit of a Redis database: each Redis database can store up to 2^32 key-value pairs by default. When this limit is reached, no more data can be added to it.

## Disabling Dangerous Commands

Open the `redis.conf` file

```bash
# Assigning an empty string to a command effectively disables it
# You can also rename a command to prevent yourself from using it
rename-command KEYS ""
# rename-command KEYS "KEYSSS"
rename-command SHUTDOWN ""
rename-command CONFIG ""
rename-command FLUSHALL ""
```

## String

```bash
# If key exists, overwrite original value; if key does not exist, set key and value
127.0.0.1:6379> SET k1 v1
OK

# When setting key, also specify expiration time		SETEX key time value
127.0.0.1:6379> SETEX k1 10 v1


# View single key value
127.0.0.1:6379> GET k1
"v1"

# Set multiple keys at once
127.0.0.1:6379> MSET k1 v1 k2 v2 k3 v3
OK

# View multiple key values at once
127.0.0.1:6379> MGET k1 k2 k3
1) "v1"
2) "v2"
3) "v3"

# GET then SET: GET first; if k1 does not exist, return nil, then set a value v1
# If key exists, first return the original value, then set the new value
127.0.0.1:6379> GETSET k1 v1111
"v1"

# Specify timeout when setting; value can be retrieved within lifetime
127.0.0.1:6379> SET k1 v1 ex 100
OK
127.0.0.1:6379> SETEX k2 100 v1
OK
127.0.0.1:6379> TTL k1
(integer) 92
127.0.0.1:6379> TTL k2
(integer) 94

# If key does not exist, set a key:value; if key exists, do nothing
# Returns 0 means key exists, does nothing
# Returns 1 means key does not exist, key-value pair set successfully
127.0.0.1:6379> SETNX k1 v1
(integer) 0

# Delete single key, delete multiple keys (returns count of deleted keys)
127.0.0.1:6379> DEL k1
(integer) 1
127.0.0.1:6379> DEL k1 k2 k3
(integer) 2

# Append value; if key does not exist, equivalent to SET; if key exists, append value to original value
127.0.0.1:6379> APPEND k1 v1
(integer) 2
127.0.0.1:6379> GET k1
"v1"
127.0.0.1:6379> APPEND k1 111
(integer) 5
127.0.0.1:6379> GET k1
"v1111"

# SETRANGE replaces element at specified byte position with specified value
127.0.0.1:6379> SET k7 0123456789
127.0.0.1:6379> SETRANGE k7 5 A   # Replace value at byte position 5 with A
(integer) 10
127.0.0.1:6379> GET k7  # Result after replacement
"01234A6789"
127.0.0.1:6379> SETRANGE k7 12 BC  # If specified byte exceeds string length, pad with zeros
(integer) 14
127.0.0.1:6379> GET k7 
"01234A6789\x00\x00BC"
127.0.0.1:6379> SETRANGE k7 6 7 BC   # Not allowed to replace elements at byte positions 6~7 with specified value
(error) ERR wrong number of arguments for 'setrange' command

# Check if key exists; return 1 if exists, otherwise 0
127.0.0.1:6379> EXISTS k1
(integer) 1

# If key exists, return value length, otherwise 0
127.0.0.1:6379> STRLEN k1
(integer) 2
127.0.0.1:6379> STRLEN k222   # k222 does not exist
(integer) 0

# Return value of string within specified byte range
127.0.0.1:6379> SET k7 0123456789
OK
127.0.0.1:6379> GETRANGE k7 1 5   # Value within byte range 1~5; note: index starts from 0
"12345"
127.0.0.1:6379> GETRANGE k7 5 15  # Value within byte range 5~15; if string is not long enough, return as much as available from start position
"56789"
127.0.0.1:6379> GETRANGE k7 15 20  # If both start and end are out of string range, return empty
""
```

**In the examples above there are operations that set or get values by range, but you cannot do this with Chinese characters, because a single Chinese character consists of multiple bytes.**

Counter functionality:

```bash
127.0.0.1:6379> INCR num		 # Each INCR call increments num by one; num may not exist beforehand
(integer) 1
127.0.0.1:6379> INCR num
(integer) 2
127.0.0.1:6379> INCRBY num 10	  # Add n at once
(integer) 12
127.0.0.1:6379> INCRBY num 100
(integer) 112
127.0.0.1:6379> DECR num          # DECR decrements num by one
(integer) 111
127.0.0.1:6379> decrby num 10	  # Subtract n at once
(integer) 101
127.0.0.1:6379> DECR num1		  # If key num1 does not exist, first set to 0 then decrement
(integer) -1
127.0.0.1:6379> GET num           # Can retrieve counter value via GET
"101"
127.0.0.1:6379> GET num1
"-1"
127.0.0.1:6379> TYPE num		  # Note: the value is still a string
string
```

## List

Characteristics of lists:

- Newly inserted elements are placed at the front, which is equivalent to inserting at index 0 by default every time. This behavior is like a WeChat Moments feed, where the newest posts appear at the top.
- Each element in a list has its own index. From left to right, indexing starts at 0; from right to left, it starts at `-1`. This is the same as lists in Python.
- Elements in a list can be duplicated.

```bash
# Add
LPUSH l1 a b                         # If l1 does not exist, create it and insert a b; if l1 exists, insert a b directly
LPUSHX l1 c                          # If key exists then insert, otherwise do nothing
LINSERT l1 before a a1               # Insert a1 before element a
LINSERT l1 after a a2                # Insert a2 after element a
RPUSH l1 1                           # Append element 1 to tail of list
RPUSH l1 2 3                         # First append 2 then append 3 to tail
RPUSHX l1 4                          # If list l1 exists, append element 4 to tail; otherwise do nothing

# Query, get value by index
LRANGE l1 0 -1                       # From index 0 to -1, i.e. from head to tail, get all elements in list
LRANGE l1 0 2                        # Get elements at indexes 0 1 2
LRANGE l1 0 0                        # Get element at index 0
LRANGE l1 10 15                      # If index is out of range, return empty
LINDEX l1 1                          # Return element by index


# Delete
DEL	l1								 # Delete entire list
LPOP l1                              # Pop head element from list
RPOP l1                              # Pop tail element from list
RPOPLPUSH l1 l2                      # Pop tail element from l1 and add to l2
LREM l1 2 a1                         # From left to right, delete specified count of element a1. In this example, if there is 1 a1, delete one; if there are 3 or more, still delete 2
LTRIM l1 2 4                         # Keep elements at indexes 2-4, delete the rest

# Update
LSET l1 0 a                          # Modify element at index 0 to specified value; error if index does not exist
```

## Hash

Mapping:

```bash
MySQL data format:
user table
id	 name	job	  age
1    zhang  it    18
2 	 wang   it    24
3    zhao   it    20

Corresponding hash storage format:
key 	field1 	value 	field2 	value 	field3 	value
user:1 	name 	zhang 	job 	it 		age 	18
user:2 	name 	wang 	job 	it 		age 	18
user:3 	name 	zhao 	job 	it 		age 	18

user corresponds to MySQL table, n corresponds to id in MySQL user table
user:n
```

Operations:

```bash
# Add
127.0.0.1:6379> HMSET user:1 name zhangsan age 18 gender m
OK
127.0.0.1:6379> HMSET user:2 name lisi age 18 gender m
OK

# Query
# Get value of specified field, equivalent to select name from user where id=1;
127.0.0.1:6379> HGET user:1 name
"zhangsan"

# Get values of multiple specified fields, equivalent to select name,age from user where id=1;
127.0.0.1:6379> HMGET user:1 name age
1) "zhangsan"
2) "18"

# Get all key-value pairs, equivalent to select * from user;
127.0.0.1:6379> HGETALL user:1
1) "name"
2) "zhangsan"
3) "age"
4) "18"
5) "gender"
6) "m"

# Check if specified field exists; return 1 if exists, otherwise 0
127.0.0.1:6379> HEXISTS user:1 name
(integer) 1

# Return count of all fields in key
127.0.0.1:6379> HLEN user:1
(integer) 3

# Update
127.0.0.1:6379> HINCRBY user:1 age 8			# Add fixed number to integer field value
127.0.0.1:6379> HSET user:1 name zhangsan2		# Reassign value to specified field
```

## Set

Basic operations:

```bash
# Add
127.0.0.1:6379> SADD s1 a b c		# Declare key and add three elements a b c
(integer) 3
127.0.0.1:6379> SMEMBERS s1			# Return all elements in s1
1) "c"
2) "b"
3) "a"
127.0.0.1:6379> SCARD s1			# Return count of elements in s1
(integer) 3
127.0.0.1:6379> SRANDMEMBER s1		# Randomly return 1 element from set
"a"
127.0.0.1:6379> SRANDMEMBER s1
"a"
127.0.0.1:6379> SRANDMEMBER s1
"c"
127.0.0.1:6379> SRANDMEMBER s1
"b"
127.0.0.1:6379> SRANDMEMBER s1 2    # Randomly return specified number of elements
1) "b"
2) "c"

127.0.0.1:6379> SISMEMBER s1 a		# Check if element a exists	sismember
(integer) 1


# Delete
127.0.0.1:6379> SPOP s1				# Randomly delete an element and return it
"c"
127.0.0.1:6379> SPOP s1	2			# Randomly delete specified number of elements and return them
1) "d"
2) "a"
127.0.0.1:6379> DEL s1				# Delete set
(integer) 1

# Move
127.0.0.1:6379> SADD s1 a b c		# Move element a from s1 to s2; if s2 does not exist, create it first then move
(integer) 3
127.0.0.1:6379> SMOVE s1 s2 a       # Note: can only move one at a time, multiple not supported, e.g. SMOVE s1 s2 a b c
(integer) 1
127.0.0.1:6379> SMEMBERS s1
1) "c"
2) "b"
127.0.0.1:6379> SMEMBERS s2
1) "a"
```

## Sorted Set (zset)

```bash
# Add
127.0.0.1:6379> ZADD top 0 xuwei 0 zhoujielun
(integer) 2

# Query, withscores is optional, indicates returning both member and its score
127.0.0.1:6379> ZSCORE top xuwei				# Return score of specified member in top; return nil if member does not exist
"0"
127.0.0.1:6379> ZSCORE top zhangsan  		
(nil)

# Return all members in top, default ascending by score; same score sorted by ASCII
127.0.0.1:6379> ZRANGE top 0 -1
1) "xuwei"
2) "zhoujielun"
127.0.0.1:6379> ZRANGE top 0 -1 WITHSCORES
1) "xuwei"
2) "0"
3) "zhoujielun"
4) "0"

# Return index of member in sorted set; return nil if member does not exist    
127.0.0.1:6379> ZRANK top xuwei
(integer) 0
127.0.0.1:6379> ZRANK top zhangsan
(nil)

# Return count of members in top
127.0.0.1:6379> ZCARD top
(integer) 2

# Return all members in top; -inf means first member, +inf means last member; results default sorted by score
127.0.0.1:6379> ZRANGEBYSCORE top -inf +inf
1) "xuwei"
2) "zhoujielun"
127.0.0.1:6379> ZRANGEBYSCORE top -inf +inf WITHSCORES
1) "xuwei"
2) "0"
3) "zhoujielun"
4) "0"

# Return all members in top sorted by index from large to small
127.0.0.1:6379> ZREVRANGE top 0 -1
1) "zhoujielun"
2) "xuwei"
127.0.0.1:6379> ZREVRANGE top 0 -1 WITHSCORES
1) "zhoujielun"
2) "0"
3) "xuwei"
4) "0"

# Return members in top within index range 0 <= index <= 2; return empty if out of range
127.0.0.1:6379> ZREVRANGE top 0 2
1) "zhoujielun"
2) "xuwei"
127.0.0.1:6379> ZREVRANGE top 0 2 WITHSCORES
1) "zhoujielun"
2) "0"
3) "xuwei"
4) "0"
127.0.0.1:6379> ZREVRANGE top 3 5 WITHSCORES
(empty list or set)

# Return count of members in top with score in range 20 <= score <= 200
127.0.0.1:6379> ZADD top 20 xuwei 80 zhoujielun 100 daolang 120 zhaolei   # First create some data
127.0.0.1:6379> ZCOUNT top 20 200
(integer) 4

# Return members in top with score in range 20 <= score <= 200
127.0.0.1:6379> ZRANGEBYSCORE top 20 200
1) "xuwei"
2) "zhoujielun"
3) "daolang"
4) "zhaolei"
127.0.0.1:6379> ZRANGEBYSCORE top 20 200 WITHSCORES
1) "xuwei"
2) "20"
3) "zhoujielun"
4) "80"
5) "daolang"
6) "100"
7) "zhaolei"
8) "120"

# Return members in top with score range 100 >= score >= 20, sorted descending by score
127.0.0.1:6379> ZREVRANGEBYSCORE top 100 20
1) "daolang"
2) "zhoujielun"
3) "xuwei"
127.0.0.1:6379> ZREVRANGEBYSCORE top 100 20 WITHSCORES
1) "daolang"
2) "100"
3) "zhoujielun"
4) "80"
5) "xuwei"
6) "20"


# Update
# Reassign value to specified member
127.0.0.1:6379> ZADD top 30 xuwei
(integer) 0

# Add specified score to member and return new score
127.0.0.1:6379> ZINCRBY top 10 xuwei
"40"


# Delete
# Delete members with scores in specified range and return count of deleted members
127.0.0.1:6379> ZREMRANGEBYSCORE top 80 100
(integer) 2

# Delete members in top within specified index range 0 <= index <= 1
127.0.0.1:6379> ZREMRANGEBYRANK top 0 1
(integer) 2

# Delete one or more members in top, return actual count deleted; return 0 if key not found
127.0.0.1:6379> ZREMRANGEBYRANK top 0 1
(integer) 2

127.0.0.1:6379> DEL top
(integer) 1
```
