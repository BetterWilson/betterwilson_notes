# Deep copy vs. shallow copy

## Assignment and copy

```python
a = [1, 2, 3]
b = a
a[0] = 10
print(f'b{b}')	# b[10, 2, 3]
```

For mutable data types, `b = a` makes `a` and `b` point to the same data space, and the addresses of `a` and `b` are the same.

If you want `b` to change but `a` to stay unchanged:

```python
import copy
a = [1, 2, 3]
print(id(a))    # 2763880625536
b = copy.copy(a)
print(id(b))    # 2764500316352
a[0] = 10
print(f'b{b}')  # b[1, 2, 3]
```

`b = copy.copy(a)` copies the data of `a` into a new memory space.

## Shallow copy

`copy.copy()`

```python
import copy

a = [1,2]
b = [3,4]
c = [a,b]
d = copy.copy(c)
print(id(c))    # 2619548658816
print(id(d))    # 2619548658880
print(id(c[0]))     # 2632003843456
print(id(d[0]))     # 2632003843456

a[0] = 10
print(f'c{c}')  # c[[10, 2], [3, 4]]
print(f'd{d}')  # d[[10, 2], [3, 4]]
```

In `c = [a, b]`, `c` actually stores the pointer addresses of `a` and `b`, so modifying `a` also changes `c`.

A shallow copy only copies the top-level data; nested objects still share references, for example `c[0]` and `d[0]` have the same address.

## Deep copy

`copy.deepcopy()`

```python
import copy

a = [1,2]
b = [3,4]
c = [a,b]
d = copy.deepcopy(c)
print(id(c))    # 2013669044224
print(id(d))    # 2013669044288
print(id(c[0]))     # 2013050074496
print(id(d[0]))     # 2013669044096

a[0] = 10
print(f'c{c}')      # c[[10, 2], [3, 4]]
print(f'd{d}')      # d[[1, 2], [3, 4]]
```

A deep copy recursively copies "data at all levels", so nested objects are completely independent.
