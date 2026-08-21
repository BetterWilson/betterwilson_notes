# Custom Loss / Fully Connected Layer / Differentiation and Backpropagation

## Understanding Tensor Ranks

- **Rank-0 tensor**: a constant (scalar), `scalar`
- **Rank-1 tensor**: a vector, `vector`
- **Rank-2 tensor**: a matrix, `matrix`
- **Rank-3 tensor**: commonly used to represent a batch of grayscale images `(batch_size, height, width)`
- **Rank-4 tensor**: commonly used to represent image data `(batch_size, channel, height, width)` (PyTorch's image convention is C, H, W)
- **Rank-5 tensor**: commonly used to represent video data `(batch_size, frame, channel, height, width)`

---

## Custom Loss Function

### Why write a custom loss function?

PyTorch ships with common loss functions such as `nn.MSELoss`, `nn.CrossEntropyLoss`, and `nn.BCELoss`. In real projects, though, you frequently run into situations where you need to **design your own loss function**:

| Scenario | Example | Why aren't the built-ins enough? |
|------|------|-------------------|
| **Multi-task learning** | Classification and regression at the same time | Need to combine multiple losses with weights |
| **Special business requirements** | Over-prediction costs 10x more than under-prediction | Need an asymmetric loss |
| **Custom regularization** | Impose special constraints on certain parameters | Need to add a penalty term inside the loss |
| **Paper reproduction** | Implementing Focal Loss, Contrastive Loss, etc. | Newer loss functions are not built in yet |
| **Handling class imbalance** | Binary classification with very few positive samples | Need to give the minority class a larger weight |

### Approach 1: Functional definition (simple cases)

If the loss computation involves no learnable parameters, defining it as an **ordinary function** is enough — this is the simplest and most recommended way.

```python
import torch
import torch.nn as nn

# Example 1: custom root mean squared error (RMSE)
def rmse_loss(y_pred, y_true):
    """
    RMSE = sqrt(MSE)
    Its advantage over MSE: the unit matches the original data, so it is more readable
    """
    mse = torch.mean((y_pred - y_true) ** 2)
    return torch.sqrt(mse)

# Usage example
y_pred = torch.randn(16, 1)      # 16 samples, 1 output
y_true = torch.randn(16, 1)
loss = rmse_loss(y_pred, y_true)
print(f"RMSE Loss: {loss.item():.4f}")

# Example 2: asymmetric loss (over-estimation is penalized 3x more than under-estimation)
def asymmetric_loss(y_pred, y_true, over_penalty=3.0):
    """
    In some business scenarios, over-estimating costs more than under-estimating.
    Inventory forecasting, for instance -- stocking too much ties up capital,
    while stocking too little just means slightly lower profit.
    """
    error = y_pred - y_true
    # error > 0 -> over-estimate, multiply by a larger penalty coefficient
    # error < 0 -> under-estimate, normal penalty
    loss = torch.where(error > 0,
                       over_penalty * error ** 2,   # over-estimate: penalty x3
                       error ** 2)                   # under-estimate: normal penalty
    return torch.mean(loss)

# Verify the asymmetric loss
y_pred = torch.tensor([3.0, -1.0])
y_true = torch.tensor([0.0, 0.0])
print(f"Asymmetric loss: {asymmetric_loss(y_pred, y_true):.4f}")
# over-estimate(3) loss = 9x3 = 27, under-estimate(-1) loss = 1, mean = 14
```

> **How to choose between functional and class-based?**
> - The loss function **does not need** learnable parameters (the vast majority of cases) → use the **functional** style, simple and intuitive
> - The loss function **does need** learnable parameters (very rare, e.g. certain adaptive losses) → use the **class-based** style (subclass `nn.Module`)

### Approach 2: Class-based definition (when you need parameters or state)

When the loss function has its own parameters (such as class weights or a temperature coefficient) or internal state, subclassing `nn.Module` is a better fit.

```python
import torch
import torch.nn as nn

class WeightedMSELoss(nn.Module):
    """
    Weighted MSE: assign a different weight to each sample.
    For example, if you know some samples have more reliable labels,
    give them larger weights.
    """
    def __init__(self, sample_weights=None):
        super().__init__()
        # Register as a buffer (not a parameter, so the optimizer won't update it,
        # but it is saved/loaded along with the model)
        if sample_weights is not None:
            self.register_buffer('weights', sample_weights)
        else:
            self.weights = None

    def forward(self, y_pred, y_true):
        squared_error = (y_pred - y_true) ** 2
        if self.weights is not None:
            # Multiply each sample's error by its corresponding weight
            weighted_error = squared_error * self.weights.view(-1, 1)
            return torch.mean(weighted_error)
        return torch.mean(squared_error)

# Usage: suppose there are 4 samples and the 1st one has the most reliable label (highest weight)
weights = torch.tensor([2.0, 1.0, 1.0, 0.5])
criterion = WeightedMSELoss(sample_weights=weights)

y_pred = torch.randn(4, 1)
y_true = torch.randn(4, 1)
loss = criterion(y_pred, y_true)
print(f"Weighted MSE Loss: {loss.item():.4f}")
```

### Hands-on: implementing Focal Loss (handling class imbalance)

Focal Loss comes from the RetinaNet paper "Focal Loss for Dense Object Detection" (Tsung-Yi Lin et al., with Kaiming He as a co-author, ICCV 2017). Its core idea is to **reduce the loss weight of already correctly classified samples** so the model pays more attention to hard-to-classify samples.

> **Why do we need Focal Loss?** In object detection, the vast majority of candidate boxes are "background" (easy to classify) and only a tiny fraction are "objects" (hard to classify). Standard cross entropy computes a loss for the enormous number of easy samples too, so the model gets "drowned out" by simple samples. Focal Loss uses a $(1-p_t)^\gamma$ factor to heavily attenuate the loss of easy samples ($p_t$ close to 1).

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """
    Focal Loss for binary/multi-class classification.

    Formula: FL(p_t) = -alpha_t * (1 - p_t)^gamma * log(p_t)

    Args:
        alpha: class weights that alleviate class imbalance. Shaped like [a_0, a_1, ..., a_C]
        gamma: focusing parameter. gamma=0 degenerates to ordinary cross entropy;
               the larger gamma is, the more strongly easy samples are suppressed
        reduction: 'mean' | 'sum' | 'none'
    """
    def __init__(self, alpha=None, gamma=2.0, reduction='mean'):
        super().__init__()
        if alpha is not None:
            alpha = torch.tensor(alpha, dtype=torch.float32)
        self.register_buffer('alpha', alpha)
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs, targets):
        """
        inputs: (N, C) -- logits produced by the model (before softmax)
        targets: (N,)  -- ground-truth class labels, each value in [0, C-1]
        """
        # 1. Compute cross entropy (without averaging, keeping per-sample values)
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')  # (N,)

        # 2. Compute p_t: the model's predicted probability for the correct class
        # cross_entropy = -log(p_t), so p_t = exp(-ce_loss)
        p_t = torch.exp(-ce_loss)  # (N,)

        # 3. Focal Loss = alpha_t * (1 - p_t)^gamma * CE
        focal_weight = (1 - p_t) ** self.gamma  # (N,)

        if self.alpha is not None:
            # Take the alpha value of each sample's corresponding class
            alpha_t = self.alpha[targets]       # (N,)
            focal_weight = alpha_t * focal_weight

        focal_loss = focal_weight * ce_loss     # (N,)

        # 4. Reduction
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss

# ===== Comparison: ordinary CrossEntropy vs Focal Loss =====
# Simulated data: 3 classes, batch_size=5
logits = torch.randn(5, 3)
targets = torch.randint(0, 3, (5,))

ce_criterion = nn.CrossEntropyLoss()
focal_criterion = FocalLoss(alpha=[1.0, 1.0, 1.0], gamma=2.0)

print(f"CrossEntropy Loss : {ce_criterion(logits, targets):.4f}")
print(f"Focal Loss (gamma=2)  : {focal_criterion(logits, targets):.4f}")

# ===== Getting an intuitive feel for the effect of (1-p_t)^gamma =====
print("\nEffect of (1-p_t)^gamma on the loss value:")
for p_t_val in [0.9, 0.7, 0.5, 0.3, 0.1]:
    # The larger p_t is -> the easier the sample -> the smaller (1-p_t) is -> the more the loss is compressed
    ce = -torch.log(torch.tensor(p_t_val))
    focal_1 = (1 - p_t_val) ** 1.0 * ce
    focal_2 = (1 - p_t_val) ** 2.0 * ce
    focal_5 = (1 - p_t_val) ** 5.0 * ce
    print(f"  p_t={p_t_val:.1f}: CE={ce:.4f}, gamma=1->{focal_1:.4f}, gamma=2->{focal_2:.4f}, gamma=5->{focal_5:.6f}")
```

> **Reading the sample output**:
> - `p_t=0.9` (already classified very well): CE=0.1054, with γ=2 the Focal Loss → 0.0011 (compressed by ~100x!)
> - `p_t=0.1` (classified badly): CE=2.3026, with γ=2 the Focal Loss → 1.8651 (essentially unchanged)
> - That is the essence of Focal Loss: **pay little attention to good samples, pay a lot to hard ones**

### Hands-on: custom combined loss (multi-task learning)

```python
import torch
import torch.nn as nn

class CombinedLoss(nn.Module):
    """
    A joint loss that does classification and regression at the same time.
    For example: predicting "will it rain" (classification) + "how many millimeters" (regression)
    """
    def __init__(self, cls_weight=1.0, reg_weight=0.5):
        super().__init__()
        self.cls_weight = cls_weight
        self.reg_weight = reg_weight
        self.cls_loss = nn.BCEWithLogitsLoss()    # binary classification (sigmoid built in)
        self.reg_loss = nn.MSELoss()               # regression

    def forward(self, cls_pred, cls_target, reg_pred, reg_target):
        loss_cls = self.cls_loss(cls_pred, cls_target)
        loss_reg = self.reg_loss(reg_pred, reg_target)
        # Weighted sum. The weights are hyperparameters and need to be tuned according to
        # how important each task is on the validation set
        total_loss = self.cls_weight * loss_cls + self.reg_weight * loss_reg
        return total_loss, {'cls_loss': loss_cls.item(),
                            'reg_loss': loss_reg.item(),
                            'total': total_loss.item()}

# Simulate multi-task outputs
cls_pred = torch.randn(8, 1)     # classification logits
cls_true = torch.randint(0, 2, (8, 1)).float()
reg_pred = torch.randn(8, 1)     # regression predictions
reg_true = torch.randn(8, 1)     # regression ground truth

criterion = CombinedLoss(cls_weight=1.0, reg_weight=0.5)
total_loss, loss_dict = criterion(cls_pred, cls_true, reg_pred, reg_true)
print(f"Total Loss: {total_loss:.4f}, details: {loss_dict}")
```

### Things to watch out for when writing a custom loss function

| Key point | Explanation |
|------|------|
| **Keep it differentiable** | Every operation must use PyTorch tensor operations (`torch.xxx`); don't use NumPy or pure Python operations |
| **Numerical stability** | When `log` or `exp` is involved, use `torch.clamp()` to prevent overflow; for cross-entropy-style losses use `log_softmax` instead of `softmax` + `log` |
| **The reduction argument** | Keep the same `'mean'` / `'sum'` / `'none'` convention as PyTorch's built-ins |
| **Device consistency** | When custom parameters are involved, use `.to(device)` or `register_buffer` to make sure the parameters and the input data live on the same device |
| **Be careful with in-place operations** | Be careful with in-place operations such as `x += ...` inside a loss function: if the tensor being modified in place happens to be a saved tensor needed for backpropagation, `backward` will raise a RuntimeError; doing an in-place operation on a leaf tensor with requires_grad errors out immediately |

---

## Custom Fully Connected Layer

### Why write a custom layer?

| Scenario | Example |
|------|------|
| **Learning the principles** | Hand-write a `Linear` layer to understand how `nn.Linear` works internally |
| **Special initialization** | You need a layer whose weights are all positive and whose rows sum to 1 |
| **Special structure** | You need a layer with "weight sharing", or one that is partially connected (not fully connected) |
| **Adding noise** | Add controllable noise to the weights or activations during the forward pass (variants of Dropout, etc.) |
| **Custom regularization** | Record certain values during the forward pass to add an extra regularization loss later |

### Basic template: subclass nn.Module

Every custom layer follows the same template:

```python
import torch
import torch.nn as nn

class MyCustomLayer(nn.Module):
    def __init__(self, ...):
        super().__init__()
        # 1. Define learnable parameters (nn.Parameter) or submodules
        ...

    def forward(self, x):
        # 2. Define the forward pass logic
        ...
        return output
```

> **Key rules**:
> - Learnable parameters must be wrapped in `nn.Parameter`, otherwise the optimizer cannot see them
> - All computation must be written inside `forward` (or in methods it calls)
> - `__init__` only defines the structure, it performs no computation

### Writing a Linear layer from scratch

This is the best way to understand the fully connected layer — implement `y = xW^T + b` manually with `nn.Parameter`.

```python
import torch
import torch.nn as nn

class MyLinear(nn.Module):
    """
    A hand-written fully connected layer, equivalent to nn.Linear(in_features, out_features).

    Forward formula: y = x @ W^T + b
    where x: (N, in_features), W: (out_features, in_features), b: (out_features,)
    Output y: (N, out_features)
    """
    def __init__(self, in_features, out_features, bias=True):
        super().__init__()
        # 1. Define the weight matrix W
        # Shape (out_features, in_features): each row is the weight vector of one output neuron
        self.weight = nn.Parameter(torch.randn(out_features, in_features) * 0.01)

        # 2. Define the bias b
        if bias:
            self.bias = nn.Parameter(torch.zeros(out_features))
        else:
            # When no bias is needed, register it as None and check for it in forward
            self.register_parameter('bias', None)

        # 3. Do He initialization manually (suitable for layers followed by ReLU)
        self.reset_parameters()

    def reset_parameters(self):
        # He (Kaiming) initialization: weight variance = 2 / fan_in
        nn.init.kaiming_uniform_(self.weight, a=0, mode='fan_in', nonlinearity='relu')
        if self.bias is not None:
            # The bias is usually initialized to 0, but a small constant also works
            nn.init.zeros_(self.bias)

    def forward(self, x):
        # y = x @ W^T + b
        # x: (N, in_features)
        # self.weight: (out_features, in_features)
        # self.weight.T: (in_features, out_features)
        # x @ self.weight.T: (N, out_features)
        y = x @ self.weight.T
        if self.bias is not None:
            y = y + self.bias
        return y

# ===== Verification: output matches nn.Linear =====
batch_size = 4
in_dim, out_dim = 3, 5
x = torch.randn(batch_size, in_dim)

# Test with identical weights
my_layer = MyLinear(in_dim, out_dim)
official_layer = nn.Linear(in_dim, out_dim)

# Copy the weights
with torch.no_grad():
    official_layer.weight.copy_(my_layer.weight)
    official_layer.bias.copy_(my_layer.bias)

y_my = my_layer(x)
y_official = official_layer(x)

print("Hand-written Linear output:\n", y_my)
print("\nnn.Linear output:\n", y_official)
print(f"\nMaximum difference: {(y_my - y_official).abs().max().item():.10f}")  # Should be 0 or extremely small
```

> **`nn.Parameter` vs `torch.tensor`**:
> ```python
> # ✅ Correct: w will be tracked and updated by the optimizer
> w = nn.Parameter(torch.randn(5, 3))
>
> # ❌ Wrong: w is just an ordinary tensor; the optimizer does not recognize it
> w = torch.randn(5, 3)
>
> # How to check: see whether it appears in model.parameters()
> for name, param in model.named_parameters():
>     print(name)  # Only nn.Parameter is listed; ordinary tensors will not appear
> ```

### Going further: a custom layer with an activation function

Packaging fully connected + activation + Dropout into a single "building block" makes it convenient to reuse:

```python
import torch
import torch.nn as nn

class MyDenseBlock(nn.Module):
    """
    A combined block of fully connected + BatchNorm + activation + Dropout.
    This is the most commonly used pattern in real projects.
    """
    def __init__(self, in_features, out_features,
                 activation='relu', dropout=0.0, use_bn=True):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)

        # BatchNorm needs to know the number of features
        self.bn = nn.BatchNorm1d(out_features) if use_bn else nn.Identity()

        # Activation function dictionary
        act_dict = {
            'relu': nn.ReLU(inplace=True),
            'leaky_relu': nn.LeakyReLU(0.1, inplace=True),
            'gelu': nn.GELU(),
            'sigmoid': nn.Sigmoid(),
            'tanh': nn.Tanh(),
            'none': nn.Identity(),
        }
        self.activation = act_dict.get(activation, nn.ReLU(inplace=True))

        # Dropout
        self.dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()

    def forward(self, x):
        x = self.linear(x)
        x = self.bn(x)
        x = self.activation(x)
        x = self.dropout(x)
        return x

# Quickly build a network
model = nn.Sequential(
    MyDenseBlock(784, 256, activation='relu', dropout=0.3),
    MyDenseBlock(256, 128, activation='relu', dropout=0.3),
    MyDenseBlock(128, 10,  activation='none', use_bn=False),  # No activation on the last layer
)
print(model)

x = torch.randn(32, 784)
y = model(x)
print(f"Input shape: (32, 784) → output shape: {y.shape}")  # (32, 10)
```

### In practice: a constrained fully connected layer (non-negative weights + row normalization)

Certain scenarios (such as attention mechanisms or NMF decomposition) require the weights to satisfy specific constraints:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class NonNegativeLinear(nn.Module):
    """
    A fully connected layer whose weights are always non-negative.
    Implementation: actually store W_raw, and use softplus or exp in forward to ensure W >= 0.

    Why not use clamp? clamp(min=0) has a gradient of 0 throughout the truncated region (the negative
    half-axis where W_raw < 0), so negative raw weights get stuck at 0 forever because their gradient
    is constantly 0. softplus is differentiable everywhere, making it better suited to gradient descent.
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        # Store the raw weights (which may be negative) and transform them to non-negative in forward
        self.weight_raw = nn.Parameter(torch.randn(out_features, in_features))
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x):
        # softplus(x) = log(1 + e^x); the output is always > 0 and differentiable everywhere
        weight = F.softplus(self.weight_raw)
        return F.linear(x, weight, self.bias)

class RowNormalizedLinear(nn.Module):
    """
    A fully connected layer where each row of weights sums to 1 (the weights can be viewed as a "probability distribution").
    Implementation: apply softmax to each row to ensure sum(W[i, :]) = 1.
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        self.weight_raw = nn.Parameter(torch.randn(out_features, in_features))
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x):
        # Apply softmax to each row to ensure the sum is 1
        weight = F.softmax(self.weight_raw, dim=1)  # dim=1 → normalize row-wise
        return F.linear(x, weight, self.bias)

# Verify row normalization
layer = RowNormalizedLinear(4, 3)
print("Sum of each row of weights:", layer.weight_raw.softmax(dim=1).sum(dim=1))
# Output: tensor([1., 1., 1.])
```

### In practice: a fully connected layer with noise injection

```python
import torch
import torch.nn as nn

class NoisyLinear(nn.Module):
    """
    Adds Gaussian noise to the activations during training, and switches off automatically at inference.
    This is a regularization technique (a variant similar to Dropout) that can improve model robustness.

    Parameters:
        sigma: the standard deviation of the noise (a scaling factor relative to the activation values)
    """
    def __init__(self, in_features, out_features, sigma=0.1):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)
        self.sigma = sigma

    def forward(self, x):
        y = self.linear(x)
        if self.training:  # self.training is controlled by model.train() / model.eval()
            # Add noise during training
            noise = torch.randn_like(y) * self.sigma * y.detach()
            y = y + noise
        return y

# Test the difference between training/inference mode
layer = NoisyLinear(3, 4, sigma=0.5)
x = torch.ones(2, 3)

layer.train()  # Training mode
y_train = layer(x)
print("Training mode output:\n", y_train)

layer.eval()   # Inference mode
y_eval = layer(x)
print("\nInference mode output:\n", y_eval)
```

---

## Custom Differentiation and Backpropagation

### Prerequisite recap: how automatic differentiation (Autograd) works

In PyTorch, every tensor operation is recorded into a **computation graph**. When you call `.backward()`, PyTorch traverses the computation graph backwards from the output and uses the chain rule to compute the gradient of every tensor with `requires_grad=True`.

```python
import torch

# The simplest example: y = x², find dy/dx
x = torch.tensor(3.0, requires_grad=True)
y = x ** 2          # y = 9
y.backward()        # Automatically computes dy/dx = 2x = 6
print(f"x.grad = {x.grad}")  # Output: 6.0 ✓

# What does the computation graph look like?
#   x ──→ [pow(2)] ──→ y
# Operations are recorded during the forward pass; on the backward pass it passes through [pow(2)] and multiplies by the local derivative 2x
```

> **In most cases, you do not need to hand-write backward**. PyTorch operations such as `+`, `*`, `@`, and `torch.sin` all have built-in backpropagation rules. Only when you want to implement a **completely new operation that PyTorch does not support** do you need a custom `autograd.Function`.

### When do you need a custom autograd.Function?

| Scenario | Example |
|------|------|
| Implementing a new operator proposed in a paper | A custom activation function or normalization method |
| Needing to optimize the gradient computation manually | Using your own mathematical tricks to speed up gradient computation (faster than the automatically composed computation graph) |
| Containing non-differentiable operations | Quantization (rounding), hard thresholding — the gradient needs to be "approximated" in backward |
| Calling external C/CUDA code | A CUDA kernel you wrote yourself, where you need to tell PyTorch how to compute gradients |

### The core tool: torch.autograd.Function

Inherit from `torch.autograd.Function` and implement two static methods:

| Method | What it does | Return value |
|------|--------|--------|
| `forward(ctx, ...)` | The forward computation | The output tensor |
| `backward(ctx, grad_output)` | Backpropagation (computing gradients) | The gradient for each input (the count matches forward's inputs) |

`ctx` is a "shuttle box" — in `forward` you can store things in it (`ctx.save_for_backward(...)`), and in `backward` you take them out and use them.

> **Why static methods?** `torch.autograd.Function` is designed to be stateless — the same `Function` can be called multiple times in a computation graph, each call is independent, and `ctx` holds the context of that particular call. Static methods ensure you cannot accidentally misuse instance variables.

### Hand-writing ReLU (understanding how backward works)

Although PyTorch already has `F.relu`, writing it by hand once gives you a thorough understanding of the backward mechanism.

```python
import torch

class MyReLU(torch.autograd.Function):
    """
    Custom ReLU: forward = max(0, x), backward = grad_output * (x > 0)

    This is the simplest backward example — where the forward output equals the input, the gradient
    passes back unchanged; where the forward output was zeroed out, the gradient is also truncated to 0.
    """

    @staticmethod
    def forward(ctx, x):
        # ctx.save_for_backward: store intermediate forward results for use in backward
        # Here we only need to know "at which positions x > 0", so storing x suffices
        ctx.save_for_backward(x)
        # clamp(min=0) is exactly max(0, x)
        return x.clamp(min=0)

    @staticmethod
    def backward(ctx, grad_output):
        """
        grad_output: the gradient passed back from the following layer, ∂L/∂y (i.e. ∂L/∂(ReLU output))

        Chain rule: ∂L/∂x = ∂L/∂y · ∂y/∂x
                          = grad_output · (x > 0).float()
        """
        x, = ctx.saved_tensors           # Retrieve what forward stored
        grad_input = grad_output.clone()  # Make a copy (good habit: do not modify grad_output)
        grad_input[x <= 0] = 0            # At positions where x <= 0, truncate the gradient to 0
        return grad_input

# ===== Verification: compare against the official ReLU =====
x = torch.randn(5, requires_grad=True)
# You must use .apply() to invoke a custom Function
y_custom = MyReLU.apply(x)

# The official ReLU as a control
x2 = x.detach().clone().requires_grad_(True)
y_official = torch.relu(x2)

# Check the forward pass
print("Custom ReLU:", y_custom)
print("Official ReLU  :", y_official)
print("Forward matches:", torch.allclose(y_custom, y_official))

# Check the backward pass
loss_custom = y_custom.sum()
loss_official = y_official.sum()
loss_custom.backward()
loss_official.backward()
print("Gradients match:", torch.allclose(x.grad, x2.grad))
```

> **What is grad_output?** Let the current layer's output be $y$ and the final loss be $L$. The `grad_output` received by `backward` is exactly $\frac{\partial L}{\partial y}$ — **the gradient passed back from the later layers**. What you must do is use the chain rule to compute $\frac{\partial L}{\partial x}$, i.e. `grad_output * ∂y/∂x`.

### Hand-writing Sigmoid (understanding how to use ctx.save_for_backward)

```python
import torch

class MySigmoid(torch.autograd.Function):
    """
    Custom Sigmoid: y = 1 / (1 + e^{-x})
    Backward: ∂y/∂x = y * (1 - y) = sigmoid(x) * (1 - sigmoid(x))
    """

    @staticmethod
    def forward(ctx, x):
        # 1. Use the numerically stable way of computing sigmoid(x)
        #    Using 1/(1+exp(-x)) directly overflows in exp when x is very large
        #    The stable approach: use 1/(1+exp(-x)) when x>=0, and exp(x)/(1+exp(x)) when x<0
        #
        #    In fact PyTorch's torch.sigmoid already does this optimization; here we demonstrate the principle
        output = torch.sigmoid(x)  # In production, just use torch.sigmoid

        # 2. backward needs the forward output y, so store it
        ctx.save_for_backward(output)
        return output

    @staticmethod
    def backward(ctx, grad_output):
        output, = ctx.saved_tensors
        # The derivative of sigmoid: y * (1 - y)
        grad_sigmoid = output * (1 - output)
        # Chain rule: ∂L/∂x = ∂L/∂y * ∂y/∂x
        grad_input = grad_output * grad_sigmoid
        return grad_input

# ===== Verification =====
x = torch.randn(5, requires_grad=True)
y = MySigmoid.apply(x)
print("Forward output:", y)
y.sum().backward()
print("Gradient:", x.grad)
```

### Hand-writing a custom operation: a polynomial transformation

Suppose you invented a new activation function $f(x) = x + x^2 + x^3$ that PyTorch does not have built in:

```python
import torch

class PolyActivation(torch.autograd.Function):
    """
    Forward: y = x + x² + x³
    Backward: ∂y/∂x = 1 + 2x + 3x²
    """
    @staticmethod
    def forward(ctx, x):
        # Save x, needed in backward
        ctx.save_for_backward(x)
        return x + x ** 2 + x ** 3

    @staticmethod
    def backward(ctx, grad_output):
        x, = ctx.saved_tensors
        # Local derivative: 1 + 2x + 3x²
        local_grad = 1 + 2 * x + 3 * x ** 2
        grad_input = grad_output * local_grad
        return grad_input

# ===== Verification =====
x = torch.tensor([-2.0, -1.0, 0.0, 1.0, 2.0], requires_grad=True)
y = PolyActivation.apply(x)
y.sum().backward()

print("x     :", x.detach().numpy())
print("y     :", y.detach().numpy())
print("grad  :", x.grad.numpy())
# x=-2: y=-2+4-8=-6, grad=1-4+12=9
# x=-1: y=-1+1-1=-1, grad=1-2+3=2
# x=0:  y=0,         grad=1
# x=1:  y=3,         grad=1+2+3=6
# x=2:  y=2+4+8=14,  grad=1+4+12=17
```

### Going further: approximating gradients for non-differentiable operations

**Quantization** is a typical example — the derivative of the `round()` function is 0 everywhere (except at the jump points, where it is non-differentiable), yet we want to train through it. The approach is: **use a hard round in the forward pass, and pass straight through in the backward pass (Straight-Through Estimator, STE)**.

> **The core idea of STE**: during forward propagation, compute the output using the real (non-differentiable) operation; during backpropagation, pretend the operation does not exist (derivative of 1) and let the gradient "pass straight through". Although the gradient is imprecise, it works surprisingly well in practice.

```python
import torch

class STEQuantize(torch.autograd.Function):
    """
    Forward: round to the nearest integer (non-differentiable: the derivative is 0 almost everywhere)
    Backward: straight-through estimator (STE) — pretend the rounding never happened, gradient unchanged

    Use case: quantization-aware training (QAT)
    """
    @staticmethod
    def forward(ctx, x):
        # Real rounding
        return torch.round(x)

    @staticmethod
    def backward(ctx, grad_output):
        # Key point: STE — the gradient passes straight through without any modification
        return grad_output.clone()

# Test
x = torch.tensor([1.3, 2.7, 3.5], requires_grad=True)
y = STEQuantize.apply(x)
print("Forward (after quantization):", y)  # [1., 3., 4.]

# Backward: even though the forward output is the rounded value, the gradient propagates as usual
y.sum().backward()
print("Gradient (STE straight-through):", x.grad)  # [1., 1., 1.] — the gradient did not decay!
```

### In practice: a complete custom layer (integrating Layer + Function)

Wrapping a custom activation function into an `nn.Module` makes it convenient to use inside a model:

```python
import torch
import torch.nn as nn

# Step one: define the autograd.Function (the low-level operator)
class SwishFunction(torch.autograd.Function):
    """
    Swish activation function: f(x) = x * sigmoid(βx)

    Derivative: f'(x) = sigmoid(βx) + β * x * sigmoid(βx) * (1 - sigmoid(βx))
         = β * f(x) + sigmoid(βx) * (1 - β * f(x))   (after simplification; when β=1 it reduces to f(x) + sigmoid(x)(1 - f(x)))

    Swish was proposed by Google Brain (2017) and sometimes outperforms ReLU on deep networks.
    Its characteristics are: non-monotonic, smooth, bounded below and unbounded above.
    """
    @staticmethod
    def forward(ctx, x, beta):
        # beta may be a Python number or a tensor (such as an nn.Parameter); convert it uniformly to a tensor before saving
        # Note: save_for_backward can only be called once; calling it again overwrites what was saved before
        beta_t = beta if torch.is_tensor(beta) else torch.tensor(float(beta))
        sigmoid_bx = torch.sigmoid(beta_t * x)
        output = x * sigmoid_bx
        ctx.save_for_backward(x, sigmoid_bx, beta_t)
        return output

    @staticmethod
    def backward(ctx, grad_output):
        x, sigmoid_bx, beta = ctx.saved_tensors
        # The Swish derivative:
        # f(x) = x * sigmoid(βx)
        # ∂f/∂x = sigmoid(βx) + β * x * sigmoid(βx) * (1 - sigmoid(βx))
        #        = sigmoid(βx) + β * f(x) * (1 - sigmoid(βx))
        #        = β * f(x) + sigmoid(βx) * (1 - β * f(x))
        f_x = x * sigmoid_bx
        local_grad = sigmoid_bx + beta * f_x * (1 - sigmoid_bx)
        grad_input = grad_output * local_grad
        # ∂f/∂β = x² * sigmoid(βx) * (1 - sigmoid(βx)); beta is a scalar, so sum the gradients over all elements
        # Only compute and return it when beta is a tensor that requires gradients (such as an nn.Parameter); otherwise return None
        grad_beta = None
        if ctx.needs_input_grad[1]:
            grad_beta = (grad_output * x * x * sigmoid_bx * (1 - sigmoid_bx)).sum()
        return grad_input, grad_beta

# Step two: wrap it into an nn.Module (for convenient use)
class Swish(nn.Module):
    def __init__(self, beta=1.0):
        super().__init__()
        # beta as a learnable parameter: SwishFunction.backward already returns the gradient w.r.t. beta, so it is updated during training
        # If you want to keep beta fixed, use self.register_buffer('beta', torch.tensor(beta)) instead
        self.beta = nn.Parameter(torch.tensor(beta))

    def forward(self, x):
        return SwishFunction.apply(x, self.beta)

# ===== Using it in a model =====
class SwishMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.swish1 = Swish(beta=1.0)    # Use it just like nn.ReLU()!
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = self.fc1(x)
        x = self.swish1(x)
        x = self.fc2(x)
        return x

model = SwishMLP()
x = torch.randn(32, 784)
print(f"Output shape: {model(x).shape}")  # (32, 10)
```

### Important considerations when customizing backward

| Key point | Description |
|------|------|
| **Do not modify grad_output in place** | Use `grad_output.clone()` to create a copy before operating on it, otherwise you will affect other nodes in the computation graph |
| **Number of return values = number of forward inputs** | `forward(ctx, a, b)` → `backward` must `return grad_a, grad_b`. Return `None` for inputs that do not need gradients |
| **ctx.save_for_backward only stores tensors** | It cannot store lists, dicts, etc. Assign non-tensor values directly with `ctx.attr = value` |
| **Avoid unnecessary custom Functions** | If something can be composed from PyTorch's built-in operations, do not hand-write backward — the built-ins are faster and have fewer bugs |
| **Verify with torch.autograd.gradcheck** | PyTorch provides a numerical gradient checking tool to verify whether your backward is correct |

### Verifying a custom backward with gradcheck

This is a **mandatory step** — use numerical differentiation to verify that your backward implementation is correct.

```python
import torch

# Test whether the gradients of a custom Function are correct
# gradcheck compares numerical differentiation (finite differences) against the backward you wrote
x = torch.randn(5, dtype=torch.double, requires_grad=True)

# Test MyReLU (defined earlier)
# Note: gradcheck defaults to raise_exception=True — when gradients do not match it raises GradcheckError
# rather than returning False; to get a boolean result for an if check, pass raise_exception=False explicitly
test_passed = torch.autograd.gradcheck(
    MyReLU.apply,   # The Function to test
    (x,),            # The inputs (as a tuple)
    eps=1e-6,        # The step size for numerical differentiation
    atol=1e-4,       # The allowed absolute error
    raise_exception=False  # Return False on failure instead of raising
)
print(f"MyReLU gradcheck: {'✅ passed' if test_passed else '❌ failed'}")

# Test MySigmoid
test_passed = torch.autograd.gradcheck(MySigmoid.apply, (x,), eps=1e-6, atol=1e-4, raise_exception=False)
print(f"MySigmoid gradcheck: {'✅ passed' if test_passed else '❌ failed'}")

# Test PolyActivation
test_passed = torch.autograd.gradcheck(PolyActivation.apply, (x,), eps=1e-6, atol=1e-4, raise_exception=False)
print(f"PolyActivation gradcheck: {'✅ passed' if test_passed else '❌ failed'}")
```

> **How gradcheck works**: numerical differentiation approximates the derivative with $f'(x) \approx \frac{f(x+\epsilon)-f(x-\epsilon)}{2\epsilon}$, and then compares it against the result of the `backward` you wrote. If the difference exceeds `atol`, your `backward` implementation has a bug.

---

## Summary of the Relationship Between the Three

### A complete example: all three appearing at once

Suppose you want to implement a **Parametric Contrastive Loss + L2-Normalized Linear + custom gradient clipping** from a paper. The code below strings all three together to help you see clearly where each one sits:

```python
import torch
import torch.nn as nn

# ═══════════════════════════════════════════════════════════
# Layer 3 (the lowest level): custom differentiation rules
# ═══════════════════════════════════════════════════════════
class GradientClipFunction(torch.autograd.Function):
    """
    Custom backpropagation: the part of the gradient exceeding a threshold is clipped away.
    Forward = identity mapping, backward = clipping applied to the gradient.
    """
    @staticmethod
    def forward(ctx, x, threshold):
        ctx.threshold = threshold
        return x.clone()

    @staticmethod
    def backward(ctx, grad_output):
        # Clip the gradient being propagated back, to prevent any single step's gradient from being too large
        return torch.clamp(grad_output, -ctx.threshold, ctx.threshold), None

def grad_clip(x, threshold=1.0):
    return GradientClipFunction.apply(x, threshold)


# ═══════════════════════════════════════════════════════════
# Layer 2 (the middle level): a custom network layer
# ═══════════════════════════════════════════════════════════
class L2NormalizedLinear(nn.Module):
    """
    L2-normalize both the input and the weights before performing the linear transformation.
    Equivalent to computing cosine similarity (multiplied by a learnable scaling factor).
    Commonly used in tasks such as face recognition and metric learning.
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(out_features, in_features))
        self.scale = nn.Parameter(torch.tensor(10.0))  # A learnable scaling factor

    def forward(self, x):
        # L2-normalize the input and the weights
        x_norm = nn.functional.normalize(x, p=2, dim=1)
        w_norm = nn.functional.normalize(self.weight, p=2, dim=1)
        # Cosine similarity × scaling factor
        cosine = x_norm @ w_norm.T
        return cosine * self.scale


# ═══════════════════════════════════════════════════════════
# Layer 1 (the topmost level): a custom loss function
# ═══════════════════════════════════════════════════════════
class ContrastiveLoss(nn.Module):
    """
    Contrastive Loss:
    - Same-class sample pairs (label=1): pull them closer
    - Different-class sample pairs (label=0): push them apart (at least margin away)
    """
    def __init__(self, margin=1.0):
        super().__init__()
        self.margin = margin

    def forward(self, x1, x2, label):
        # x1, x2: the feature vectors of the two samples (batch, dim)
        # label: 1 means same class, 0 means different class
        dist_sq = (x1 - x2).pow(2).sum(dim=1)   # The squared Euclidean distance d²
        dist = torch.sqrt(dist_sq + 1e-9)       # The Euclidean distance d (eps added to prevent NaN gradients at sqrt(0))
        # Standard Contrastive Loss (Hadsell et al. 2006):
        # L = y·d² + (1-y)·max(0, margin - d)²   —— the hinge compares the distance d itself, so margin has units of "distance"
        loss_pos = label * dist_sq
        loss_neg = (1 - label) * torch.clamp(self.margin - dist, min=0).pow(2)
        return (loss_pos + loss_neg).mean()


# ═══════════════════════════════════════════════════════════
# Assembly: the three working together
# ═══════════════════════════════════════════════════════════
class SimpleContrastiveModel(nn.Module):
    def __init__(self, input_dim=128, embed_dim=64):
        super().__init__()
        self.encoder = nn.Sequential(
            L2NormalizedLinear(input_dim, embed_dim),  # ← custom layer
        )
        self.criterion = ContrastiveLoss(margin=1.0)    # ← custom loss

    def forward(self, x1, x2, label):
        # Encode the two inputs
        e1 = self.encoder(x1)
        e2 = self.encoder(x2)
        # Apply gradient clipping to the encoded results (to prevent the gradient of some sample pair from blowing up)
        e1 = grad_clip(e1, threshold=5.0)              # ← custom differentiation
        e2 = grad_clip(e2, threshold=5.0)
        # Compute the contrastive loss
        loss = self.criterion(e1, e2, label)
        return loss


# Run it once to see how the three cooperate
model = SimpleContrastiveModel()
x1 = torch.randn(8, 128)
x2 = torch.randn(8, 128)
label = torch.randint(0, 2, (8,)).float()

loss = model(x1, x2, label)   # Forward: passing in turn through custom layer → custom differentiation → custom loss
loss.backward()                # Backward: the custom differentiation's backward is invoked automatically, clipping gradients
print(f"Contrastive Loss: {loss.item():.4f}")
```

### How the three are positioned

Imagine you are **constructing a building**:

```
	 自定义损失函数   ←  「验收标准」
      定义"什么是好、什么是坏"。
      离验收标准越近 → loss 越小 → 训练目标。
      继承 nn.Module 或直接用函数，只算数值不碰梯度。
                                                      
     自定义层         ←  「建筑材料」
      搭积木——Linear、Conv、BN、激活函数。
      继承 nn.Module，管理权重/偏置这些可学习参数。
      用现有算子拼出新结构，反向传播 PyTorch 自动搞定。
                                                     
     自定义求导       ←  「烧制砖头的配方」
      当市面上没有你要的砖（算子），自己烧。
      继承 autograd.Function，手写 forward + backward。
      这是最底层——你直接告诉 PyTorch 梯度怎么流。
```

| Dimension | Custom loss function | Custom layer | Custom differentiation |
|------|:---:|:---:|:---:|
| **Base class** | function / `nn.Module` | `nn.Module` | `torch.autograd.Function` |
| **Need to hand-write backward?** | ❌ No | ❌ No | ✅ Yes |
| **Manages learnable parameters?** | Very rarely | ✅ Yes (`nn.Parameter`) | ❌ No (stateless) |
| **Typical output** | A scalar (the loss value) | A tensor (features/activations) | A tensor + its gradient rule |
| **Consequence of a mistake** | The model learns the wrong thing (wrong direction) | Forward errors out or performs poorly | Gradients are wrong and the model does not converge at all |
| **Debugging difficulty** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High |
| **Frequency of use** | ⭐⭐⭐ Very high | ⭐⭐ Medium | ⭐ Low |

### Remember it in one sentence

> The **loss function** defines the objective, the **custom layer** builds the structure, and **custom differentiation** clears the path for gradients — the loss sets the direction at the top, layers manage structure in the middle, and differentiation manages flow at the bottom. The three levels each have their own role and work together as one.
