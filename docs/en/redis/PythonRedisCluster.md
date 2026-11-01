# Python Connects to Redis Cluster

```python
from redis import RedisCluster
from redis.cluster import ClusterNode

if __name__ == '__main__':


    # List of all cluster nodes
    nodes = [
        ClusterNode("192.168.10.150", port=6380), ClusterNode("192.168.10.150", port=6381),

        ClusterNode("192.168.10.151", port=6380), ClusterNode("192.168.10.151", port=6381),

        ClusterNode("192.168.10.152", port=6380), ClusterNode("192.168.10.152", port=6381),
    ]

    # You can provide IP info for all machines in the cluster
    cluster = RedisCluster(startup_nodes=nodes, decode_responses=True)

    # Or specify any single node (master or replica, it will auto-discover the cluster)
    # cluster = RedisCluster(host="192.168.10.150", port=6381, decode_responses=True)
    cluster.set("user", "zhangkai")
    print(cluster.get("user"))
```
