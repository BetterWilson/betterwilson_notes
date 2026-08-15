# re regular expressions

## match

`re.match(pattern,text,flags=0)`

Matches from the beginning of the string; it only verifies whether the "beginning matches the rule".

- `pattern`: the regex rule string (must use an r raw string to avoid escaping)
- `text`: the target string to match
- `flags`: the matching mode (e.g. `re.IGNORECASE` to ignore case)

## search

`re.search(pattern,text,flags=0)`

Matches from any position in the string, stopping as soon as it finds the "first content that matches the rule".

The difference from `match`: `match` only looks at the beginning, while `search` scans the entire string.

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

Finds "all content that matches the rule" in the string.

Returns a list (the elements are the matched strings; if there are groups, it returns the group contents).

```python
text = "我的手机号：13812345678，备用号：13987654321"
pattern = r"1[34578]\d{9}"
phones = re.findall(pattern, text)
print("所有手机号：", phones)  # 输出：所有手机号：['13812345678','13987654321']
```

## sub

`re.sub(pattern,repl,text,count=0,flags=0)`

Replaces the matched content with `repl` (a string or a function).

`count=0` means "replace all matches", and `count=1` means "replace only the first".

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

Uses the "matched content" as the delimiter to split the string, returning a list.

`maxsplit=0` means "split all", and `maxsplit=1` means "split only once".

## compile

`re.compile(pattern,flags=0)`

Precompiles the regex rule into a `Pattern` object, improving efficiency when used multiple times later (avoiding repeated parsing of the rule).

Use case: the same regex rule needs to be matched multiple times (e.g. processing large amounts of text in a loop).

```python
pattern = re.compile(r'1[34578]\d{9}',flags=0)
res = pattern.search()
```

## The flags parameter: matching control modes

`flags` is used to modify the matching behavior of the regex.

- `re.IGNORECASE` (abbreviated `re.I`): ignore case when matching
- `re.DOTALL` (abbreviated `re.S`): makes `.` match the newline `\n` (by default `.` does not match `\n`)
- `re.MULTILINE` (abbreviated `re.M`): makes `^` and `$` match the "start and end of each line" (by default they only match the start and end of the whole string)

## How to find the second match with search

`search` can only find the first match. To find the second one, you need to combine `finditer` with `next`; `next` moves the iterator forward one step.

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

## The role of r in regular expressions

When the pattern contains an escape character `\`, it can be matched literally without being escaped.



## Regex syntax

### Ordinary character classes

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

### Quantifier character classes (greedy matching by default (match as much as possible); add `?` to suppress it)

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

### Boundary matchers

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

### Logical matchers

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

### Special matchers

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
