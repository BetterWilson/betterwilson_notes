# The difference between isinstance and type

In Python, there are two ways to determine the type to which a class instance belongs:

- `isinstance(x, A)` is used to determine whether `x` was instantiated from class `A`, or from a subclass of `A`

- `type()` returns the type of this class

  Using `type(x) is A` determines whether `x` was created by `A`; the difference from `isinstance` is that it has **no default inheritance relationship**

```python
class A:
    pass


class B(A):
    pass


b = B()
print(isinstance(b, B))		# True
print(isinstance(b, A))		# True

print(type(b))				# <class '__main__.B'>

print(type(b) is B)			# True
print(type(b) is A)			# False
```

Therefore, it is recommended to use `isinstance` rather than `type` to check types.
