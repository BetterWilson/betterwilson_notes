---
description: "Classification Algorithms. KNN is a supervised learning algorithm that can be used for both classification and regression tasks."
---

# Classification Algorithms

## KNN (K-Nearest Neighbors)

KNN is a supervised learning algorithm that can be used for both classification and regression tasks.

Core idea: If most of the k most similar samples of a sample in feature space belong to a certain category, then this sample also belongs to that category.

### Distance Calculation

- Euclidean distance (most commonly used)
- Manhattan distance

![image-20260624133715309](/images/machine_learning/machine-learning-classification-01.png)

> 📖 **Euclidean vs Manhattan distance — understand it through "walking"**
>
> **Euclidean distance = straight-line distance (how a bird flies)**
> $$d_{euc} = \sqrt{(x_1-x_2)^2 + (y_1-y_2)^2}$$
> From point A(1,1) to point B(4,5): $d = \sqrt{(4-1)^2 + (5-1)^2} = \sqrt{9+16} = \sqrt{25} = 5$
>
> **Manhattan distance = block distance (how a person walks)**
> $$d_{\text{manhattan}} = |x_1-x_2| + |y_1-y_2|$$
> From point A(1,1) to point B(4,5): $d = |4-1| + |5-1| = 3+4 = 7$
>
> Manhattan distance is named after the grid-like streets of Manhattan in New York — you cannot walk straight through buildings; you can only walk along streets horizontally and vertically. In machine learning, Euclidean distance is more commonly used when the differences between features are large, while Manhattan distance is less sensitive to outliers.

### API

```python
from sklearn.neighbors import KNeighborsClassifier  # KNN classification algorithm
from sklearn.neighbors import KNeighborsRegressor  # KNN regression algorithm

#  Create object		
estimator = KNeighborsClassifier(n_neighbors=3)  # Create a KNN classification model object, K=3

# Model training		
estimator.fit(X_train, y_train)  # X_train: training set features, y_train: training set labels

# Result prediction		
y_predict = estimator.predict(X_test)  # X_test: test set features, y_predict: test set predictions
# Model evaluation		
score = estimator.score(X_test, y_test)  # score: accuracy	X_test: test set features, y_test: test set labels
```

### Example - Facebook Check-in Prediction

[Facebook V: Predicting Check Ins | Kaggle](https://www.kaggle.com/competitions/facebook-v-predicting-check-ins/overview)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# Read data
data = pd.read_csv('./data/FBlocation/train.csv')

# Filtering conditions
filtered_data = data[(data['x'] > 1.0) & (data['x'] < 1.25) & (data['y'] > 2.5) & (data['y'] < 2.75)].copy()
print(filtered_data.shape)
print(filtered_data.dtypes)
print(filtered_data.columns)

# Process time feature: the 'time' column is minutes since 1970-01-01
if 'time' in filtered_data.columns:
    # Convert the 'time' column to pandas datetime (unit=minutes, origin=1970-01-01)
    filtered_data['datetime'] = pd.to_datetime(filtered_data['time'], unit='m', origin='1970-01-01')
    filtered_data['hour'] = filtered_data['datetime'].dt.hour
    filtered_data['day'] = filtered_data['datetime'].dt.dayofweek  # 0=Monday
    filtered_data['month'] = filtered_data['datetime'].dt.month

# Keep only records where the number of visits to a place_id is greater than 3
place_counts = filtered_data['place_id'].value_counts()
valid_places = place_counts[place_counts > 3].index
filtered_data = filtered_data[filtered_data['place_id'].isin(valid_places)].copy()
print(filtered_data.shape)

# Select feature columns and target column; adjust as appropriate for the data
features = ['x', 'y', 'accuracy', 'hour', 'day', 'month']

X = filtered_data[features]
y = filtered_data['place_id']

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # Use training set to compute mean and variance
X_test = scaler.transform(X_test)  # Standardize test set using training set mean and variance

# KNN modeling
knn = KNeighborsClassifier(n_neighbors=3)
knn.fit(X_train, y_train)

# Predict
y_pred = knn.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"KNN prediction accuracy: {accuracy:.4f}")
```

## Cross Validation + Grid Search

### Hyperparameters

Hyperparameters: In machine learning and deep learning, **hyperparameters** are parameters set manually before the algorithm runs, used to control the behavior and performance of the model.

**Cross Validation**: split the training set into multiple subsets, use one subset as the validation set (test set) in turn while the rest are used as the training set, and finally take the average performance metric to ensure the stability of model evaluation.

![image-20260624141841958](/images/machine_learning/machine-learning-classification-02.png)

The purpose of cross validation is actually to reduce the randomness of the results, thereby improving the accuracy and credibility of the model.

> 📖 **Cross validation — understand it through "mock exams"**
>
> Suppose you have 10 years of past exam papers (training set), and you want to know your real level:
>
> - **Without cross validation**: use the first 8 papers to study, and the last 2 for testing → if the last 2 happen to be hard problems, your score will be underestimated
> - **5-fold cross validation**: split the 10 papers into 5 groups (2 per group), take turns using 1 group for testing and the remaining 4 for training, then average the 5 scores → more objective!
>
> Each "fold" is one cycle of "mock exam + reviewing with the other problems". cv=5 means 5-fold cross validation.
>
> In sklearn, setting `cv=5` means the same process is repeated 5 times, using a different validation set each time.

**Grid Search**: Grid search is an exhaustive search method that finds the optimal hyperparameters by traversing all possible combinations of hyperparameters.

> 📖 **Grid search — understand it through "finding the best recipe"**
>
> You want to find the best-tasting lemonade recipe, with two variables: the amount of sugar and the amount of lemon.
>
> - Sugar amounts to try: 1 spoon, 2 spoons, 3 spoons
> - Lemon amounts to try: 1, 2
> - **Grid search** means: try every combination! There are 3×2 = 6 recipes in total; make one cup of each to taste and pick the best.
>
> The `param_grid` in the code:
>
> ```python
> param_grid = {
>     'n_neighbors': [1, 3, 5, 7, 9],   # 5 K values
>     'weights': ['uniform', 'distance']  # 2 weight modes
> }
> ```
>
> There are 5×2 = 10 combinations in total. Combined with cv=5 cross validation, that means 10×5 = 50 training runs! This is exactly what `GridSearchCV` does.
>
> `n_jobs=-1` means using all CPU cores of your computer for parallel computation to speed up the process.

![image-20260624142536574](/images/machine_learning/machine-learning-classification-03.png)

**Grid search + cross validation** is a powerful tool for model selection and tuning:

- Cross validation solves the model's data input problem (data set splitting) to obtain a more reliable model
- Grid search solves the combination of hyperparameters

### Example - Facebook Check-in Prediction

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import GridSearchCV

# Read data
data = pd.read_csv(r'./data/FBlocation/train.csv')

# Filtering conditions
filtered_data = data[(data['x'] > 1.0) & (data['x'] < 1.25) & (data['y'] > 2.5) & (data['y'] < 2.75)]

# Process time feature: the 'time' column is minutes since 1970-01-01
if 'time' in filtered_data.columns:
    # Convert the 'time' column to pandas datetime (unit=minutes, origin=1970-01-01)
    filtered_data['datetime'] = pd.to_datetime(filtered_data['time'], unit='m', origin='1970-01-01')
    filtered_data['hour'] = filtered_data['datetime'].dt.hour
    filtered_data['day'] = filtered_data['datetime'].dt.dayofweek  # 0=Monday
    filtered_data['month'] = filtered_data['datetime'].dt.month

# Keep only records where the number of visits to a place_id is >= 3
place_counts = filtered_data['place_id'].value_counts()
valid_places = place_counts[place_counts > 3].index
filtered_data = filtered_data[filtered_data['place_id'].isin(valid_places)].copy()

# Select feature columns and target column; adjust as appropriate for the data
features = ['x', 'y', 'accuracy', 'hour', 'day', 'month']

X = filtered_data[features]
y = filtered_data['place_id']

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
from sklearn.preprocessing import StandardScaler

# Standardize features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)  # Use training set to compute mean and variance
X_test = scaler.transform(X_test)  # Standardize test set using training set mean and variance

# Grid search
# Define parameter search space
param_grid = {
    'n_neighbors': [1, 3, 5, 7, 9],
    'weights': ['uniform', 'distance']  # weights: uniform = equal weights, distance = distance-based weights
}

# Create grid search object
grid_search = GridSearchCV(KNeighborsClassifier(), param_grid, cv=5, scoring='accuracy', n_jobs=-1)

# Fit model
grid_search.fit(X_train, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best accuracy: {grid_search.best_score_:.4f}")

# Predict on test set with the best-parameter model
best_knn = grid_search.best_estimator_  # best_estimator_ contains the best model
y_pred_best = best_knn.predict(X_test)
best_accuracy = accuracy_score(y_test, y_pred_best)
print(f"Test set accuracy with best parameters: {best_accuracy:.4f}")
```

## Naive Bayes

### Bayes' Theorem

$$
P(A|B)=\frac{P(A)·P(B|A)}{P(B)}
$$

### Conditional Independence of Features

If the occurrence of two events has no relationship with each other, they are called conditionally independent features.

If features B and C are conditionally independent, the following formula holds:
$$
P(B,C|A)=P(B|A)·P(C|A)
$$
Under the condition that event A occurs, the probability of B and C occurring simultaneously, if B and C are conditionally independent features, equals the product of the probability of event B occurring and the probability of event C occurring under the condition that event A occurs.

Assuming B, C, D, E, F are conditionally independent features:
$$
P(B,C,D,E,F|A)=P(B|A)·P(C|A)·P(D|A)·P(E|A)·P(F|A)·
$$

### Naive Bayes

The Naive Bayes model is a classification method based on Bayes' theorem and the assumption of conditional independence of features.

- Suppose the possible outcomes of our event are X and Y, and 4 features are involved in generating X and Y, with attribute values A, B, C, D respectively.

- We want to compute the probability of X and Y given ABCD, i.e., $P(X|A,B,C,D)$ and $P(Y|A,B,C,D)$. If $P(X|A,B,C,D)>P(Y|A,B,C,D)$, then when the four values ABCD appear, the outcome is more likely to be X.

- Using Bayes' formula
  $$
  P(X|A,B,C,D)=\frac{P(X)P(A,B,C,D|X)}{P(A,B,C,D)}
  $$

  $$
  P(Y|A,B,C,D)=\frac{P(Y)P(A,B,C,D|Y)}{P(A,B,C,D)}
  $$

- $$
  P(A,B,C,D|X)=P(A|X)·P(B|A,X)·P(C|B,A,X)·P(D|C,B,A,X)
  $$

- **Based on the conditional independence assumption**, assume that A, B, C, D are conditionally independent features, i.e., they have no relationship with each other
  $$
  P(A,B,C,D|X)=P(A|X)·P(B|X)·P(C|X)·P(D|X)
  $$

- Computing the probability of X and Y given ABCD then becomes computing
  $$
  Probability\ of\ X=P(X)·P(A|X)·P(B|X)·P(C|X)·P(D|X)
  $$

  $$
  Probability\ of\ Y=P(Y)·P(A|Y)·P(B|Y)·P(C|Y)·P(D|Y)
  $$

### Laplace Smoothing Coefficient

In the probability calculation above, e.g., $P(A|X)$, if this value equals 0, then the entire computed probability must be 0.

Therefore, to avoid a probability value of 0, we add a value to both the numerator and the denominator. This is the role of the Laplace smoothing coefficient.
$$
P(A|X)=\frac{P(X,A)+\alpha}{P(X)+{\alpha}m}
$$

- $\alpha$ is the Laplace smoothing coefficient, usually set to 1
- $m$ represents the total number of **all independent samples**

> 📖 **Naive Bayes — walk through a full computation with "spam filtering"**
>
> Suppose we want to determine whether an email is spam. Training data (6 emails):
>
> | Email | Contains "free" | Contains "meeting" | Is spam? |
> | ----- | --------------- | ----------------- | -------- |
> | 1     | Yes             | No                | Yes      |
> | 2     | Yes             | Yes               | Yes      |
> | 3     | Yes             | No                | Yes      |
> | 4     | No              | Yes               | No       |
> | 5     | No              | No                | No       |
> | 6     | No              | Yes               | No       |
>
> First compute the prior probabilities:
>
> - P(spam) = 3/6 = 0.5 (3 of 6 are spam)
> - P(normal) = 3/6 = 0.5
>
> Then compute the conditional probabilities (with Laplace smoothing, α=1):
>
> - P(contains "free" | spam) = (3+1)/(3+1×2) = 4/5 = 0.8
    >   - Numerator: "free" appears 3 times in spam + α(1)
>   - Denominator: total spam count 3 + α×m, m=2 is the number of feature values ("yes" and "no")
> - P(contains "free" | normal) = (0+1)/(3+2) = 1/5 = 0.2
> - P(contains "meeting" | spam) = (1+1)/(3+2) = 2/5 = 0.4
> - P(contains "meeting" | normal) = (2+1)/(3+2) = 3/5 = 0.6
>
> A new email arrives — contains "free" but not "meeting". Determine whether it is spam:
>
> P(spam | features) = P(spam) × P(free|spam) × P(no meeting|spam) = 0.5 × 0.8 × (1-0.4) = 0.5 × 0.8 × 0.6 = **0.24**
>
> P(normal | features) = P(normal) × P(free|normal) × P(no meeting|normal) = 0.5 × 0.2 × (1-0.6) = 0.5 × 0.2 × 0.4 = **0.04**
>
> 0.24 > 0.04 → classified as **spam** ✅
>
> **Where is the "naive" part?** We assume the two features "contains free" and "contains meeting" are independent. In reality they may be correlated (spam often contains multiple marketing words at once), but this simplification makes the computation extremely easy, and in practice it often works quite well!

### Example - 20 Newsgroups Text Classification

```python
from sklearn.datasets import fetch_20newsgroups
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import classification_report, accuracy_score

# Load data
newsgroups = fetch_20newsgroups(subset='all', shuffle=True, random_state=42, data_home='data')
X, y = newsgroups.data, newsgroups.target
print(f'Number of X samples: {len(X)}')
print(f"First news sample content:\n{X[0]}\n")
print(f"First news sample label: {y[0]} ({newsgroups.target_names[y[0]]})\n")

print(f'y[0:50]: {y[0:50]}')
print(f"Total categories: {len(newsgroups.target_names)}")
print(f"Category names: {newsgroups.target_names}")

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Text feature extraction: TF-IDF
# The max_df parameter sets the upper threshold for word frequency to filter out words that appear too frequently,
# which are likely noise not helpful for classification.
# max_df can be:
#   1. Float (0.0 ~ 1.0): words appearing in more than this proportion of documents will be filtered (e.g., max_df=0.7 ignores words in >70% of docs).
#   2. Integer: words appearing in more than max_df documents will be filtered.
# Usually max_df=0.8~0.9 removes common useless words and helps generalization.

vectorizer = TfidfVectorizer(stop_words='english', max_df=0.8) # stop_words='english' means stop words: words that appear frequently but are not helpful for classification, e.g., the, is, at, which
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)
print(f"X_train_tfidf shape: {X_train_tfidf.shape}")

# Naive Bayes model training
nb = MultinomialNB(alpha=0.01)
nb.fit(X_train_tfidf, y_train)

# Predict
y_pred = nb.predict(X_test_tfidf)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"Naive Bayes classifier accuracy: {accuracy:.4f}")
```

## Decision Trees

### Information Entropy

In information theory, entropy represents a measure of the uncertainty of a random variable.

- The larger the entropy, the lower the certainty of the data and the greater the amount of information
- The smaller the entropy, the higher the certainty of the data

The information entropy formula:
$$
H=-\sum_{i=1}^{k}p_i\log_2(p_i)
$$

> 📖 **Information entropy — understand it through "guessing a coin"**
>
> In the formula:
>
> - $k$: the total number of categories (e.g., two categories "yes/no", k=2)
> - $P_i$: the proportion of the i-th category (e.g., 60% "yes", 40% "no")
> - $\log_2$: logarithm base 2 (because information theory measures information in binary bits)
>
> **Larger entropy = more chaotic data = greater uncertainty**
>
> Numerical examples:
>
> | Scenario               | Calculation                                                | Entropy    | Understanding               |
> | ---------------------- | ---------------------------------------------------------- | ---------- | --------------------------- |
> | 10 samples, all "yes"  | $H = -(1 \times \log_2 1) = 0$                             | **0**      | Completely certain, no need to split further |
> | 5 "yes", 5 "no"        | $H = -(0.5\log_2 0.5 + 0.5\log_2 0.5)$ = -(0.5×(-1) + 0.5×(-1)) | **1.0**    | Most chaotic, completely uncertain |
> | 7 "yes", 3 "no"        | $H = -(0.7\log_2 0.7 + 0.3\log_2 0.3)$ ≈ -(0.7×(-0.51) + 0.3×(-1.74)) | **≈0.88**  | Slightly biased toward "yes", fairly chaotic |
>
> How to compute $\log_2$ on a calculator? Use the change-of-base formula: $\log_2(x) = \frac{\ln(x)}{\ln(2)}$ or $\frac{\lg(x)}{\lg(2)}$
>
> For example, $\log_2(0.5) = \frac{\ln(0.5)}{\ln(2)} = \frac{-0.693}{0.693} = -1$
>
> What a decision tree does: find a feature to split the data so that the entropy after splitting is as small as possible (i.e., make the data more "pure").

### Information Gain

Information gain: represents the degree to which the uncertainty of classifying data D is reduced due to feature A.

Definition: the information gain $gain(D,A)$ or $g(D,A)$ of feature A with respect to training data set D is defined as the difference between the entropy $H(D)$ of set D and the entropy $H(D|A)$ of D given feature A.
$$
gain(D,A)=H(D)-H(D|A)
$$
The method of selecting features based on information gain is: for the training data set D, compute the information gain of each feature, compare their magnitudes, and select the feature with the largest information gain for splitting.

![image-20260625094500930](/images/machine_learning/machine-learning-classification-04.png)

### CART Decision Tree

The CART model is a decision tree model that can be used for both classification and regression. Classification and regression trees use different optimization strategies.

- CART regression trees use the strategy of minimizing squared error
- CART classification trees use the strategy of minimizing the Gini index

#### Gini Index Calculation

$$
Gini(D)=1-\sum_{k=1}^{k}{p_k^2},\quad k \text{ is the number of classes}
$$

$$
Gini\_index(D,\alpha)=\sum_{v=1}^{v}\frac{D^v}{D}Gini(D^v)
$$

Gini index calculation example

![image-20260625104455872](/images/machine_learning/machine-learning-classification-05.png)

- Has a house or not

  ![image-20260625104837079](/images/machine_learning/machine-learning-classification-06.png)

- Marital status

  ![image-20260625104905582](/images/machine_learning/machine-learning-classification-07.png)

> 📖 **Gini index — understand it through "drawing lots"**
>
> **Gini impurity** measures: the probability that two randomly drawn samples belong to different categories.
> $$Gini(D) = 1 - \sum_{k=1}^{K} p_k^2$$
>
> - $K$: number of categories, $p_k$: proportion of the k-th category
>
> | Scenario              | Calculation                       | Gini value | Understanding                   |
> | --------------------- | --------------------------------- | ---------- | ------------------------------- |
> | 10 samples, all "yes" | $1 - (1^2) = 0$                   | **0**      | Perfectly pure; two drawn samples are certainly the same category |
> | 5 "yes", 5 "no"       | $1 - (0.5^2+0.5^2) = 1-0.5$       | **0.5**    | Most chaotic                   |
> | 7 "yes", 3 "no"       | $1 - (0.7^2+0.3^2) = 1-0.58$      | **0.42**   | Fairly pure                    |
>
> In the example above: after splitting by "has a house or not", the left child node has Gini=0 (all 3 defaulted, very pure), and the right child node has Gini=0.444 (of the 7, 4 did not default and 3 defaulted, somewhat mixed). This is "purer" than not splitting, so "has a house or not" is a useful feature.
>
> **Gini vs information entropy**: both serve the same purpose (measuring chaos). CART decision trees use Gini by default (faster to compute because there is no need to compute logs).

### Pruning

Pruning is the main means by which decision tree learning algorithms deal with **overfitting**.

In decision tree learning, in order to classify training samples as correctly as possible, the node splitting process is repeated. Sometimes this causes the decision tree to grow too many branches, and the model may fit the training samples "too well", treating some characteristics of the training set itself as general properties of all data, leading to overfitting. Therefore, the risk of overfitting can be reduced by proactively removing some branches.

- Pre-pruning refers to estimating each node before splitting during the decision tree generation process: if the current node's split cannot improve the generalization performance of the decision tree, stop splitting and mark the current node as a leaf node.
- Post-pruning starts by generating a complete decision tree from the training set, then examines non-leaf nodes bottom-up. If replacing the subtree corresponding to a node with a leaf node can improve the generalization performance of the decision tree, the subtree is replaced with a leaf node.

### Example - Titanic

```python
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split

df = pd.read_csv('data/titanic.csv')

X = df[['pclass', 'age', 'sex']].copy()
# Convert gender to numeric variable
X['sex'] = X['sex'].map({'male': 0, 'female': 1})
y = df['survived']

# Ensure pclass is numeric
# Map '1st', '2nd', '3rd' in 'pclass' to numeric values 1, 2, 3
X['pclass'] = X['pclass'].map({'1st': 1, '2nd': 2, '3rd': 3})

# age may also have missing values; fill them (optional)
X['age'] = X['age'].fillna(X['age'].median())

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Decision tree classification

# Main hyperparameters of DecisionTreeClassifier and their meanings:
# 1. criterion: metric for evaluating split quality. Common choices: 'gini' (Gini impurity) or 'entropy' (information gain, ID3).
# 2. max_depth: maximum depth of the tree. Too large may overfit; too small may underfit.
# 3. min_samples_split: minimum samples required to split an internal node. Default is 2; increasing it controls tree growth and avoids overfitting.
# 4. min_samples_leaf: minimum samples required in a leaf node. Controls the minimum number of samples per leaf; larger values smooth the model.
# 5. max_features: maximum number of features to consider when splitting. Controls how many features are examined for the best split, helping prevent overfitting.
# 6. random_state: random seed for reproducibility.
# 7. splitter: strategy for choosing the split at each node. 'best' (default) chooses the best split; 'random' chooses a random feature to split on.
# It is generally recommended to tune max_depth, min_samples_split, min_samples_leaf, criterion first, and determine optimal values based on validation set performance.

clf = DecisionTreeClassifier(random_state=42,max_depth=5)
clf.fit(X_train, y_train)

# Predict
y_pred = clf.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"Decision tree classification accuracy: {accuracy:.4f}")


# Plot decision tree
from sklearn import tree
import matplotlib.pyplot as plt

# Configure matplotlib to support Chinese display
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

plt.figure(figsize=(100,50),dpi=300)

tree.plot_tree(
    clf,  # trained decision tree classifier
    feature_names=X.columns,  # list of feature names corresponding to each column of input X
    class_names=['Not Survived', 'Survived'],  # class names corresponding to target variable categories
    filled=True,  # whether to fill node colors to distinguish different classes
    rounded=True,  # whether to show nodes as rounded rectangles
    fontsize=12  # font size set to 12
)
plt.savefig('decision_tree.png', dpi=300, bbox_inches='tight')
plt.close()
print("Decision tree image saved as decision_tree.png")

if __name__ == '__main__':
    sex_0_count = (X_train['sex'] == 0).sum()
    sex_1_count = (X_train['sex'] == 1).sum()
    print(f"Number of sex=0 in X_train: {sex_0_count}")
    print(f"Number of sex=1 in X_train: {sex_1_count}")

    age_le_12 = X_train[(X_train['sex'] == 0) & (X_train['age'] <= 12)].shape[0]
    age_gt_12 = X_train[(X_train['sex'] == 0) & (X_train['age'] > 12)].shape[0]
    print(f"Number of sex=0 and age≤12 in X_train: {age_le_12}")
    print(f"Number of sex=0 and age>12 in X_train: {age_gt_12}")
```

![decision_tree](/images/machine_learning/decision_tree.png)

## Random Forest (Multiple Decision Trees)

Based on the idea of "Ensemble Learning", it is a supervised learning algorithm that builds **multiple independent decision trees** and integrates their results (voting / averaging). It can handle both classification and regression tasks.

Random forest = multiple "diversified" decision trees + result integration (solving the core defects of decision trees, namely "prone to overfitting and instability").

### Ensemble Learning

Ensemble Learning is a machine learning framework that builds multiple **"base models" (Base Model)** and combines their prediction results according to specific rules to achieve better performance than a single base model (higher accuracy, lower risk of overfitting).

Core logic: "Collective wisdom outperforms the individual" — the "diversity" of base models offsets the limitations of a single model.

There are three types of ensemble learning:

- Parallel ensemble (Bagging)

  "Random sampling" of the training data, including random samples and random features, trains multiple independent base models in parallel, and integrates them via "voting / averaging".

- Sequential ensemble (Boosting)

  Base models are trained sequentially based on "error feedback"; the later model focuses on the samples that the previous model got wrong.

- Stacking ensemble (Stacking)

  First layer (base model layer): choose several different types of base models and train them with the training set to obtain each sample's "base model prediction result".

  Second layer (meta model layer): use the "base model prediction results" as new features and train a "meta model" with a small "validation set".

  New samples are first predicted by all base models, then the results are fed into the meta model to obtain the final output.

### Double Randomness

- Random samples (Bootstrap sampling)

  Perform "sampling with replacement" on the original training set; each tree is trained on an independent sample (about 63.2% of the samples are selected).

- Random features

  When each tree splits a node, it only randomly selects `max_features` features from all features to participate in the purity calculation.

  The default `max_features` is the square root of the total number of features.

### Key Parameters in sklearn

- `n_estimators`: the number of decision trees, default 100, commonly 100-1000
- `max_features`: the maximum number of features each tree can choose when splitting; default $\sqrt{total\ number\ of\ features}$ for classification tasks, $\frac{total\ number\ of\ features}{3}$ for regression tasks
- `max_depth`: the pre-pruning parameter of a single tree

### Example - Titanic

```python
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

df = pd.read_csv('data/titanic.csv')

X = df[['pclass', 'age', 'sex']].copy()
# Convert gender to numeric variable
X['sex'] = X['sex'].map({'male': 0, 'female': 1})
y = df['survived']

# Ensure pclass is numeric
# Map '1st', '2nd', '3rd' in 'pclass' to numeric values 1, 2, 3
X['pclass'] = X['pclass'].map({'1st': 1, '2nd': 2, '3rd': 3})

# age may also have missing values; fill them (optional)
X['age'] = X['age'].fillna(X['age'].median())

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

from sklearn.ensemble import RandomForestClassifier

# Create random forest classifier
# Set max_samples (e.g., 0.8 means each tree uses 80% of training samples)
# max_features is an important parameter in RandomForestClassifier and other ensemble models,
# controlling the number of features available to each tree when searching for the best split.
# - If set to an integer, e.g., 4, then 4 features are randomly chosen from all features at each split.
# - If set to a float (e.g., 0.6), then 60% of features are randomly chosen at each split.
# - If set to "sqrt", then sqrt(total features) is used (commonly used for classification).
# - If set to "log2", then log2(total features) is used.
# This increases model diversity and reduces overfitting risk.

rf_clf = RandomForestClassifier(
    n_estimators=100,  # Ensemble of 100 decision trees; final prediction by majority voting
    max_depth=5,  # Limit single tree depth to control model complexity and prevent overfitting
    random_state=42,
    max_samples=1,  # Proportion of training samples per tree; 1 means use all training samples (bootstrap sampling with replacement)
    max_features='sqrt',  # Number of features considered at each split = sqrt(total features); with 3 features in this dataset -> about 1~2
    min_samples_leaf=5,  # Each leaf must have at least 5 samples
)

# Fit random forest model on training set
rf_clf.fit(X_train, y_train)

# Predict on test set
y_pred_rf = rf_clf.predict(X_test)

# Evaluate random forest accuracy
rf_accuracy = accuracy_score(y_test, y_pred_rf)
print(f"Random forest classification accuracy: {rf_accuracy:.4f}")

from sklearn.model_selection import GridSearchCV

# Define parameter grid for tuning
param_grid = {
    'n_estimators': [50, 100, 200, 500, 800],
    'max_depth': [3, 5, 7, None],
    'min_samples_leaf': [1, 3, 5, 10],
    'max_features': ['sqrt', 'log2', 1, 0.7],
    'max_samples': [0.6, 0.7, 0.8, None],
    'random_state': [42]  # Ensure reproducibility
}

rf = RandomForestClassifier()

# Use grid search with cross-validation to find best hyperparameters
grid_search = GridSearchCV(
    estimator=rf,
    param_grid=param_grid,
    cv=5,  # 5-fold cross-validation
    scoring='accuracy',  # Use accuracy as evaluation metric
    n_jobs=-1  # Parallel computation to speed up
)

grid_search.fit(X_train, y_train)

print("Best parameters:", grid_search.best_params_)
print("Best accuracy under cross-validation:", grid_search.best_score_)

# If you want to retrain and evaluate with the best parameters, you can use:
best_rf = grid_search.best_estimator_
y_pred_best = best_rf.predict(X_test)
best_accuracy = accuracy_score(y_test, y_pred_best)
print(f"Random forest accuracy on test set with best parameters: {best_accuracy:.4f}")


# === Sample output ===
# Random forest classification accuracy: 0.6388
# Best parameters: {'max_depth': None, 'max_features': 'sqrt', 'max_samples': 0.8, 'min_samples_leaf': 3, 'n_estimators': 500, 'random_state': 42}
# Best accuracy under cross-validation: 0.8333333333333334
# Random forest accuracy on test set with best parameters: 0.8137
```

## Classification Model Evaluation Metrics

### Confusion Matrix

In classification tasks, there are four different combinations between the Predicted Condition and the True Condition, which form the **Confusion Matrix**.

The first digit indicates whether the model's prediction matches the true value, and the second digit indicates whether the model predicted a positive example or a negative example.

![image-20260625160637641](/images/machine_learning/machine-learning-classification-09.png)

Using "cancer prediction" as an example to explain each parameter:

- True positive: actually has the disease
- True negative: actually does not have the disease
- Predicted positive: the model predicts the disease
- Predicted negative: the model predicts no disease

Explanation of the matrix metrics:

- **TP**: the model correctly diagnoses cancer (actually ill, confirmed) → ideal result; treatment can be given in time
- **TN**: the model correctly diagnoses healthy (actually healthy, ruled out) → ideal result; no unnecessary medical burden
- **FP**: the model wrongly diagnoses a healthy person as having cancer (actually healthy, misdiagnosed) → consequence: healthy people need extra checkups, causing anxiety and medical costs
- **FN**: the model wrongly diagnoses a cancer patient as healthy (actually ill, missed) → consequence: the patient misses the treatment window, endangering their life (**the most costly error**)

### Evaluation Metrics

> 📖 **Each evaluation metric — walk through a complete numerical computation**
>
> Suppose we have a cancer screening result for 100 people:
>
> |                  | Predicted: ill | Predicted: healthy |
> | ---------------- | -------------- | ------------------ |
> | **Actual: ill**  | TP = 8         | FN = 2             |
> | **Actual: healthy** | FP = 10      | TN = 80            |
>
> 10 people are actually ill, 90 are actually healthy. The model detected 8 ill people but falsely reported 10.
>
> **Accuracy** = (8+80)/100 = **0.88** (88% of people were classified correctly)
>
> Looks good? But —
>
> **Precision** = 8/(8+10) = **0.444** (44.4%)
> Of the 18 people the model said "you are ill", only 8 are actually ill. **The misdiagnosis rate is too high!** (10 healthy people were scared)
>
> **Recall** = 8/(8+2) = **0.80** (80%)
> Of the 10 actually ill people, 8 were detected and 2 were missed. **Miss rate 20%** (these 2 people are in danger!)
>
> **F1-Score** = 2×8/(2×8+10+2) = 16/28 = **0.571**
> F1 is the harmonic mean of precision and recall. Low precision drags F1 down.
>
> ---
>
> **When do we value which metric more?**
>
> | Scenario              | Key metric   | Reason                                                    |
> | --------------------- | ------------ | --------------------------------------------------------- |
> | Cancer screening      | **Recall** ↑ | Better to misdiagnose (more FP) than to miss cases (fewer FN) |
> | Spam filtering        | **Precision** ↑ | Better to miss spam (more FN) than to throw important emails into the trash (fewer FP) |
> | General classification | **F1-Score** | Both precision and recall matter                          |

#### Accuracy; universal but limited

$$
Accuracy=\frac{TP+TN}{TP+TN+FP+FN}
$$

Suppose the cancer incidence in a region is 5% (50 of 1000 people are ill, 950 are healthy):

- If the model "predicts everyone as healthy" (does not diagnose any patient), then TP=0, TN=950, FP=0, FN=50;
- Accuracy = 950/(0+950+0+50) = 95% (seems very high), but it misses all patients, completely losing its medical value.

#### Precision and Recall

Precision: among people diagnosed as patients, the proportion who are truly ill → controls the misdiagnosis rate.

Recall: among truly ill people, the proportion who were diagnosed → controls the miss rate.
$$
Precision\ P=\frac{TP}{TP+FP}
$$


$$
Recall\ R=\frac{TP}{TP+FN}
$$

#### F1-Score

F1-Score is a metric that balances precision and recall.
$$
F1=\frac{2TP}{2TP+FP+FN}
$$



#### API

```python
# accuracy
from sklearn.metrics import accuracy_score
# precision
from sklearn.metrics import precision_score
# recall
from sklearn.metrics import recall_score
# confusion matrix
from sklearn.metrics import confusion_matrix
# F1-score
from sklearn.metrics import f1_score
# classification report
from sklearn.metrics import classification_report


# 1. Provide predicted and true results
# y_pred = ['ill', 'ill', 'ill', 'ill', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy', 'healthy']
y_pred = [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
# y_true = ['ill', 'ill', 'healthy', 'healthy', 'ill', 'ill', 'healthy', 'healthy', 'ill', 'ill']
y_true = [1, 0, 0, 0, 0, 0, 0, 0, 1, 1]

# 2. Compute metrics
print("Confusion matrix:\n", confusion_matrix(y_true, y_pred, labels=[1, 0]))
print("Accuracy:", accuracy_score(y_true, y_pred))
print("Precision:", precision_score(y_true, y_pred))
print("Recall:", recall_score(y_true, y_pred))
print("F1-score:", f1_score(y_true, y_pred))
# digits: number of decimal places to keep
# target_names: class names
# macro avg: arithmetic mean of metrics across classes, ignoring sample counts
# weighted avg: weighted mean of metrics across classes, considering sample counts
print("Evaluation report:\n", classification_report(y_true, y_pred,target_names=['Healthy','Patient'],digits=4))
```
