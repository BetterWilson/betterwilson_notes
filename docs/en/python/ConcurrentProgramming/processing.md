# Processes

## 1. Multi-process Development

A process is the smallest unit of resource allocation in a computer; a process can contain multiple threads, and threads within the same process share resources;

Processes, on the other hand, are isolated from one another.

In Python, multiprocessing can take advantage of the CPU's multi-core capabilities, so CPU-intensive operations are well-suited to multiprocessing.

### 1.1 Introduction to Processes

```python
import multiprocessing

def task():
	pass

if __name__ == '__main__':
    p1 = multiprocessing.Process(target=task)
    p1.start()
```

```python
from multiprocessing import Process

def task(arg):
	pass

def run():
    p = multiprocessing.Process(target=task, args=('xxx',))
    p.start()

if __name__ == '__main__':
    run()
```



Regarding processes operated through the multiprocessing module in Python:

Depending on the platform, [`multiprocessing`](https://docs.python.org/3/library/multiprocessing.html#module-multiprocessing) supports three ways to start a process. These *start methods* are

> - *fork*, ["copies" almost all resources] [supports passing file objects/thread locks as arguments] [unix] [can start from anywhere] [fast]
>
>   The parent process uses [`os.fork()`](https://docs.python.org/3/library/os.html#os.fork) to fork the Python interpreter. The child process, when it begins, is effectively identical to the parent process. All resources of the parent are inherited by the child process. Note that safely forking a multithreaded process is problematic. Available on Unix only. The default on Unix.
>
> - *spawn*, [passes only the essential resources via the run parameter] [does not support passing file objects/thread locks as arguments] [unix, win] [starts from the main code block] [slow]
>
>   The parent process starts a fresh python interpreter process. The child process will only inherit those resources necessary to run the process object's [`run()`](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.Process.run) method. In particular, unnecessary file descriptors and handles from the parent process will not be inherited. Starting a process using this method is rather slow compared to using *fork* or *forkserver*. Available on Unix and Windows. The default on Windows and macOS.
>
> - *forkserver*, [passes only the essential resources via the run parameter] [does not support passing file objects/thread locks as arguments] [some unix] [starts from the main code block]
>
>   When the program starts and selects the *forkserver* start method, a server process is started. From then on, whenever a new process is needed, the parent process connects to the server and requests that it fork a new process. The fork server process is single threaded so it is safe for it to use [`os.fork()`](https://docs.python.org/3/library/os.html#os.fork). No unnecessary resources are inherited. Available on Unix platforms which support passing file descriptors over Unix pipes.

```python
import multiprocessing
multiprocessing.set_start_method("spawn")
```

*Changed in version 3.8:* On macOS, the *spawn* start method is now the default. The *fork* start method should be considered unsafe as it can lead to crashes of the subprocess. See [bpo-33725](https://bugs.python.org/issue33725).

*Changed in version 3.4:* *spawn* added on all unix platforms, and *forkserver* added for some unix platforms. Child processes no longer inherit all of the parents inheritable handles on Windows.

On Unix using the *spawn* or *forkserver* start methods will also start a *resource tracker* process which tracks the unlinked named system resources (such as named semaphores or [`SharedMemory`](https://docs.python.org/3/library/multiprocessing.shared_memory.html#multiprocessing.shared_memory.SharedMemory) objects) created by processes of the program. When all processes have exited the resource tracker unlinks any remaining tracked object. Usually there should be none, but if a process was killed by a signal there may be some "leaked" resources. (Neither leaked semaphores nor shared memory segments will be automatically unlinked until the next reboot. This is problematic for both objects because the system allows only a limited number of named semaphores, and shared memory segments occupy some space in the main memory.)

Official documentation: https://docs.python.org/3/library/multiprocessing.html

### 1.2 Common Features

Common methods of a process:

- `p.start()`, the current process becomes ready and waits to be scheduled by the CPU (the actual unit of work is the thread within the process).

- `p.join()`, waits for the current process's task to finish before continuing to execute.

  ```python
  import time
  from multiprocessing import Process
  
  
  def task(arg):
      time.sleep(2)
      print("执行中...")
  
  
  if __name__ == '__main__':
      multiprocessing.set_start_method("spawn")
      p = Process(target=task, args=('xxx',))
      p.start()
      p.join()
  
      print("继续执行...")
  ```

- `p.daemon = 布尔值`, daemon process (must be placed before start)

  - `p.daemon =True`, set as a daemon process; after the main process finishes, the child process also closes automatically.
  - `p.daemon =False`, set as a non-daemon process; the main process waits for the child process, and only after the child process finishes does the main process end.

  ```python
  import time
  import multiprocessing
  from multiprocessing import Process
  
  
  def task(arg):
      time.sleep(2)
      print("执行中...")
  
  
  if __name__ == '__main__':
      multiprocessing.set_start_method("spawn")
      p = Process(target=task, args=('xxx',))
      p.daemon = True
      p.start()
  
      print("继续执行...")
  ```

- Setting and getting a process's name

  ```python
  import os
  import time
  import threading
  import multiprocessing
  
  
  def func():
      time.sleep(3)
  
  
  def task(arg):
      for i in range(10):
          t = threading.Thread(target=func)
          t.start()
      print(os.getpid(), os.getppid())	# getpid()获取子进程自己的进程id，getppid()获取父进程的进程id
      print("线程个数", len(threading.enumerate()))	# threading.enumerate()里面放所有的进程
      time.sleep(2)
      print("当前进程的名称：", multiprocessing.current_process().name)
  
  
  if __name__ == '__main__':
      print(os.getpid())
      multiprocessing.set_start_method("spawn")
      p = multiprocessing.Process(target=task, args=('xxx',))
      p.name = "哈哈哈哈"
      p.start()
  
      print("继续执行...")
  ```
  
- Custom process class: write what the process needs to do directly into the run method.

  ```python
  import multiprocessing
  
  
  class MyProcess(multiprocessing.Process):
      def run(self):
          print('执行此进程', self._args)
  
  
  if __name__ == '__main__':
      multiprocessing.set_start_method("spawn")
      p = MyProcess(args=('xxx',))
      p.start()
      print("继续执行...")
  ```
  
- CPU count: how many processes should a program generally create? (to leverage the CPU's multi-core advantage).

  ```python
  import multiprocessing
  multiprocessing.cpu_count()
  ```

  ```python
  import multiprocessing
  
  if __name__ == '__main__':
      count = multiprocessing.cpu_count()
      for i in range(count - 1):
          p = multiprocessing.Process(target=xxxx)
          p.start()
  ```



## 2. Sharing Data Between Processes

A process is the smallest unit of resource allocation, and each process maintains its own independent data, which is not shared.

```python
import multiprocessing


def task(data):
    data.append(666)


if __name__ == '__main__':
    data_list = []
    p = multiprocessing.Process(target=task, args=(data_list,))
    p.start()
    p.join()

    print("主进程：", data_list) # []
```

If you want them to share data, you can achieve this with the help of some special mechanisms.



### 2.1 Sharing

**Shared memory**

Data can be stored in a shared memory map using [`Value`](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.Value) or [`Array`](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.Array). For example, the following code

```
    'c': ctypes.c_char,  'u': ctypes.c_wchar,
    'b': ctypes.c_byte,  'B': ctypes.c_ubyte, 
    'h': ctypes.c_short, 'H': ctypes.c_ushort,
    'i': ctypes.c_int,   'I': ctypes.c_uint,  （其u表示无符号）
    'l': ctypes.c_long,  'L': ctypes.c_ulong, 
    'f': ctypes.c_float, 'd': ctypes.c_double
```

```python
from multiprocessing import Process, Value, Array


def func(n, m1, m2):
    n.value = 888
    m1.value = 'a'.encode('utf-8')
    m2.value = "张"


if __name__ == '__main__':
    num = Value('i', 666)
    v1 = Value('c')
    v2 = Value('u')

    p = Process(target=func, args=(num, v1, v2))
    p.start()
    p.join()

    print(num.value)  # 888
    print(v1.value)  # a
    print(v2.value)  # 张
```

```python
from multiprocessing import Process, Value, Array


def f(data_array):
    data_array[0] = 666


if __name__ == '__main__':
    arr = Array('i', [11, 22, 33, 44]) # 数组：元素类型必须是int; 只能是这么几个数据。

    p = Process(target=f, args=(arr,))
    p.start()
    p.join()

    print(arr[:])
```

**Server process**

A manager object returned by `Manager()` controls a server process which holds Python objects and allows other processes to manipulate them using proxies.

```python
from multiprocessing import Process, Manager

def f(d, l):
    d[1] = '1'
    d['2'] = 2
    d[0.25] = None
    l.append(666)

if __name__ == '__main__':
    with Manager() as manager:
        d = manager.dict()
        l = manager.list()

        p = Process(target=f, args=(d, l))
        p.start()
        p.join()

        print(d)
        print(l)
```



### 2.2 Exchanging

[`multiprocessing`](https://docs.python.org/3/library/multiprocessing.html#module-multiprocessing) supports two types of communication channel between processes

**Queues**

![image-20210302110643327](assets/image-20210302110643327.png)

The [`Queue`](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.Queue) class is a near clone of [`queue.Queue`](https://docs.python.org/3/library/queue.html#queue.Queue). For example

```python
import multiprocessing


def task(q):
    for i in range(10):
        q.put(i)


if __name__ == '__main__':
    queue = multiprocessing.Queue()
    
    p = multiprocessing.Process(target=task, args=(queue,))
    p.start()
    p.join()

    print("主进程")
    print(queue.get())
    print(queue.get())
    print(queue.get())
    print(queue.get())
    print(queue.get())
```

**Pipes**

![image-20210302110821720](assets/image-20210302110821720.png)

The [`Pipe()`](https://docs.python.org/3/library/multiprocessing.html#multiprocessing.Pipe) function returns a pair of connection objects connected by a pipe which by default is duplex (two-way). For example:

```python
import time
import multiprocessing


def task(conn):
    time.sleep(1)
    conn.send([111, 22, 33, 44])
    data = conn.recv() # 阻塞
    print("子进程接收:", data)
    time.sleep(2)


if __name__ == '__main__':
    parent_conn, child_conn = multiprocessing.Pipe()

    p = multiprocessing.Process(target=task, args=(child_conn,))
    p.start()

    info = parent_conn.recv() # 阻塞，等待子进程发送值
    print("主进程接收：", info)
    parent_conn.send(666)
```

The above are all mechanisms provided by Python for sharing and exchanging data between processes. Just be aware of them — they are rarely used in project development. In real projects, third-party solutions such as MySQL, Redis, etc. are generally used for resource sharing.



## 3. Process Locks

When multiple processes preemptively perform certain operations, process locks can be used to prevent problems.

```python
import time
from multiprocessing import Process, Value, Array


def func(n):
    n.value = n.value + 1


if __name__ == '__main__':
    num = Value('i', 0)

    for i in range(20):
        p = Process(target=func, args=(num,))
        p.start()

    time.sleep(3)
    print(num.value)
```

```python
import time
from multiprocessing import Process, Manager


def f(d):
    d[1] += 1


if __name__ == '__main__':
    with Manager() as manager:
        d = manager.dict()
        d[1] = 0
        for i in range(20):
            p = Process(target=f, args=(d,))
            p.start()
        time.sleep(3)
        print(d)
```



Obviously, problems can arise when multiple processes operate on the same data, so a lock needs to intervene at this point:

```python
import time
import multiprocessing


def task(lock):
    print("开始")
    lock.acquire()
    # 假设文件中保存的内容就是一个值：10
    with open('f1.txt', mode='r', encoding='utf-8') as f:
        current_num = int(f.read())

    print("排队抢票了")
    time.sleep(0.5)
    current_num -= 1

    with open('f1.txt', mode='w', encoding='utf-8') as f:
        f.write(str(current_num))
    lock.release()


if __name__ == '__main__':
    multiprocessing.set_start_method("spawn")
    
    lock = multiprocessing.RLock() # 进程锁
    
    for i in range(10):
        p = multiprocessing.Process(target=task, args=(lock,))
        p.start()

    # spawn模式，需要特殊处理。(主进程等子进程执行完)
    time.sleep(7)
```



```python
import time
import multiprocessing
import os


def task(lock):
    print("开始")
    lock.acquire()
    # 假设文件中保存的内容就是一个值：10
    with open('f1.txt', mode='r', encoding='utf-8') as f:
        current_num = int(f.read())

    print(os.getpid(), "排队抢票了")
    time.sleep(0.5)
    current_num -= 1

    with open('f1.txt', mode='w', encoding='utf-8') as f:
        f.write(str(current_num))
    lock.release()


if __name__ == '__main__':
    multiprocessing.set_start_method("spawn")
    lock = multiprocessing.RLock()

    process_list = []
    for i in range(10):
        p = multiprocessing.Process(target=task, args=(lock,))
        p.start()
        process_list.append(p)

    # spawn模式，需要特殊处理。
    for item in process_list:
        item.join()		# 让每一个子进程都执行完
```




## 4. Process Pool

```python
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor


def task(num):
    print("执行", num)
    time.sleep(2)


if __name__ == '__main__':
    pool = ProcessPoolExecutor(4)		# 进程池中最多维护4个进程
    for i in range(10):
        pool.submit(task, i)			# 这里不会等待，是全部执行；具体等待是在进程池内部执行的
    print(1)
    print(2)
```

```python
import time
from concurrent.futures import ProcessPoolExecutor


def task(num):
    print("执行", num)
    time.sleep(2)


if __name__ == '__main__':

    pool = ProcessPoolExecutor(4)
    for i in range(10):
        pool.submit(task, i)
    pool.shutdown(True)		# 等待进程池中的任务都执行完毕后，再继续往后执行。
    print(1)
```

```python
import time
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

def task(num):
    print("执行", num)
    time.sleep(2)
    return num


def done(res):
    print(multiprocessing.current_process())	# 查看具体是由哪个进程操作的
    time.sleep(1)
    print(res.result())
    time.sleep(1)


if __name__ == '__main__':

    pool = ProcessPoolExecutor(4)
    for i in range(10):
        fur = pool.submit(task, i)
        fur.add_done_callback(done) # done的调用由主进程处理（与线程池不同）
        
    print(multiprocessing.current_process())
    pool.shutdown(True)
```



Note: If you need to use process locks in a process pool, they must be implemented using the Lock (mutex) and RLock (recursive lock) in Manager.

```python
import time
import multiprocessing
from concurrent.futures.process import ProcessPoolExecutor


def task(lock):
    print("开始")
    # lock.acquire()
    # lock.relase()
    with lock:
        # 假设文件中保存的内容就是一个值：10
        with open('f1.txt', mode='r', encoding='utf-8') as f:
            current_num = int(f.read())

        print("排队抢票了")
        time.sleep(1)
        current_num -= 1

        with open('f1.txt', mode='w', encoding='utf-8') as f:
            f.write(str(current_num))


if __name__ == '__main__':
    pool = ProcessPoolExecutor()
    # lock_object = multiprocessing.RLock() # 不能使用
    manager = multiprocessing.Manager()
    lock_object = manager.RLock() # Lock
    for i in range(10):
        pool.submit(task, lock_object)
```



## 5. Coroutines

Computers provide threads and processes for implementing concurrent programming (these truly exist).

A coroutine (Coroutine) is something created by programmers through code (it does not truly exist).

```
协程也可以被称为微线程，是一种用户态内的上下文切换技术。
简而言之，其实就是通过一个线程实现代码块相互切换执行（来回跳着执行）。
```

For example:

```python
def func1():
    print(1)
    print(2)
    
def func2():
    print(3)
    print(4)
    
func1()
func2()
```

The above code is an ordinary function definition and execution. The code in the two functions executes in order, outputting `1、2、3、4` in sequence.

But if coroutine technology is introduced, the code between the two functions can switch back and forth, ultimately outputting `1、3、2、4`.



There are several ways to implement coroutines in Python, for example:

- greenlet

  ```
  pip install greenlet
  ```

  ```python
  from greenlet import greenlet
  
  def func1():
      print(1)        # 第1步：输出 1
      gr2.switch()    # 第3步：切换到 func2 函数
      print(2)        # 第6步：输出 2
      gr2.switch()    # 第7步：切换到 func2 函数，从上一次执行的位置继续向后执行
      
  def func2():
      print(3)        # 第4步：输出 3
      gr1.switch()    # 第5步：切换到 func1 函数，从上一次执行的位置继续向后执行
      print(4)        # 第8步：输出 4
      
  gr1 = greenlet(func1)
  gr2 = greenlet(func2)
  
  gr1.switch() # 第1步：去执行 func1 函数
  ```

- yield

  ```python
  def func1():
      yield 1
      yield from func2()
      yield 2
      
  def func2():
      yield 3
      yield 4
      
  f1 = func1()
  for item in f1:
      print(item)
  ```

  

Although the two approaches above both implement coroutines, this way of writing code is not very meaningful.

This kind of back-and-forth switching may actually make the program execute more slowly (compared to serial execution).



**How can coroutines be made more meaningful?**

> Instead of requiring the user to switch manually, it should switch automatically when encountering I/O operations.
>
> After Python 3.4, the asyncio module was introduced, and Python 3.5 added the async and await syntax. It is internally based on coroutines and switches automatically when it encounters I/O requests.

```python
import asyncio

async def func1():
    print(1)
    await asyncio.sleep(2)
    print(2)
    
async def func2():
    print(3)
    await asyncio.sleep(2)
    print(4)
    
tasks = [
    asyncio.ensure_future(func1()),
    asyncio.ensure_future(func2())
]
loop = asyncio.get_event_loop()
loop.run_until_complete(asyncio.wait(tasks))
```

Example:

```python
"""
需要先安装：pip3 install aiohttp
"""

import aiohttp
import asyncio

async def fetch(session, url):
    print("发送请求：", url)
    async with session.get(url, verify_ssl=False) as response:
        content = await response.content.read()
        file_name = url.rsplit('_')[-1]
        with open(file_name, mode='wb') as file_object:
            file_object.write(content)
            
async def main():
    async with aiohttp.ClientSession() as session:
        url_list = [
            'https://www3.autoimg.cn/newsdfs/g26/M02/35/A9/120x90_0_autohomecar__ChsEe12AXQ6AOOH_AAFocMs8nzU621.jpg',
            'https://www2.autoimg.cn/newsdfs/g30/M01/3C/E2/120x90_0_autohomecar__ChcCSV2BBICAUntfAADjJFd6800429.jpg',
            'https://www3.autoimg.cn/newsdfs/g26/M0B/3C/65/120x90_0_autohomecar__ChcCP12BFCmAIO83AAGq7vK0sGY193.jpg'
        ]
        tasks = [asyncio.create_task(fetch(session, url)) for url in url_list]
        await asyncio.wait(tasks)
if __name__ == '__main__':
    asyncio.run(main())
```

From the above, it is clear that when handling I/O requests, coroutines can achieve concurrent operations with just a single thread.



**What is the difference between coroutines, threads, and processes?**

```python
线程，是计算机中可以被cpu调度的最小单元。
进程，是计算机资源分配的最小单元（进程为线程提供资源）。
一个进程中可以有多个线程,同一个进程中的线程可以共享此进程中的资源。

由于CPython中GIL的存在：
	- 线程，适用于IO密集型操作。
    - 进程，适用于计算密集型操作。

协程，协程也可以被称为微线程，是一种用户态内的上下文切换技术，在开发中结合遇到IO自动切换，就可以通过一个线程实现并发操作。

所以，在处理IO操作时，协程比线程更加节省开销（协程的开发难度大一些）。
```



Many Python frameworks now support coroutines, such as FastAPI, Tornado, Sanic, Django 3, aiohttp, etc., and they are increasingly used in enterprise development (though not yet very widely).



As for coroutines, for now you just need to understand these concepts; there's no need to delve too deeply into advanced development and application yet. Once you've learned about web frameworks and web scraping, it will be more effective to come back and study them in depth. If you're interested in doing further research, you can refer to my articles and special-topic videos:

- Articles

  ```python
  https://pythonav.com/wiki/detail/6/91/
  https://zhuanlan.zhihu.com/p/137057192
  ```

- Videos

  ```
  https://www.bilibili.com/video/BV1NA411g7yf
  ```

  






















