---
description: "Django-signal Component. Django 4.2 signals official docs: Django has a \"signal dispatcher\". It is essentially the observer pattern, also known as Publish/Subscribe. When some action occurs,"
---

# Django-signal component

Django 4.2 signals official docs: https://docs.djangoproject.com/en/4.2/ref/signals/#signals

Django has a "signal dispatcher". It is essentially the observer pattern, also known as Publish/Subscribe. When some action occurs, a signal is sent, and the functions that subscribed to that signal are executed.

In plain terms, when some action happens, signals allow a specific sender to notify some receivers. **It is used to decouple operations when the framework executes.**

## 1 Custom signals

- Define a signal

  ```python
  import django.dispatch

  # Custom signal
  cut_info_signal = django.dispatch.Signal()
  ```

- Register callbacks

  ```python
  from utils.signals import cut_info_signal


  def callback_1(sender, **kwargs):
      print("callback-1")


  def callback_2(sender, **kwargs):
      print("callback-2")


  cut_info_signal.connect(callback_1)
  cut_info_signal.connect(callback_2)
  ```

- Send the signal

  ```python
  from utils.signals import cut_info_signal
  cut_info_signal.send("This signal is triggered")
  ```

Register certain actions on a single signal; once the condition is met, the signal is sent (all callbacks are executed).



## 2 Built-in signals

```Python
Model signals
    pre_init                    # Automatically triggered before Django model's __init__
    post_init                   # Automatically triggered after Django model's __init__
    pre_save                    # Automatically triggered before Django model object is saved
    post_save                   # Automatically triggered after Django model object is saved
    pre_delete                  # Automatically triggered before Django model object is deleted
    post_delete                 # Automatically triggered after Django model object is deleted
    m2m_changed                 # Automatically triggered before/after m2m field operations on a Django model's third table
                                # (add, remove, clear)
    class_prepared              # Triggered on startup when registered app models are detected, once for each class

Management signals
    pre_migrate                 # Automatically triggered before migrate command runs
    post_migrate                # Automatically triggered after migrate command runs

Request/response signals
    request_started             # Automatically triggered before a request arrives
    request_finished            # Automatically triggered after a request finishes
    got_request_exception       # Automatically triggered after a request exception

Test signals
    setting_changed             # Automatically triggered when settings are modified during testing
    template_rendered           # Automatically triggered when a template is rendered during testing

Database Wrappers
    connection_created          # Automatically triggered when a database connection is created
```

### Usage 1: register a signal using a function name as the argument

- Register signal callbacks

  ```python
  from django.core.signals import request_finished
  from django.core.signals import request_started
  from django.core.signals import got_request_exception

  from django.db.models.signals import class_prepared
  from django.db.models.signals import pre_init, post_init
  from django.db.models.signals import pre_save, post_save
  from django.db.models.signals import pre_delete, post_delete
  from django.db.models.signals import m2m_changed
  from django.db.models.signals import pre_migrate, post_migrate

  from django.test.signals import setting_changed
  from django.test.signals import template_rendered

  from django.db.backends.signals import connection_created


  def func1(*args, **kwargs):
      print("func1")


  def func2(*args, **kwargs):
      print("func2")


  post_save.connect(func1)
  post_save.connect(func2)
  ```

- Send the signal

  ```python
  from app01 import models

  def demo(request):
      models.UserInfo.objects.create(name="wilson", age=21)
      return HttpResponse("OK")
  ```

![image-20240519092650759](/images/django/django-django-signal-01.png)

Of course, if we print out `args` and `kwargs`, we can see that both signals are triggered by the `UserInfo` table.

![image-20240519093115406](/images/django/django-django-signal-02.png)

### Usage 2: using a decorator

```python
from app01 import models
from django.http import HttpResponse
from django.db.models.signals import post_save


@post_save.connect
def func1(*args, **kwargs):
    print("func1", args, kwargs)


@post_save.connect
def func2(*args, **kwargs):
    print("func2", args, kwargs)


# post_save.connect(func1)
# post_save.connect(func2)


def demo(request):
    models.UserInfo.objects.create(name="wilson", age=21)
    return HttpResponse("OK")
```

![image-20240519093455450](/images/django/django-django-signal-03.png)

##### Note on where signals are defined

Generally, we do not define and register signals in view functions; instead, we put them in the `__init__.py` file at the project root (as long as the project starts, this file is automatically loaded).




## 3 Examples of using built-in signals

### Signals triggered when creating a model class object

- `views.py`

```python
from django.shortcuts import render, HttpResponse
from api.models import User



# ----------- Usage of built-in signals --------------
def index(request):
    # When does a model class object call save()? When creating and updating objects
    obj = User.objects.create(name='zhangsan')
    print(obj)
    return HttpResponse("INDEX")
```

- `demo/__init__.py`

```python
from django.db.models.signals import pre_init, post_init, pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver

@receiver(pre_init)
def pre_init_callback(sender, **kwargs):
    """ Sent at the beginning of the model's __init__() method whenever a Django model is instantiated """
    print('pre_init_callback', sender)
    print('pre_init_callback', kwargs)

@receiver(post_init)
def post_init_callback(sender, **kwargs):
    """ Same as pre_init, but sent after __init__() completes """
    print('post_init_callback', sender)
    print('post_init_callback', kwargs)

@receiver(pre_save)
def pre_save_callback(sender, **kwargs):
    """ Sent at the beginning of the model's save() method """
    print('pre_save_callback', sender)
    print('pre_save_callback', kwargs)
    print('pre_save_callback', kwargs['instance'].name)


@receiver(post_save)
def post_save_callback(sender, **kwargs):
    """ Same as pre_save, but sent at the end of the save() method """
    print('post_save_callback', sender)
    print('post_save_callback', kwargs)
    print('post_save_callback', kwargs['instance'].name)
```

Printed output:

```bash
pre_init_callback <class 'api.models.User'>
pre_init_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000159F5287DC0>, 'args': (), 'kwargs': {'name': 'zhangsan'}}
post_init_callback <class 'api.models.User'>
post_init_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000159F5287EE0>, 'instance': <User: zhangsan>}
pre_save_callback <class 'api.models.User'>
pre_save_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000159F5287FD0>, 'instance': <User: zhangsan>, 'raw': False, 'using': 'default', 'update_fields': None}
pre_save_callback zhangsan
post_save_callback <class 'api.models.User'>
post_save_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000159F52C4100>, 'instance': <User: zhangsan>, 'created': True, 'update_fields': None, 'raw': False, 'using': 'default'}
post_save_callback zhangsan
zhangsan
```

### Signals triggered when editing a model class object

`views.py`:

```python
from django.shortcuts import render, HttpResponse
from api.models import User

# ----------- Usage of built-in signals --------------
def index(request):
    # When does a model class object call save()? When creating and updating objects
    # Create
    # obj = User.objects.create(name='zhangsan')
    # print(obj)

    # Edit
    obj = User.objects.filter(name='zhangsan2').first()
    old = obj.name
    obj.name = "zhangsan888"
    new = obj.name
    # log.info(f'{old}-->{new}')
    obj.save()

    return HttpResponse("INDEX")
```

`demo/__init__.py`:

```python
from django.db.models.signals import pre_init, post_init, pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver

@receiver(pre_init)
def pre_init_callback(sender, **kwargs):
    """ Sent at the beginning of the model's __init__() method whenever a Django model is instantiated """
    print('pre_init_callback', sender)
    print('pre_init_callback', kwargs)


@receiver(post_init)
def post_init_callback(sender, **kwargs):
    """ Same as pre_init, but sent after __init__() completes """
    print('post_init_callback', sender)
    print('post_init_callback', kwargs)


@receiver(pre_save)
def pre_save_callback(sender, **kwargs):
    """ Sent at the beginning of the model's save() method """
    print('pre_save_callback', sender)
    print('pre_save_callback', kwargs)
    print('pre_save_callback', kwargs['instance'].name)


@receiver(post_save)
def post_save_callback(sender, **kwargs):
    """ Same as pre_save, but sent at the end of the save() method """
    print('post_save_callback', sender)
    print('post_save_callback', kwargs)
    print('post_save_callback', kwargs['instance'].name)
```

Log output:

```bash
pre_init_callback <class 'api.models.User'>
pre_init_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000186F4937DC0>, 'args': (1, 'zhangsan2'), 'kwargs': {}}
post_init_callback <class 'api.models.User'>
post_init_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000186F4937EE0>, 'instance': <User: zhangsan2>}
zhangsan2
pre_save_callback <class 'api.models.User'>
pre_save_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000186F4937FD0>, 'instance': <User: zhangsan888>, 'raw': False, 'using': 'default', 'update_fields': None}
pre_save_callback zhangsan888
post_save_callback <class 'api.models.User'>
post_save_callback {'signal': <django.db.models.signals.ModelSignal object at 0x00000186F4974100>, 'instance': <User: zhangsan888>, 'created': False, 'update_fields': None, 'raw': False, 'using': 'default'}
post_save_callback zhangsan888
```



### Signals triggered when deleting a model class object

`views.py`:

```python
from django.shortcuts import render, HttpResponse
from api.models import User



# ----------- Usage of built-in signals --------------

def index(request):
    # When does a model class object call save()? When creating and updating objects
    # Create
    # obj = User.objects.create(name='zhangsan')
    # print(obj)

    # Edit
    # obj = User.objects.filter(name='zhangsan2').first()
    # old = obj.name
    # obj.name = "zhangsan888"
    # new = obj.name
    # # log.info(f'{old}-->{new}')
    # obj.save()

    # Delete
    obj_list = User.objects.filter(name='zhangsan888')
    # print(111, obj_list)  # <QuerySet [<User: zhangsan888>, <User: zhangsan888>, <User: zhangsan888>]>
    for obj in obj_list:
        obj.delete()

    return HttpResponse("INDEX")
```

`demo/__init__.py`:

```python
from django.db.models.signals import pre_init, post_init, pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver

@receiver(pre_init)
def pre_init_callback(sender, **kwargs):
    """ Sent at the beginning of the model's __init__() method whenever a Django model is instantiated """
    print('pre_init_callback', sender)
    print('pre_init_callback', kwargs)


@receiver(post_init)
def post_init_callback(sender, **kwargs):
    """ Same as pre_init, but sent after __init__() completes """
    print('post_init_callback', sender)
    print('post_init_callback', kwargs)





@receiver(pre_save)
def pre_save_callback(sender, **kwargs):
    """ Sent at the beginning of the model's save() method """
    print('pre_save_callback', sender)
    print('pre_save_callback', kwargs)
    print('pre_save_callback', kwargs['instance'].name)


@receiver(post_save)
def post_save_callback(sender, **kwargs):
    """ Same as pre_save, but sent at the end of the save() method """
    print('post_save_callback', sender)
    print('post_save_callback', kwargs)
    print('post_save_callback', kwargs['instance'].name)


@receiver(pre_delete)
def pre_delete_callback(sender, **kwargs):
    """ Sent at the beginning of the model's delete() and QuerySet's delete() methods """
    print('pre_delete_callback', sender)
    print('pre_delete_callback', kwargs)


@receiver(post_delete)
def post_delete_callback(sender, **kwargs):
    """ Same as pre_delete, but sent at the end of the model's delete() and QuerySet's delete() methods """
    print('post_delete_callback', sender)
    print('post_delete_callback', kwargs)
```

Log output:

```bash
post_init_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD6FE7EE0>, 'instance': <User: zhangsan888>}
pre_delete_callback <class 'api.models.User'>
pre_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70241F0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
post_delete_callback <class 'api.models.User'>
post_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70242E0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
pre_delete_callback <class 'api.models.User'>
pre_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70241F0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
post_delete_callback <class 'api.models.User'>
post_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70242E0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
pre_delete_callback <class 'api.models.User'>
pre_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70241F0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
post_delete_callback <class 'api.models.User'>
post_delete_callback {'signal': <django.db.models.signals.ModelSignal object at 0x0000026FD70242E0>, 'instance': <User: zhangsan888>, 'using': 'default', 'origin': <User: zhangsan888>}
```

## 4 migrate signal application

After we run `python manage.py makemigrations` and `python manage.py migrate`, two tables with data are automatically created: `django_content_type` and `auth_permission`.

![image-20240519095757844](/images/django/django-django-signal-04.png)

The implementation principle is that when Django starts, functions are registered on the `post_migrate` signal. When we run `python manage.py migrate`, Django not only creates tables based on the `migrations` folder configuration in the registered apps, but also executes the functions registered on the `post_migrate` signal to insert data into the `django_content_type` and `auth_permission` tables.

We can find the source code in the Django-auth component:

![image-20240519100413069](/images/django/django-django-signal-05.png)

Flowchart:

![image-20240519101823131](/images/django/django-django-signal-06.png)
