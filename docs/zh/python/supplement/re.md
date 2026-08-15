# re正则表达式

## match

`re.match(pattern,text,flags=0)`

从字符串开头开始匹配，仅验证“开头是否符合规则”

- pattern：正则规则字符串（必加r原始字符串，避免转义）
- text：待匹配的目标字符串
- flags：匹配模式（如re.IGNORECASE忽略大小写）

## search

`re.search(pattern,text,flags=0)`

从字符串任意位置匹配，找到“第一个符合规则的内容”即停止

区别match：match只看开头，而search遍历整个字符串

```python
text = "我的手机号：13812345678，备用号：13987654321"
pattern = r"1[34578]\d{9}"  # 不限制位置，只匹配手机号格式
result = re.search(pattern, text)
if result:
    print("第一个手机号：", result.group())  # 输出：第一个手机号：13812345678
    print("位置：", result.span())  # 输出：位置：(6,17)（起始/结束索引）
```

## findall

`re.findall(pattern,text,flags=0)`

从字符串中找到“所有符合规则的内容”

返回列表（元素为匹配的字符串，若有分组则返回分组内容）

```python
text = "我的手机号：13812345678，备用号：13987654321"
pattern = r"1[34578]\d{9}"
phones = re.findall(pattern, text)
print("所有手机号：", phones)  # 输出：所有手机号：['13812345678','13987654321']
```

## sub

`re.sub(pattern,repl,text,count=0,flags=0)`

将匹配到的内容替换为repl（字符串或函数）

count=0表示“替换所有匹配内容”，count=1表示“只替换第一个”

```python
import re

def double(num: re.Match) -> str:
    return str(int(num.group()) * 2)

text = "视频播放量1000次"
new_text = re.sub(r'\d+', double, text)
print(new_text)
```

## split

`re.split(pattern,text,maxsplit=0,flags=0)`

用“匹配到的内容”作为分隔符，分割字符串，返回列表

maxsplit=0表示“全部分割”，maxsplit=1表示“只分割一次”

## compile

`re.compile(pattern,flags=0)`

将正则规则预编译为Pattern对象，后续多次使用时提升效率（避免重复解析规则）

适用场景：同一正则规则需要匹配多次（如循环处理大量文本）

```python
pattern = re.compile(r'1[34578]\d{9}',flags=0)
res = pattern.search()
```

## flags参数匹配控制模式

flags用于修改正则的匹配行为

- re.IGNORECASE（简称re.I）：忽略大小写匹配
- re.DOTALL（简称re.S）：让.匹配换行符\n（默认.不匹配\n）
- re.MULTILINE（简称re.M）：让^和$匹配“每行的开头和结尾”（默认只匹配整个字符串的开头结尾）

## search如何查找第二个

search只能查找第一个，如果要查找第二个，那么需要使用finditer外加next组合，next是迭代器向下走一个

```python
import re

def find_second_match(pattern, text):
    matches = re.finditer(pattern, text)
    try:
        next(matches)  # 跳过第一个匹配项
        second_match = next(matches)  # 获取第二个匹配项
        return second_match.group()
    except StopIteration:
        return None

text = "abc123def456ghi789"
pattern = r"\d+"
second_match = find_second_match(pattern, text)
print(second_match)
```

## 正则表达式r的作用

当匹配的时候遇到转义字符`\`，可以正常匹配，不会转义



## 正则语法

### 普通字符集

```
    \w				匹配字母数字及下划线
    \W				匹配非字母数字及下划线
    \s				匹配任意空白字符，等价于 [\t\n\r\f].
    \S				匹配任意非空白字符
    \d				匹配任意数字，等价于 [0-9]
    \D				匹配任意非数字
    \1...\9			匹配第n个分组的内容。
    [a-zA-Z0-9]		匹配任何字母及数字
```

### 数量字符集（默认贪婪匹配（尽可能多的匹配），想要抑制，加？）

```
    .		匹配任意字符，除了换行符，当re.DOTALL标记被指定时，可以匹配包括换行符的任意字符
    *       匹配前一个字符0次1次或多次
    +       匹配前一个字符1次或多次
    ?       匹配前一个字符0次或1次
    {m}     匹配前一个字符m次
    {m,n}   匹配前一个字符m到n次
    {m,}    匹配前一个字符至少m次
    {,n}    匹配前一个字符0到n次，最多n次
```

### 边界匹配符

```
^			匹配字符串开头，如果是多行则匹配每一行的开头
[^]			在[...]中，^表示否定，如非字母[^a-zA-Z]，非数字[^0-9]
$			匹配字符串或一行的结尾，如果是多行匹配模式，则每一行的结尾
\A 			仅匹配字符串的开始，同^
\b 			匹配一个单词的边界，也就是指单词和空格间的位置
\B			等价于[^\b]表示匹配非单词边界
\Z			匹配字符串结束，如果是存在换行，只匹配到换行前的结束字符串。
\z 			匹配字符串结束
```

### 逻辑匹配符

```
|（或）
　　　　匹配 | 左右任意一种正则表达式，如果左边表达式匹配上，匹配结束，不再匹配右边的正则表达式，该符号一般放在()中使用，如果没在圆括号中则它的范围是整个正则表达式
分组 (...)
　　　　后向引用，用()括起来的正则表达式将被作为一个分组，从正则表达式的左边依次算起，有多少个左括号'('，就有 多少个分组，分组的编码从1依次加1，无论是括号中嵌套括号，并且分组表达式作为一个整体，后可接数量词。
\<number>
　　　　引用分组匹配到的分组编号为<number>的字符串 如：\1...\9
(?P<name>...)
　　　　命名分组，除了默认的分组编号外再指定一个别名分组
　　　　注意：P是大写
(?P=name)
　　　　引用别名为name的分组匹配，这个是在正则表达式中引用，表示匹配重复的字符串,也可以使用编号引用。
　　　　注意：P是大写
```

### 特殊匹配符

```
(?imx)				正则表达式包含三种可选标志：i, m, 或 x 。只影响括号中的区域。
(?-imx)				正则表达式关闭 i, m, 或 x 可选标志。只影响括号中的区域。
(?:...)				匹配到的括号内字符串不作为分组
(?!pattern)			前向否定断言语法，表示否定开头, 只能用在正则表达式的开头，pattern是匹配模式，它后面的内容需要不							匹配 该正则表达式才匹配成功
(?<!pattern)		后向否定断言语法，表示否定结尾,前面的内容需要不匹配该pattern模式才匹配成功
(?=pattern)			前向肯定断言语法. 需要匹配pattren模式才能匹配成功，表示肯定前面的字符内容
(?<=pattern)		后向肯定断言语法, 需要匹配pattern模式才能匹配成功，表示肯定后面的字符内容
(?#...)				后面的内容将被作为注释而忽略
```