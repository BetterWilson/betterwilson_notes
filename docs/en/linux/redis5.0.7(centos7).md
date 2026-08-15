# Redis 5.0.7 Installation (CentOS 7)

## 1 Disable the Firewall and Download Dependencies

```bash
# 查看防火墙状态
systemctl status firewalld.service
# 关闭防火墙
systemctl stop firewalld.service
# 禁止开机启动防火墙
systemctl disable firewalld.service
# 启动防火墙
systemctl start firewalld.service
# 防火墙随系统开启启动
systemctl enable firewalld.service
# 关闭selinux,提高了系统的安全性，但关闭它可以释放系统资源，提高服务器的性能，避免一些程序的兼容性问题等等
[root@r ~]# sed -i.ori 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/selinux/config

systemctl stop firewalld.service
systemctl disable firewalld.service
systemctl status firewalld.service
sed -i.ori 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/selinux/config
yum update -y
yum -y install gcc automake autoconf libtool make
yum -y install net-tools
yum -y install vim
yum -y install wget
```

## 2 Plan the Directories in Advance

```bash
/data/redis6379/					# 数据存放目录
/opt/redis-5.0.7/					# 安装目录
/opt/								# 下载并解压目录
/opt/redis6379/{conf,logs,pid}   	# 配置目录，日志目录，pid目录
```

## 3 Download and Install

**Note: download links for all versions: https://download.redis.io/releases/**

```bash
mkdir -p /data/redis6379 
cd /opt
# yum -y install wget
wget https://download.redis.io/releases/redis-5.0.7.tar.gz
tar -zxf redis-5.0.7.tar.gz
cd /opt/redis-5.0.7
make && make install
```

At this point, we can call Redis-related commands from any path, e.g.:

```bash
[root@cs opt]# redis-server -v
Redis server v=5.0.7 sha=00000000:0 malloc=jemalloc-5.1.0 bits=64 build=a67ef2d8861912e7
```

## 4 Write the Configuration File

```bash
mkdir -p /opt/redis6379/{conf,logs,pid}
cat >/opt/redis6379/conf/redis6379.conf<<EOF
daemonize yes
# 注意，生产中， 千万不要bind 0.0.0.0，不要将Redis暴露到外网环境，防止被人攻击
bind 0.0.0.0
port 6379
pidfile /opt/redis6379/pid/redis6379.pid
logfile /opt/redis6379/logs/redis6379.log

requirepass 1234
EOF
```

## 5 Startup Command

```bash
redis-server /opt/redis6379/conf/redis6379.conf

ps -ef|grep redis
```

```bash
# -a 后面跟你的密码
# -p 后面是6379端口，其实这个-p参数可以不带，不带默认就是访问的6379端口的Redis

[root@cs opt]# redis-cli -a 1234 -p 6379
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> 
```

Or connect first and then authenticate:

```bash
[root@cs opt]# redis-cli						# 连接肯定是没问题，但由于设置了密码，你未通过认证之前，你啥也做不了
127.0.0.1:6379> ping
(error) NOAUTH Authentication required.
127.0.0.1:6379> auth 1234					# 认证，auth命令后面跟你的密码
OK
127.0.0.1:6379> ping						# 认证通过，你想干啥干啥
PONG
127.0.0.1:6379> quit						# 常见的退出客户端命令有： quit/exit/ctrl+c   注意，退出客户端只是表示关闭客户端和服务端的连接，而不是停止服务端，这点要区分开
[root@cs opt]# 
```

## 6 Configure `systemctl` to Manage `Redis`

```bash
# 先把之前可能运行的Redis停止
# 创建redis用户和组，以及给相关目录权限
# 创建systemctl管理redis的文件
# 就可以通过systemctl管理redis了

redis-cli shutdown

# -u和-g选项表示同时添加具有特定UID和GID的用户
# -M创建一个没有主目录的用户
# -s表示当前创建的当前用户无法用来登录系统
# chown -R redis:redis表示指定目录以及内部的文件所有用户属组归于redis:redis
# groupdel redis
# cat /etc/group |grep redis
groupadd redis -g 1000
# userdel redis
# cat /etc/passwd |grep redis
useradd redis -u 1000 -g 1000 -M -s /sbin/nologin
chown -R redis:redis /opt/redis*
chown -R redis:redis /data/redis*

cat >/usr/lib/systemd/system/redis.service<<EOF
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target
[Service]
ExecStart=/usr/local/bin/redis-server /opt/redis6379/conf/redis6379.conf --supervised systemd
ExecStop=/usr/local/bin/redis-cli shutdown
Type=notify
User=redis
Group=redis
RuntimeDirectory=redis
RuntimeDirectoryMode=0755
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload   # 当添加或者修改了某个服务的配置文件，就要执行daemon-reload命令重新加载下
systemctl start redis


# 启动/停止/重启/查看状态/设置redis开机自启
systemctl start/stop/restart/status/enable redis
```

## 7 Optimize the Warnings

If you look at the Redis logs, you'll find that some warnings appear at startup; we can optimize these warnings accordingly.

```bash
cat /opt/redis6379/logs/redis6379.log
```

### Warning 1: maximum open files is too low

This means the number of client connections is a bit small; just increase it.

```bash
63918:M 01 Aug 2023 11:28:59.700 # You requested maxclients of 10000 requiring at least 10032 max file descriptors.
63918:M 01 Aug 2023 11:28:59.700 # Server can't set maximum open files to 10032 because of OS error: Operation not permitted.
63918:M 01 Aug 2023 11:28:59.700 # Current maximum open files is 4096. maxclients has been reduced to 4064 to compensate for low ulimit. If you need higher maxclients increase 'ulimit -n'.
```

Solution: add the `LimitNOFILE` parameter to the systemd startup file:

```bash
cat >/usr/lib/systemd/system/redis.service<<EOF
[Unit]
Description=Redis persistent key-value database
After=network.target
After=network-online.target
Wants=network-online.target
[Service]
ExecStart=/usr/local/bin/redis-server /opt/redis6379/conf/redis6379.conf --supervised systemd
ExecStop=/usr/local/bin/redis-cli shutdown
Type=notify
User=redis
Group=redis
RuntimeDirectory=redis
RuntimeDirectoryMode=0755
LimitNOFILE=65536
[Install]
WantedBy=multi-user.target
EOF
```

### Warning 2: overcommit_memory setting

Related to virtual memory; overcommit_memory is the memory allocation policy, with valid values: 0, 1, 2.

0: the kernel checks whether there is enough available memory for the application process; if so, the memory allocation is allowed; otherwise, the allocation fails and the error is returned to the application process.
1: the kernel allows allocating all physical memory regardless of the current memory state.
2: the kernel allows allocating more memory than the total of all physical memory and swap space.

```bash
63918:M 01 Aug 2023 11:28:59.701 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.,
```

Solution:

```bash
# 临时解决
sysctl vm.overcommit_memory=1

# 永久解决 vim /etc/sysctl.conf  追加：
vm.overcommit_memory=1

# 生效配置
sysctl -p
```

### Warning 3: Disable THP (Transparent Huge Pages)

Redis recommends disabling THP and gives the specific steps; note you must run these as root or they will fail.

- The `Linux kernel` introduced the `THP` feature in version 2.6.38, supporting large memory page (2MB) allocation, and it is enabled by default.
- When `THP` is enabled, the speed of forking child processes is reduced, but after a `fork` operation, each memory page grows from the original 4KB to 2MB, which greatly increases the parent process's memory consumption during rewrites.
- At the same time, the memory copied on each write command is amplified 512x per unit, slowing down write operations and causing many write operations to become slow queries; for example, even simple incr and set commands may appear in slow queries.

```bash
63918:M 01 Aug 2023 11:28:59.701 # WARNING you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.
```

Solution: the following commands must be run as root:

```bash
# 临时解决
echo never > /sys/kernel/mm/transparent_hugepage/enabled


# 永久解决 vim /etc/rc.local  追加：

echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

### Warning 4: TCP Connection Count Adjustment

This means the value of /proc/sys/net/core/somaxconn is 128, but redis.conf is configured with 511; however, the [linux](https://so.csdn.net/so/search?q=linux&spm=1001.2101.3001.7020) kernel will silently truncate it to 128. In a high-concurrency environment, 128 is far from enough, so we need to increase it.

```bash
63918:M 01 Aug 2023 11:28:59.701 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
```

Solution:

```bash
# 永久解决 vim /etc/sysctl.conf  追加：
net.core.somaxconn= 4096

# 生效配置
sysctl -p
```

Then restart Redis and observe the logs:

```bash
# 先清空原有的日志内容
# 然后重启redis
# 观察日志输出
echo "">/opt/redis6379/logs/redis6379.log
cat /opt/redis6379/logs/redis6379.log
systemctl daemon-reload
systemctl stop redis
systemctl status redis
systemctl start redis
systemctl status redis
cat /opt/redis6379/logs/redis6379.log

# 这输出就很干净了啊
[root@cs opt]# cat /opt/redis6379/logs/redis6379.log

79069:C 01 Aug 2023 12:05:05.217 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
79069:C 01 Aug 2023 12:05:05.217 # Redis version=5.0.7, bits=64, commit=00000000, modified=0, pid=79069, just started
79069:C 01 Aug 2023 12:05:05.217 # Configuration loaded
79069:C 01 Aug 2023 12:05:05.217 * supervised by systemd, will signal readiness
79069:M 01 Aug 2023 12:05:05.218 * Running mode=standalone, port=6379.
79069:M 01 Aug 2023 12:05:05.218 # Server initialized
79069:M 01 Aug 2023 12:05:05.219 * Ready to accept connections
```

After all these adjustments, it's best to restart the server. Then start Redis again and you're done.
