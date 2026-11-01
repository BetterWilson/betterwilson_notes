---
description: "Built-in Functions, Exceptions, Reflection. This section explains 8 built-in functions, all of which relate to object-oriented programming. So when you encounter the following situation later,"
---

# Built-in Functions, Exceptions, and Reflection


## 1. Supplementary Built-in Functions

This section explains 8 built-in functions, all of which relate to object-oriented programming.

- classmethod, staticmethod, and property.

- callable, whether it can be executed by appending parentheses.

  - Functions

    ```python
    def func():
        pass
    
    print( callable(func) ) # True
    ```

  - Classes

    ```python
    class Foo(object):
        pass
    
    print( callable(Foo) ) # True
    ```

  - Objects whose class defines a `__call__` method

    ```python
    class Foo(object):
    	pass
    
    obj = Foo()
    print( callable(obj) ) # False
    ```

    ```python
    class Foo(object):
    
        def __call__(self, *args, **kwargs):
            pass
        
    obj = Foo()
    print( callable(obj) ) # True
    ```

  So when you encounter the following situation later, the first thing to consider is that handler can be one of three things: a function, a class, or an object with a `__call__` method. Which one it actually is can only be determined by analyzing the call relationships in the code.

  ```python
  def do_something(handler):
      handler()
  ```

- super, looks up members upward according to the **MRO inheritance chain**.

  ```python
  class Top(object):
      def message(self, num):
          print("Top.message", num)
          
  class Base(Top):
      pass
  
  class Foo(Base):
  
      def message(self, num):
          print("Foo.message", num)
          super().message(num + 100)
  
  
  obj = Foo()
  obj.message(1)
  
  >>> Foo.message 1
  >>> Top.message 101
  ```

  ```python
  class Base(object):
  
      def message(self, num):
          print("Base.message", num)
          super().message(1000)
  
  
  class Bar(object):
  
      def message(self, num):
          print("Bar.message", num)
  
  
  class Foo(Base, Bar):
      pass
  
  
  obj = Foo()
  obj.message(1)
  
  >>> Base.message 1
  >>> Bar.message 1000
  ```

  ```python
  class A:
      def __init__(self):
          print("A")
  
  
  class B(A):
      def __init__(self):
          print("B")
          super().__init__()
  
  
  class C(A):
      def __init__(self):
          print("C")
          super().__init__()
  
  
  class D(B, C):
      def __init__(self):
          print("D")
          super().__init__()
  
  
  if __name__ == "__main__":
      d = D()
  ```

  ![image-20240511103953454](/images/python/ObjectOriented/image-20240511103953454.png)

  **Application Scenario**

  Suppose there is a class that already implements some functionality, but we want to extend it with a little more on top. Rewriting it from scratch would be cumbersome; in this case, we can use super.

  ```python
  info = dict() # {}
  info['name'] = "WuPeiqi"
  info["age"] = 18
  
  value = info.get("age")
  
  print(value)
  ```

  ```python
  class MyDict(dict):
  
      def get(self, k):
          print("Custom functionality")
          return super().get(k)
  
  
  info = MyDict()
  info['name'] = "WuPeiqi" # __setitem__
  info["age"] = 18       # __setitem__
  print(info)
  
  value = info.get("age")
  
  print(value)
  ```

  ![image-20210131150707551](/images/python/ObjectOriented/image-20210131150707551.png)

  

- type, gets the type of an object.

  ```python
  v1 = "WuPeiqi"
  result = type(v1)
  print(result) # <class 'str'>
  ```

  ```python
  v2 = "WuPeiqi"
  print( type(v2) == str )  # True
  
  v3 = [11, 22, 33] # list(...)
  print( type(v3) == list )  # True
  ```

  ```python
  class Foo(object):
      pass
  
  v4 = Foo()
  
  print( type(v4) == Foo )  # True
  ```

- isinstance, determines whether an object is an instance of a class or one of its subclasses.

  ```python
  class Top(object):
      pass
  
  
  class Base(Top):
      pass
  
  
  class Foo(Base):
      pass
  
  
  v1 = Foo()
  
  print( isinstance(v1, Foo) )   # True, object v1 is an instance of class Foo
  print( isinstance(v1, Base) )  # True, object v1 is an instance of a subclass of Base
  print( isinstance(v1, Top) )   # True, object v1 is an instance of a subclass of Top
  ```

  ```python
  class Animal(object):
      def run(self):
          pass
  
  class Dog(Animal):
      pass
  
  class Cat(Animal):
      pass
  
  data_list = [
      "alex",
      Dog(),
      Cat(),
  	"root"
  ]
  
  for item in data_list:
      if type(item) == Cat:
          item.run()
      elif type(item) == Dog:
          item.run()
      else:
          pass
      
  for item in data_list:
      if isinstance(item, Animal):
          item.run()
      else:
          pass
  ```

  

- issubclass, determines whether a class is a subclass (descendant) of another class.

  ```python
  class Top(object):
      pass
  
  
  class Base(Top):
      pass
  
  
  class Foo(Base):
      pass
  
  
  print(issubclass(Foo, Base))  # True
  print(issubclass(Foo, Top))   # True
  ```

  



## 2. Exception Handling

During development, when you encounter some `unpredictable` errors, or when you simply can't be bothered to add extra checks, you can choose to handle them with exception handling.

```python
import requests

while True:
    url = input("Please enter the URL of the webpage to download: ")
    res = requests.get(url=url)
    with open('content.txt', mode='wb') as f:
        f.write(res.content)
```

The code above for downloading a video runs normally under normal conditions, but if there is a network problem, the program will raise an error and fail to execute properly.

```python
try:
    res = requests.get(url=url)
except Exception as e:
    # Code block to execute when the above code raises an exception
print("Done")
```

```python
import requests

while True:
    url = input("Please enter the URL of the webpage to download: ")
    
    try:
        res = requests.get(url=url)
    except Exception as e:
        print("Request failed, reason: {}".format(str(e)))
        continue
        
    with open('content.txt', mode='wb') as f:
        f.write(res.content)
```

```python
num1 = input("Please enter a number: ")
num2 = input("Please enter a number: ")
try:
    num1 = int(num1)
    num2 = int(num2)
    result = num1 + num2
    print(result)
except Exception as e:
    print("Input error")
```

Common application scenarios going forward:

- Calling the WeChat API to implement WeChat message push, WeChat Pay, etc.

- Alipay payments, video playback, etc.

- Database or Redis connections and operations

- Calling third-party video playback functionality, where errors are caused by issues in the third-party program.

  



Basic format of exception handling:

```python
try:
    # Logic code
except Exception as e:
    # If the code in try raises an exception, the code in this block will execute.
```

```python
try:
    # Logic code
except Exception as e:
    # If the code in try raises an exception, the code in this block will execute.
finally:
    # Whether the code in try raises an error or not, the code in finally will execute, generally used for releasing resources.

print("end")

"""
try:
    file_object = open("xxx.log")
    # ....
except Exception as e:
    # Exception handling
finally:
    file_object.close()  # If there is no exception in try, finally closes the file at the end; if there is an exception in try, execute the logic in except, and finally execute finally to close the file.
"""    
```







### 2.1 Refining Exceptions

```python
import requests

while True:
    url = input("Please enter the URL of the webpage to download: ")
    
    try:
        res = requests.get(url=url)
    except Exception as e:
        print("Request failed, reason: {}".format(str(e)))
        continue
        
    with open('content.txt', mode='wb') as f:
        f.write(res.content)
```

Earlier we simply caught exceptions and printed a uniform message whenever one occurred. If you want more fine-grained exception handling, you can do it like this:

```python
import requests
from requests import exceptions

while True:
    url = input("Please enter the URL of the webpage to download: ")
    try:
        res = requests.get(url=url)
        print(res)    
    except exceptions.MissingSchema as e:
        print("URL schema does not exist")
    except exceptions.InvalidSchema as e:
        print("URL schema error")
    except exceptions.InvalidURL as e:
        print("URL address format error")
    except exceptions.ConnectionError as e:
        print("Network connection error")
    except Exception as e:
        print("Code error", e)
        
# Tip: If you want to keep it simple, you can just write one Exception to catch the error.
```



If you want to handle errors in a more granular way, for example, handling a Key error and a Value error separately:

Basic format:

```python
try:
    # Logic code
    pass

except KeyError as e:
    # Only catches KeyError exceptions in try, e.g., when accessing info_dict["n1"] and the key does not exist.
    print("KeyError")

except ValueError as e:
    # Only catches ValueError exceptions in try, e.g., converting a string to int int("invalid")
    print("ValueError")

except Exception as e:
    # Handles errors that the above except blocks cannot catch (can catch all errors).
    print("Exception")
```

Python provides many fine-grained built-in exceptions for you to choose from.

```python
Common exceptions:
"""
AttributeError: attempting to access an attribute that the object does not have, e.g., foo.x, but foo has no attribute x
IOError: input/output exception; basically unable to open file
ImportError: unable to import module or package; basically a path issue or name error
IndentationError: syntax error (subclass); code is not properly aligned
IndexError: subscript index out of sequence bounds, e.g., when x has only three elements, but trying to access x[5]
KeyError: attempting to access a key that does not exist in the dictionary inf['xx']
KeyboardInterrupt: Ctrl+C was pressed
NameError: using a variable that has not been assigned an object
SyntaxError: illegal Python code, code cannot compile (personally think this is a syntax error, written incorrectly)
TypeError: the type of the passed object does not match the requirement
UnboundLocalError: attempting to access a local variable that has not been set, basically because there is another global variable with the same name,
causing you to think you are accessing it
ValueError: passing a value that the caller does not expect, even if the type of the value is correct
"""
More exceptions:
"""
ArithmeticError
AssertionError
AttributeError
BaseException
BufferError
BytesWarning
DeprecationWarning
EnvironmentError
EOFError
Exception
FloatingPointError
FutureWarning
GeneratorExit
ImportError
ImportWarning
IndentationError
IndexError
IOError
KeyboardInterrupt
KeyError
LookupError
MemoryError
NameError
NotImplementedError
OSError
OverflowError
PendingDeprecationWarning
ReferenceError
RuntimeError
RuntimeWarning
StandardError
StopIteration
SyntaxError
SyntaxWarning
SystemError
SystemExit
TabError
TypeError
UnboundLocalError
UnicodeDecodeError
UnicodeEncodeError
UnicodeError
UnicodeTranslateError
UnicodeWarning
UserWarning
ValueError
Warning
ZeroDivisionError
"""
```



### 2.2 Custom Exceptions & Raising Exceptions

All of the exceptions above are Python built-ins; the corresponding exception is only raised when a specific error occurs.

In fact, you can also define custom exceptions during development.

```python
class MyException(Exception):
    pass
```

```python
try:
    pass
except MyException as e:
    print("MyException was triggered", e)
except Exception as e:
    print("Exception", e)
```

In the code above, the `except` clause is defined to catch `MyException`, but it will never be triggered, because the default exceptions each have specific trigger conditions. For example, a missing index or a missing key raises `IndexError` and `KeyError`.

For our custom exceptions, if we want to trigger them, we need to use `raise MyException()`.

```python
class MyException(Exception):
    pass


try:
    # 。。。
    raise MyException()
    # 。。。
except MyException as e:
    print("MyException was triggered", e)
except Exception as e:
    print("Exception", e)
```

```python
class MyException(Exception):
    def __init__(self, msg, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.msg = msg


try:
    raise MyException("xxx failed")
except MyException as e:
    print("MyException was triggered", e.msg)
except Exception as e:
    print("Exception", e)
```

```python
class MyException(Exception):
    title = "Request error"


try:
    raise MyException()
except MyException as e:
    print("MyException was triggered", e.title)
except Exception as e:
    print("Exception", e)
```



**Case 1**: We collaborate on development together, and you call a method I wrote.

- I define a function

  ```python
  class EmailValidError(Exception):
      title = "Email format error"
  
  class ContentRequiredError(Exception):
      title = "Content cannot be empty error"
      
  def send_email(email,content):
      if not re.match("\w+@live.com",email):
          raise EmailValidError()
  	if len(content) == 0 :
          raise ContentRequiredError()
  	# Send email code...
      # ...
  ```

- You call the function I wrote

  ```python
  def execute():
      # Other code
      # ...
      
  	try:
          send_email(...)
      except EmailValidError as e:
          pass
      except ContentRequiredError as e:
          pass
      except Exception as e:
          print("Send failed")
  
  execute()
  
  # Tip: If you want to keep it simple, you can just write one Exception to catch the error.
  ```

  

**Case 2**: The framework has already defined these internally; different errors trigger different exceptions.

```python
import requests
from requests import exceptions

while True:
    url = input("Please enter the URL of the webpage to download: ")
    try:
        res = requests.get(url=url)
        print(res)    
    except exceptions.MissingSchema as e:
        print("URL schema does not exist")
    except exceptions.InvalidSchema as e:
        print("URL schema error")
    except exceptions.InvalidURL as e:
        print("URL address format error")
    except exceptions.ConnectionError as e:
        print("Network connection error")
    except Exception as e:
        print("Code error", e)
        
# Tip: If you want to keep it simple, you can just write one Exception to catch the error.
```



**Case 3**: Trigger the specified exception as required; each exception type has its own special meaning.

![image-20210131231423064](/images/python/ObjectOriented/image-20210131231423064.png)







### 2.3 The Special finally

```python
try:
    # Logic code
except Exception as e:
    # If the code in try raises an exception, the code in this block will execute.
finally:
    # Whether the code in try raises an error or not, the code in finally will execute, generally used for releasing resources.

print("end")
```

When defining exception-handling code inside a function or method, pay special attention to finally and return.

```python
def func():
    try:
        return 123
    except Exception as e:
        pass
    finally:
        print(666)
        
func()
```

Even if return is defined in try or except, the code in the final finally block will still be executed.



### Exercises

1. Fill in the code to catch errors in the program.

   ```python
   # Iterator
   class IterRange(object):
       def __init__(self, num):
           self.num = num
           self.counter = -1
   
       def __iter__(self):
           return self
   
       def __next__(self):
           self.counter += 1
           if self.counter == self.num:
               raise StopIteration()
           return self.counter
   
       
   obj = IterRange(20)
   
   while True:
       try:
       	ele = next(obj)
   	except StopIteration as e:
           print("Data retrieval complete")
           break
       print(ele)
       
   ```

2. Fill in the code to catch errors in the program.

   ```python
   class IterRange(object):
       def __init__(self, num):
           self.num = num
           self.counter = -1
   
       def __iter__(self):
           return self
   
       def __next__(self):
           self.counter += 1
           if self.counter == self.num:
               raise StopIteration()
           return self.counter
   
   
   class Xrange(object):
       def __init__(self, max_num):
           self.max_num = max_num
   
       def __iter__(self):
           return IterRange(self.max_num)
   
   
   data_object = Xrange(100)
   obj_iter = data_object.__iter__()
   
   while True:
       try:
       	ele = next(obj_iter)
   	except StopIteration as e:
            print("Data retrieval complete")
           break
       print(ele)
   ```

3. Fill in the code to catch errors in the program.

   ```python
   def func():
       yield 1
       yield 2
       yield 3
       
   gen = func()
   while True:
       try:
       	ele = next(gen)
   	except StopIteration as e:
            print("Data retrieval complete")
           break
       print(ele)
   ```

4. Fill in the code to catch errors in the program. (Note: this case is for practice only; in real development, it is recommended to handle this situation with your own checks rather than using exceptions)

   ```python
   num = int("WuPeiqi")
   ```

   ```python
   try:
       num = int("WuPeiqi")
   except ValueError as e:
       print("Conversion failed")
   ```

5. Fill in the code to catch errors in the program. (Note: this case is for practice only; in real development, it is recommended to handle this situation with your own checks rather than using exceptions)

   ```python
   data = [11,22,33,44,55]
   data[1000]
   ```

   ```python
   try:
       data = [11,22,33,44,55]
   	data[1000]
   except IndexError as e:
        print("Conversion failed")
   ```

   

6. Fill in the code to catch errors in the program. (Note: this case is for practice only; in real development, it is recommended to handle this situation with your own checks rather than using exceptions)

   ```python
   data = {"k1":123,"k2":456}
   data["xxxx"]
   ```

   ```python
   try:
       data = {"k1":123,"k2":456}
   	data["xxxx"]
   except KyeError as e:
        print("Conversion failed")
   ```

7. Analyze the code and write the result

   ```python
   class MyDict(dict):
   
       def __getitem__(self, item):
           try:
               return super().__getitem__(item) # KeyError
           except KeyError as e:
               return None
   
   
   info = MyDict()
   info['name'] = "WuPeiqi"
   info['wx'] = "wupeiq666"
   
   print(info['wx'])     # info['wx']  -> __getitem__
   print(info['email'])  # info['email']  -> __getitem__
   ```

8. Read the code and write the result

   ```python
   def run(handler):
       try:
           num = handler()
           print(num)
           return "Success"
       except Exception as e:
           return "Error"
       finally:
           print("END")
   
       print("End")
   
   
   res = run(lambda: 123) 
   print(res)
   ```

   ```python
   >>> 123
   >>> END
   >>> Success
   ```

   ```python
   def func():
       print(666)
       return "Success"
   
   def run(handler):
       try:
           num = handler()
           print(num)
           return func()
       except Exception as e:
           return "Error"
       finally:
           print("END")
   
       print("End")
   
   
   res = run(lambda: 123) 
   print(res)
   ```

   ```python
   >>> 123
   >>> 666
   >>> END
   >>> Success
   ```



## 3. Reflection

Reflection provides a more flexible way for you to operate on members of an object (performing member operations on the `object` in the form of strings).

```python
class Person(object):
    
    def __init__(self,name,wx):
        self.name = name
        self.wx = wx
	
    def show(self):
        message = "Name: {}, WeChat: {}".format(self.name, self.wx)
        
        
user_object = Person("WuPeiqi","wupeiqi666")


# Use object.member format to get data
user_object.name
user_object.wx
user_object.show()

# Use object.member format to set data
user_object.name = "WuPeiqi"
```

```python
user = Person("WuPeiqi","wupeiqi666")

# getattr: get member
getattr(user,"name") # user.name
getattr(user,"wx")   # user.wx


method = getattr(user,"show") # user.show
method()
# or
getattr(user,"show")()

# setattr: set member
setattr(user, "name", "WuPeiqi") # user.name = "WuPeiqi"
```

Python provides 4 built-in functions to support reflection:

- getattr, gets a member from an object

  ```
  v1 = getattr(object, "member_name")
  v2 = getattr(object, "member_name", default_value_if_not_exist)
  ```

- setattr, sets a member on an object

  ```
  setattr(object, "member_name", value)
  ```

- hasattr, whether the object contains a member

  ```
  v1 = hasattr(object, "member_name") # True/False
  ```

- delattr, deletes a member from an object

  ```
  delattr(object, "member_name")
  ```

From now on, whenever you come across this object.member style of writing, it can all be implemented based on reflection.

Example:

```python
class Account(object):

    def login(self):
        pass

    def register(self):
        pass

    def index(self):
        pass

    
def run(self):
    name = input("Please enter the method name to execute: ") # index register login xx run ..
    
    account_object = Account()
    method = getattr(account_object, name,None) # index = getattr(account_object,"index")
    
    if not method:
        print("Input error")
        return 
    method()
```



### 3.1 Everything Is an Object

There is a saying in Python: `everything is an object`. Every object maintains its own members internally.

- Objects are objects

  ```python
  class Person(object):
      
      def __init__(self,name,wx):
          self.name = name
          self.wx = wx
  	
      def show(self):
          message = "Name: {}, WeChat: {}".format(self.name, self.wx)
          
          
  user_object = Person("WuPeiqi","wupeiqi666")
  user_object.name
  ```

- Classes are objects

  ```python
  class Person(object):
      title = "WuPeiqi"
  
  Person.title
  # Person class is also an object (not usually called that way)
  ```

- Modules are objects

  ```python
  import re
  
  re.match
  # The re module is also an object (not usually called that way).
  ```

  

Since reflection supports operating on members of an object in the form of strings [equivalent to object.member], reflection can also be used to operate on members of classes and modules.

Simply put: as long as you see xx.oo, it can be implemented with reflection.

```python
class Person(object):
    title = "WuPeiqi"

v1 = Person.title
print(v1)
v2 = getattr(Person,"title")
print(v2)
```

```python
import re

v1 = re.match("\w+","dfjksdufjksd")
print(v1)

func = getattr(re,"match")
v2 = func("\w+","dfjksdufjksd")
print(v2)
```



### 3.2 import_module + Reflection

In Python, if you want to import a module, you can use the import syntax; you can also import a module in the form of a string.

Example 1:

```python
# Import module
import random

v1 = random.randint(1,100)
```

```python
# Import module
from importlib import import_module

m = import_module("random")

v1 = m.randint(1,100)
```

Example 2:

```python
# Import module exceptions
from requests import exceptions as m
```

```python
# Import module exceptions
from importlib import import_module
m = import_module("requests.exceptions")
```

Example 3:

```python
# Import module exceptions, get the InvalidURL class from exceptions.
from requests.exceptions import InvalidURL
```

```python
# Wrong way
from importlib import import_module
m = import_module("requests.exceptions.InvalidURL") # Error, import_module can only import up to the module level.
```

```python
# Import module
from importlib import import_module
m = import_module("requests.exceptions")
# Get class from module
cls = m.InvalidURL
```



In the source code of many projects, `import_module` and `getattr` are used together to import a module from a string and get its members, for example:

```python
from importlib import import_module

path = "openpyxl.utils.exceptions.InvalidFileException"

module_path,class_name = path.rsplit(".",maxsplit=1) # "openpyxl.utils.exceptions"   "InvalidFileException"

module_object = import_module(module_path)

cls = getattr(module_object,class_name)

print(cls)
```



In our own development, we can also build on this to improve the extensibility of our code. For example: please implement a feature in the project that sends SMS and WeChat messages.

Refer to the auto_message project in the sample code.

