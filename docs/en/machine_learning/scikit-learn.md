# scikit-learn

## Installation

```python
pip install -U scikit-learn
# -U means: if scikit-learn is already installed, upgrade it to the latest version
```

## Model Selection

![image-20260629140715883](assets/image-20260629140715883.png)

## Feature Extraction

### Loading Features from Dictionaries

`DictVectorizer` converts a list of dictionaries containing features into a numeric matrix (feature vectors) that machine learning models can use directly.

```python
# Import dictionary vectorizer
from sklearn.feature_extraction import DictVectorizer
import pandas as pd

# Prepare dictionary data
data = [
    {'color': 'red', 'size': 'large', 'price': 100},
    {'color': 'blue', 'size': 'medium', 'price': 80},
    {'color': 'red', 'size': 'small', 'price': 50}
]

# Initialize dictionary vectorizer
# sparse=False means return a dense 2D matrix instead of a sparse matrix
# sparse=True (default) returns a sparse matrix, which only stores non-zero elements and saves memory
# Sparse matrix: a matrix where most values are zero
dict_vec = DictVectorizer(sparse=False)

# Extract features
X = dict_vec.fit_transform(data)

# View results
print(X)

# View feature names
print(dict_vec.get_feature_names_out())

# View results with DataFrame
pd.DataFrame(X, columns=dict_vec.get_feature_names_out())
```

Interpreting the result:

- The numeric feature "价格" (price) keeps its original value directly (first column);
- The categorical feature "颜色" (color) is one-hot encoded into "颜色=红" (color=red) and "颜色=蓝" (color=blue)
- The categorical feature "尺寸" (size) is one-hot encoded into "尺寸=大" (size=large), "尺寸=中" (size=medium), and "尺寸=小" (size=small)

Additional notes: One-hot encoding is a **one-bit effective encoding**. Its core characteristic is: within a group of codes, **only one binary bit is 1 at any time, and all the remaining bits are 0**. Instead of conveying information through numeric magnitudes, this encoding uses "which bit is 1" to uniquely identify a state or category, which is why it is also called a "one-hot code" or "one-bit effective code".

- For example, for the three labels "猫、狗、鸟" (cat, dog, bird), the one-hot codes are [1,0,0] (cat), [0,1,0] (dog), and [0,0,1] (bird)

- It avoids the "numeric magnitude association" of labels (e.g., binary codes 00, 01, 10 may be misinterpreted by a model as "cat < dog < bird", whereas one-hot encoding does not have this problem), and it also fits the output layer of neural networks (e.g., the cross-entropy computation between the Softmax layer output and one-hot labels)

- Advantages: simple to decode, good temporal performance, and suitable for scenarios with few states and high speed requirements

### Loading Features from English Text

`CountVectorizer` converts English text (or text in other languages) into a numeric feature matrix based on word frequency (i.e., counting how many times each word appears in a document).

```python
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer

# Sample texts (3 documents)
documents = [
    "I love machine learning. Machine learning is interesting.",
    "I love coding. Coding is fun and useful.",
    "Machine learning and coding are my favorite skills."
]

# Create CountVectorizer object (default params: lowercase text, tokenize by space/punctuation, no stop-word filtering)
# min_df/max_df parameter explanation:
# min_df: minimum document frequency, i.e., the minimum number or proportion of documents a word must appear in; words below this threshold will be ignored (note: it's the number of documents)
# max_df: maximum document frequency, i.e., the number or proportion of documents a word appears in; words above this threshold will be ignored
# When both min_df and max_df are integers, they represent document counts; when both are floats, they represent proportions
count_vec = CountVectorizer(min_df=2)

# Fit and transform documents
X = count_vec.fit_transform(documents)

# View results
print(X.toarray())

# View feature names
print(count_vec.get_feature_names_out())

# View with DataFrame
df = pd.DataFrame(X.toarray(), columns=count_vec.get_feature_names_out())
print(df)
```

### Loading Features from Chinese Text

First use `jieba` for word segmentation, then use `CountVectorizer` to load the features.

```python
import jieba
from sklearn.feature_extraction.text import CountVectorizer
import pandas as pd

# 1. Texts
documents = [
    "Life is short, I love python",
    "Life is long, no need for python python",
    "Life is long, no need for python python python"
]

# 2. Word segmentation, get a list of segmented texts
cut_documents = [" ".join(jieba.cut(document)) for document in documents]
print(cut_documents)

# 3. Create feature extraction object
vectorizer = CountVectorizer(min_df=2)

# 4. Create feature matrix
X = vectorizer.fit_transform(cut_documents)

# 5. View results with DataFrame
pd.DataFrame(X.toarray(), columns=vectorizer.get_feature_names_out())
```

### TF-IDFVectorizer

`TF-IDFVectorizer` introduces **inverse document frequency (IDF)** weights on top of **term frequency (TF)**, which measures the "importance" of a word in a text more reasonably and prevents high-frequency but semantically meaningless words (such as "the" and "is") from dominating the features.

**Term Frequency (TF)**: how frequently a word appears in the current document. The formula is:
$$
TF(t,d)=\frac{number\ of\ times\ word\ t\ appears\ in\ document\ d}{total\ number\ of\ words\ in\ document\ d}
$$
In practice, scikit-learn uses the raw "count of occurrences" as TF by default rather than the frequency, which is simpler and more intuitive.

**Inverse Document Frequency (IDF)**: measures how "rare" a word is — if a word appears in most documents, its IDF will be low (e.g., "is", "and"); if it appears in only a few documents, its IDF will be high (e.g., "machine learning", "coding"). The formula is:
$$
IDF(t)=log(\frac{total\ number\ of\ documents}{number\ of\ documents\ containing\ word\ t\ +\ 1})
$$
Adding 1 to the denominator avoids the division-by-zero error when "the number of documents containing word t is 0 (test set)" — this is "smoothing". The log uses base 10.

Finally, **TF-IDF value = TF × IDF**, which combines the word's "frequency of occurrence" in the current document with its "rarity" across all documents. The higher the value, the more important the word is for distinguishing the current document.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
import pandas as pd

# Sample texts (3 documents)
documents = [
    "I love machine learning. Machine learning is interesting.",
    "I love coding. Coding is fun and useful.",
    "Machine learning and coding are my favorite skills."
]

# 2. Create TF-IDF object
# stopwords='english' ignores English stop words
# Stop words: words that appear frequently but usually contribute little to semantic understanding
tfidf = TfidfVectorizer(min_df=1, stop_words='english')

# 3. Create feature matrix
X = tfidf.fit_transform(documents)

# 4. Display results
print(pd.DataFrame(X.toarray(), columns=tfidf.get_feature_names_out()))
```

## Numerical Feature Preprocessing

The core goal is to adjust the scale, distribution, or fill in missing values of the data so that it better fits the model's assumptions (e.g., linear models assume features share similar distributions), thereby improving the stability and performance of the model.

> 📖 **Why do we need to "scale" features? — An intuitive example**
>
> Suppose you want to predict house prices and you have two features:
>
> - Area: 50~300 (square meters)
> - Number of bedrooms: 1~5 (rooms)
>
> Without any processing, the area value (300) is 60 times larger than the number of bedrooms (5). The model will think "area" is far more important than "number of bedrooms", and gradient descent will oscillate violently in the direction of area.
>
> After scaling, both features are in a similar range (e.g., 0~1), so the model can treat every feature fairly, and gradient descent becomes more stable.

### Normalization (Min-Max Scaling)

`MinMaxScaler` performs a linear transformation using the minimum and maximum values of a feature, mapping feature values linearly into a specified finite interval (such as [0,1] or [-1,1], or any arbitrary range) to eliminate the difference in units among features. The formula is:
$$
X_{scaled}=\frac{X-X_{min}}{X_{max}-X_{min}}\times(max\_range-min\_range)+min\_range
$$
The default range is [0,1]. The characteristics of this linear transformation are:

- It does not change the **distribution shape** of the data (e.g., if the original data is uniformly distributed, it remains uniformly distributed after normalization)
- It does not change the **relative relationships** between data points (e.g., if A > B in the original data, then A' > B' after normalization)
- It only changes the **absolute numerical range** of the data, thereby removing scale differences

```python
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# Create data
data = np.array([[1, 200], [2, 300], [3, 400]])
print(data)

# Create normalization scaler
scaler = MinMaxScaler(feature_range=(0, 1))

# Fit and normalize data
data_scaled = scaler.fit_transform(data)

# Display results
print(data_scaled)
```

### Standardization

`StandardScaler` transforms features into a distribution with **mean 0 and standard deviation 1**, preserving the relative dispersion of the data; the data distribution remains the original distribution.

It is based on the mean and standard deviation of the features. The formula is:
$$
X_{scaled}=\frac{X-\mu}{\sigma}
$$

```python
import numpy as np
from sklearn.preprocessing import StandardScaler

# Create data
data = np.array([[1, 200], [2, 300], [3, 400]])

# Create standardization scaler
scaler = StandardScaler()

# Fit and standardize data
data_scaled = scaler.fit_transform(data)

# Display results
print(data_scaled)
```

> 📖 **Normalization vs Standardization — when to use which?**
>
> |                   | Normalization (MinMaxScaler)                    | Standardization (StandardScaler)                  |
> | ----------------- | ----------------------------------------------- | ------------------------------------------------ |
> | Formula           | $\frac{X-X_{min}}{X_{max}-X_{min}}$             | $\frac{X-\mu}{\sigma}$                           |
> | Result range      | Precisely controlled to [0,1] or [a,b]          | Mean=0, standard deviation=1 (range unknown)     |
> | Sensitivity to outliers | ❌ Severe (one extreme value compresses the other data) | ✅ Less sensitive                          |
> | Suitable scenarios | Image processing (pixel values 0-255 → 0-1), scenarios needing a fixed range | KNN, SVM, linear regression, logistic regression, PCA |
> | Distribution shape | Preserves the original distribution shape       | Preserves the original distribution shape         |
>
> **Rule of thumb**:
>
> - Data has outliers → prefer standardization
> - A strict range is required → use normalization
> - Not sure → try standardization first (works for most cases)

## Handling Missing Values

`SimpleImputer` handles missing values (NaN).

Key parameter: strategy (imputation strategy)

- `mean`: fill with the mean (suitable for continuous features that are approximately normally distributed)
- `median`: fill with the median (suitable for continuous features containing outliers)
- `most_frequent`: fill with the mode (suitable for categorical or discrete features)
- `constant`: fill with a constant (requires specifying ` fill_value`)

```python
import numpy as np
from sklearn.impute import SimpleImputer

# Create data (with missing values)
data = np.array([[1, np.nan], [2, 300], [np.nan, 400]])

# Create missing value handler
# strategy: mean, median, most_frequent, constant
# mean: fill missing values with the mean of the data
imputer = SimpleImputer(missing_values=np.nan, strategy='mean')

# Fit model and transform
data_new = imputer.fit_transform(data)

# Output results
print(data_new)
```

## Feature Selection — Variance Threshold

**Select a subset from the original features (keep some features / drop some features)** in order to reduce the feature dimension and improve computational efficiency.

Use the variance threshold `VarianceThreshold` to remove low-variance features.

```python
import numpy as np
from sklearn.feature_selection import VarianceThreshold

data = np.array([[0, 2, 0, 3], [0, 1, 4, 3], [0, 1, 1, 3]])
print(data)

# Create selector
# threshold: default threshold=0, i.e., remove all features with zero variance
selector = VarianceThreshold(threshold=0.05)  # Keep features with variance >= 0.05

# Fit data
selected_data = selector.fit_transform(data)

# Output results
print(selected_data)
```

## Feature Dimensionality Reduction — PCA

Dimensionality reduction maps high-dimensional features into a lower-dimensional space through linear or nonlinear mathematical transformations, producing entirely new low-dimensional features (not a subset of the original features). The core goal is to preserve as much of the original information as possible while reducing dimensionality.

![image-20260625092047210](assets/image-20260625092047210.png)

Dimensionality reduction: a 2D plane has 5 sample points. If we find a 1D number axis and project the 5 sample points onto it, minimizing the sum of perpendicular distances determines the axis position. The coordinates of the 5 sample points in the new axis coordinate system are the feature values after dimensionality reduction.

**PCA (Principal Component Analysis)**: a linear dimensionality reduction method belonging to unsupervised learning; it does not rely on label information.

**Core idea**: Principal Component Analysis (PCA) is an unsupervised learning method that aims to map the original high-dimensional data into a low-dimensional space through a linear transformation while preserving as much variance (i.e., information) as possible. In simple terms, PCA finds a new set of coordinate axes (called principal components) that capture the greatest variability in the data, allowing the original data to be approximated with fewer dimensions.

> 📖 **PCA dimensionality reduction — understand it through "camera angles"**
>
> Imagine photographing a group of people standing on the ground. Their positions are three-dimensional (x, y, z), but if you shoot from directly above, the photo is two-dimensional — you "project" the 3D data onto a plane, yet the positional relationships among the people are mostly preserved.
>
> What PCA does: find the **best camera angle**.
>
> - Principal component 1 (PC1): the direction in which the data spreads the most → photographing along this direction preserves the most information
> - Principal component 2 (PC2): among the directions perpendicular to PC1, the direction in which the data spreads the most
> - ...
>
> If the first 2 principal components already explain 95% of the variance (information), then you can compress the high-dimensional data to 2 dimensions while still preserving 95% of the information!
>
> **The `n_components` parameter**:
>
> - Integer (e.g., `n_components=2`): keep 2 principal components
> - Float (e.g., `n_components=0.95`): automatically keep enough principal components so that they explain 95% of the variance
>
> This is a very clever dimensionality reduction method: instead of picking a few of the original features, it **recombines** the original features to create the most information-dense "new features".

```python
from sklearn.decomposition import PCA
import numpy as np

# Create PCA object
# When n_components is an integer: number of dimensions to keep
# When n_components is a float (0~1): proportion of variance explained by retained principal components
pca = PCA(n_components=2)

# Prepare data
X = np.array([[0, 2, 0, 3], [0, 1, 4, 3], [0, 1, 1, 3]])

# Train PCA model
X_pca = pca.fit_transform(X)

# Output results
print(f"Original data structure: {X.shape[0]} samples, {X.shape[1]} dimensions")
print(f"Reduced feature count: {X_pca.shape[0]} samples, {X_pca.shape[1]} dimensions")
```
