# 分类算法

## KNN（K近邻）

KNN算法是有监督学习算法，既可用于分类，也可用于回归任务

核心思想： 如果一个样本在特征空间中的 k 个最相似的样本中的大多数属于某一个类别，则该样本也属于这个类别

### 距离计算

- 欧式距离（最常用）
- 曼哈顿距离

![image-20260624133715309](assets/image-20260624133715309.png)

> 📖 **欧氏距离 vs 曼哈顿距离——用"走路"来理解**
>
> **欧氏距离 = 直线距离（鸟飞过去）**
> $$d_{欧} = \sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}$$
> 点A(1,1)到点B(4,5)：$d = \sqrt{(4-1)^2 + (5-1)^2} = \sqrt{9+16} = \sqrt{25} = 5$
>
> **曼哈顿距离 = 街区距离（人走过去）**
> $$d_{曼} = |x_1-x_2| + |y_1-y_2|$$
> 点A(1,1)到点B(4,5)：$d = |4-1| + |5-1| = 3+4 = 7$
>
> 曼哈顿距离得名于纽约曼哈顿的棋盘式街道——你不能穿楼走直线，只能沿街道横竖着走。在机器学习中，当特征之间差异很大时欧氏距离更常用，曼哈顿距离对异常值不那么敏感。

### API

```python
from sklearn.neighbors import KNeighborsClassifier  # KNN分类算法
from sklearn.neighbors import KNeighborsRegressor  # KNN回归算法

#  创建对象		
estimator = KNeighborsClassifier(n_neighbors=3)  # 创建一个KNN分类模型对象， K值取3

# 模型训练		
estimator.fit(X_train, y_train)  # X_train: 训练集特征， y_train：训练集标签

# 结果预测		
y_predict = estimator.predict(X_test)  # X_test: 测试集特征， y_predict：测试集的预测结果
# 模型评估		
score = estimator.score(X_test, y_test)  # score: 准确率	X_test: 测试集特征，y_test: 测试集标签
```

### 示例-Facebook招聘预测

[Facebook V: Predicting Check Ins | Kaggle](https://www.kaggle.com/competitions/facebook-v-predicting-check-ins/overview)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# 读取数据
data = pd.read_csv('./data/FBlocation/train.csv')

# 过滤条件
filtered_data = data[(data['x'] > 1.0) & (data['x'] < 1.25) & (data['y'] > 2.5) & (data['y'] < 2.75)].copy()
print(filtered_data.shape)
print(filtered_data.dtypes)
print(filtered_data.columns)

# 处理时间特征，time 列是距离1970年1月1号的分钟数
if 'time' in filtered_data.columns:
    # 将 time 列转换为 pandas 的 datetime 类型（单位为分钟，从1970-01-01开始）
    filtered_data['datetime'] = pd.to_datetime(filtered_data['time'], unit='m', origin='1970-01-01')
    filtered_data['hour'] = filtered_data['datetime'].dt.hour
    filtered_data['day'] = filtered_data['datetime'].dt.dayofweek  # 0=Monday
    filtered_data['month'] = filtered_data['datetime'].dt.month

# 只保留去该place_id人数大于3的记录
place_counts = filtered_data['place_id'].value_counts()
valid_places = place_counts[place_counts > 3].index
filtered_data = filtered_data[filtered_data['place_id'].isin(valid_places)].copy()
print(filtered_data.shape)

# 选择特征列和目标列，可以根据数据适当调整
features = ['x', 'y', 'accuracy', 'hour', 'day', 'month']

X = filtered_data[features]
y = filtered_data['place_id']

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 对特征进行标准化
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # 使用训练集来计算 均值和方差
X_test = scaler.transform(X_test)  # 使用训练集的均值和方差来标准化测试集

# KNN建模
knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X_train, y_train)

# 预测
y_pred = knn.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"KNN预测准确率: {accuracy:.4f}")
```

## 交叉验证+网格搜索

### 超参数

超参数：在机器学习和深度学习中，**超参数**是指在算法运行之前手动设置的参数，用于控制模型的行为和性能

**交叉验证**（Cross Validation）：将训练集分为多个子集，轮流使用一个子集作为验证集（测试集），其余作为训练集，最终取平均性能指标，确保模型评估稳定性

![image-20260624141841958](assets/image-20260624141841958.png)

交叉验证的目的，其实就是为了降低结果的偶然性，从而提高模型的准确度与可信度

> 📖 **交叉验证——用"模拟考试"来理解**
>
> 假如你有10份历年真题（训练集），你想知道自己的真实水平：
> - **不用交叉验证**：用前8份复习，后2份测试 → 如果恰好后2份都是难题，成绩会低估
> - **5折交叉验证**：把10份分成5组（每组2份），轮流拿1组做测试、剩下4组做训练，最后取5次成绩的平均 → 更客观！
>
> 每一"折"就是一次"模拟考试 + 用其他题复习"的循环。cv=5 就是5折交叉验证。
>
> 在sklearn中设置 `cv=5` 意味着同样的流程做5遍，每遍换一组验证集。

**网格搜索**（Grid Search）：网格搜索是一种穷举搜索方法，它通过遍历超参数的所有可能组合来寻找最优超参数。

> 📖 **网格搜索——用"找最佳配方"来理解**
>
> 你想找到最好喝的柠檬水配方，有两个变量：糖量和柠檬量。
> - 糖量尝试：1勺、2勺、3勺
> - 柠檬量尝试：1个、2个
> - **网格搜索**就是：把所有组合都试一遍！共 3×2 = 6 种配方，每种都做一杯尝尝，选最好喝的。
>
> 代码中的 `param_grid`：
> ```python
> param_grid = {
>     'n_neighbors': [1, 3, 5, 7, 9],   # 5种K值
>     'weights': ['uniform', 'distance']  # 2种权重方式
> }
> ```
> 总共 5×2 = 10 种组合，结合 cv=5 的交叉验证，要做 10×5 = 50 次训练！这就是 `GridSearchCV` 在做的事情。
>
> `n_jobs=-1` 表示用你电脑的所有CPU核心并行计算，加速这个过程。

![image-20260624142536574](assets/image-20260624142536574.png)

**网格搜索 + 交叉验证** 是模型的选择和调优的强有力的工具：

- 交叉验证解决模型的数据输入问题(数据集划分)得到更可靠的模型
- 网格搜索解决超参数的组合

### 示例-Facebook招聘预测

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import GridSearchCV

# 读取数据
data = pd.read_csv(r'./data/FBlocation/train.csv')

# 过滤条件
filtered_data = data[(data['x'] > 1.0) & (data['x'] < 1.25) & (data['y'] > 2.5) & (data['y'] < 2.75)]

# 处理时间特征，time 列是距离1970年1月1号的分钟数
if 'time' in filtered_data.columns:
    # 将 time 列转换为 pandas 的 datetime 类型（单位为分钟，从1970-01-01开始）
    filtered_data['datetime'] = pd.to_datetime(filtered_data['time'], unit='m', origin='1970-01-01')
    filtered_data['hour'] = filtered_data['datetime'].dt.hour
    filtered_data['day'] = filtered_data['datetime'].dt.dayofweek  # 0=Monday
    filtered_data['month'] = filtered_data['datetime'].dt.month

# 只保留去该place_id人数大于等于3的记录
place_counts = filtered_data['place_id'].value_counts()
valid_places = place_counts[place_counts > 3].index
filtered_data = filtered_data[filtered_data['place_id'].isin(valid_places)].copy()

# 选择特征列和目标列，可以根据数据适当调整
features = ['x', 'y', 'accuracy', 'hour', 'day', 'month']

X = filtered_data[features]
y = filtered_data['place_id']

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
from sklearn.preprocessing import StandardScaler

# 对特征进行标准化
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # 使用训练集来计算 均值和方差
X_test = scaler.transform(X_test)  # 使用训练集的均值和方差来标准化测试集

# 网格搜索
# 定义参数搜索空间
param_grid = {
    'n_neighbors': [1, 3, 5, 7, 9],
    'weights': ['uniform', 'distance']  # weights 权重，uniform 均匀权重，distance 距离权重
}

# 建立网格搜索对象
grid_search = GridSearchCV(KNeighborsClassifier(), param_grid, cv=5, scoring='accuracy', n_jobs=-1)

# 拟合模型
grid_search.fit(X_train, y_train)

print(f"最优参数: {grid_search.best_params_}")
print(f"最优准确率: {grid_search.best_score_:.4f}")

# 使用最佳参数的模型预测测试集
best_knn = grid_search.best_estimator_  # best_estimator_里边是最佳的模型
y_pred_best = best_knn.predict(X_test)
best_accuracy = accuracy_score(y_test, y_pred_best)
print(f"使用最优参数模型的测试集准确率: {best_accuracy:.4f}")
```

## 朴素贝叶斯

### 贝叶斯公式

$$
P(A|B)=\frac{P(A)·P(B|A)}{P(B)}
$$

### 特征条件独立

如果两件事情的发生，没有任何关系，那么叫做特征条件独立

如果B，C特征条件独立，存在以下公式：
$$
P(B,C|A)=P(B|A)·P(C|A)
$$
在事件A发生的条件下，同时发生B，C的概率，如果B和C之间特征条件独立，那么该值为 在事件A发生的条件下，发生B事件的概率和发生C事件的概率的乘积。

假设B，C，D，E，F特征条件独立：
$$
P(B,C,D,E,F|A)=P(B|A)·P(C|A)·P(D|A)·P(E|A)·P(F|A)·
$$

### 朴素贝叶斯

朴素贝叶斯法（Naive Bayes model）是基于贝叶斯定理与特征条件独立假设的分类方法

- 假如我们的事件有可能出现的结果分别为X、Y，而在生成X，Y的过程中会经过4个特征，假设其属性值分别为A、B、C、D

- 我们要计算在ABCD的情况出现X，Y的情况，$P(X|A,B,C,D)$和$P(Y|A,B,C,D)$，如果$P(X|A,B,C,D)>P(Y|A,B,C,D)$则出现ABCD四个值的时候结果为X的概率更大

- 使用贝叶斯公式
  $$
  P(X|A,B,C,D)=\frac{P(X)P(A,B,C,D|X)}{P(A,B,C,D)}
  $$

  $$
  P(Y|A,B,C,D)=\frac{P(Y)P(A,B,C,D|Y)}{P(A,B,C,D)}
  $$

- $$
  P(A,B,C,D|X)=P(A|X)·P(B|A,X)·P(C|B,A,X)·P(D|C,B,A,X)
  $$

- **基于条件独立假设**，假设ABCD之间特征条件独立，也就是他们之间没有关系
  $$
  P(A,B,C,D|X)=P(A|X)·P(B|X)·P(C|X)·P(D|X)
  $$

- 计算在ABCD的情况出现X，Y的情况，也就变成了计算
  $$
  X的概率=P(X)·P(A|X)·P(B|X)·P(C|X)·P(D|X)
  $$

  $$
  Y的概率=P(Y)·P(A|Y)·P(B|Y)·P(C|Y)·P(D|Y)
  $$

### 拉普拉斯平滑系数

在上面计算概率的过程中，比如$P(A|X)$,假如这个值等于0，那么整个计算得到的概率一定是0

所以，为了避免概率值为0，我们在分子和分母分别加上一个数值，这就是拉普拉斯平滑系数的作用
$$
P(A|X)=\frac{P(X,A)+\alpha}{P(X)+{\alpha}m}
$$

- $\alpha$是拉普拉斯平滑系数，一般指定为 1
- $m$表示**所有独立样本**的总数

> 📖 **朴素贝叶斯——用"垃圾邮件过滤"走一遍完整计算**
>
> 假设我们要判断一封邮件是不是垃圾邮件。训练数据（6封邮件）：
>
> | 邮件 | 含"免费" | 含"会议" | 是垃圾邮件？ |
> |------|---------|---------|------------|
> | 1 | 是 | 否 | 是 |
> | 2 | 是 | 是 | 是 |
> | 3 | 是 | 否 | 是 |
> | 4 | 否 | 是 | 否 |
> | 5 | 否 | 否 | 否 |
> | 6 | 否 | 是 | 否 |
>
> 先算先验概率：
> - P(垃圾) = 3/6 = 0.5（6封中3封是垃圾）
> - P(正常) = 3/6 = 0.5
>
> 再算条件概率（拉普拉斯平滑，α=1）：
> - P(含"免费" | 垃圾) = (3+1)/(3+1×2) = 4/5 = 0.8
>   - 分子："免费"在垃圾邮件中出现3次 + α(1)
>   - 分母：垃圾邮件总数3 + α×m，m=2是特征取值数（"是"和"否"）
> - P(含"免费" | 正常) = (0+1)/(3+2) = 1/5 = 0.2
> - P(含"会议" | 垃圾) = (1+1)/(3+2) = 2/5 = 0.4
> - P(含"会议" | 正常) = (2+1)/(3+2) = 3/5 = 0.6
>
> 新邮件来了——含"免费"但不含"会议"，判断它是不是垃圾：
>
> P(垃圾 | 特征) = P(垃圾) × P(免费|垃圾) × P(不含会议|垃圾) = 0.5 × 0.8 × (1-0.4) = 0.5 × 0.8 × 0.6 = **0.24**
>
> P(正常 | 特征) = P(正常) × P(免费|正常) × P(不含会议|正常) = 0.5 × 0.2 × (1-0.6) = 0.5 × 0.2 × 0.4 = **0.04**
>
> 0.24 > 0.04 → 判断为**垃圾邮件** ✅
>
> **"朴素"在哪？** 我们假设"含免费"和"含会议"这两个特征是独立的。现实中它们可能有关联（垃圾邮件往往同时包含多个营销词），但这种简化让计算变得极其容易，而且实际效果往往还不错！

### 示例-20类新闻文本

```python
from sklearn.datasets import fetch_20newsgroups
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, accuracy_score

# 加载数据
newsgroups = fetch_20newsgroups(subset='all', shuffle=True, random_state=42, data_home='data')
X, y = newsgroups.data, newsgroups.target
print(f'X的样本数量: {len(X)}')
print(f"第一个新闻样本内容：\n{X[0]}\n")
print(f"第一个新闻样本的标签：{y[0]} ({newsgroups.target_names[y[0]]})\n")

print(f'y[0:50]: {y[0:50]}')
print(f"类别总数: {len(newsgroups.target_names)}")
print(f"类别名称: {newsgroups.target_names}")

# 分割数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 文本特征提取：TF-IDF
# max_df 参数用于设置词频的上限阈值，用于过滤掉出现频率过高的词语，这些词很可能是对分类没有帮助的噪声。
# max_df 可以是:
#   1. 浮点数（0.0 ~ 1.0）：表示“出现于超过该比例文档中的词”将被过滤（如 max_df=0.7 表示出现在70%以上文档中的词会被忽略）。
#   2. 整数：表示“出现于超过max_df个 文档中的词”将被过滤。
# 通常 max_df=0.8~0.9 可以去除常见无用词，有助于提升模型泛化能力。

vectorizer = TfidfVectorizer(stop_words='english', max_df=0.8) #stop_words='english' 停用词含义是：在文本中出现频率很高，但是对分类没有帮助的词，如：the, is, at, which等
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)
print(f"X_train_tfidf的形状: {X_train_tfidf.shape}")

# 朴素贝叶斯模型训练
nb = MultinomialNB(alpha=0.01)
nb.fit(X_train_tfidf, y_train)

# 预测
y_pred = nb.predict(X_test_tfidf)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"朴素贝叶斯分类器的准确率: {accuracy:.4f}")
```

## 决策树

### 信息熵

熵在信息论中代表随机变量不确定度的度量

- 熵越大，数据的确定性度越低，信息量大
- 熵越小，数据的确定性越高

信息熵计算公式：
$$
H=-\sum_{i=1}^{k}p_i\log_2(P_i)
$$

> 📖 **信息熵——用"猜硬币"来理解**
>
> 公式中：
> - $k$：类别总数（比如"是/否"两个类别，k=2）
> - $P_i$：第 i 个类别的占比（比如60%是"是"，40%是"否"）
> - $\log_2$：以2为底的对数（因为信息论用二进制比特衡量信息量）
>
> **熵越大 = 数据越混乱 = 不确定性越大**
>
> 数值举例：
>
> | 场景 | 计算 | 熵值 | 理解 |
> |------|------|------|------|
> | 10个样本全"是" | $H = -(1 \times \log_2 1) = 0$ | **0** | 完全确定，不需要再分了 |
> | 5个"是"，5个"否" | $H = -(0.5\log_2 0.5 + 0.5\log_2 0.5)$ = -(0.5×(-1) + 0.5×(-1)) | **1.0** | 最混乱，完全不确定 |
> | 7个"是"，3个"否" | $H = -(0.7\log_2 0.7 + 0.3\log_2 0.3)$ ≈ -(0.7×(-0.51) + 0.3×(-1.74)) | **≈0.88** | 有点偏向"是"，较混乱 |
>
> $\log_2$ 在计算器上怎么按？用换底公式：$\log_2(x) = \frac{\ln(x)}{\ln(2)}$ 或 $\frac{\lg(x)}{\lg(2)}$
>
> 比如 $\log_2(0.5) = \frac{\ln(0.5)}{\ln(2)} = \frac{-0.693}{0.693} = -1$
>
> 决策树在做的事：找一个特征来分割数据，让分割后的熵尽可能小（也就是让数据变得更"纯"）。

### 信息增益

信息增益：表示由于特征A而使得对数据D的分类不确定性减少的程度

定义：特征A对训练数据集D的信息增益$gain(D,A)$或$g(D,A)$，定义为集合D的熵$H(D)$与特征A给定条件下D的熵$H(D|A)$之差。
$$
gain(D,A)=H(D)-H(D|A)
$$
根据信息增益选择特征方法是：对训练数据集D，计算其每个特征的信息增益，并比较它们的大小，并选择信息增益最大的特征进行划分。

![image-20260625094500930](assets/image-20260625094500930.png)

### CART决策树

CART模型是一种决策树模型，它即可以用于分类，也可以用于回归。分类和回归树模型采用不同的最优化策略

- CART回归树使用平方误差最小化策略
- CART分类生成树采用的基尼指数最小化策略

#### 基尼指数计算方法

$$
Gini(D)=1-\sum_{k=1}^{k}{p_k^2},k是类别数目
$$

$$
Gini\_index(D,\alpha)=\sum_{v=1}^{v}\frac{D^v}{D}Gini(D^v)
$$

基尼指数计算举例

![image-20260625104455872](assets/image-20260625104455872.png)

- 是否有房

  ![image-20260625104837079](assets/image-20260625104837079.png)

- 婚姻状况

  ![image-20260625104905582](assets/image-20260625104905582.png)

> 📖 **基尼指数——用"抽签"来理解**
>
> **基尼不纯度**衡量的是：随机抽两个样本，它们属于不同类别的概率。
> $$Gini(D) = 1 - \sum_{k=1}^{K} p_k^2$$
>
> - $K$：类别数，$p_k$：第 k 类的占比
>
> | 场景 | 计算 | 基尼值 | 理解 |
> |------|------|--------|------|
> | 10个全"是" | $1 - (1^2) = 0$ | **0** | 完全纯净，抽两个肯定同类别 |
> | 5个"是"5个"否" | $1 - (0.5^2+0.5^2) = 1-0.5$ | **0.5** | 最混乱 |
> | 7个"是"3个"否" | $1 - (0.7^2+0.3^2) = 1-0.58$ | **0.42** | 较纯净 |
>
> 上图例子：用"是否有房"分割后，左子节点 Gini=0（3个全违约，很纯），右子节点 Gini=0.444（7个中4个不违约3个违约，有点混）。这比不分割时更"纯"，所以"是否有房"是一个有用的特征。
>
> **基尼 vs 信息熵**：两者作用相同（衡量混乱程度），CART决策树默认用基尼（计算更快，因为不需要算log）。



### 剪枝

剪枝 (pruning)是决策树学习算法对付 **过拟合** 的主要手段。

在决策树学习中，为了尽可能正确分类训练样本，结点划分过程将不断重复，有时会造成决策树分支过多，这时就可能因训练样本得"太好"了，以致于把训练集自身的一些特点当作所有数据都具有的一般性质而导致过拟合。因此，可通过主动去掉一些分支来降低过拟合的风险。

- 预剪枝是指在决策树生成过程中，对每个结点在划分前先进行估计，若当前结点的划分不能带来决策树泛化性能提升，则停止划分并将当前结点标记为叶结点
- 后剪枝则是先从训练集生成一棵完整的决策树，然后自底向上地对非叶结点进行考察，若将该结点对应的子树替换为叶结点能带来决策树泛化性能提升，则将该子树替换为叶结点。

### 示例-泰坦尼克号

```python
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

df = pd.read_csv('data/titanic.csv')

X = df[['pclass', 'age', 'sex']].copy()
# 将性别转为数值型变量
X['sex'] = X['sex'].map({'male': 0, 'female': 1})
y = df['survived']

# 确保pclass为数值型
# 将 'pclass' 中的 '1st', '2nd', '3rd' 映射为数值 1, 2, 3
X['pclass'] = X['pclass'].map({'1st': 1, '2nd': 2, '3rd': 3})

# age 可能也有缺失值，补充缺失值（可选）
X['age'] = X['age'].fillna(X['age'].median())

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 决策树分类

# 决策树分类器常用/优先调节的主要超参数及其含义如下：
# 1. criterion：用于划分节点时评估分裂质量的指标。常用'gini'（基尼不纯度）或'entropy'（信息增益，ID3）。
# 2. max_depth：树的最大深度。过大容易过拟合，过小可能欠拟合。
# 3. min_samples_split：内部节点再划分所需最小样本数。默认为2，可以有效控制树的生长，从而避免过拟合。
# 4. min_samples_leaf：叶子节点所需的最小样本数。用来控制每个叶子节点最少要包含的样本数量，增大有助于平滑模型。
# 5. max_features：划分时考虑的最大特征数。可以控制每次寻找最佳分割时考虑的特征数，一定程度上防止过拟合。
# 6. random_state：随机数种子，方便结果复现。
# 7. splitter：划分节点的策略，'best'（默认）表示每次选择最优的划分，'random'表示在一个随机的特征上划分。
# 一般建议优先尝试调节max_depth, min_samples_split, min_samples_leaf, criterion等参数，根据模型在验证集上的表现确定最优值。

clf = DecisionTreeClassifier(random_state=42,max_depth=5)
clf.fit(X_train, y_train)

# 预测
y_pred = clf.predict(X_test)

# 评估
accuracy = accuracy_score(y_test, y_pred)
print(f"决策树分类准确率: {accuracy:.4f}")


# 绘制决策树图
from sklearn import tree
import matplotlib.pyplot as plt

# 配置matplotlib支持中文显示
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

plt.figure(figsize=(100,50),dpi=300)

tree.plot_tree(
    clf,  # 训练好的决策树分类器
    feature_names=X.columns,  # 特征名称列表，对应于输入X的每一列
    class_names=['未幸存', '幸存'],  # 类别名称，依次对应于目标变量的类别
    filled=True,  # 是否填充节点颜色，便于区分不同类别
    rounded=True,  # 节点框是否显示为圆角矩形
    fontsize=12  # 字体大小设置为12
)
plt.savefig('decision_tree.png', dpi=300, bbox_inches='tight')
plt.close()
print("决策树图已保存为 decision_tree.png")

if __name__ == '__main__':
    sex_0_count = (X_train['sex'] == 0).sum()
    sex_1_count = (X_train['sex'] == 1).sum()
    print(f"X_train中sex为0的数目: {sex_0_count}")
    print(f"X_train中sex为1的数目: {sex_1_count}")

    age_le_12 = X_train[(X_train['sex'] == 0) & (X_train['age'] <= 12)].shape[0]
    age_gt_12 = X_train[(X_train['sex'] == 0) & (X_train['age'] > 12)].shape[0]
    print(f"X_train中sex为0且age≤12的数目: {age_le_12}")
    print(f"X_train中sex为0且age>12的数目: {age_gt_12}")
```

![decision_tree](assets/decision_tree.png)

## 随即森林（多棵决策树）

基于 “集成学习（Ensemble Learning）” 思想，通过构建**多棵独立决策树**，并对结果进行集成（投票 / 平均）的监督学习算法，可处理分类与回归任务

随机森林 = 多棵 “差异化” 决策树 + 结果集成（解决决策树 “易过拟合、不稳定” 的核心缺陷）

### 集成学习

集成学习（Ensemble Learning）是通过构建多个 **“基模型”（Base Model）** ，并按特定规则将其预测结果整合，以获得比单个基模型更优性能（更高准确率、更低过拟合风险）的机器学习框架。

核心逻辑：“集体智慧优于个体”，通过基模型的 “多样性” 抵消单个模型的局限性。

集成学习有三种类型: 

- 并行集成（Bagging）

  对训练数据 “随机抽样”，包括样本随机与特征随机，并行训练多个独立基模型，用 “投票 / 平均” 集成

- 串行集成（Boosting）

  按 “错误反馈” 串行训练基模型，后一个模型聚焦前一个模型的错误样本

- 堆叠集成（Stacking）

  第一层（基模型层）： 选择多种不同类型的基模型用训练集训练，得到每个样本的 “基模型预测结果”

  第二层（元模型层）：将 “基模型预测结果” 作为新的特征，用少量 “验证集” 训练一个 “元模型”

  新样本先经所有基模型预测，再将结果输入元模型，得到最终输出

### 双重随机

- 样本随机（Bootstrap 抽样）

  对原始训练集进行 “有放回抽样”，每棵树用独立的抽样样本训练（约 63.2% 样本被选中）

- 特征随机

  每棵树分裂节点时，仅从全部特征中随机选择`max_features`个特征参与纯度计算

   `max_features`默认是特征总数量的平方根

### sklearn中的关键参数

- `n_estimators`： 决策树数量，默认100，常用取值 100-1000
- `max_features`： 每棵树分裂时可选的最大特征数，分类任务默认$\sqrt{总特征数}$，回归任务$\frac{默认总特征数}{3}$
- `max_depth`： 单棵树的预剪枝参数

### 示例-泰坦尼克号

```python
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

df = pd.read_csv('data/titanic.csv')

X = df[['pclass', 'age', 'sex']].copy()
# 将性别转为数值型变量
X['sex'] = X['sex'].map({'male': 0, 'female': 1})
y = df['survived']

# 确保pclass为数值型
# 将 'pclass' 中的 '1st', '2nd', '3rd' 映射为数值 1, 2, 3
X['pclass'] = X['pclass'].map({'1st': 1, '2nd': 2, '3rd': 3})

# age 可能也有缺失值，补充缺失值（可选）
X['age'] = X['age'].fillna(X['age'].median())

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

from sklearn.ensemble import RandomForestClassifier

# 创建随机森林分类器
# 设置每次抽样控制样本数的超参数max_samples（如0.8表示每棵树只用80%的训练样本）
# max_features 是 RandomForestClassifier 等集成模型中的一个重要参数，
# 用于控制每棵树在寻找最佳分割时可用的特征数量。
# - 如果设置为整数，比如 4，则每次分裂时从全部特征中随机选择 4 个特征考虑最佳切分。
# - 如果设置为浮点数（如 0.6），则每次分裂时从全部特征中随机选择 60% 的特征考虑最佳切分。
# - 如果设置为 "sqrt"，则使用特征总数的平方根（常用于分类问题）。
# - 如果设置为 "log2"，则使用特征总数的对数（以 2 为底）。
# 这样做可以增加模型多样性，降低过拟合风险。

rf_clf = RandomForestClassifier(
    n_estimators=100,  # 集成 100 棵决策树，最终预测通过多数投票决定
    max_depth=5,  # 限制单棵树深度，控制模型复杂度，防止单棵树过拟合
    random_state=42,
    max_samples=1,  # 每棵树使用的训练样本比例，1 表示使用全部训练样本（bootstrap 有放回抽样）
    max_features='sqrt',  # 每次分裂时考虑的特征数 = sqrt(总特征数)，本数据集3个特征 → 约1~2个
    min_samples_leaf=5,  # 每个叶子至少 5 个样本
)

# 用训练集拟合随机森林模型
rf_clf.fit(X_train, y_train)

# 用测试集预测
y_pred_rf = rf_clf.predict(X_test)

# 评估随机森林的准确率
rf_accuracy = accuracy_score(y_test, y_pred_rf)
print(f"随机森林分类准确率: {rf_accuracy:.4f}")

from sklearn.model_selection import GridSearchCV

# 定义待调参的参数网格
param_grid = {
    'n_estimators': [50, 100, 200, 500, 800],
    'max_depth': [3, 5, 7, None],
    'min_samples_leaf': [1, 3, 5, 10],
    'max_features': ['sqrt', 'log2', 1, 0.7],
    'max_samples': [0.6, 0.7, 0.8, None],
    'random_state': [42]  # 保证结果可复现
}

rf = RandomForestClassifier()

# 使用网格搜索交叉验证寻找最佳超参数
grid_search = GridSearchCV(
    estimator=rf,
    param_grid=param_grid,
    cv=5,  # 5折交叉验证
    scoring='accuracy',  # 使用准确率作为评估指标
    n_jobs=-1  # 并行计算，加快速度
)

grid_search.fit(X_train, y_train)

print("最佳参数：", grid_search.best_params_)
print("交叉验证下的最佳准确率：", grid_search.best_score_)

# 如果你想用最优参数重新训练并评估模型，可以使用：
best_rf = grid_search.best_estimator_
y_pred_best = best_rf.predict(X_test)
best_accuracy = accuracy_score(y_test, y_pred_best)
print(f"测试集上使用最佳参数的随机森林准确率: {best_accuracy:.4f}")


随机森林分类准确率: 0.6388
最佳参数： {'max_depth': None, 'max_features': 'sqrt', 'max_samples': 0.8, 'min_samples_leaf': 3, 'n_estimators': 500, 'random_state': 42}
交叉验证下的最佳准确率： 0.8333333333333334
测试集上使用最佳参数的随机森林准确率: 0.8137
```

## 分类模型评估指标

### 混淆矩阵

在分类任务下，预测结果(Predicted Condition)与正确标记(True Condition)之间存在四种不同的组合，构成**混淆矩阵(Confusion Matrix)**

第一位表示模型预测结果和真实值是否一致，第二位表示模型预测的是正例还是反例

![image-20260625160637641](assets/image-20260625160637641.png)



以“癌症预测”为例，解释一下各个参数

- 真实结果-正例：表示实际上患病 
- 真实结果-反例：表示实际上没病 
- 预测结果-正例：表示模型预测患病
- 预测结果-反例：表示模型预测没病

矩阵指标解释：

- **TP**：模型正确诊断为癌症（实际患病，确诊）→       理想结果，可及时治疗； 

- **TN**：模型正确诊断为健康（实际健康，排除）→      理想结果，无多余医疗负担； 

- **FP**：模型误判健康人为癌症（实际健康，误诊）→ 后果：健康人需额外检查，产生焦虑与医疗成本； 
- **FN**：模型误判癌症患者为健康（实际患病，漏诊）→ 后果：患者错失治疗时机，危及生命（**代价最高**）

### 评估指标

> 📖 **各评估指标——走一遍完整数值计算**
>
> 假设我们有一个100人的癌症筛查结果：
>
> | | 预测：患病 | 预测：健康 |
> |---|---|---|
> | **实际：患病** | TP = 8 | FN = 2 |
> | **实际：健康** | FP = 10 | TN = 80 |
>
> 10人真患病，90人真健康。模型检出8人患病，但误报了10人。
>
> **准确率 Accuracy** = (8+80)/100 = **0.88**（88%的人判对了）
>
> 看起来不错？但——
>
> **精确率 Precision** = 8/(8+10) = **0.444**（44.4%）
> 被模型说"你有病"的18人中，只有8人真病了。**误诊率太高！**（10个健康人被吓得不轻）
>
> **召回率 Recall** = 8/(8+2) = **0.80**（80%）
> 10个真病人中，检出8个，漏了2个。**漏诊率20%**（这2人危险了！）
>
> **F1-Score** = 2×8/(2×8+10+2) = 16/28 = **0.571**
> F1 是精确率和召回率的调和平均。精确率低会把F1拉下来。
>
> ---
>
> **什么时候更看重哪个指标？**
>
> | 场景 | 重点指标 | 原因 |
> |------|---------|------|
> | 癌症筛查 | **召回率** ↑ | 宁可误诊（FP多），不能漏诊（FN少） |
> | 垃圾邮件过滤 | **精确率** ↑ | 宁可漏掉垃圾邮件（FN多），不能把重要邮件扔垃圾桶（FP少） |
> | 通用分类 | **F1-Score** | 精确率和召回率都要兼顾 |

#### 准确率（Accuracy）；通用但有限

$$
Accuracy=\frac{TP+TN}{TP+TN+FP+FN}
$$

假设某地区癌症发病率为 5%（1000 人中 50 人患病，950 人健康）：

- 若模型 “全预测为健康”（不诊断出任何患者），则 TP=0，TN=950，FP=0，FN=50；
- 准确率 = 950/(0+950+0+50)=95%（看似很高），但漏诊所有患者，完全失去医疗价值

#### 精确率（Precision）与召回率（Recall）

精确率：被诊断为患者的人中，真患病的比例 ->控制误诊率

召回率：真患病的人中，被诊断出来的比例 ->控制漏诊率
$$
精确率P=\frac{TP}{TP+FP}
$$


$$
召回率R=\frac{TP}{TP+FN}
$$

#### F1-Score

F1-Score是一个平衡精确率与召回率的一个指标
$$
F1=\frac{2TP}{2TP+FP+FN}
$$



#### API

```python
# 准确率
from sklearn.metrics import accuracy_score
# 精确率
from sklearn.metrics import precision_score
# 召回率
from sklearn.metrics import recall_score
# 混淆矩阵
from sklearn.metrics import confusion_matrix
# F1-score
from sklearn.metrics import f1_score
# 分类评估报告
from sklearn.metrics import classification_report


# 1. 给出预测结果和真实结果
# y_pred = ['有病', '有病', '有病', '有病', '无病', '无病', '无病', '无病', '无病', '无病']
y_pred = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
# y_true = ['有病', '有病', '无病', '无病', '有病', '有病', '无病', '无病', '有病', '有病']
y_true = [1, 0, 0, 0, 0, 0, 0, 0, 1, 1]

# 2. 计算值
print("混淆矩阵:\n", confusion_matrix(y_true, y_pred, labels=[1, 0]))
print("准确率:", accuracy_score(y_true, y_pred))
print("精确率:", precision_score(y_true, y_pred))
print("召回率:", recall_score(y_true, y_pred))
print("F1-score:", f1_score(y_true, y_pred))
# digits: 保留几位小数
# target_names: 类别名称
# macro avg: 不考虑样本数量，两类指标的算术平均
# weighted avg: 考虑样本数量，两类指标的加权平均
print("评估报告:\n", classification_report(y_true, y_pred,target_names=['健康','病患'],digits=4))
```
