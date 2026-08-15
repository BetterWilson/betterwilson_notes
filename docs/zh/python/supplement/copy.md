# 深copy与浅copy

## 赋值与copy

```python
a = [1, 2, 3]
b = a
a[0] = 10
print(f'b{b}')	# b[10, 2, 3]
```

对于可变数据类型，`b=a`会将a和b指向同一个数据空间，且a和b的地址是相同的

如果想让b变，a不变：

```python
import copy
a = [1, 2, 3]
print(id(a))    # 2763880625536
b = copy.copy(a)
print(id(b))    # 2764500316352
a[0] = 10
print(f'b{b}')  # b[1, 2, 3]
```

`b = copy.copy(a)`会将a的数据复制一份，放到新的内存空间中

## 浅copy

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

`c = [a,b]`c里面实际存储的是a和b的指针地址，所以修改a，c也会改变

浅copy只拷贝表层数据，嵌套对象仍然共享引用，例如c[0]和d[0]地址一样

## 深copy

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

深copy递归拷贝“所有层级数据”，嵌套对象完全独立