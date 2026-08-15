// 侧边栏共享数据 —— config.mjs 和 RelatedArticles.vue 共用同一份数据源
// 修改 config.mjs 的 sidebar 时，只需修改这里即可

export const SIDEBAR = {
    '/zh/python/ConcurrentProgramming/': {
        text: 'python并发编程',
        items: [
            {text: '进程', link: '/zh/python/ConcurrentProgramming/processing'},
            {text: '线程', link: '/zh/python/ConcurrentProgramming/threading'},
        ],
    },
    '/zh/python/ObjectOriented/': {
        text: 'python面向对象',
        items: [
            {text: '成员，成员修饰符', link: '/zh/python/ObjectOriented/member'},
            {text: '内置函数，异常，反射', link: '/zh/python/ObjectOriented/function-error-reflection'},
            {text: 'self对象，封装，继承，多态', link: '/zh/python/ObjectOriented/self-encapsulation-inherit-polymorphism'},
        ],
    },
    '/zh/python/supplement/': {
        text: 'python补充',
        items: [
            {text: '魔法函数', link: '/zh/python/supplement/MagicFunction'},
            {text: 'bisect模块', link: '/zh/python/supplement/bisect'},
            {text: 'isinstance和type区别', link: '/zh/python/supplement/IsinstanceAndType'},
            {text: 'is和==的关系', link: '/zh/python/supplement/IsAnd=='},
            {text: 'python中的常见内置类型分类', link: '/zh/python/supplement/BuiltInTypes'},
            {text: 'type,object,class三者关系', link: '/zh/python/supplement/TypeAndObjectAndClass'},
            {text: 'type元类', link: '/zh/python/supplement/type'},
            {text: 'socket模块', link: '/zh/python/supplement/socket'},
            {text: 'cookie,session缓存', link: '/zh/python/supplement/cookie-session'},
            {text: 'JWT', link: '/zh/python/supplement/jwt'},
            {text: 're正则', link: '/zh/python/supplement/re'},
            {text: '深copy与浅copy', link: '/zh/python/supplement/copy'},
            {text: '模块', link: '/zh/python/supplement/model'},
        ],
    },
    '/zh/git': {
        text: 'Git',
        items: [
            {text: 'Git常用命令清单', link: '/zh/git/GitUseful'},
        ],
    },
    '/zh/drf': {
        text: 'DRF',
        items: [
            {text: 'drf返回值，事务，Logging日志', link: '/zh/drf/response-transaction-logging'},
            {text: 'drf解析器，序列化器，分页', link: '/zh/drf/parser-serializer-pagination'},
            {text: 'drf认证，权限，限流，版本', link: '/zh/drf/auth-permission-throttle-version'},
            {text: 'drf视图，路由，筛选器', link: '/zh/drf/views-url-filter'},
        ],
    },
    '/zh/django': {
        text: 'Django',
        items: [
            {text: 'Django-admin单例模式和懒加载', link: '/zh/django/Django-admin'},
            {text: 'Django-admin组件', link: '/zh/django/DjangoAdmin'},
            {text: 'Django-auth组件', link: '/zh/django/Django-auth'},
            {text: 'Django-signal组件', link: '/zh/django/Django-signal'},
            {text: 'Django模板查找顺序', link: '/zh/django/DjangoModel'},
            {text: 'Django自定义命令', link: '/zh/django/DjangoManage'},
            {text: 'model中的抽象类', link: '/zh/django/modelClass'},
            {text: 'model中的Manager对象', link: '/zh/django/modelManager'},
        ],
    },
    '/zh/redis': {
        text: 'Redis',
        items: [
            {text: '多台服务器无密码传输数据', link: '/zh/redis/no-password'},
            {text: 'Django连接redis', link: '/zh/redis/Django-redis'},
            {text: 'Python连接redis', link: '/zh/redis/Python-redis'},
            {text: 'Python连接Redis集群', link: '/zh/redis/PythonRedisCluster'},
            {text: 'Python连接Redis哨兵', link: '/zh/redis/PythonRedisSentinel'},
            {text: 'redis持久化', link: '/zh/redis/redisPersistence'},
            {text: 'Redis大key热key过期key', link: '/zh/redis/RedisKey'},
            {text: 'Redis集群Cluster', link: '/zh/redis/RedisCluster'},
            {text: 'Redis哨兵Sentinel', link: '/zh/redis/RedisSentinel'},
            {text: 'Redis数据类型', link: '/zh/redis/RedisDataType'},
            {text: 'Redis主从复制', link: '/zh/redis/RedisMaster-slaveReplication'},
        ],
    },
    '/zh/linux': {
        text: 'linux',
        items: [
            {text: 'Linux命令(Ubuntu)', link: '/zh/linux/commands'},
            {text: '项目准备', link: '/zh/linux/ProjectPreparation'},
            {text: 'MySQL8.0安装(centos7)', link: '/zh/linux/mysql8.0(centos7)'},
            {text: 'nginx1.24.0安装(centos7)', link: '/zh/linux/nginx1.24.0(centos7)'},
            {text: 'Python3.11.0解释器安装(centos7)', link: '/zh/linux/python3.11.0(centos7)'},
            {text: 'Redis5.0.7安装(centos7)', link: '/zh/linux/redis5.0.7(centos7)'},
            {text: '报错解决', link: '/zh/linux/ResolveError'},
            {text: '项目部署', link: '/zh/linux/ProjectDeployment'},
        ],
    },
    '/zh/vue': {
        text: 'Vue',
        items: [
            {text: 'vue知识点', link: '/zh/vue/notes'},
            {text: 'vue-router', link: '/zh/vue/router'},
            {text: 'vue-pinia', link: '/zh/vue/pinia'},
            {text: 'vue-axios', link: '/zh/vue/axios'},
            {text: 'vue-cookie', link: '/zh/vue/cookie'},
        ],
    },
    '/zh/machine_learning': {
        text: 'Machine learning',
        items: [
            {text: 'scikit-learn', link: '/zh/machine_learning/scikit-learn'},
            {text: '分类算法', link: '/zh/machine_learning/classification'},
            {text: '回归算法', link: '/zh/machine_learning/regression'},
            {text: '聚类算法', link: '/zh/machine_learning/clustering'},
            {text: '集成学习', link: '/zh/machine_learning/ensemble_learning'},
        ]
    },
    '/zh/deep_learning': {
        text: 'Deep learning',
        items: [
            {text: '依赖安装', link: '/zh/deep_learning/dependencies'},
            {text: 'Pytorch', link: '/zh/deep_learning/Pytorch'},
            {text: 'Pytorch分类与回归', link: '/zh/deep_learning/PytorchCR'},
            {text: '神经网络概念', link: '/zh/deep_learning/neural_network'},
            {text: '自定义损失/全连接层/求导与反向传播', link: '/zh/deep_learning/custom'},
            {text: '卷积神经网络CNN1', link: '/zh/deep_learning/cnn1'},
            {text: '卷积神经网络CNN2', link: '/zh/deep_learning/cnn2'},
            {text: '卷积神经网络CNN3', link: '/zh/deep_learning/cnn3'},
        ]
    }
}

// ---------- 英文侧边栏（内容逐步翻译，只列已翻译的页面）----------
// key 带 /en/ 前缀，必须与 docs/en/ 下的实际文件保持同步，否则会 404
export const SIDEBAR_EN = {
    '/en/python/ConcurrentProgramming/': {
        text: 'Python Concurrency',
        items: [
            {text: 'Processes', link: '/en/python/ConcurrentProgramming/processing'},
            {text: 'Threads', link: '/en/python/ConcurrentProgramming/threading'},
        ],
    },
    '/en/python/ObjectOriented/': {
        text: 'Python OOP',
        items: [
            {text: 'Members, Member Modifiers', link: '/en/python/ObjectOriented/member'},
            {text: 'Built-in Functions, Exceptions, Reflection', link: '/en/python/ObjectOriented/function-error-reflection'},
            {text: 'self, Encapsulation, Inheritance, Polymorphism', link: '/en/python/ObjectOriented/self-encapsulation-inherit-polymorphism'},
        ],
    },
    '/en/python/supplement/': {
        text: 'Python Supplement',
        items: [
            {text: 'Magic Functions', link: '/en/python/supplement/MagicFunction'},
            {text: 'bisect Module', link: '/en/python/supplement/bisect'},
            {text: 'isinstance vs type', link: '/en/python/supplement/IsinstanceAndType'},
            {text: 'is vs ==', link: '/en/python/supplement/IsAnd=='},
            {text: 'Common Built-in Types in Python', link: '/en/python/supplement/BuiltInTypes'},
            {text: 'Relationship between type, object, class', link: '/en/python/supplement/TypeAndObjectAndClass'},
            {text: 'type Metaclass', link: '/en/python/supplement/type'},
            {text: 'socket Module', link: '/en/python/supplement/socket'},
            {text: 'cookie, session Cache', link: '/en/python/supplement/cookie-session'},
            {text: 'JWT', link: '/en/python/supplement/jwt'},
            {text: 're Regular Expressions', link: '/en/python/supplement/re'},
            {text: 'Deep Copy vs Shallow Copy', link: '/en/python/supplement/copy'},
            {text: 'Modules', link: '/en/python/supplement/model'},
        ],
    },
    '/en/git': {
        text: 'Git',
        items: [
            {text: 'Git Useful Commands Cheat Sheet', link: '/en/git/GitUseful'},
        ],
    },
    '/en/drf': {
        text: 'DRF',
        items: [
            {text: 'DRF Return Values, Transactions, Logging', link: '/en/drf/response-transaction-logging'},
            {text: 'DRF Parsers, Serializers, Pagination', link: '/en/drf/parser-serializer-pagination'},
            {text: 'DRF Authentication, Permissions, Throttling, Versioning', link: '/en/drf/auth-permission-throttle-version'},
            {text: 'DRF Views, Routing, Filters', link: '/en/drf/views-url-filter'},
        ],
    },
    '/en/django': {
        text: 'Django',
        items: [
            {text: 'Django-admin Singleton Pattern and Lazy Loading', link: '/en/django/Django-admin'},
            {text: 'Django-admin Component', link: '/en/django/DjangoAdmin'},
            {text: 'Django-auth Component', link: '/en/django/Django-auth'},
            {text: 'Django-signal Component', link: '/en/django/Django-signal'},
            {text: 'Django Template Lookup Order', link: '/en/django/DjangoModel'},
            {text: 'Django Custom Commands', link: '/en/django/DjangoManage'},
            {text: 'Abstract Classes in Models', link: '/en/django/modelClass'},
            {text: 'Manager Objects in Models', link: '/en/django/modelManager'},
        ],
    },
    '/en/redis': {
        text: 'Redis',
        items: [
            {text: 'Transfer Data Between Servers Without Password', link: '/en/redis/no-password'},
            {text: 'Connecting Redis with Django', link: '/en/redis/Django-redis'},
            {text: 'Connecting Redis with Python', link: '/en/redis/Python-redis'},
            {text: 'Connecting Redis Cluster with Python', link: '/en/redis/PythonRedisCluster'},
            {text: 'Connecting Redis Sentinel with Python', link: '/en/redis/PythonRedisSentinel'},
            {text: 'Redis Persistence', link: '/en/redis/redisPersistence'},
            {text: 'Redis Big Keys, Hot Keys, Expired Keys', link: '/en/redis/RedisKey'},
            {text: 'Redis Cluster', link: '/en/redis/RedisCluster'},
            {text: 'Redis Sentinel', link: '/en/redis/RedisSentinel'},
            {text: 'Redis Data Types', link: '/en/redis/RedisDataType'},
            {text: 'Redis Master-Slave Replication', link: '/en/redis/RedisMaster-slaveReplication'},
        ],
    },
    '/en/linux': {
        text: 'Linux',
        items: [
            {text: 'Linux Commands (Ubuntu)', link: '/en/linux/commands'},
            {text: 'Project Preparation', link: '/en/linux/ProjectPreparation'},
            {text: 'MySQL 8.0 Installation (CentOS 7)', link: '/en/linux/mysql8.0(centos7)'},
            {text: 'Nginx 1.24.0 Installation (CentOS 7)', link: '/en/linux/nginx1.24.0(centos7)'},
            {text: 'Python 3.11.0 Installation (CentOS 7)', link: '/en/linux/python3.11.0(centos7)'},
            {text: 'Redis 5.0.7 Installation (CentOS 7)', link: '/en/linux/redis5.0.7(centos7)'},
            {text: 'Error Resolution', link: '/en/linux/ResolveError'},
            {text: 'Project Deployment', link: '/en/linux/ProjectDeployment'},
        ],
    },
    '/en/vue': {
        text: 'Vue',
        items: [
            {text: 'Vue Knowledge Points', link: '/en/vue/notes'},
            {text: 'vue-router', link: '/en/vue/router'},
            {text: 'vue-pinia', link: '/en/vue/pinia'},
            {text: 'vue-axios', link: '/en/vue/axios'},
            {text: 'vue-cookie', link: '/en/vue/cookie'},
        ],
    },
    '/en/machine_learning': {
        text: 'Machine learning',
        items: [
            {text: 'scikit-learn', link: '/en/machine_learning/scikit-learn'},
            {text: 'Classification Algorithms', link: '/en/machine_learning/classification'},
            {text: 'Regression Algorithms', link: '/en/machine_learning/regression'},
            {text: 'Clustering Algorithms', link: '/en/machine_learning/clustering'},
            {text: 'Ensemble Learning', link: '/en/machine_learning/ensemble_learning'},
        ]
    },
}
