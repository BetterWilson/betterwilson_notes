---
description: "DRF Return Values, Transactions, Logging. Another approach, suitable for ser.is_valid(raise_exception=True). Based on context management: if an exception occurs,"
---

# DRF Return Values, Transactions, and Logging

## 1 Return Values

- Define the `finalize_response` method in the view (it can also be used to determine whether an exception occurred).

- Custom exceptions

  - Configuration file

    ```python
    # settings.py
    REST_FRAMEWORK = {
        "EXCEPTION_HANDLER": 'utils.handlers.exception_handler'		# Path to custom exception_handler
    }
    ```

  - Customize inside the `exception_handler` function.



### 1.1 Normal Return

![image-20240502142352055](/images/drf/drf-response-transaction-logging-01.png)

![image-20240502142414330](/images/drf/drf-response-transaction-logging-02.png)

```python
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response


class DemoView(APIView):

    def get(self, request: Request):
        return Response({"name": "Zhang San", "age": 22})

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        # Transform the data
        response.data = {"code": 0, "data": response.data}
        return response
```



### 1.2 Exception Return

#### Custom exception_handler

##### utils/handlers.py

```python
from django.http import Http404

from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import Throttled
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import NotAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import set_rollback


def exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
        exc.ret_code = 1001
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
        exc.ret_code = 1002
    elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        exc.ret_code = 1003
    elif isinstance(exc, Throttled):
        exc.ret_code = 1004
    elif isinstance(exc, ValidationError):
        exc.ret_code = 1005

    # Handle DRF-related exceptions
    if isinstance(exc, exceptions.APIException):
        headers = {}
        if getattr(exc, 'auth_header', None):
            headers['WWW-Authenticate'] = exc.auth_header
        if getattr(exc, 'wait', None):
            headers['Retry-After'] = '%d' % exc.wait

        if isinstance(exc.detail, (list, dict)):
            data = exc.detail
        else:
            code = getattr(exc, 'ret_code', None) or -1
            data = {'code': code, 'detail': exc.detail}

        set_rollback()
        return Response(data, status=exc.status_code, headers=headers)
    return None
```

Another approach, suitable for `ser.is_valid(raise_exception=True)`.

```python
from django.http import Http404

from rest_framework import status
from rest_framework import exceptions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import Throttled
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import NotAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import set_rollback

from utils import return_code


def exception_handler(exc, context):
    exc.status_code = status.HTTP_200_OK    # Change HTTP response status code for easier frontend handling
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
        exc.ret_code = return_code.NotFound404
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
        exc.ret_code = return_code.PermissionDenied
    elif isinstance(exc, AuthenticationFailed):
        exc.ret_code = return_code.AuthenticationFailed
    elif isinstance(exc, NotAuthenticated):
        exc.ret_code = return_code.NotAuthenticated
    elif isinstance(exc, Throttled):
        exc.ret_code = return_code.ThrottledError
    elif isinstance(exc, ValidationError):
        exc.ret_code = return_code.ValidationError

    # Handle DRF-related exceptions
    if isinstance(exc, exceptions.APIException):
        headers = {}
        if getattr(exc, 'auth_header', None):
            headers['WWW-Authenticate'] = exc.auth_header
        if getattr(exc, 'wait', None):
            headers['Retry-After'] = '%d' % exc.wait

        # if isinstance(exc.detail, (list, dict)):
        #     data = exc.detail
        # else:
        #     exc_code = getattr(exc, 'ret_code', None) or -1
        #     data = {'code': exc_code, 'message': exc.detail}
        exc_code = getattr(exc, 'ret_code', None) or return_code.UnexpectedError
        data = {'code': exc_code, 'message': exc.detail}

        set_rollback()
        return Response(data, status=exc.status_code, headers=headers)

    data = {"code": return_code.UnexpectedError, "message": str(exc)}
    return Response(data, status=500)
```



##### utils/exceptions.py

```python
from rest_framework import exceptions


class ExtraException(exceptions.APIException):
    def __init__(self, detail=None, ret_code=None, code=None):
        super().__init__(detail, code)
        self.ret_code = ret_code
```



##### views.py

```python
from rest_framework import exceptions
from rest_framework import serializers
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, UpdateModelMixin
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.throttling import BaseThrottle

from api import models
from utils.exceptions import ExtraException


class ExtraAuthentication(BaseAuthentication):
    def authenticate(self, request):
        raise exceptions.AuthenticationFailed("Authentication failed")

    def authenticate_header(self, request):
        return "api"


class ExtraPermission(BasePermission):
    def has_permission(self, request, view):
        return False

    def has_object_permission(self, request, view, obj):
        return False


class ExtraThrottle(BaseThrottle):
    def allow_request(self, request, view):
        return False


class DemoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.UserInfo
        fields = "__all__"


class DemoView(ListModelMixin, CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, UpdateModelMixin,
               GenericViewSet):
    # authentication_classes = [ExtraAuthentication]
    # throttle_classes = [ExtraThrottle]
    # permission_classes = [ExtraPermission]
    queryset = models.UserInfo.objects.all()
    serializer_class = DemoSerializer

    def perform_create(self, serializer):
        if True:
            # Custom error
            # raise ExtraException("Data anomaly")
            raise ExtraException("Update failed", ret_code=9000)
        serializer.save()

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if response.exception:
            return response

        response.data = {'code': 0, 'data': response.data}
        return response
```



### 1.3 DRF Return Value Mechanism Source Code

![image-20240502155015927](/images/drf/drf-response-transaction-logging-03.png)



## 2. Transactions

### 2.1 Local Transactions (*)



Based on context management: if an exception occurs, it automatically rolls back; if there is no exception, it automatically commits.

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from api import models


class Demo1View(APIView):
    def get(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                models.UserInfo.objects.create(name='v1', age=1)
                models.Order.objects.create(name='v1', age=1)
        except Exception as e:
            print("Exception, auto-rollback")

        return Response("...")
```



The callback function for transaction commit (essentially, after the transaction completes, a function is automatically executed):

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from api import models
from functools import partial


def db_success_callback(*args, **kwargs):
    print(args, **kwargs)

class Demo1View(APIView):
    def get(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # Callback function, automatically executed on successful transaction commit
                transaction.on_commit(db_success_callback)
                transaction.on_commit( partial(db_success_callback, 11, 22, 33) )

                models.UserInfo.objects.create(name='v1', age=1)
                models.Order.objects.create(title='v1', count=1)
        except Exception as e:
            print("Exception, auto-rollback") # Exceptions inside on_commit callbacks will not trigger rollback

        return Response("...")
```





Roll back to a specified savepoint:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from api import models


class Demo1View(APIView):
    def get(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # Callback function, automatically executed on successful transaction commit
                n1 = transaction.savepoint()
                models.UserInfo.objects.create(name='v1', age=1)
                n2 = transaction.savepoint()
                models.UserInfo.objects.create(name='v2', age=1)

                # Must be inside the transaction; rollback to the specified savepoint so subsequent changes are not committed
                transaction.savepoint_rollback(n2)
        except Exception as e:
            print("Exception, auto-rollback", e)  # Exceptions inside on_commit callbacks will not trigger rollback

        return Response("...")
```











### 2.2 View Transactions



Enable a transaction for the entire view:

- If a database operation raises an exception inside the view, it automatically rolls back.
- If other exceptions occur inside the view, it will not roll back.

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction, IntegrityError
from api import models


class Demo1View(APIView):

    @transaction.atomic
    def get(self, request, *args, **kwargs):
        try:
            models.UserInfo.objects.create(name='v100', age=1)
            models.UserInfo.objects.create(name="v200", age="xxx")  # Exception occurs, rollback, i.e., v100 will not be saved
            int("asdf")   # Exception occurs, no rollback, i.e., both records are saved to the database normally
        except Exception as e:
            pass
        return Response("...")

```





Define savepoints to customize the rollback position:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction, IntegrityError
from api import models


class Demo1View(APIView):

    @transaction.atomic
    def get(self, request, *args, **kwargs):
        try:
            models.UserInfo.objects.create(name='v10', age=1)
            n1 = transaction.savepoint()
            models.UserInfo.objects.create(name="v11", age=1)
            n2 = transaction.savepoint()
            models.UserInfo.objects.create(name='v12', age=1)
            n3 = transaction.savepoint()
            models.UserInfo.objects.create(name='v13', age=1)
            
            # After reading some values, if v12 should not have been created, you can actively roll back
            transaction.savepoint_rollback(n1)
        except Exception as e:
            print("Exception occurred", e)
        return Response("...")
```





### 2.3 Global Transactions

Low efficiency: generally not used in projects.



If you want to enable global transactions, you need to add one more parameter when connecting to the database:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'dbhot4',
        'USER': 'root',
        'PASSWORD': 'root123',
        'HOST': '127.0.0.1',
        'PORT': '3306',
        'ATOMIC_REQUESTS': True
    }
}
```

- As long as the view function raises an exception, no matter what the cause, it automatically rolls back.

  ```python
  class Demo1View(APIView):
      def get(self, request, *args, **kwargs):
          models.UserInfo.objects.create(name='v1', age=1)
          models.UserInfo.objects.create(xxxxxxx='v2', age=1) # Error
          return Response("...")
  ```

  ```python
  class Demo1View(APIView):
      def get(self, request, *args, **kwargs):
          models.UserInfo.objects.create(name='v1', age=1)
          models.UserInfo.objects.create(name='v2', age=1)
          int("asdf")  # Error
          return Response("...")
  ```

- If the view function runs without errors (handling exceptions with `try` also counts as not raising an error), it will not roll back.

  ```python
  class Demo1View(APIView):
      def get(self, request, *args, **kwargs):
          try:
              models.UserInfo.objects.create(name='v1', age=1)
              models.UserInfo.objects.create(xxxxxxx='v2', age=1)
              int("xxx")
          except Exception as e:
              pass
          return Response("...")
  
  # The view function executed without error, no rollback.
  ```





If global transactions are enabled and you want to exempt a specific function from being wrapped in a transaction, you can use:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction, IntegrityError
from api import models
from django.utils.decorators import method_decorator


@method_decorator(transaction.non_atomic_requests, name='dispatch')
class Demo1View(APIView):

    def get(self, request, *args, **kwargs):
        models.UserInfo.objects.create(name='v100', age=1)
        models.UserInfo.objects.create(name="v200", age="xxx") # Error
        return Response("...")
```





## 3. Logging

When is logging used?

- For predictable situations, write logs.
- For unpredictable situations, write logs.



### 3.1 Basic Version

```python
CRITICAL = 50
FATAL = CRITICAL
ERROR = 40
WARNING = 30
WARN = WARNING
INFO = 20
DEBUG = 10
NOTSET = 0
```

```python
import logging

# 1. Configure logging
logging.basicConfig(
    filename='error.log',  # Log file
    format='%(asctime)s :  %(message)s',  # Format when writing logs.
    datefmt='%Y-%m-%d %H:%M:%S %p',
    level=20  # Level; only messages with a level greater than 20 will actually be written to the file.
)

# 2. Write logs
"""
CRITICAL = 50
FATAL = CRITICAL
ERROR = 40
WARNING = 30
WARN = WARNING
INFO = 20
DEBUG = 10
NOTSET = 0
"""
logging.debug("Hello")  # 10, Hello
logging.info("Good afternoon")  # 10, Good afternoon
logging.error("Are you silly")  # 40, Are you silly
```

![image-20230115005930027](/images/drf/drf-response-transaction-logging-04.png)





By default, this form does not support writing logs to a file:

```python
import logging
import traceback

# 1. Configure logging
logging.basicConfig(
    filename='v10.log',  # Log file
    format='%(asctime)s :  %(message)s',  # Format when writing logs.
    datefmt='%Y-%m-%d %H:%M:%S %p',
    level=20  # Level; only messages with a level greater than 20 will actually be written to the file.
)

# 2. Configure logging (ineffective because the configuration is already in memory and cannot be reset)
logging.basicConfig(
    filename='v100.log',  # Log file
    format='%(asctime)s :  %(message)s',  # Format when writing logs.
    datefmt='%Y-%m-%d %H:%M:%S %p',
    level=20  # Level; only messages with a level greater than 20 will actually be written to the file.
)


logging.error("silly alex")
```



### 3.2 Object Version (Supports Multiple Files)

- Formatter: formats the log.

- FileHandler: maintains the file, specifically used to write content to a file.

- Logger: defines a level; only messages above this level trigger the FileHandler to write content.

- Write logs.

  ```python
  logger = Logger()
  logger.error("content") # 10 "xxx"
  ```



Example 1:

```python
import logging

# Define Formatter
fmt = logging.Formatter(fmt="%(asctime)s - %(name)s - %(levelname)s -%(module)s:  %(message)s")

# Define FileHandler
handler_object = logging.FileHandler('v2.log', 'a', encoding='utf-8')
handler_object.setFormatter(fmt)

# Define Logger
logger_object = logging.Logger('s1', level=logging.INFO)  # 20
logger_object.addHandler(handler_object)

# ===> Write logs <====
logger_object.error("alex") # 40>20, so it will be written to the log
```



Example 2:

```python
import logging

# Define Formatter
fmt = logging.Formatter(fmt="%(asctime)s - %(name)s - %(levelname)s -%(module)s:  %(message)s")

# Define FileHandler
handler_object = logging.FileHandler('v2.log', 'a', encoding='utf-8')
handler_object.setFormatter(fmt)

handler_object2 = logging.FileHandler('v22.log', 'a', encoding='utf-8')
handler_object2.setFormatter(fmt)

# Define Logger
logger_object = logging.Logger('s1', level=logging.INFO)  # 20
logger_object.addHandler(handler_object)
logger_object.addHandler(handler_object2)

# Write logs
logger_object.error("alex")
```









### 3.3 Configuration Version



#### Example 1: Simple Configuration

```python
import logging.config

# 1. Define the dict
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,  # Delete existing handlers from other loggers
    'formatters': {
        'standard': {
            'format': '{asctime} {levelname} ：{message}',
            'style': '{',
            "datefmt": '%Y-%m-%d %H:%M:%S %p',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
        },
        'demo': {
            "class": 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': 'demo.log',
            # 'maxBytes': 10240,  # Split log by file size (bytes)
            # 'backupCount': 30,  # 5 (how many historical log files to keep)
            "encoding": "utf-8"
        }
    },
    'loggers': {
        'nb': {
            'handlers': ['console', 'demo'],
            'level': "INFO",  # >=20 triggers logging
            'propagate': False
        }
    }
}

# 2. Configure logging according to custom settings
logging.config.dictConfig(LOGGING_CONFIG)

# 3. Write logs
logger_object = logging.getLogger("nb")
logger_object.info('6666666666')
```



#### Example 2: Multi-File Configuration

```python
import logging.config

# 1. Define the dict
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,  # Delete existing handlers from other loggers
    'formatters': {
        'standard': {
            'format': '{asctime} {levelname} {threadName} ：{message}',
            'style': '{',
            "datefmt": '%Y-%m-%d %H:%M:%S %p',
        },
        'simple': {
            'format': '%(asctime)s %(levelname)s  %(message)s',
            'style': '%',
            "datefmt": '%Y-%m-%d',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'run': {
            # Runtime log, auto-split by day
            "class": 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'standard',
            'filename': "run.log",
            'when': 'D',  # Split log by day
            'interval': 1,  # 1 day
            'backupCount': 3,  # Keep backups
            "encoding": "utf-8"
        },
        'error': {
            # Error log, split by file size
            "class": 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': 'error.log',
            'maxBytes': 1024 * 1025 * 50,  # Split log by file size 50M
            'backupCount': 5,
            "encoding": "utf-8"
        },
    },
    'loggers': {
        'run': {
            'handlers': ['run'],
            'level': "INFO",  # >=20 triggers logging
            'propagate': True
        },
        'error': {
            'handlers': ['console', 'error'],
            'level': "ERROR",  # >=20 triggers logging
            'propagate': False
        }
    },
    'root': {
        'handlers': ['console', ],
        'level': 'DEBUG',
        'propagate': True
    }
}

# 2. Configure logging according to custom settings
logging.config.dictConfig(LOGGING_CONFIG)

# 3. Write logs
# root = logging.getLogger()
# root.info("test test")

# run = logging.getLogger('run')
# run.info("test test")

# run = logging.getLogger('error')
# run.info("has info")
# run.error("error occurred")
```



#### Example 3: Filtering

```python
import logging


class CallbackFilter(logging.Filter):
    def __init__(self, callback):
        self.callback = callback

    def filter(self, record):
        if self.callback(record):
            return True
        return False


class DynamicFilter(logging.Filter):
    def filter(self, record):
        # record contains the log-related object logging.LogRecord
        # print(record, type(record))
        if not record.msg:
            return False
        return True
```



```python
import logging.config

# 1. Define the dict
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": True,  # Delete existing handlers from other loggers
    'formatters': {
        'standard': {
            'format': '{asctime} {levelname} {threadName} ：{message}',
            'style': '{',
            "datefmt": '%Y-%m-%d %H:%M:%S %p',
        },
        'simple': {
            'format': '%(asctime)s %(levelname)s  %(message)s',
            'style': '%',
            "datefmt": '%Y-%m-%d',
        },
    },
    "filters": {
        "dy": {
            "()": "utils.DynamicFilter"
        },
        "call": {
            "()": "utils.CallbackFilter",
            "callback": lambda record: len(record.msg) > 4
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'run': {
            # Runtime log, auto-split by day
            "class": 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'standard',
            'filters': ['', 'call'],
            'filename': "run.log",
            'when': 'D',  # Split log by day
            'interval': 1,  # 1 day
            'backupCount': 3,  # Keep backups
            "encoding": "utf-8"
        },
        'error': {
            # Error log, split by file size
            "class": 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': 'error.log',
            'maxBytes': 1024 * 1025 * 50,  # Split log by file size 50M
            'backupCount': 5,
            "encoding": "utf-8"
        },
    },
    'loggers': {
        'run': {
            'handlers': ['run'],
            'level': "INFO",  # >=20 triggers logging
            'propagate': True
        },
        'error': {
            'handlers': ['console', 'error'],
            'level': "ERROR",  # >=20 triggers logging
            'propagate': False
        }
    },
    'root': {
        'handlers': ['console', ],
        'level': 'DEBUG',
        'propagate': True
    }
}

# 2. Configure logging according to custom settings
logging.config.dictConfig(LOGGING_CONFIG)

# 3. Write logs
run = logging.getLogger('run')
run.info("test test xxxxx")
```



### 3.4 Django

```python
###########
# LOGGING #
###########
import os
BASE_LOG_DIR = BASE_DIR / 'log'
BASE_LOG_DIR.mkdir(exist_ok=True)

# The callable to use to configure logging
LOGGING_CONFIG = "logging.config.dictConfig"

# Custom logging configuration.
# 1. Define the dict
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,  # Delete existing handlers from other loggers
    'formatters': {
        'standard': {
            'format': '{asctime} {levelname} {threadName} ：{message}',
            'style': '{',
            "datefmt": '%Y-%m-%d %H:%M:%S %p',
        },
        'simple': {
            'format': '%(asctime)s %(levelname)s  %(message)s',
            'style': '%',
            "datefmt": '%Y-%m-%d',
        },
    },
    # "filters": {
    #     "dy": {
    #         "()": "django.utils.log.RequireDebugFalse"
    #     },
    #     "call": {
    #         "()": "django.utils.log.CallbackFilter",
    #         "callback": lambda record: len(record.msg) > 4
    #     }
    # },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'run': {
            # Runtime log, auto-split by day
            "class": 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'standard',
            # 'filters': ["dy", 'call'],
            'filename': os.path.join(BASE_LOG_DIR, 'run.log'),
            'when': 'D',  # Split log by day
            'interval': 1,  # 1 day
            'backupCount': 3,  # Keep backups
            "encoding": "utf-8"
        },
        'error': {
            # Error log, split by file size
            "class": 'logging.handlers.RotatingFileHandler',
            'formatter': 'standard',
            'filename': os.path.join(BASE_LOG_DIR, 'error.log'),
            'maxBytes': 1024 * 1025 * 50,  # Split log by file size 50M
            'backupCount': 5,
            "encoding": "utf-8"
        },
    },
    'loggers': {
        'run': {
            'handlers': ['run'],
            'level': "INFO",  # >=20 triggers logging
            'propagate': True
        },
        'error': {
            'handlers': ['console', 'error'],
            'level': "ERROR",  # >=40 triggers logging
            'propagate': False
        }
    },
    'root': {
        'handlers': ['console', ],
        'level': 'DEBUG',
        'propagate': True
    }
}
```

```python
logger = logging.getLogger("error")
logger.error("...")
```

```python
logger = logging.getLogger("run")
logger.info("...")
```

```python
logger = logging.getLogger()
logger.info("...")
```



### 3.5 Splitting Logs by File Size in Django

In your `settings.py`.

```python
LOGS_DIRS = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOGS_DIRS):
    os.makedirs(LOGS_DIRS)

# Logging
LOGGING = {
    'version': 1,  # Version of the logging module used. Currently only version 1 is provided officially, but it may be upgraded in the future. To avoid version issues during upgrades, it is fixed to 1 here
    'disable_existing_loggers': False,  # Whether to disable other existing logging functions? Definitely not, because some third-party modules may be using them. If disabled, third-party modules cannot catch their own exceptions.
    'formatters': {  # Log format settings; verbose and simple are both custom
        'verbose': {  # Detailed format, suitable for logging when developers are not present.
            # Format definition: https://docs.python.org/3/library/logging.html#logrecord-attributes
            # levelname log level
            # asctime occurrence time
            # module file name
            # process process ID
            # thread thread ID
            # message exception info
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',  # Variable format delimiter
        },
        'simple': {  # Simple format, suitable for terminal output when developers are present
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {  # Filters
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {  # Log processing flow; console and mail_admins are both custom.
        'console': {
            'level': 'DEBUG',  # Set the minimum log level for the current log processing flow
            'filters': ['require_debug_true'],  # Log filtering for the current log processing flow
            'class': 'logging.StreamHandler',  # Core class for the current log processing flow; StreamHandler helps output log info to the terminal
            'formatter': 'simple'  # Log format for the current log processing flow
        },
        # 'mail_admins': {
        #     'level': 'ERROR',                  # Set the minimum log level for the current log processing flow
        #     'class': 'django.utils.log.AdminEmailHandler',  # AdminEmailHandler can help output log info to the administrator's email.
        #     'filters': ['special']             # Log filtering for the current log processing flow
        # }
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            # Log path, log file name; the logs directory must be created manually
            'filename': '%s/django.log' % LOGS_DIRS,
            # Maximum size of a single log file; set to 300M here
            'maxBytes': 300 * 1024 * 1024,
            # Number of backup log files; set maximum to 10
            'backupCount': 10,
            # Log format: detailed format
            'formatter': 'verbose',
            'encoding': 'utf-8',  # Log output encoding
        },
    },
    'loggers': {  # Log processing namespace
        'django': {
            'handlers': ['console', 'file'],  # Which log processing flows to call when writing logs under the django namespace
            'propagate': True,  # Whether to bubble up and notify other logging functions after the django namespace log processing flow ends. True means allowed
        },
    }
}

```

A solution to permission errors when splitting log files, using Windows as an example.

1.   Install the module: `pip install concurrent-log-handler`

2.   Modify the existing configuration entries as follows:

```python
# Which folder to save logs to? Here it will auto-create under the logs folder in the project root
LOGS_DIRS = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOGS_DIRS):
    os.makedirs(LOGS_DIRS)

# Split logs by file size
LOGGING = {
    'version': 1,  # Version of the logging module used. Currently only version 1 is provided officially, but it may be upgraded in the future. To avoid version issues during upgrades, it is fixed to 1 here
    'disable_existing_loggers': False,  # Whether to disable other existing logging functions? Definitely not, because some third-party modules may be using them. If disabled, third-party modules cannot catch their own exceptions.
    'formatters': {  # Log format settings; verbose and simple are both custom
        'verbose': {  # Detailed format, suitable for logging when developers are not present.
            # Format definition: https://docs.python.org/3/library/logging.html#logrecord-attributes
            # levelname log level
            # asctime occurrence time
            # module file name
            # process process ID
            # thread thread ID
            # message exception info
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',  # Variable format delimiter
        },
        'simple': {  # Simple format, suitable for terminal output when developers are present
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {  # Filters
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {  # Log processing flow; console and mail_admins are both custom.
        'console': {
            'level': 'DEBUG',  # Set the minimum log level for the current log processing flow
            'filters': ['require_debug_true'],  # Log filtering for the current log processing flow
            'class': 'logging.StreamHandler',  # Core class for the current log processing flow; StreamHandler helps output log info to the terminal
            'formatter': 'simple'  # Log format for the current log processing flow
        },
        # 'mail_admins': {
        #     'level': 'ERROR',                  # Set the minimum log level for the current log processing flow
        #     'class': 'django.utils.log.AdminEmailHandler',  # AdminEmailHandler can help output log info to the administrator's email.
        #     'filters': ['special']             # Log filtering for the current log processing flow
        # }
        'file': {
            'level': 'INFO',
            # 'class': 'logging.handlers.RotatingFileHandler',  # Default: split logs by file size
            'class': 'concurrent_log_handler.ConcurrentRotatingFileHandler',  # Install and use concurrent-log-handler under Windows
            # 'class': 'cloghandler.ConcurrentRotatingFileHandler',  # Install and use ConcurrentLogHandler on Linux
            'delay': True,  # Also add the delay parameter
            # Log path, log file name; the logs directory must be created manually
            'filename': '%s/django.log' % LOGS_DIRS,
            # Maximum size of a single log file; set to 300M here
            # 'maxBytes': 300 * 1024 * 1024,
            'maxBytes': 0.1 * 1024 * 1024,
            # Number of backup log files; set maximum to 10
            'backupCount': 10,
            # Log format: detailed format
            'formatter': 'verbose',
            'encoding': 'utf-8',  # Log output encoding
        },
    },
    'loggers': {  # Log processing namespace
        'django': {
            'handlers': ['console', 'file'],  # Which log processing flows to call when writing logs under the django namespace
            'propagate': True,  # Whether to bubble up and notify other logging functions after the django namespace log processing flow ends. True means allowed
        },
    }
}
```

![image-20240307134506546](/images/drf/drf-response-transaction-logging-05.png)

### 3.6 Splitting Logs by Time in Django

In your `settings.py`.

```python
LOGS_DIRS = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOGS_DIRS):
    os.makedirs(LOGS_DIRS)

# Logging
LOGGING = {
    'version': 1,  # Version of the logging module used. Currently only version 1 is provided officially, but it may be upgraded in the future. To avoid version issues during upgrades, it is fixed to 1 here
    'disable_existing_loggers': False,  # Whether to disable other existing logging functions? Definitely not, because some third-party modules may be using them. If disabled, third-party modules cannot catch their own exceptions.
    'formatters': {  # Log format settings; verbose and simple are both custom
        'verbose': {  # Detailed format, suitable for logging when developers are not present.
            # Format definition: https://docs.python.org/3/library/logging.html#logrecord-attributes
            # levelname log level
            # asctime occurrence time
            # module file name
            # process process ID
            # thread thread ID
            # message exception info
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',  # Variable format delimiter
        },
        'simple': {  # Simple format, suitable for terminal output when developers are present
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {  # Filters
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {  # Log processing flow; console and mail_admins are both custom.
        'console': {
            'level': 'DEBUG',  # Set the minimum log level for the current log processing flow
            'filters': ['require_debug_true'],  # Log filtering for the current log processing flow
            'class': 'logging.StreamHandler',  # Core class for the current log processing flow; StreamHandler helps output log info to the terminal
            'formatter': 'simple'  # Log format for the current log processing flow
        },
        # 'mail_admins': {
        #     'level': 'ERROR',                  # Set the minimum log level for the current log processing flow
        #     'class': 'django.utils.log.AdminEmailHandler',  # AdminEmailHandler can help output log info to the administrator's email.
        #     'filters': ['special']             # Log filtering for the current log processing flow
        # }
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            # Log path, log file name; the logs directory must be created manually
            'filename': '%s/django.log' % LOGS_DIRS,
            # TimedRotatingFileHandler parameters
            # Currently set to one log file per day
            # 'S'         |  sec
            # 'M'         |  min
            # 'H'         |  hour
            # 'D'         |  day
            # 'W0'-'W6'   |  Mon-Sun
            # 'midnight'  |  midnight
            'when': 'S',  # Interval type; do not run tests on Windows if set to seconds
            'interval': 5,  # Time interval
            'backupCount': 5,  # How many log files to keep; old ones will be discarded if exceeded
            'encoding': 'utf-8',  # Log text encoding
        },
    },
    'loggers': {  # Log processing namespace
        'django': {
            'handlers': ['console', 'file'],  # Which log processing flows to call when writing logs under the django namespace
            'propagate': True,  # Whether to bubble up and notify other logging functions after the django namespace log processing flow ends. True means allowed
        },
    }
}
```

If splitting by date reports an error on Windows, it is recommended not to use time-based log splitting on Windows; just use file-size-based splitting instead. Additionally, the default date-based splitting configuration only reports an error on Windows and works fine on Linux.

Finally, the recommendation is: whether on Windows or Linux, if you don't want errors, just use file-size-based splitting for everything.
