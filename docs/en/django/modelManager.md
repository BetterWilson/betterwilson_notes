# Manager objects in models

When we perform ORM CRUD operations, we usually write:

```python
from app01 import models

models.Depart.objects.all(..)
models.Depart.objects.filter(..)
models.Depart.objects.create(..)
```

But sometimes we need to customize some operations to implement a certain feature, for example

```python
models.Depart.objects.func(...)
```

In that case, we need to define our own Manager object.

```python
from django.db import models


class MyManager(models.Manager):
    def func(self, title):
        models.Depart.objects.create(title=title)
        models.Depart.objects.create(title=title)


class Depart(models.Model):
    title = models.CharField(verbose_name="标题", max_length=32)
    count = models.IntegerField(verbose_name="数量")

    objects = MyManager()
```

This way, when we execute `models.Depart.objects.func(...)`, 2 rows are created in the table.
