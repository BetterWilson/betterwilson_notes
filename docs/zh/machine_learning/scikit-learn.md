# scikit-learn

## 安装

```python
pip install -U scikit-learn
# -U表示，如果已经安装了sklearn，那么将其升级到最新版本
```

## 模型选择

![image-20260629140715883](assets/image-20260629140715883.png)

## 特征提取

### 从字典加载特征

`DictVectorizer`将由字典组成的特征列表转换为机器学习模型可直接使用的数值矩阵（特征向量）

```python
# 导入字典提取器
from sklearn.feature_extraction import DictVectorizer
import pandas as pd

# 准备字典数据
data = [
    {'颜色': '红', '尺寸': '大', '价格': 100},
    {'颜色': '蓝', '尺寸': '中', '价格': 80},
    {'颜色': '红', '尺寸': '小', '价格': 50}
]

# 初始化字典提取器
# sparse=False 表示返回的矩阵是二维的，而不是稀疏矩阵
# sparse=True 默认值，返回的矩阵是稀疏矩阵, 稀疏矩阵只保存非零的元素,省内存
# 稀疏矩阵: 矩阵中，大多数值都为0的矩阵
dict_vec = DictVectorizer(sparse=False)

# 提取特征
X = dict_vec.fit_transform(data)

# 查看结果
print(X)

# 查看特征名
print(dict_vec.get_feature_names_out())

# 结合DataFrame查看结果
pd.DataFrame(X, columns=dict_vec.get_feature_names_out())
```

结果说明：

- 数值特征 “价格” 直接保留原值（第一列）；
- 类别特征 “颜色” 被独热编码为 “颜色=红”“颜色=蓝”
- 类别特征 “尺寸” 被独热编码为 “尺寸=大”“尺寸=中”“尺寸=小”

补充：独热码(one-hot)是一种**一位有效编码**，其核心特征是：在一组编码中，**任意时刻只有一个二进制位为1，其余所有位均为0**。这种编码方式不依赖数值大小表示信息，而是通过 “哪一位为 1” 来唯一标识一个状态或类别，因此也被称为 “独热码” 或 “一位有效码”。

- 例如，“猫、狗、鸟” 三类标签，独热码表示为 [1,0,0]（猫）、[0,1,0]（狗）、 [0,0,1]（鸟）

- 避免标签的 “数值大小关联”（如二进制码 00、01、10 可能被模型误解为 “猫 < 狗 <鸟”，而独热码无此问题），同时适配神经网络的输出层（如 Softmax 层输出与独热码标签的交叉熵计算）

- 优势：解码简单，时序性能好，适合状态数较少、对速度要求高的场景

### 从英文文本加载特征

` CountVectorizer`将英文文本（或其他语言文本）转换为基于词频的数值特征矩阵（即统计每个词在文档中出现的次数）

```python
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer

# 样本文本（3个文档）
documents = [
    "I love machine learning. Machine learning is interesting.",
    "I love coding. Coding is fun and useful.",
    "Machine learning and coding are my favorite skills."
]

# 创建CountVectorizer对象（默认参数：小写化文本、按空格/标点分词、不过滤停用词）
# min_df/max_df参数解释:
# min_df：最小文档频率，即单词至少出现的文档次数或比例，低于此阈值的单词将被忽略（注意是出现的文档数）
# max_df：最大文档频率，即单词在文档中的文档次数或比例，高于此阈值的单词将被忽略
# 当min_df和max_df都为整数时，表示单词出现的次数， 当min_df和max_df都为小数时，表示单词在文档中的比例
count_vec = CountVectorizer(min_df=2)

# 训练并转换文档
X = count_vec.fit_transform(documents)

# 查看结果
print(X.toarray())

# 查看特征名
print(count_vec.get_feature_names_out())

# 结合DataFrame查看
df = pd.DataFrame(X.toarray(), columns=count_vec.get_feature_names_out())
print(df)
```

### 从中文文本加载特征

先使用`jieba`分词，在使用`CountVectorizer`加载特征

```python
import jieba
from sklearn.feature_extraction.text import CountVectorizer
import pandas as pd

# 1. 文本
documents = [
    "人生苦短，我喜欢 python",
    "人生漫长，不用 python python",
    "人生漫漫，不用 python python python"
]

# 2. 文本分词，得到一个分词之后的文本列表
cut_doucuments = [" ".join(jieba.cut(document)) for document in documents]
print(cut_doucuments)

# 3. 创建特征提取对象
vectorizer = CountVectorizer(min_df=2)

# 4. 创建特征矩阵
X = vectorizer.fit_transform(cut_doucuments)

# 5. 使用DataFrame查看结果
pd.DataFrame(X.toarray(), columns=vectorizer.get_feature_names_out())
```

### TF-IDFVectorizer

`TF-IDFVectorizer`在 **词频（TF）** 的基础上引入了 **逆文档频率（IDF）** 权重，能更合理地衡量词语在文本中的 “重要性”，避免高频但无实际意义的词（如 “the”“is”）过度影响特征。

**词频（TF)**：某个词在当前文档中出现的频率，计算公式为：
$$
TF(t,d)=\frac{词t在文档d中出现的次数}{文档d的总词数}
$$
实际实现中，scikit-learn 默认直接用 “出现次数” 作为 TF，而非频率，更简单直观

**逆文档频率（IDF）**: 衡量一个词的 “稀有度”—— 如果一个词在多数文档中都出现，它的 IDF 会较低（比如 “is”“and”）；如果只在少数文档中出现，IDF 会较高（比如“machine learning”“coding”）。计算公式为：
$$
IDF(t)=log(\frac{总文档数}{包含词t的文档数+1})
$$
分母加 1 是为了避免 “包含词 t 的文档数为 0(测试集)” 时的除零错误，即 “平滑处理”， log以10为底

最终，**TF-IDF 值 = TF × IDF**，它综合了词在当前文档中的 “出现频率” 和在所有文档中的“稀有度”，值越高说明该词对当前文档的区分度越重要。

```python
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd

# 样本文本（3个文档）
documents = [
    "I love machine learning. Machine learning is interesting.",
    "I love coding. Coding is fun and useful.",
    "Machine learning and coding are my favorite skills."
]

# 2. 创建TF-IDF对象
# stopwords='english' 忽略英文中的停用词
# 停用词: 指文本中频繁出现，但通常对语义理解帮助不大的虚词或常见词
tfidf = TfidfVectorizer(min_df=1, stop_words='english')

# 3. 创建特征矩阵
X = tfidf.fit_transform(documents)

# 4. 显示结果
print(pd.DataFrame(X.toarray(), columns=tfidf.get_feature_names_out()))
```

## 数值特征预处理

核心目标是通过调整数据的尺度、分布或补全缺失值，让数据更符合模型的假设（如线性模型假设特征分布相近），从而提升模型的稳定性和性能

> 📖 **为什么需要"缩放"特征？——一个直观例子**
>
> 假设你要预测房价，有两个特征：
>
> - 面积：50~300（平方米）
> - 卧室数：1~5（间）
>
> 不做处理的话，面积的值（300）比卧室数（5）大60倍。模型会认为"面积"比"卧室数"重要得多，梯度下降也会在面积方向上剧烈震荡。
>
> 缩放后，两个特征都在差不多的范围（如0~1），模型就能公平对待每个特征，梯度下降也更稳定。

### 归一化

`MinMaxScaler`通过特征的最小值和最大值进行线性变换，将特征值线性映射到指定的有限区间（如 [0,1] 或 [-1,1]，也可以是任意范围之间），消除不同特征的量纲差异，公式：
$$
X_{scaled}=\frac{X-X_{min}}{X_{max}-X_{min}}\times(max\_range-min\_range)+min\_range
$$
默认区间为 [0,1]，这种线性变换的特点是:

- 不改变数据的**分布形状**（如原始数据是均匀分布，归一化后仍是均匀分布）
- 不改变数据间的**相对关系**（如原始数据中 A > B，归一化后仍 A' > B'）
- 仅改变数据的**绝对数值范围**，从而消除尺度差异

```python
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# 创建数据
data = np.array([[1, 200], [2, 300], [3, 400]])
print(data)

# 创建归一化类
scaler = MinMaxScaler(feature_range=(0, 1))

# 训练并归一化数据
data_scaled = scaler.fit_transform(data)

# 显示结果
print(data_scaled)
```

### 标准化

`StandardScaler`将特征转换为**均值为0、标准差为1**的分布，保留数据的相对离散程度，数据的分布依然是原有的分布

基于特征的均值和标准差进行变换，公式：
$$
X_{scaled}=\frac{X-\mu}{\sigma}
$$

```python
import numpy as np
from sklearn.preprocessing import StandardScaler

# 创建数据
data = np.array([[1, 200], [2, 300], [3, 400]])

# 创建标准化类
scaler = StandardScaler()

# 训练并标准化数据
data_scaled = scaler.fit_transform(data)

# 显示结果
print(data_scaled)
```

> 📖 **归一化 vs 标准化——什么时候用哪个？**
>
> |              | 归一化（MinMaxScaler）                          | 标准化（StandardScaler）          |
> | ------------ | ----------------------------------------------- | --------------------------------- |
> | 公式         | $\frac{X-X_{min}}{X_{max}-X_{min}}$             | $\frac{X-\mu}{\sigma}$            |
> | 结果范围     | 精确控制到 [0,1] 或 [a,b]                       | 均值=0，标准差=1（范围不确定）    |
> | 受异常值影响 | ❌ 严重（一个极值会压缩其他数据）                | ✅ 较不敏感                        |
> | 适合场景     | 图像处理（像素值0-255→0-1）、需要固定范围的场景 | KNN、SVM、线性回归、逻辑回归、PCA |
> | 分布形状     | 保持原分布形状                                  | 保持原分布形状                    |
>
> **经验法则**：
>
> - 数据有异常值 → 优先用标准化
> - 需要严格范围 → 用归一化
> - 不确定时 → 先用标准化试试（大多数情况适用）

## 缺失值处理

`SimpleImputer`对缺失值（NAN）进行处理

关键参数：strategy（填充策略）

- `mean`：均值填充（适用于近似正态分布的连续特征）
- `median`：中位数填充（适用于含异常值的连续特征）
- `most_frequent`：众数填充（适用于分类特征或离散特征）
- `constant`：常数填充（需指定 ` fill_value`）

```python
import numpy as np
from sklearn.impute import SimpleImputer

# 创建数据(包含缺失值)
data = np.array([[1, np.nan], [2, 300], [np.nan, 400]])

# 创建缺失值处理类
# strategy: mean, median, most_frequent, constant
# mean: 使用数据的平均值填充缺失值
imputer = SimpleImputer(missing_values=np.nan, strategy='mean')

# 训练模型并预测
data_new = imputer.fit_transform(data)

# 输出结果
print(data_new)
```

## 特征选择-方差阈值

**从原始特征中筛选子集（保留一些特征 / 剔除一些特征）**，目的是减少特征的维度，提高计算的效率

使用方差阈值`VarianceThreshold`，需要删除低方差的特征

```python
import numpy as np
from sklearn.feature_selection import VarianceThreshold

data = np.array([[0, 2, 0, 3], [0, 1, 4, 3], [0, 1, 1, 3]])
print(data)

# 创建选择器
# threshold: 阈值，默认threshold=0，即删除所有方差为0的特征
selector = VarianceThreshold(threshold=0.05)  # 保留方差≥0.05的特征

# 训练数据
selected_data = selector.fit_transform(data)

# 输出结果
print(selected_data)
```

## 特征降维-PCA

特征降维是通过线性或非线性数学变换，将高维特征映射到低维空间，生成全新的低维特征（非原始特征子集），核心是在降维的同时最大化保留原始数据信息

![image-20260625092047210](assets/image-20260625092047210.png)

特征降维：2维平面有5个样本点，如果找到一个一维数轴，将5个样本点投影到数轴上，如果垂直距离和最小，那么就确定数轴所在位置，5个样本点在新数轴坐标系下的坐标，就是降维后的特征值

**PCA(主成分分析)降维**：线性降维方法，属于无监督学习，不依赖标签信息

**核心思想**：主成分分析（PCA）是一种无监督学习方法，旨在通过线性变换将原始的高维数据映射到一个低维空间，同时尽可能保留数据的方差（即信息量）。简单来说，PCA 的目标是找到一组新的坐标轴（称为主成分），这些坐标轴能够捕捉数据中最大的变异性，并用更少的维度来近似表示原始数据。

> 📖 **PCA 降维——用"拍照角度"来理解**
>
> 想象你在给一群站在地面上的人拍照。这些人的位置是三维的（x, y, z），但如果你从正上方俯拍，照片是二维的——你用一个平面"投影"了三维数据，但人的位置关系基本保留了下来。
>
> PCA 做的事：找到**最佳拍照角度**。
>
> - 第1主成分（PC1）：数据分布最"散"的方向 → 找这个方向拍照，能保留最多信息
> - 第2主成分（PC2）：垂直于PC1的方向中，数据最"散"的方向
> - ...
>
> 如果前2个主成分已经解释了95%的方差（信息），那你就可以把高维数据压缩到2维，还能保留95%的信息！
>
> **参数 `n_components`**：
>
> - 整数（如 `n_components=2`）：保留2个主成分
> - 小数（如 `n_components=0.95`）：自动保留足够的主成分，使它们解释95%的方差
>
> 这是一个很聪明的降维方法：不是在原始特征中挑几个，而是**重新组合**原始特征，造出信息最浓缩的"新特征"。

```python
from sklearn.decomposition import PCA
import numpy as np

# 创建PCA对象
# n_components 是整数时: 保留的维度
# n_components 是小数(0~1)时: 保留的主成分解释的方差比例
pca = PCA(n_components=2)

# 准备数据
X = np.array([[0, 2, 0, 3], [0, 1, 4, 3], [0, 1, 1, 3]])

# 训练PCA模型
X_pca = pca.fit_transform(X)

# 输出结果
print(f"原始数据结构：{X.shape[0]}个数据, {X.shape[1]}维")
print(f"降维后特征数：{X_pca.shape[0]}个数据, {X_pca.shape[1]}维")
```