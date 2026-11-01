---
description: "Project Deployment. Note: deploy the backend first, use postman to test that the requests work, and only then modify the baseURL in the axios file in vue. Don't mix up the order."
---

# Deploying a Frontend/Backend Separated Project

```
This article uses an Alibaba Cloud server with CentOS 7.9 operating system
This article assumes the server already has nginx and mysql installed and running normally

Django + vue + uwsgi + nginx
```

**Note**: deploy the backend first, use `postman` to test that the requests work, and only then modify the `baseURL` in the `axios` file in `vue`. Don't mix up the order.



## Prerequisites

### 1 Set Up the Server Security Group Ports

![image-20240327194311322](/images/linux/linux-project-deployment-01.png)

### 2 Configure Server Domain Resolution

![image-20240327183117979](/images/linux/linux-project-deployment-02.png)

### 3 Apply for the SSL Certificate

![image-20240327183634817](/images/linux/linux-project-deployment-03.png)

![image-20240327183916816](/images/linux/linux-project-deployment-04.png)

```
It will be approved shortly after application; download the certificate in nginx format for later use

You need one SSL certificate for each secondary domain required, to support HTTPS requests
```



## Backend Project Deployment

Project layout:

- All project files are placed in the `/od/` folder
- In my projects, pure frontend projects go in the `/od/qianmo/` folder, the frontend of frontend/backend separated projects goes in the `od/front/` folder, and backend projects go in the `/od/backend/` folder
- All `ssl` certificates are also uploaded to the `/od/` folder and extracted there; each `ssl` certificate has its own separate folder
- The `python` virtual environment is placed in the `/od/backend/` folder, at the same level as the project root; the `uwsgi` startup script is placed in the `/od/backend/script/` folder; log files are placed in the `/od/backend/log/` folder

![image-20240327185736072](/images/linux/linux-project-deployment-05.png)



### 1 Modify the Django Configuration File

In the Django project's `settings.py`, change `DEBUG` to `True` and set `ALLOWED_HOSTS` to `["*"]`.

![image-20240327194957533](/images/linux/linux-project-deployment-06.png)

```bash
# Project directory planning
mkdir -p /od/backend
cd /od/backend


yum install unzip
unzip dahe.zip -d /od/backend/dahe/

# Activate the virtual environment
cd /od/backend
pip3 install virtualenv
virtualenv venv
source /od/backend/venv/bin/activate
# Install dependency packages
pip -V
pip install --upgrade pip
pip install uwsgi==2.0.23
pip install -r /od/backend/dahe/requirements.txt

# Check whether dependencies were installed successfully
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
# Execute on the cloud server
cd to the directory where the data.sql file is located, then run the command below
mysql -uroot -p123 <dahe_data.sql
```

### 3 Test Whether the Project Runs (an Important Step)

```bash
cd /od
source /od/backend/venv/bin/activate
cd /od/backend/dahe/
python3 manage.py  runserver 0.0.0.0:8000
```

![image-20240327190111409](/images/linux/linux-project-deployment-07.png)

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

# Fill in the project root directory
chdir=/od/backend/dahe/

# Fill in the directory with the same name as the project; this is a relative path, mainly to locate the wsgi.py file inside it
module=dahe.wsgi

# Root directory of the virtual environment, i.e., the working directory
home=/od/backend/venv/

# The uwsgi master process; all other uwsgi processes are child processes of this master process. When you kill it, this master process is what gets killed
master=true

# Number of worker processes for uwsgi concurrency; official recommendation: 2 * CPU cores + 1
# These processes will share the concurrent requests
processes=3

# Temporarily use http; during actual deployment, use nginx reverse proxy and replace http with socket — don't forget to change this
http=0.0.0.0:8000
# socket=0.0.0.0:8000

# Automatically delete unix socket files and pid files when the server exits
vacuum=true

# The default request size is 4096; if you receive a larger request (e.g., with large cookies or query strings), exceeding the 4096 limit will raise an error: invalid request block size: 4547 (max 4096)...skip, so we adjust it here in advance
# https://uwsgi-docs-zh.readthedocs.io/zh_CN/latest/Options.html#buffer-size
buffer-size=32768

# uwsgi log file
logto=/od/logs/uwsgi.log
```

Start the backend project:

```bash
source /od/backend/venv/bin/activate
uwsgi --ini script/uwsgi.ini
# Run in the background (just press Enter)
uwsgi --ini script/uwsgi.ini &
```

### 5 Configure nginx and the SSL Certificates

Configuration process:

- First, we need to understand that there are 3 projects in total on our server, and we will configure an `ssl` certificate for each project, so our nginx configuration has a total of 6 `server` blocks under the `http{}` module.
- It is recommended to directly delete all the original content in `nginx.conf` and copy in the edited content after preparing it locally.
- Below, the nginx deployment of a frontend/backend separated project is used as an example; pure frontend projects are similar.

![image-20240327192722530](/images/linux/linux-project-deployment-08.png)

After the backend project is deployed, we need to run postman tests again.

Because we have configured `HTTPS` and `uwsgi`, the URL for our postman tests needs to be changed to our domain name.

![image-20240327192943689](/images/linux/linux-project-deployment-09.png)

Once the tests pass here, we can proceed with the frontend configuration.

## Frontend Project Deployment

### 1 Modify the `baseURL` in the `axios` File

**Note: change `baseURL` to the address we tested in postman above; this is very important, don't forget**

![image-20240327193259203](/images/linux/linux-project-deployment-10.png)

### 2 Build the Project

```bash
npm run build
```

A `dist` folder (the compiled files) is generated in the project root. Compress it into a zip locally (don't compress it into rar).

Upload the zip to a designated location on the cloud server. I upload mine to the `/od/front/` and `/od/qianmo/` folders on the cloud server.

### 3 Add the Frontend Module in the nginx Configuration File

![image-20240327192330206](/images/linux/linux-project-deployment-11.png)After adding it, reload the configuration file (restart nginx)

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
        #Default HTTPS access port is 443.
        #If the default HTTPS access port is not configured here, Nginx may fail to start.
        listen 443 ssl;
     
        #Enter the domain name bound to the certificate
        server_name qianmo.betterwilson.com;
     
        #Enter the absolute path of the certificate file
        ssl_certificate /od/qianmo.betterwilson.com_nginx/qianmo.betterwilson.com.pem;
        #Enter the absolute path of the certificate private key file
        ssl_certificate_key /od/qianmo.betterwilson.com_nginx/qianmo.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #Custom TLS protocol types and cipher suites (the following is a configuration example; please evaluate whether to configure it yourself)
        #The higher the TLS protocol version, the more secure the HTTPS communication, but compared to lower TLS versions, higher versions have poorer browser compatibility.
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #Indicates that server cipher suites are preferred. Enabled by default.
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
        #Default HTTPS access port is 443.
        #If the default HTTPS access port is not configured here, Nginx may fail to start.
        listen 443 ssl;
     
        #Enter the domain name bound to the certificate
        server_name shipper.betterwilson.com;
     
        #Enter the absolute path of the certificate file
        ssl_certificate /od/shipper.betterwilson.com_nginx/shipper.betterwilson.com.pem;
        #Enter the absolute path of the certificate private key file
        ssl_certificate_key /od/shipper.betterwilson.com_nginx/shipper.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #Custom TLS protocol types and cipher suites (the following is a configuration example; please evaluate whether to configure it yourself)
        #The higher the TLS protocol version, the more secure the HTTPS communication, but compared to lower TLS versions, higher versions have poorer browser compatibility.
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #Indicates that server cipher suites are preferred. Enabled by default.
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
        #Default HTTPS access port is 443.
        #If the default HTTPS access port is not configured here, Nginx may fail to start.
        listen 443 ssl;
     
        #Enter the domain name bound to the certificate
        server_name dahe.betterwilson.com;
     
        #Enter the absolute path of the certificate file
        ssl_certificate /od/dahe.betterwilson.com_nginx/dahe.betterwilson.com.pem;
        #Enter the absolute path of the certificate private key file
        ssl_certificate_key /od/dahe.betterwilson.com_nginx/dahe.betterwilson.com.key;
     
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 5m;
        #Custom TLS protocol types and cipher suites (the following is a configuration example; please evaluate whether to configure it yourself)
        #The higher the TLS protocol version, the more secure the HTTPS communication, but compared to lower TLS versions, higher versions have poorer browser compatibility.
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;

        #Indicates that server cipher suites are preferred. Enabled by default.
        ssl_prefer_server_ciphers on;

        location / {
           include uwsgi_params;
           uwsgi_pass 0.0.0.0:8000;  # The port must match the one configured in uwsgi
           # uwsgi_param UWSGI_SCRIPT dahe.wsgi;  #directory name where wsgi.py is located + .wsgi
           # uwsgi_param UWSGI_CHDIR /od/backend/dahe; # project path
        }
    }   
}
```

## Project Optimization

### 1 Modify the Cloud Server Security Group Ports

After deployment and testing are complete, close the MySQL and Redis ports on the cloud server to improve its security.

![image-20240327194546837](/images/linux/linux-project-deployment-12.png)
