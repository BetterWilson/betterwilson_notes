---
description: "re Regular Expressions. re.match(pattern,text,flags=0) Matches from the beginning of the string; it only verifies whether the \"beginning matches the rule\"."
---

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
text = "My phone number: 13812345678, backup number: 13987654321"
pattern = r"1[34578]\d{9}"  # No position restriction, just match phone number format
result = re.search(pattern, text)
if result:
    print("First phone number:", result.group())  # Output: First phone number: 13812345678
    print("Position:", result.span())  # Output: Position: (6,17) (start/end index)
```

## findall

`re.findall(pattern,text,flags=0)`

Finds "all content that matches the rule" in the string.

Returns a list (the elements are the matched strings; if there are groups, it returns the group contents).

```python
text = "My phone number: 13812345678, backup number: 13987654321"
pattern = r"1[34578]\d{9}"
phones = re.findall(pattern, text)
print("All phone numbers:", phones)  # Output: All phone numbers: ['13812345678','13987654321']
```

## sub

`re.sub(pattern,repl,text,count=0,flags=0)`

Replaces the matched content with `repl` (a string or a function).

`count=0` means "replace all matches", and `count=1` means "replace only the first".

```python
import re

def double(num: re.Match) -> str:
    return str(int(num.group()) * 2)

text = "Video play count: 1000 times"
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
        next(matches)  # Skip the first match
        second_match = next(matches)  # Get the second match
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
    \w				Match letters, digits, and underscores
    \W				Match anything except letters, digits, and underscores
    \s				Match any whitespace character, equivalent to [\t\n\r\f].
    \S				Match any non-whitespace character
    \d				Match any digit, equivalent to [0-9]
    \D				Match any non-digit
    \1...\9			Match the content of the nth group.
    [a-zA-Z0-9]		Match any letter or digit
```

### Quantifier character classes (greedy matching by default (match as much as possible); add `?` to suppress it)

```
    .		Match any character except newline; when re.DOTALL flag is set, can match any character including newline
    *       Match the preceding character 0, 1, or more times
    +       Match the preceding character 1 or more times
    ?       Match the preceding character 0 or 1 time
    {m}     Match the preceding character m times
    {m,n}   Match the preceding character m to n times
    {m,}    Match the preceding character at least m times
    {,n}    Match the preceding character 0 to n times, at most n times
```

### Boundary matchers

```
^			Match the start of the string; in multiline mode, matches the start of each line
[^]			Inside [...], ^ denotes negation, e.g. non-letter [^a-zA-Z], non-digit [^0-9]
$			Match the end of the string or a line; in multiline mode, matches the end of each line
\A 			Match only the start of the string, same as ^
\b 			Match a word boundary, i.e. the position between a word and a space
\B			Equivalent to [^\b], matches a non-word boundary
\Z			Match the end of the string; if a newline exists, only matches the end before the newline.
\z 			Match the end of the string
```

### Logical matchers

```
| (OR)
　　　　Matches either regular expression on the left or right of |. If the left expression matches, matching ends and the right regular expression is not matched. This symbol is usually used inside (), but if it is not inside parentheses, its scope is the entire regular expression.
Group (...)
　　　　Backreference. Regular expressions enclosed in () are treated as a group. Counting from the left of the regular expression, each left parenthesis '(' starts a new group. Group numbers start at 1 and increment, including nested parentheses. The group expression is treated as a whole and can be followed by a quantifier.
\<number>
　　　　References the string matched by the group numbered <number>. E.g.: \1...\9
(?P<name>...)
　　　　Named group. In addition to the default group number, specifies an alias for the group.
　　　　Note: P is uppercase
(?P=name)
　　　　References the match of the group named "name". This is used within the regular expression to match repeated strings. You can also use numeric references.
　　　　Note: P is uppercase
```

### Special matchers

```
(?imx)				The regular expression includes three optional flags: i, m, or x. Only affects the region within the parentheses.
(?-imx)				The regular expression turns off the i, m, or x optional flags. Only affects the region within the parentheses.
(?:...)				The matched string inside the parentheses is not treated as a group
(?!pattern)			Negative lookahead assertion syntax, representing a negative start. Can only be used at the beginning of a regular expression. "pattern" is the match pattern; the content after it must NOT match for the regular expression to match successfully
(?<!pattern)		Negative lookbehind assertion syntax, representing a negative end. The preceding content must NOT match the "pattern" for the match to succeed
(?=pattern)			Positive lookahead assertion syntax. Requires matching the "pattern" for the match to succeed, asserting the preceding character content
(?<=pattern)		Positive lookbehind assertion syntax. Requires matching the "pattern" for the match to succeed, asserting the following character content
(?#...)				The following content is treated as a comment and ignored
```
