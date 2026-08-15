## Classification of common built-in types in Python

- The `None` type

  Among Python's built-in types, there is only one type that can be set to `None`. This can be determined using the `id()` function (`id()` can be used to get the memory address of a variable).

  ```python
  a = None
  b = None
  print(id(a))	# 140704868887752
  print(id(b))	# 140704868887752
  ```

- Common numeric types

  - `int`
  - `float`
  - `complex` (complex number type)
  - `bool`

- Iterable types

- Sequence types

  - `list`
  - `bytes`, `bytearray`, `memoryview` (binary sequences)
  - `range`
  - `tuple`
  - `str`
  - `array`

- Mapping types

  - `dict`

- Sets

  - `set`
  - `frozenset` (an immutable `set`)

- Context management types

  - the `with` statement

- Other types

  - module types
  - classes and instances
  - function types
  - method types
  - code types (Python code itself is turned into an object type by the Python interpreter)
  - the `object` object
  - the `type` type
  - the `ellipsis` type
  - the `notimplemented` type
