# DRF Authentication, Permissions, Throttling, and Versioning

## 1. Frontend-Backend Separation

![image-20220903102113338](assets/image-20220903102113338.png)



## 2. FBV and CBV

- FBV, function-based views, essentially means writing functions to handle business requests.

  ```python
  from django.urls import path
  from app01 import views
  urlpatterns = [
      path('users/', views.users),
  ]
  ```

  ```python
  from django.http import JsonResponse
  
  def users(request, *args, **kwargs):
      if request.method == "GET":
          return JsonResponse({"code":1000,"data":"xxx"})
      elif request.method == 'POST':
          return JsonResponse({"code":1000,"data":"xxx"})
      ...
  ```

- CBV, class-based views, essentially means writing classes to handle business requests.

  ```python
  from django.urls import path
  from app01 import views
  urlpatterns = [
      path('users/', views.UserView.as_view()),
  ]
  ```

  ```python
  from django.views import View
  
  class UserView(View):
      def get(self, request, *args, **kwargs):
          return JsonResponse({"code": 1000, "data": "xxx"})
  
      def post(self, request, *args, **kwargs):
          return JsonResponse({"code": 1000, "data": "xxx"})
  ```

With CBV, you can easily distinguish the two methods via `GET` and `POST`. In fact, the underlying implementation of CBV and FBV is essentially the same.

Projects without frontend-backend separation commonly use FBV.

DRF projects support both modes, and CBV is commonly used.



## 3. DRF

The Django REST Framework builds on Django and provides us with many convenient features, making it easier to develop RESTful APIs based on Django.

DRF component overall flow: Versioning -> Authentication -> Permissions -> Throttling



### 3.1 DRF Project



```
pip install django
pip install djangorestframework
```



#### 3.1.1 Core Configuration

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "app01.apps.App01Config",
    'rest_framework',
]
```



#### 3.1.2 Routing

```python
from django.urls import path
from api import views

urlpatterns = [
    path('users/', views.UserView.as_view()),
]
```



#### 3.1.3 Views

```python
from rest_framework.views import APIView
from rest_framework.response import Response


class UserView(APIView):
    def get(self, request):
        return Response("...")
```



#### 3.1.4 DRF Request Entry Analysis

![image-20240501153451481](assets/image-20240501153451481.png)

### 3.2 Request and Parameters

The `request` in DRF is different from the `request` in Django; in fact, it re-wraps Django's request object.

![image-20240501121218606](assets/image-20240501121218606.png)

As you can see, in Django the request is a `WSGIRequest` object, while in DRF the request is a `rest_framework.request.Request` object.

#### 3.2.1 Parameters

- For plain routes, you can access the parameters passed in the request route via `self.kwargs`.

  ![image-20240501121814393](assets/image-20240501121814393.png)

- For routes containing regular expressions, you can access the route parameters via `self.args`.

  ![image-20240501122300016](assets/image-20240501122300016.png)

#### 3.2.2 The request Object

##### 1. Source Code Analysis

At the routing entry point `dispatch`, there is a function `initialize_request(request, *args, **kwargs)`.

![image-20240501123746747](assets/image-20240501123746747.png)

Now let's look at what the function `initialize_request(request, *args, **kwargs)` actually does.

This function takes the original Django request as a parameter and returns a `Request` object as well.

![image-20240501124034380](assets/image-20240501124034380.png)

In the source code of the `Request` object, the original Django `request` is assigned to `_request`.

![image-20240501124519485](assets/image-20240501124519485.png)

Additionally, there is a `__getattr__` method in the source code. Its purpose is: when you access a variable that does not exist in the class, this `__getattr__` method is invoked and its return value is used.

![image-20240501124701677](assets/image-20240501124701677.png)

In other words, you can access values inside the original Django request object via `request._request.xxx`.

You can also access values from both the DRF and Django request objects via `request.xxx`.

The principle behind `request.xxx` getting a value from the Django request object is: when the attribute is not found, the `__getattr__` method is executed, which uses reflection — at this point it is equivalent to executing `request._request.xxx`.

Flowchart:

![image-20210819150601089](assets/image-20210819150601089.png)



##### 2. Getting Values from the request Object

![image-20240501125645869](assets/image-20240501125645869.png)



### 3.3 Authentication

When developing APIs, some features require login to access while others do not. The authentication component in DRF is mainly used to implement this functionality.



#### 3.3.0 Three Return Values of the Authentication Component

- Authentication succeeds: returns the tuple `(user, auth)`, which is assigned to `request.user` and `request.auth` respectively.

  That is, `request.user = user, request.auth = auth`.

- Authentication fails: raises an exception and returns error information.

- Returns `None`.

**Note**: When multiple authentication classes are used in the authentication component, their `authenticate` methods are executed one by one in order:

- If a return value is produced (not `None`) whether authentication succeeds or fails, the subsequent authentication classes will not run.
- Only when the previous one returns `None` will the next authentication class be executed.
- If all authentication classes return `None`, then `request.user` and `request.auth` are both empty, i.e., the user is anonymous.

If you want anonymous users to be able to access views as well, you can configure this in `settings.py`. There are two ways to configure it.

- Set it to `None`.

  ![image-20240501140713358](assets/image-20240501140713358.png)

- Besides defining it as `None`, you can also define it as a function; `request.user` and `request.auth` will then correspond to the return values of the two functions respectively.

  ![image-20240501141250592](assets/image-20240501141250592.png)



#### 3.3.1 Single-View Usage

`authentication_classes` is a list, so multiple authentication components can be applied at once.

![image-20240501133058471](assets/image-20240501133058471.png)



#### 3.3.2 Multi-View Usage

In this case, you need to use DRF's global configuration. **(The authentication component class cannot be placed in the view's `view.py`, because importing `APIView` would cause a circular reference.)**

![image-20240501133711825](assets/image-20240501133711825.png)



#### 3.3.3 Combining Single-View and Multi-View

In DRF, by default, it first reads from the global configuration, then from the view class.

We can set the `authentication_classes` list of a specific view class to be empty.

![image-20240501134846789](assets/image-20240501134846789.png)



#### 3.3.4 Source Code Analysis



![image-20240501162055511](assets/image-20240501162055511.png)

### 3.4 Permissions

The configuration of the permission component is similar to the authentication component.

#### 3.4.0 Two Return Values of the Permission Component

- Has permission: returns `True`, and the program proceeds normally.
- No permission: returns `False`, and the program raises an exception.

#### 3.4.1 Single-View Usage

![image-20240501154905696](assets/image-20240501154905696.png)

#### 3.4.2 Multi-View Usage

![image-20240501155055984](assets/image-20240501155055984.png)

#### 3.4.3 Combining Single-View and Multi-View

In DRF, by default, it first reads from the global configuration, then from the view class.

We can set the `authentication_classes` list of a specific view class to be empty.

![image-20240501155423437](assets/image-20240501155423437.png)

#### 3.4.4 Relationships Among Multiple Permission Components

In DRF development, some endpoints must satisfy conditions A, B, and C simultaneously, while others only need to satisfy A or B or C. In such cases, you can use the permission component to express these conditions.

```python
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response


class DemoView(APIView):
    permission_classes = [权限类A, 权限类B, 权限类C]

    def get(self, request: Request):
        return Response({"status": True, "data": "OK"})
```

- AND relationship, supported by default: condition A AND condition B AND condition C, all must be satisfied.

  ```python
  class PermissionA(BasePermission):
      message = {"code": 1003, 'data': "无权访问"}	# 自定义错误信息
  
      def has_permission(self, request, view):
          if request.user.role == 2:
              return True
          return False
  ```

- OR relationship, custom implementation (easy to extend) (don't modify the source code; define a `check_permissions` method in the view function)

  ```python
  class APIView(View):
      def check_permissions(self, request):
          """
          Check if the request should be permitted.
          Raises an appropriate exception if the request is not permitted.
          """
      for permission in self.get_permissions():
          if permission.has_permission(request, self):	# 只要有一个是Ture，就有权限
              return
          return self.permission_denied(
              request,
              message=getattr(permission, 'message', None),
              code=getattr(permission, 'code', None)
          )
  ```



#### 3.4.5 Source Code Analysis

![image-20240501164709247](assets/image-20240501164709247.png)

#### Thought Question 1: Customizing the request Object

How do you customize the request object during development?

```python
class LoginView(APIView):
    
        def initialize_request(self, request, *args, **kwargs):
        """
        Returns the initial request object.
        """
        parser_context = self.get_parser_context(request)

        return Request(		# 定义一个类，替换这里的request
            request,
            parsers=self.get_parsers(),
            authenticators=self.get_authenticators(),
            negotiator=self.get_content_negotiator(),
            parser_context=parser_context
        )
```



#### Thought Question 2: What is the relationship between DRF's authentication and permission components and Django's middleware?

Middleware runs first, then the authentication and permission components run (much later than middleware).



### 3.5 Throttling

During development, if you don't want users to access an endpoint too frequently, you can use a throttling mechanism.

Throttling limits the frequency of user access. For example: a user can access at most 100 times per minute, or SMS verification codes can be sent 50 times per day, to prevent abuse.

- For anonymous users, use the user's IP as the unique identifier.
- For logged-in users, use the user's primary key, user ID, or name as the unique identifier.

![image-20240502091541849](assets/image-20240502091541849.png)



#### 3.5.0 Two Return Values of the Throttling Component

- Returns `True`: the current throttle class allows access, and the subsequent throttle classes continue to run.
- Returns `False`: the current throttle class does not allow access, and the subsequent throttle classes continue to run. After all throttle classes have run, all disallowed throttles are collected and the remaining wait time is calculated.
- Raises an exception: the current throttle class does not allow access, and the subsequent throttle classes will not run.



#### 3.5.1 Single-View Usage

![image-20240502090507786](assets/image-20240502090507786.png)

#### 3.5.2 Multi-View Usage

![image-20240502104742468](assets/image-20240502104742468.png)

#### 3.5.3 Combining Single-View and Multi-View

![image-20240502104821087](assets/image-20240502104821087.png)



#### 3.5.4 Configuring the Throttling Component

- Based on the throttle classes provided by DRF

  ![image-20240502091925735](assets/image-20240502091925735.png)

- Source code analysis of the throttle classes provided by DRF

  ![image-20240502102914790](assets/image-20240502102914790.png)

#### 3.5.5 Source Code Analysis

![image-20240502104319930](assets/image-20240502104319930.png)

**Global Configuration**

```python
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_CLASSES":["xxx.xxx.xx.限流类", ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "10/m",
        "xx":"100/h"
    }
}
```

### 3.6 Versioning

The RESTful specification requires that the backend API reflect a version.



#### 3.6.1 Passing the Version via GET Parameters

```python
from rest_framework.versioning import QueryParameterVersioning
```

- Single-View Usage

  ![image-20240502105555121](assets/image-20240502105555121.png)

- Multi-View Usage

  ```python
  # settings.py
  
  REST_FRAMEWORK = {
      "VERSION_PARAM": "version",	#定义URL中的参数值(一般都叫version)
      "DEFAULT_VERSION": "v1",	#默认version,可以自定义
      "ALLOWED_VERSIONS": ["v1", "v2", "v3"],
      "DEFAULT_VERSIONING_CLASS":"rest_framework.versioning.QueryParameterVersioning"
  }
  ```

  ![image-20240502105901409](assets/image-20240502105901409.png)

Source code execution flow:

![image-20210820105543193](assets/image-20210820105543193.png)





#### 3.6.2 Passing the Version via URL Path (*)

```python
from rest_framework.versioning import URLPathVersioning
```

![image-20240502110650845](assets/image-20240502110650845.png)



#### 3.6.3 Passing the Version via Request Header

````python
from rest_framework.versioning import AcceptHeaderVersioning
````

![image-20240502110937054](assets/image-20240502110937054.png)

#### 3.6.4 Source Code Analysis

![image-20240502113926511](assets/image-20240502113926511.png)



#### 3.6.5 Reverse-Generating URLs

Each versioning class also defines a `reverse` method, which is used to reverse-generate a URL and carry the relevant version information. For example:

![image-20210820105543193](assets/image-20210820105543193-3386187.png)

![image-20210820112152615](assets/image-20210820112152615.png)
