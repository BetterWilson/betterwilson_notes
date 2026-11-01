---
description: "Connecting Redis Sentinel with Python"
---

# Python Connects to Redis Sentinel

```python
from redis.sentinel import Sentinel

if __name__ == '__main__':
    # Alias monitored by Sentinel; this matches the name in your Redis config
    server_name = "myredis"

    # Set the IP and PORT for the sentinel group
    sentinel_list = [
        ("192.168.10.150", 26379),
        ("192.168.10.151", 26379),
        ("192.168.10.152", 26379)
    ]
    # Initialize the sentinel object and pass the sentinel group's IP and port info
    sentinel = Sentinel(sentinel_list)

    # print(sentinel.discover_slaves(server_name))
    # print(sentinel.discover_master(server_name))

    # Get the master node from sentinel monitoring ('192.168.10.150', 6379)
    master_client = sentinel.master_for(server_name, decode_responses=True)

    # Get the slave nodes from sentinel monitoring [('192.168.10.151', 6379), ('192.168.10.152', 6379)]
    slave_client = sentinel.slave_for(server_name, decode_responses=True)

    # Set a value on the master
    master_client.set("user", "zhangkai")

    # Get the value from a slave
    print(slave_client.get("user"))
```

**Wrapper:**

```python
from redis.sentinel import Sentinel

class PyConnectionSentinel(object):
    """ Python connects to Redis Sentinel """

    def __init__(self, server_name, sentinel_list, decode_responses=True):
        # Replica object
        self.replica = None
        # Master object
        self.master = None
        # Sentinel object
        self.sentinel_obj = None
        # The alias that the sentinel listens on — this is the name in your Redis config
        self.server_name = server_name
        self.sentinel_list = sentinel_list
        # Optionally decide whether to automatically decode the response; defaults to True
        self.decode_responses = decode_responses
        self.init_sentinel()
        self.get_master_client()
        self.get_replica_client()

    def init_sentinel(self):
        """ Initialize the sentinel object, passing the sentinel group's IP and port """
        self.sentinel_obj = Sentinel(self.sentinel_list)
        print("discover_master-->", self.sentinel_obj.discover_master(self.server_name))
        print("discover_slaves-->", self.sentinel_obj.discover_slaves(self.server_name))
        """
        discover_master--> ('192.168.10.150', 6379)
		discover_slaves--> [('192.168.10.151', 6379), ('192.168.10.152', 6379)]
        """

    def get_master_client(self):
        """ Get the master from sentinel monitoring """
        self.master = self.sentinel_obj.master_for(
            self.server_name,
            decode_responses=self.decode_responses,
            # The time from Redis sending a command to receiving a response must not exceed this value. If exceeded, redis.exceptions.TimeoutError: Timeout reading from socket will be raised.
            # It is recommended to set this to prevent the service from hanging when reading Redis data times out, and add exception handling for it.
            # socket_timeout=0.5,

            # Redis connection timeout. If a connection is not established within this time, redis.exceptions.TimeoutError: Timeout connecting to server will be raised.
            # When socket_connect_timeout is not set, this value equals socket_timeout.
            # You can set only socket_timeout
            # socket_connect_timeout=0.5

            # password='12345'

            # Boolean type, recommended to set to True. When set to False, a command timeout will immediately raise a timeout exception.
            # When set to True, after a command timeout, it will retry once; if retry succeeds, it returns normally; if retry fails, a timeout exception is raised.
            retry_on_timeout=True
        )

    def get_replica_client(self):
        """ Get the slave (replica) from sentinel monitoring """
        self.replica = self.sentinel_obj.master_for(self.server_name, decode_responses=self.decode_responses)


if __name__ == '__main__':
    # The alias that the sentinel listens on — this is the name in your Redis config
    server_name = "myredis"

    # Set the sentinel group's IP and PORT
    sentinel_list = [
        ("192.168.10.150", 26379),
        ("192.168.10.151", 26379),
        ("192.168.10.152", 26379)
    ]
    # All sentinel-related operations can be encapsulated through this class
    obj = PyConnectionSentinel(
        server_name=server_name,
        sentinel_list=sentinel_list
    )
    # Through master, you can perform read and write operations
    obj.master.set('k1', 'v1111')
    print(obj.master.get("k1"))  # v1111
    # You can also perform read operations through slave nodes to achieve master-slave separation
    print(obj.replica.get("k1"))  # v1111
```
