## The relationship between is and ==

`is` determines whether two variables refer to the same memory address, that is, it checks via the `id()` function.

`==` determines whether the values of two variables are the same.

```python
a = [1, 2, 3, 4]
b = [1, 2, 3, 4]
print(id(a))		# 2298268712768
print(id(b))		# 2298269716992
print(a is b)		# False
print(a == b)		# True
```

There is a special case here:

```python
a = 1
b = 1
print(id(a))	# 140705217569576
print(id(b))	# 140705217569576
print(a is b)	# True
print(a == b)	# True
```

The principle is: when we already have a variable holding a small integer or a short string, and we create the same small integer or short string again, Python does not allocate a new memory space. Instead, it uses a pointer to point the new variable at the already-created memory space. This is an internal optimization mechanism of Python.
