---
description: "Redis 5.0.7 Installation (CentOS 7). Note: download links for all versions: At this point, we can call Redis-related commands from any path,"
---

# Redis 5.0.7 Installation (CentOS 7)

## 1 Disable the Firewall and Download Dependencies

```bash
# Check firewall status
systemctl status firewalld.service
# Disable firewall
systemctl stop firewalld.service
# Disable firewall on boot
systemctl disable firewalld.service
# Start firewall
systemctl start firewalld.service
# Enable firewall to start on system boot
systemctl enable firewalld.service
# Disable SELinux: it improves system security, but disabling it frees system resources, improves server performance, and avoids program compatibility issues, etc.
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
/data/redis6379/					# Data directory
/opt/redis-5.0.7/					# Installation directory
/opt/								# Download and extraction directory
/opt/redis6379/{conf,logs,pid}   	# Config directory, logs directory, pid directory
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
# Note: in production, NEVER bind 0.0.0.0 or expose Redis to the public internet, to prevent attacks
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
# -a is followed by your password
# -p is followed by port 6379; the -p parameter can actually be omitted, as the default is to access Redis on port 6379

[root@cs opt]# redis-cli -a 1234 -p 6379
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> 
```

Or connect first and then authenticate:

```bash
[root@cs opt]# redis-cli						# Connecting works fine, but since a password is set, you can't do anything before authenticating
127.0.0.1:6379> ping
(error) NOAUTH Authentication required.
127.0.0.1:6379> auth 1234					# Authenticate; the auth command is followed by your password
OK
127.0.0.1:6379> ping						# Authenticated; now you can do whatever you want
PONG
127.0.0.1:6379> quit						# Common client exit commands: quit/exit/ctrl+c. Note that exiting the client only closes the client-server connection; it does NOT stop the server - an important distinction
[root@cs opt]# 
```

## 6 Configure `systemctl` to Manage `Redis`

```bash
# First stop any previously running Redis
# Create the redis user and group, and grant permissions on the relevant directories
# Create the systemctl file to manage redis
# Now redis can be managed via systemctl

redis-cli shutdown

# The -u and -g options add a user with specific UID and GID at the same time
# -M creates a user without a home directory
# -s means the created user cannot be used to log in to the system
# chown -R redis:redis assigns ownership of the specified directory and its internal files to redis:redis
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

systemctl daemon-reload   # After adding or modifying a service's config file, run daemon-reload to reload it
systemctl start redis


# Start/stop/restart/check status/enable redis on boot
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
# Temporary fix
sysctl vm.overcommit_memory=1

# Permanent fix: vim /etc/sysctl.conf, append:
vm.overcommit_memory=1

# Apply the configuration
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
# Temporary fix
echo never > /sys/kernel/mm/transparent_hugepage/enabled


# Permanent fix: vim /etc/rc.local, append:

echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

### Warning 4: TCP Connection Count Adjustment

This means the value of /proc/sys/net/core/somaxconn is 128, but redis.conf is configured with 511; however, the [linux](https://so.csdn.net/so/search?q=linux&spm=1001.2101.3001.7020) kernel will silently truncate it to 128. In a high-concurrency environment, 128 is far from enough, so we need to increase it.

```bash
63918:M 01 Aug 2023 11:28:59.701 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
```

Solution:

```bash
# Permanent fix: vim /etc/sysctl.conf, append:
net.core.somaxconn= 4096

# Apply the configuration
sysctl -p
```

Then restart Redis and observe the logs:

```bash
# First clear the existing log content
# Then restart redis
# Observe the log output
echo "">/opt/redis6379/logs/redis6379.log
cat /opt/redis6379/logs/redis6379.log
systemctl daemon-reload
systemctl stop redis
systemctl status redis
systemctl start redis
systemctl status redis
cat /opt/redis6379/logs/redis6379.log

# The output is now clean
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
