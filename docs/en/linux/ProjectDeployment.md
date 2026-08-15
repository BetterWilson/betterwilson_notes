# Deploying a Frontend/Backend Separated Project

```
本文采用阿里云服务器，centos7.9操作系统
本文默认服务器已安装nginx,mysql并且可以正常运行

Django + vue + uwsgi + nginx
```

**Note**: deploy the backend first, use `postman` to test that the requests work, and only then modify the `baseURL` in the `axios` file in `vue`. Don't mix up the order.



## Prerequisites

### 1 Set Up the Server Security Group Ports

![image-20240327194311322](assets\image-20240327194311322.png)

### 2 Configure Server Domain Resolution

![image-20240327183117979](assets\image-20240327183117979.png)

### 3 Apply for the SSL Certificate

![image-20240327183634817](assets\image-20240327183634817.png)

![image-20240327183916816](assets\image-20240327183916816.png)

```
申请后很快就能通过，下载nginx格式证书，备用

有几个需要用到的二级域名就需要几个ssl证书，用来支持HTTPS请求
```



## Backend Project Deployment

Project layout:

- All project files are placed in the `/od/` folder
- In my projects, pure frontend projects go in the `/od/qianmo/` folder, the frontend of frontend/backend separated projects goes in the `od/front/` folder, and backend projects go in the `/od/backend/` folder
- All `ssl` certificates are also uploaded to the `/od/` folder and extracted there; each `ssl` certificate has its own separate folder
- The `python` virtual environment is placed in the `/od/backend/` folder, at the same level as the project root; the `uwsgi` startup script is placed in the `/od/backend/script/` folder; log files are placed in the `/od/backend/log/` folder

![image-20240327185736072](assets\image-20240327185736072.png)



### 1 Modify the Django Configuration File

In the Django project's `settings.py`, change `DEBUG` to `True` and set `ALLOWED_HOSTS` to `["*"]`.

![image-20240327194957533](assets\image-20240327194957533.png)

```bash
# 项目目录规划
mkdir -p /od/backend
cd /od/backend


yum install unzip
unzip dahe.zip -d /od/backend/dahe/

# 启动虚拟环境
cd /od/backend
pip3 install virtualenv
virtualenv venv
source /od/backend/venv/bin/activate
# 安装依赖包
pip -V
pip install --upgrade pip
pip install uwsgi==2.0.23
pip install -r /od/backend/dahe/requirements.txt

# 检查是否包依赖安装成功
(venv) [root@iZgc7d0d1szot7fke40ez9Z od]# pip list
Package                 Version
----------------------- ------------
asgiref                 3.7.2
async-timeout           4.0.3
certifi                 2023.7.22
charset-normalizer      3.2.0
Django                  4.2.5
django-redis            5.3.0
djangorestframework     3.14.0
idna                    3.4
pip                     24.0
pycryptodome            3.19.0
PyJWT                   2.8.0
PyMySQL                 1.1.0
pytz                    2023.3.post1
redis                   5.0.0
requests                2.31.0
setuptools              69.1.0
sqlparse                0.4.4
tencentcloud-sdk-python 3.0.986
tzdata                  2023.3
urllib3                 2.0.5
uWSGI                   2.0.23
wheel                   0.42.0
```

### 2 Database Migration

```sql
# 云服务器中执行
cd到data.sql文件所在的目录，执行下面的命令
mysql -uroot -p123 <dahe_data.sql
```

### 3 Test Whether the Project Runs (an Important Step)

```bash
cd /od
source /od/backend/venv/bin/activate
cd /od/backend/dahe/
python3 manage.py  runserver 0.0.0.0:8000
```

![image-20240327190111409](assets\image-20240327190111409.png)

Here you can use `postman` to send requests to the backend API and check whether you get the correct return values.

Once there are no problems, proceed with the deployment configuration below.

### 4 Configure uwsgi

Create the uwsgi.ini file:

```bash
cd /od/backend/
mkdir script
mkdir logs
vim /od/backend/script/uwsgi.ini
```

```bash
[uwsgi]
socket=0.0.0.0:8000
chdir=/od/backend/dahe/
module=dahe.wsgi
processes=3
home=/od/backend/venv/
master=true
vacuum=true
buffer-size=32768
# logto=/od/backend/logs/uwsgi.log
```

Explanation of the file contents:

```ini
[uwsgi]

# 填写订单项目的根目录
chdir=/od/backend/dahe/

# 填写与项目同名的目录，这是个相对路径，主要就是找到其内的wsgi.py这个文件
module=dahe.wsgi

# 虚拟环境的根目录，也就是工作目录
home=/od/backend/venv/

# uwsgi的主进程，其他的uwsgi的进程都是这个主进程的子进程，当你kill时，杀掉的也是这个master主进程
master=true

# uwsgi并发时的工作进程的数量，官网的建议是：2 * cup核数 + 1
# 由这几个进程来分摊并发请求
processes=3

# 临时使用http，实际部署时，通过nginx反向代理，就要把http换成socket，这点别忘了改
http=0.0.0.0:8000
# socket=0.0.0.0:8000

# 当服务器退出时，自动删除unix socket文件和pid文件
vacuum=true

# 默认的请求的大小为4096，如果你接收到了一个更大的请求 (例如，带有大cookies或者查询字符串)，那么超过4096的限制就会报错invalid request block size: 4547 (max 4096)...skip，所以我们这里提前调整下
# https://uwsgi-docs-zh.readthedocs.io/zh_CN/latest/Options.html#buffer-size
buffer-size=32768

# uwsgi的日志文件
logto=/od/logs/uwsgi.log
```

Start the backend project:

```bash
source /od/backend/venv/bin/activate
uwsgi --ini script/uwsgi.ini
# 以后台方式运行(直接回车就行)
uwsgi --ini script/uwsgi.ini &
```

### 5 Configure nginx and the SSL Certificates

Configuration process:

- First, we need to understand that there are 3 projects in total on our server, and we will configure an `ssl` certificate for each project, so our nginx configuration has a total of 6 `server` blocks under the `http{}` module.
- It is recommended to directly delete all the original content in `nginx.conf` and copy in the edited content after preparing it locally.
- Below, the nginx deployment of a frontend/backend separated project is used as an example; pure frontend projects are similar.

![image-20240327192722530](assets\image-20240327192722530.png)

After the backend project is deployed, we need to run postman tests again.

Because we have configured `HTTPS` and `uwsgi`, the URL for our postman tests needs to be changed to our domain name.

![image-20240327192943689](assets\image-20240327192943689.png)

Once the tests pass here, we can proceed with the frontend configuration.

## Frontend Project Deployment

### 1 Modify the `baseURL` in the `axios` File

**Note: change `baseURL` to the address we tested in postman above; this is very important, don't forget**

![image-20240327193259203](assets\image-20240327193259203.png)

### 2 Build the Project

```bash
npm run build
```

A `dist` folder (the compiled files) is generated in the project root. Compress it into a zip locally (don't compress it into rar).

Upload the zip to a designated location on the cloud server. I upload mine to the `/od/front/` and `/od/qianmo/` folders on the cloud server.

### 3 Add the Frontend Module in the nginx Configuration File

![image-20240327192330206](assets\image-20240327192330206.png)After adding it, reload the configuration file (restart nginx)

```
nginx -s reload
```

Finally, visit the frontend routes and you can access your project.

Deployment successful.



## My Complete nginx Configuration File:

```nginx
worker_processes  2;



events {
    worker_connections  2048;
}


http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       80;
        server_name  qianmo.betterwilson.com;

        charset utf-8;

        location / {
            root /od/qianmo/dist;
            index index.html;
            try_files $uri $uri/ /index.html;   
        }
    }

    server {
        #HTTPS的默认访问端口443。
        #如果未在此处配置HTTPS的默认访问端口，可能会造成Nginx无法启动。
        listen 443 ssl;
     
        #填写证书绑定的域名
        server_name qianmo.betterwilson.com;
     
        #填写证书文件绝对路径
        ssl_certificate /od/qianmo.betterwilson.com_nginx/qianmo.betterwilson.com.pem;
        #填写证书私钥文件绝对路径
        ssl_certificate_key /od/qianmo.betterwilson.com_nginx/qianmo.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #自定义设置使用的TLS协议的类型以及加密套件（以下为配置示例，请您自行评估是否需要配置）
        #TLS协议版本越高，HTTPS通信的安全性越高，但是相较于低版本TLS协议，高版本TLS协议对浏览器的兼容性较差。
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #表示优先使用服务端加密套件。默认开启
        ssl_prefer_server_ciphers on;
 
 
        location / {
            root /od/qianmo/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }

    server {
        listen       80;
        server_name  shipper.betterwilson.com;

        rewrite ^(.*) https://$server_name$1 redirect;
    }

    server {
        #HTTPS的默认访问端口443。
        #如果未在此处配置HTTPS的默认访问端口，可能会造成Nginx无法启动。
        listen 443 ssl;
     
        #填写证书绑定的域名
        server_name shipper.betterwilson.com;
     
        #填写证书文件绝对路径
        ssl_certificate /od/shipper.betterwilson.com_nginx/shipper.betterwilson.com.pem;
        #填写证书私钥文件绝对路径
        ssl_certificate_key /od/shipper.betterwilson.com_nginx/shipper.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #自定义设置使用的TLS协议的类型以及加密套件（以下为配置示例，请您自行评估是否需要配置）
        #TLS协议版本越高，HTTPS通信的安全性越高，但是相较于低版本TLS协议，高版本TLS协议对浏览器的兼容性较差。
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #表示优先使用服务端加密套件。默认开启
        ssl_prefer_server_ciphers on;
 
 
        location / {
            root /od/front/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
        
        location /media {
            alias /od/backend/dahe/media;
        }
    }

    server {
        listen       8080;
        server_name  dahe.betterwilson.com;

        rewrite ^(.*) https://$server_name$1 redirect;
    }

    server {
        #HTTPS的默认访问端口443。
        #如果未在此处配置HTTPS的默认访问端口，可能会造成Nginx无法启动。
        listen 443 ssl;
     
        #填写证书绑定的域名
        server_name dahe.betterwilson.com;
     
        #填写证书文件绝对路径
        ssl_certificate /od/dahe.betterwilson.com_nginx/dahe.betterwilson.com.pem;
        #填写证书私钥文件绝对路径
        ssl_certificate_key /od/dahe.betterwilson.com_nginx/dahe.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #自定义设置使用的TLS协议的类型以及加密套件（以下为配置示例，请您自行评估是否需要配置）
        #TLS协议版本越高，HTTPS通信的安全性越高，但是相较于低版本TLS协议，高版本TLS协议对浏览器的兼容性较差。
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #表示优先使用服务端加密套件。默认开启
        ssl_prefer_server_ciphers on;

        location / {
           include uwsgi_params;
           uwsgi_pass 0.0.0.0:8000;  # 端口要和uwsgi里配置的一样
           # uwsgi_param UWSGI_SCRIPT dahe.wsgi;  #wsgi.py所在的目录名+.wsgi
           # uwsgi_param UWSGI_CHDIR /od/backend/dahe; # 项目路径
        }
    }   
}
```

## Project Optimization

### 1 Modify the Cloud Server Security Group Ports

After deployment and testing are complete, close the MySQL and Redis ports on the cloud server to improve its security.

![image-20240327194546837](assets\image-20240327194546837.png)
