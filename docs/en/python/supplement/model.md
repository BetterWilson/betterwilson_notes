# Python modules

## Module search paths

```python
import sys
print(sys.path)	# 输出模块的所有路径列表
```



## `if __name__ == "__main__"`

Every module has a `__name__` attribute that identifies the module's "name":

- When the module is imported, the value of `__name__` is the module name (e.g. `math`)
- When the module itself is executed, the value of `__name__` is `__main__`

**Core principle (how it works)**

- Every Python file has a built-in variable `__name__`.
- When you run this file directly, Python automatically sets the `__name__` variable of that file to `"__main__"`.
- When this file is imported from another file, Python sets the `__name__` variable of that file to its file name.

So, the line `if __name__ == "__main__":` is asking: "Am I being run directly right now?" When you write a utility class or function library, you can write some debugging or test code below it. When others `import` your module, these tests will not run; they only execute when you run this file directly — the two don't interfere with each other.



## Other attributes of modules

- The `file` attribute: every module has a built-in attribute `__file__` that shows the full path of the module.

- The `all` attribute: if a module file contains the `__all__` variable, when importing with `from xxx import *`, only the elements in this list can be imported.
