# Members and Member Modifiers

## 1. Members

All members in object-oriented programming are as follows:

- Variables
  - Instance variables
  - Class variables
- Methods
  - Bound methods
  - Class methods
  - Static methods
- Properties

When programming with object orientation, you will encounter many situations and use different members to handle them. Next, we will introduce the characteristics and use cases of each member one by one.



### 1.1 Variables

- Instance variables belong to the object; each object maintains its own data.
- Class variables belong to the class and can be shared by all objects. They are generally used to provide common data to objects (similar to global variables).





```python
class Person(object):
    country = "中国"

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show(self):
        # message = "{}-{}-{}".format(Person.country, self.name, self.age)
        message = "{}-{}-{}".format(self.country, self.name, self.age)
        print(message)

print(Person.country) # 中国


p1 = Person("wilson",20)
print(p1.name)
print(p1.age)
print(p1.country) # 中国

p1.show() # 中国-wilson-20
```

Tip: When the same instance variable exists in every object, you can choose to move it into a class variable instead, so that objects do not maintain multiple copies of identical data.



#### Common Mistakes & Interview Questions

Question 1: Note the difference between reading and writing.



```python
class Person(object):
    country = "中国"

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show(self):
        message = "{}-{}-{}".format(self.country, self.name, self.age)
        print(message)

print(Person.country) # 中国

p1 = Person("wilson",20)
print(p1.name) # wilson
print(p1.age) # 20
print(p1.country) # 中国
p1.show() # 中国-wilson-20

p1.name = "root"     # 在对象p1中讲name重置为root
p1.num = 19          # 在对象p1中新增实例变量 num=19
p1.country = "china" # 在对象p1中新增实例变量 country="china"

print(p1.country)   # china
print(Person.country) # 中国
```

```python
class Person(object):
    country = "中国"

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show(self):
        message = "{}-{}-{}".format(self.country, self.name, self.age)
        print(message)

print(Person.country) # 中国

Person.country = "美国"


p1 = Person("wilson",20)
print(p1.name) # wilson
print(p1.age) # 20
print(p1.country) # 美国
```





Question 2: Reading and writing in an inheritance relationship



```python
class Base(object):
    country = "中国"


class Person(Base):

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def show(self):
        message = "{}-{}-{}".format(Person.country, self.name, self.age)
        # message = "{}-{}-{}".format(self.country, self.name, self.age)
        print(message)


# 读
print(Base.country) # 中国
print(Person.country) # 中国

obj = Person("wilson",19)
print(obj.country) # 中国

# 写
Base.country = "china"
Person.country = "泰国"
obj.country = "日本"
```

Interview question

```python
class Parent(object):
    x = 1


class Child1(Parent):
    pass


class Child2(Parent):
    pass


print(Parent.x, Child1.x, Child2.x) # 1 1 1

Child1.x = 2
print(Parent.x, Child1.x, Child2.x) # 1 2 1

Parent.x = 3
print(Parent.x, Child1.x, Child2.x) # 3 2 3
```



### 1.2 Methods

- Bound method: has a `self` parameter by default, called by an object (in this case, `self` equals the object calling the method). [Callable by both object and class]
- Class method: has a `cls` parameter by default, callable by either a class or an object (in this case, `cls` equals the class calling the method). [Callable by both object and class]
- Static method: has no default parameters, callable by both class and object. [Callable by both object and class]



```python
class Foo(object):

    def __init__(self, name,age):
        self.name = name
        self.age = age

    def f1(self):
        print("绑定方法", self.name)

    @classmethod
    def f2(cls):
        print("类方法", cls)

    @staticmethod
    def f3():
        print("静态方法")
        
# 绑定方法（对象）
obj = Foo("wilson",20)
obj.f1() # Foo.f1(obj)


# 类方法
Foo.f2()  # cls就是当前调用这个方法的类。（类）
obj.f2()  # cls就是当前调用这个方法的对象的类。


# 静态方法
Foo.f3()  # 类执行执行方法（类）
obj.f3()  # 对象执行执行方法
```

Python is quite flexible here — methods can be called through both objects and classes. In languages like Java and C#, however, bound methods can only be called by objects, while class methods and static methods can only be called by classes.

```python
import os
import requests


class Download(object):

    def __init__(self, folder_path):
        self.folder_path = folder_path

    @staticmethod
    def download_dou_yin():
        # 下载抖音
        res = requests.get('.....')

        with open("xxx.mp4", mode='wb') as f:
            f.write(res.content)

    def download_dou_yin_2(self):
        # 下载抖音
        res = requests.get('.....')
        path = os.path.join(self.folder_path, 'xxx.mp4')
        with open(path, mode='wb') as f:
            f.write(res.content)


obj = Download("video")
obj.download_dou_yin()

```

Interview question:

What is the purpose of @classmethod and @staticmethod in a class?



### 1.3 Properties

A property is actually created by combining a bound method with a special decorator, allowing us to call the method without parentheses in the future. For example:

```python
class Foo(object):

    def __init__(self, name):
        self.name = name

    def f1(self):
        return 123

    @property
    def f2(self):
        return 123


obj = Foo("wilson")

v1 = obj.f1()
print(v1)

v2 = obj.f2
print(v2)
```



Example: Using the pagination feature developed earlier.

```python
class Pagination:
    def __init__(self, current_page, per_page_num=10):
        self.per_page_num = per_page_num
        
        if not current_page.isdecimal():
            self.current_page = 1
            return
        current_page = int(current_page)
        if current_page < 1:
            self.current_page = 1
            return
        self.current_page = current_page
	
    def start(self):
        return (self.current_page - 1) * self.per_page_num
	
    def end(self):
        return self.current_page * self.per_page_num


user_list = ["用户-{}".format(i) for i in range(1, 3000)]

# 分页显示，每页显示10条
while True:
    page = input("请输入页码：")
	
    # page，当前访问的页码
    # 10，每页显示10条数据
	# 内部执行Pagination类的init方法。
    pg_object = Pagination(page, 20)
    
    page_data_list = user_list[ pg_object.start() : pg_object.end() ]
    for item in page_data_list:
        print(item)
```

```python
class Pagination:
    def __init__(self, current_page, per_page_num=10):
        self.per_page_num = per_page_num

        if not current_page.isdecimal():
            self.current_page = 1
            return
        current_page = int(current_page)
        if current_page < 1:
            self.current_page = 1
            return
        self.current_page = current_page

    @property
    def start(self):
        return (self.current_page - 1) * self.per_page_num

    @property
    def end(self):
        return self.current_page * self.per_page_num


user_list = ["用户-{}".format(i) for i in range(1, 3000)]

# 分页显示，每页显示10条
while True:
    page = input("请输入页码：")

    pg_object = Pagination(page, 20)
    page_data_list = user_list[ pg_object.start : pg_object.end ]
    
    for item in page_data_list:
        print(item)
```



In fact, apart from the examples we wrote, properties can also be found in the source code of many modules and frameworks — for example, the requests module.

```python
import requests

# 内部下载视频，并将下载好的数据分装到Response对象中。
res = requests.get(
    url="https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v0200f240000buuer5aa4tij4gv6ajqg",
    headers={
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 FS"
    }
)

# 去对象中获取text，其实需要读取原始文本字节并转换为字符串
res.text
```



There are two ways to write properties:

- Method one: based on the decorator

  ```python
  class C(object):
      
      @property
      def x(self):
          pass
      
      @x.setter
      def x(self, value):
          pass
      
      @x.deleter
      def x(self):
  		pass
          
  obj = C()
  
  obj.x
  obj.x = 123
  del obj.x
  ```

- Method two: based on defining a variable

  ```python
  class C(object):
      
      def getx(self): 
  		pass
      
      def setx(self, value): 
  		pass
          
      def delx(self): 
  		pass
          
      x = property(getx, setx, delx, "I'm the 'x' property.")
      
  obj = C()
  
  obj.x
  obj.x = 123
  del obj.x
  ```

  

A glimpse at Django source code:

```python
class WSGIRequest(HttpRequest):
    def __init__(self, environ):
        script_name = get_script_name(environ)
        # If PATH_INFO is empty (e.g. accessing the SCRIPT_NAME URL without a
        # trailing slash), operate as if '/' was requested.
        path_info = get_path_info(environ) or '/'
        self.environ = environ
        self.path_info = path_info
        # be careful to only replace the first slash in the path because of
        # http://test/something and http://test//something being different as
        # stated in https://www.ietf.org/rfc/rfc2396.txt
        self.path = '%s/%s' % (script_name.rstrip('/'),
                               path_info.replace('/', '', 1))
        self.META = environ
        self.META['PATH_INFO'] = path_info
        self.META['SCRIPT_NAME'] = script_name
        self.method = environ['REQUEST_METHOD'].upper()
        # Set content_type, content_params, and encoding.
        self._set_content_type_params(environ)
        try:
            content_length = int(environ.get('CONTENT_LENGTH'))
        except (ValueError, TypeError):
            content_length = 0
        self._stream = LimitedStream(self.environ['wsgi.input'], content_length)
        self._read_started = False
        self.resolver_match = None

    def _get_scheme(self):
        return self.environ.get('wsgi.url_scheme')

    def _get_post(self):
        if not hasattr(self, '_post'):
            self._load_post_and_files()
        return self._post

    def _set_post(self, post):
        self._post = post

    @property
    def FILES(self):
        if not hasattr(self, '_files'):
            self._load_post_and_files()
        return self._files

    POST = property(_get_post, _set_post)
```



Finally, a supplement about properties:

Because properties and instance variables are called in the same way, be careful when writing them: the property name should not conflict with an instance variable name.

```python
class Foo(object):

    def __init__(self, name, age):
        self.name = name
        self.age = age

    @property
    def func(self):
        return 123


obj = Foo("wilson", 123)
print(obj.name)
print(obj.func)
```



If the names do conflict, errors may occur.

```python
class Foo(object):

    def __init__(self, name, age):
        self.name = name  # 报错，错认为你想要调用 @name.setter 装饰的方法。
        self.age = age

    @property
    def name(self):
        return "{}-{}".format(self.name, self.age)


obj = Foo("wilson", 123)
```



```python
class Foo(object):

    def __init__(self, name, age):
        self.name = name 
        self.age = age

    @property
    def name(self):
        return "{}-{}".format(self.name, self.age) # 报错，循环调用自己（直到层级太深报错）

    @name.setter
    def name(self, value):
        print(value)


obj = Foo("wilson", 123)
print(obj.name)
```



**If you really want to create some relationship in the names, you can prefix the instance variable with an underscore.**

```python
class Foo(object):

    def __init__(self, name, age):
        self._name = name
        self.age = age

    @property
    def name(self):
        return "{}-{}".format(self._name, self.age)


obj = Foo("wilson", 123)
print(obj._name)
print(obj.name)
```



## 2. Member Modifiers

Member modifiers in Python refer to public and private members.

- Public: the member can be called from anywhere.

- Private: the member can only be called inside the class (a member whose name starts with **two underscores** is private).

  Python uses name mangling to wrap the private attribute `__name` as `_classname__attr`, i.e., `_Foo__name`

Example 1:

```python
class Foo(object):

    def __init__(self, name, age):
        self.__name = name
        self.age = age

    def get_data(self):
        return self.__name

    def get_age(self):
        return self.age


obj = Foo("wilson", 123)


# 公有成员
print(obj.age)
v1 = self.get_age()
print(v1)

# 私有成员
# print(obj.__name) # 错误，由于是私有成员，只能在类中进行使用。
v2 = obj.get_data()
print(v2)
```



Example 2:

```python
class Foo(object):

    def get_age(self):
        print("公有的get_age")

    def __get_data(self):
        print("私有的__get_data方法")

    def proxy(self):
        print("公有的proxy")
        self.__get_data()


obj = Foo()
obj.get_age()

obj.proxy()
```



Example 3:

```python
class Foo(object):

    @property
    def __name(self):
        print("公有的get_age")

    @property
    def proxy(self):
        print("公有的proxy")
        self.__name
        return 1


obj = Foo()
v1 = obj.proxy
print(v1)

```



**Special note: private members of a parent class cannot be inherited by subclasses.**

```python
class Base(object):

    def __data(self):
        print("base.__data")

    def num(self):
        print("base.num")


class Foo(Base):

    def func(self):
        self.num()
        self.__data() # # 不允许执行父类中的私有方法


obj = Foo()
obj.func()

```

```python
class Base(object):

    def __data(self):
        print("base.__data")

    def num(self):
        print("base.num")
        self.__data()  # 不允许执行父类中的私有方法


class Foo(Base):

    def func(self):
        self.num()


obj = Foo()
obj.func()
```





Finally, strictly speaking, private members cannot be called from outside, but they can still be accessed with some special syntax (this pattern appears in the Flask source code, though it is not recommended for your own code).

```python
class Foo(object):

    def __init__(self):
        self.__num = 123
        self.age = 19

    def __msg(self):
        print(1234)


obj = Foo()
print(obj.age)
print(obj._Foo__num)
obj._Foo__msg()
```



Whether a member should be exposed to the outside as an independent feature for external callers to use.

- If yes, make it public.
- If no — it is only a helper for other internal members — make it private.

