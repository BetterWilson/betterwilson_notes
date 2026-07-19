# 自定义损失/全连接层/求导与反向传播

## Tensor的阶数理解

- **0阶张量**：常数（标量，常量），`scalar`
- **1阶张量**：向量，`vector`
- **2阶张量**：矩阵，`matrix`
- **3阶张量**：常用于表示一批灰度图 `(batch_size, height, width)`
- **4阶张量**：常用于表示图像数据 `(batch_size, channel, height, width)`（PyTorch 图像惯例为 C, H, W）
- **5阶张量**：常用于表示视频数据 `(batch_size, frame, channel, height, width)`

---

## 自定义损失函数

### 为什么要自定义损失函数？

PyTorch 内置了 `nn.MSELoss`、`nn.CrossEntropyLoss`、`nn.BCELoss` 等常用损失函数。但在实际项目中，你经常会遇到需要**自己设计损失函数**的场景：

| 场景 | 举例 | 为什么内置的不够？ |
|------|------|-------------------|
| **多任务学习** | 同时做分类 + 回归 | 需要把多个 loss 加权组合 |
| **特殊业务需求** | 预测值偏高比偏低代价大 10 倍 | 需要非对称损失 |
| **自定义正则化** | 给某些参数加特殊约束 | 需要在 loss 中加惩罚项 |
| **论文复现** | 实现 Focal Loss、Contrastive Loss 等 | 较新的损失函数尚未内置 |
| **处理样本不平衡** | 正样本极少的二分类 | 需要给少数类加更大的权重 |

### 方法一：函数式定义（简单场景）

如果损失计算不涉及可学习参数，直接用**普通函数**定义即可——这是最简单、最推荐的方式。

```python
import torch
import torch.nn as nn

# 例1：自定义均方根误差（RMSE）
def rmse_loss(y_pred, y_true):
    """
    RMSE = sqrt(MSE)
    比 MSE 的好处是：单位和原始数据一致，可读性更强
    """
    mse = torch.mean((y_pred - y_true) ** 2)
    return torch.sqrt(mse)

# 使用示例
y_pred = torch.randn(16, 1)      # 16个样本，1个输出
y_true = torch.randn(16, 1)
loss = rmse_loss(y_pred, y_true)
print(f"RMSE Loss: {loss.item():.4f}")

# 例2：非对称损失（高估的惩罚是低估的 3 倍）
def asymmetric_loss(y_pred, y_true, over_penalty=3.0):
    """
    某些业务场景中，预测偏高（over-estimate）比预测偏低（under-estimate）代价更大。
    比如库存预测——备货太多会积压资金，备货太少只是少赚一点。
    """
    error = y_pred - y_true
    # error > 0 → 高估，乘以更大的惩罚系数
    # error < 0 → 低估，正常惩罚
    loss = torch.where(error > 0,
                       over_penalty * error ** 2,   # 高估：惩罚 ×3
                       error ** 2)                   # 低估：正常惩罚
    return torch.mean(loss)

# 验证非对称损失
y_pred = torch.tensor([3.0, -1.0])
y_true = torch.tensor([0.0, 0.0])
print(f"非对称损失: {asymmetric_loss(y_pred, y_true):.4f}")
# 高估(3)的loss=9×3=27, 低估(-1)的loss=1, 平均=14
```

> **函数式 vs 类式怎么选？**
> - 损失函数**不需要**可学习参数（绝大多数情况）→ 用**函数式**，简单直观
> - 损失函数**需要**可学习参数（极少见，如某些自适应损失）→ 用**类式**（继承 `nn.Module`）

### 方法二：类式定义（需要参数或状态时）

当损失函数有自己的参数（如类别权重、温度系数）或内部状态时，继承 `nn.Module` 更合适。

```python
import torch
import torch.nn as nn

class WeightedMSELoss(nn.Module):
    """
    加权 MSE：给每个样本不同的权重。
    比如知道某些样本的标注更可靠，就给它们更大的权重。
    """
    def __init__(self, sample_weights=None):
        super().__init__()
        # 注册为 buffer（不是参数，不会被优化器更新，但会随模型保存/加载）
        if sample_weights is not None:
            self.register_buffer('weights', sample_weights)
        else:
            self.weights = None

    def forward(self, y_pred, y_true):
        squared_error = (y_pred - y_true) ** 2
        if self.weights is not None:
            # 每个样本的误差乘上对应的权重
            weighted_error = squared_error * self.weights.view(-1, 1)
            return torch.mean(weighted_error)
        return torch.mean(squared_error)

# 使用：假设有 4 个样本，第 1 个样本的标注最可靠（权重最高）
weights = torch.tensor([2.0, 1.0, 1.0, 0.5])
criterion = WeightedMSELoss(sample_weights=weights)

y_pred = torch.randn(4, 1)
y_true = torch.randn(4, 1)
loss = criterion(y_pred, y_true)
print(f"Weighted MSE Loss: {loss.item():.4f}")
```

### 实战：实现 Focal Loss（处理类别不平衡）

Focal Loss 出自 RetinaNet 论文《Focal Loss for Dense Object Detection》（Tsung-Yi Lin 等，何恺明为合著者，ICCV 2017），核心思想是**降低已分类正确样本的 loss 权重**，让模型更关注难分类的样本。

> **为什么需要 Focal Loss？** 在目标检测中，绝大多数候选框是"背景"（容易分类），只有极少数是"目标"（难分类）。标准交叉熵会对海量易分样本也计算 loss，导致模型被简单样本"淹没"。Focal Loss 通过一个 $(1-p_t)^\gamma$ 因子，让易分样本（$p_t$ 接近 1）的 loss 大幅衰减。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """
    Focal Loss for binary/multi-class classification.

    公式: FL(p_t) = -α_t * (1 - p_t)^γ * log(p_t)

    参数:
        alpha: 类别权重，缓解类别不平衡。形如 [α_0, α_1, ..., α_C]
        gamma: 聚焦参数。γ=0 退化为普通交叉熵；γ 越大，易分样本被压制得越厉害
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
        inputs: (N, C) — 模型输出的 logits（未经 softmax）
        targets: (N,)  — 真实类别标签，每个值 ∈ [0, C-1]
        """
        # 1. 计算交叉熵（不取平均，保持每个样本的值）
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')  # (N,)

        # 2. 计算 p_t：模型对正确类别的预测概率
        # cross_entropy = -log(p_t)，所以 p_t = exp(-ce_loss)
        p_t = torch.exp(-ce_loss)  # (N,)

        # 3. Focal Loss = α_t * (1 - p_t)^γ * CE
        focal_weight = (1 - p_t) ** self.gamma  # (N,)

        if self.alpha is not None:
            # 取每个样本对应类别的 α 值
            alpha_t = self.alpha[targets]       # (N,)
            focal_weight = alpha_t * focal_weight

        focal_loss = focal_weight * ce_loss     # (N,)

        # 4. 归约
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss

# ===== 对比：普通 CrossEntropy vs Focal Loss =====
# 模拟数据：3 分类，batch_size=5
logits = torch.randn(5, 3)
targets = torch.randint(0, 3, (5,))

ce_criterion = nn.CrossEntropyLoss()
focal_criterion = FocalLoss(alpha=[1.0, 1.0, 1.0], gamma=2.0)

print(f"CrossEntropy Loss : {ce_criterion(logits, targets):.4f}")
print(f"Focal Loss (γ=2)  : {focal_criterion(logits, targets):.4f}")

# ===== 直观感受 (1-p_t)^γ 的效果 =====
print("\n(1-p_t)^γ 对损失值的影响：")
for p_t_val in [0.9, 0.7, 0.5, 0.3, 0.1]:
    # p_t 越大 → 样本越容易 → (1-p_t) 越小 → 损失被压缩得越多
    ce = -torch.log(torch.tensor(p_t_val))
    focal_1 = (1 - p_t_val) ** 1.0 * ce
    focal_2 = (1 - p_t_val) ** 2.0 * ce
    focal_5 = (1 - p_t_val) ** 5.0 * ce
    print(f"  p_t={p_t_val:.1f}: CE={ce:.4f}, γ=1→{focal_1:.4f}, γ=2→{focal_2:.4f}, γ=5→{focal_5:.6f}")
```

> **输出示例解读**：
> - `p_t=0.9`（已分得很好）：CE=0.1054，γ=2 时 Focal Loss → 0.0011（被压缩了 ~100 倍！）
> - `p_t=0.1`（分得很差）：CE=2.3026，γ=2 时 Focal Loss → 1.8651（基本不变）
> - 这就是 Focal Loss 的核心：**好的样本少管，难的样本多管**

### 实战：自定义组合损失（多任务学习）

```python
import torch
import torch.nn as nn

class CombinedLoss(nn.Module):
    """
    同时做分类和回归的联合损失。
    例如：预测"会不会下雨"（分类） + "下多少毫米"（回归）
    """
    def __init__(self, cls_weight=1.0, reg_weight=0.5):
        super().__init__()
        self.cls_weight = cls_weight
        self.reg_weight = reg_weight
        self.cls_loss = nn.BCEWithLogitsLoss()    # 二分类（内置 sigmoid）
        self.reg_loss = nn.MSELoss()               # 回归

    def forward(self, cls_pred, cls_target, reg_pred, reg_target):
        loss_cls = self.cls_loss(cls_pred, cls_target)
        loss_reg = self.reg_loss(reg_pred, reg_target)
        # 加权求和。权重是超参数，需要根据验证集上两个任务的重要程度调整
        total_loss = self.cls_weight * loss_cls + self.reg_weight * loss_reg
        return total_loss, {'cls_loss': loss_cls.item(),
                            'reg_loss': loss_reg.item(),
                            'total': total_loss.item()}

# 模拟多任务输出
cls_pred = torch.randn(8, 1)     # 分类 logits
cls_true = torch.randint(0, 2, (8, 1)).float()
reg_pred = torch.randn(8, 1)     # 回归预测
reg_true = torch.randn(8, 1)     # 回归真值

criterion = CombinedLoss(cls_weight=1.0, reg_weight=0.5)
total_loss, loss_dict = criterion(cls_pred, cls_true, reg_pred, reg_true)
print(f"Total Loss: {total_loss:.4f}, 详情: {loss_dict}")
```

### 编写自定义损失函数的注意事项

| 要点 | 说明 |
|------|------|
| **保持可微性** | 所有运算必须使用 PyTorch 的张量操作（`torch.xxx`），不要用 NumPy 或纯 Python 操作 |
| **数值稳定性** | 涉及 `log`、`exp` 时使用 `torch.clamp()` 防溢出；交叉熵类用 `log_softmax` 而非 `softmax` + `log` |
| **reduction 参数** | 保持和 PyTorch 内置一致的 `'mean'` / `'sum'` / `'none'` 约定 |
| **设备一致性** | 涉及自定义参数时，用 `.to(device)` 或 `register_buffer` 确保参数和输入数据在同一设备 |
| **慎用原地操作** | 损失函数内慎用 `x += ...` 等原地操作：若被原地修改的张量恰好是反向传播需要的已保存张量，backward 时会报 RuntimeError；对 requires_grad 的叶子张量做原地操作则会立刻报错 |

---

## 自定义全连接层

### 为什么要自定义层？

| 场景 | 举例 |
|------|------|
| **学习原理** | 手写一个 `Linear` 层，理解 `nn.Linear` 内部怎么工作的 |
| **特殊初始化** | 需要一个全部权重为正数、且每行和为 1 的层 |
| **特殊结构** | 需要一个"权重共享"的层，或部分连接（非全连接）的层 |
| **添加噪声** | 前向传播时给权重或激活值加可控制的噪声（Dropout 的变体等） |
| **自定义正则** | 在前向过程中记录某些值，用于后面加额外的正则化损失 |

### 基础模板：继承 nn.Module

所有自定义层都遵循同一个模板：

```python
import torch
import torch.nn as nn

class MyCustomLayer(nn.Module):
    def __init__(self, ...):
        super().__init__()
        # 1. 定义可学习参数（nn.Parameter）或子模块
        ...

    def forward(self, x):
        # 2. 定义前向传播逻辑
        ...
        return output
```

> **关键规则**：
> - 可学习参数必须用 `nn.Parameter` 包装，否则优化器看不到它
> - 所有运算必须写在 `forward` 里（或它调用的方法里）
> - `__init__` 只定义结构，不做计算

### 从零手写 Linear 层

这是理解全连接层的最佳方式——用 `nn.Parameter` 手动实现 `y = xW^T + b`。

```python
import torch
import torch.nn as nn

class MyLinear(nn.Module):
    """
    手写全连接层，等价于 nn.Linear(in_features, out_features)。

    前向公式：y = x @ W^T + b
    其中 x: (N, in_features), W: (out_features, in_features), b: (out_features,)
    输出 y: (N, out_features)
    """
    def __init__(self, in_features, out_features, bias=True):
        super().__init__()
        # 1. 定义权重矩阵 W
        # 形状 (out_features, in_features)：每一行是一个输出神经元的权重向量
        self.weight = nn.Parameter(torch.randn(out_features, in_features) * 0.01)

        # 2. 定义偏置 b
        if bias:
            self.bias = nn.Parameter(torch.zeros(out_features))
        else:
            # 不需要偏置时，注册为 None，forward 中判断
            self.register_parameter('bias', None)

        # 3. 手动做 He 初始化（适用于后接 ReLU 的层）
        self.reset_parameters()

    def reset_parameters(self):
        # He (Kaiming) 初始化：权重方差 = 2 / fan_in
        nn.init.kaiming_uniform_(self.weight, a=0, mode='fan_in', nonlinearity='relu')
        if self.bias is not None:
            # 偏置通常初始化为 0，但也可以用一个小常数
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

# ===== 验证：和 nn.Linear 输出一致 =====
batch_size = 4
in_dim, out_dim = 3, 5
x = torch.randn(batch_size, in_dim)

# 用相同权重测试
my_layer = MyLinear(in_dim, out_dim)
official_layer = nn.Linear(in_dim, out_dim)

# 复制权重
with torch.no_grad():
    official_layer.weight.copy_(my_layer.weight)
    official_layer.bias.copy_(my_layer.bias)

y_my = my_layer(x)
y_official = official_layer(x)

print("手写 Linear 输出:\n", y_my)
print("\nnn.Linear 输出:\n", y_official)
print(f"\n最大差异: {(y_my - y_official).abs().max().item():.10f}")  # 应为 0 或极小
```

> **`nn.Parameter` vs `torch.tensor`**：
> ```python
> # ✅ 正确：w 会被优化器跟踪和更新
> w = nn.Parameter(torch.randn(5, 3))
>
> # ❌ 错误：w 只是一个普通 tensor，优化器不认它
> w = torch.randn(5, 3)
>
> # 判断：看看有没有出现在 model.parameters() 里
> for name, param in model.named_parameters():
>     print(name)  # 只列出 nn.Parameter，普通 tensor 不会出现
> ```

### 进阶：带激活函数的自定义层

把全连接 + 激活 + Dropout 打包成一个"积木块"，方便重复使用：

```python
import torch
import torch.nn as nn

class MyDenseBlock(nn.Module):
    """
    全连接 + BatchNorm + 激活 + Dropout 的组合块。
    这是实际项目中最常用的模式。
    """
    def __init__(self, in_features, out_features,
                 activation='relu', dropout=0.0, use_bn=True):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)

        # BatchNorm 需要知道特征数
        self.bn = nn.BatchNorm1d(out_features) if use_bn else nn.Identity()

        # 激活函数字典
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

# 快速搭建网络
model = nn.Sequential(
    MyDenseBlock(784, 256, activation='relu', dropout=0.3),
    MyDenseBlock(256, 128, activation='relu', dropout=0.3),
    MyDenseBlock(128, 10,  activation='none', use_bn=False),  # 最后一层不加激活
)
print(model)

x = torch.randn(32, 784)
y = model(x)
print(f"输入形状: (32, 784) → 输出形状: {y.shape}")  # (32, 10)
```

### 实战：带约束的全连接层（权重非负 + 行归一化）

某些场景（如注意力机制、NMF 分解）需要权重满足特定约束：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class NonNegativeLinear(nn.Module):
    """
    权重永远为非负数的全连接层。
    实现方式：实际存储 W_raw，forward 时用 softplus 或 exp 确保 W >= 0。

    为什么不用 clamp？clamp(min=0) 在整个被截断区域（W_raw < 0 的负半轴）梯度为 0，
    负的原始权重会因梯度恒为 0 而永远卡死在 0。
    softplus 处处可导，更适合梯度下降。
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        # 存储原始权重（可以为负），forward 时变换为非负
        self.weight_raw = nn.Parameter(torch.randn(out_features, in_features))
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x):
        # softplus(x) = log(1 + e^x)，输出始终 > 0，且处处可导
        weight = F.softplus(self.weight_raw)
        return F.linear(x, weight, self.bias)

class RowNormalizedLinear(nn.Module):
    """
    每行权重和为 1 的全连接层（权重可视为"概率分布"）。
    实现方式：对每行做 softmax，确保 sum(W[i, :]) = 1。
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        self.weight_raw = nn.Parameter(torch.randn(out_features, in_features))
        self.bias = nn.Parameter(torch.zeros(out_features))

    def forward(self, x):
        # 对每行做 softmax，确保和为 1
        weight = F.softmax(self.weight_raw, dim=1)  # dim=1 → 按行归一化
        return F.linear(x, weight, self.bias)

# 验证行归一化
layer = RowNormalizedLinear(4, 3)
print("权重每行之和:", layer.weight_raw.softmax(dim=1).sum(dim=1))
# 输出: tensor([1., 1., 1.])
```

### 实战：带噪声注入的全连接层

```python
import torch
import torch.nn as nn

class NoisyLinear(nn.Module):
    """
    训练时给激活值加高斯噪声，推理时自动关闭。
    这是一种正则化手段（类似 Dropout 的变体），可以提升模型鲁棒性。

    参数:
        sigma: 噪声的标准差（相对于激活值的缩放因子）
    """
    def __init__(self, in_features, out_features, sigma=0.1):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features)
        self.sigma = sigma

    def forward(self, x):
        y = self.linear(x)
        if self.training:  # self.training 由 model.train() / model.eval() 控制
            # 训练时加噪声
            noise = torch.randn_like(y) * self.sigma * y.detach()
            y = y + noise
        return y

# 测试训练/推理模式的区别
layer = NoisyLinear(3, 4, sigma=0.5)
x = torch.ones(2, 3)

layer.train()  # 训练模式
y_train = layer(x)
print("训练模式输出:\n", y_train)

layer.eval()   # 推理模式
y_eval = layer(x)
print("\n推理模式输出:\n", y_eval)
```

---

## 自定义求导与反向传播

### 前置回顾：自动微分（Autograd）如何工作

在 PyTorch 中，每个张量操作都会被记录到**计算图**里。当你调用 `.backward()` 时，PyTorch 从输出反向遍历计算图，利用链式法则计算出每个 `requires_grad=True` 的张量的梯度。

```python
import torch

# 最简单的例子：y = x²，求 dy/dx
x = torch.tensor(3.0, requires_grad=True)
y = x ** 2          # y = 9
y.backward()        # 自动计算 dy/dx = 2x = 6
print(f"x.grad = {x.grad}")  # 输出: 6.0 ✓

# 计算图是什么样的？
#   x ──→ [pow(2)] ──→ y
# 前向时记录运算，反向时经过 [pow(2)] 乘上局部导数 2x
```

> **大多数情况下，你不需要手写 backward**。PyTorch 的 `+`、`*`、`@`、`torch.sin` 等操作都已经内置了反向传播规则。只有当你要实现一个**全新的、PyTorch 不支持的运算**时，才需要自定义 `autograd.Function`。

### 什么时候需要自定义 autograd.Function？

| 场景 | 举例 |
|------|------|
| 实现论文中提出的新算子 | 自定义的激活函数、归一化方法 |
| 需要手动优化梯度计算 | 用自己的数学技巧加速梯度计算（比自动合成的计算图更快） |
| 包含不可微操作 | 量化（四舍五入）、硬阈值——需要在 backward 中"近似"梯度 |
| 调用外部 C/CUDA 代码 | 自己写的 CUDA kernel，需要告诉 PyTorch 怎么算梯度 |

### 核心工具：torch.autograd.Function

继承 `torch.autograd.Function` 并实现两个静态方法：

| 方法 | 做什么 | 返回值 |
|------|--------|--------|
| `forward(ctx, ...)` | 前向计算 | 输出张量 |
| `backward(ctx, grad_output)` | 反向传播（计算梯度） | 每个输入的梯度（数量和 forward 的输入一致） |

`ctx` 是一个"穿梭箱"——`forward` 中可以往里面存东西（`ctx.save_for_backward(...)`），`backward` 中取出来用。

> **为什么用静态方法？** `torch.autograd.Function` 被设计为无状态——同一个 `Function` 可以在计算图中被多次调用，每次调用都是独立的，由 `ctx` 来保存此次调用的上下文。静态方法确保你不会误用实例变量。

### 手写 ReLU（理解 backward 如何工作）

虽然 PyTorch 已经有 `F.relu`，但手写一次能彻底理解 backward 的机制。

```python
import torch

class MyReLU(torch.autograd.Function):
    """
    自定义 ReLU：前向 = max(0, x)，反向 = grad_output * (x > 0)

    这是最简单的 backward 例子——前向输出等于输入时，梯度原样传回；
    前向输出被置零时，梯度也截断为 0。
    """

    @staticmethod
    def forward(ctx, x):
        # ctx.save_for_backward: 把前向的中间结果存起来，backward 时要用
        # 这里只需要知道"哪些位置 x > 0"，存 x 即可
        ctx.save_for_backward(x)
        # clamp(min=0) 就是 max(0, x)
        return x.clamp(min=0)

    @staticmethod
    def backward(ctx, grad_output):
        """
        grad_output: 后一层传来的梯度 ∂L/∂y（也就是 ∂L/∂(ReLU输出)）

        链式法则：∂L/∂x = ∂L/∂y · ∂y/∂x
                       = grad_output · (x > 0).float()
        """
        x, = ctx.saved_tensors           # 取出 forward 存的东西
        grad_input = grad_output.clone()  # 复制一份（好习惯：不修改 grad_output）
        grad_input[x <= 0] = 0            # x <= 0 的位置，梯度截断为 0
        return grad_input

# ===== 验证：和官方 ReLU 对比 =====
x = torch.randn(5, requires_grad=True)
# 需要用 .apply() 来调用自定义 Function
y_custom = MyReLU.apply(x)

# 官方 ReLU 作为对照
x2 = x.detach().clone().requires_grad_(True)
y_official = torch.relu(x2)

# 检查前向
print("自定义 ReLU:", y_custom)
print("官方 ReLU  :", y_official)
print("前向一致:", torch.allclose(y_custom, y_official))

# 检查反向
loss_custom = y_custom.sum()
loss_official = y_official.sum()
loss_custom.backward()
loss_official.backward()
print("梯度一致:", torch.allclose(x.grad, x2.grad))
```

> **grad_output 是什么？** 设当前层输出为 $y$，最终损失为 $L$。`backward` 收到的 `grad_output` 就是 $\frac{\partial L}{\partial y}$——**从后面的层传回来的梯度**。你要做的是用链式法则算出 $\frac{\partial L}{\partial x}$，即 `grad_output * ∂y/∂x`。

### 手写 Sigmoid（理解 ctx.save_for_backward 的用法）

```python
import torch

class MySigmoid(torch.autograd.Function):
    """
    自定义 Sigmoid: y = 1 / (1 + e^{-x})
    反向: ∂y/∂x = y * (1 - y) = sigmoid(x) * (1 - sigmoid(x))
    """

    @staticmethod
    def forward(ctx, x):
        # 1. 用 sigmoid(x) 的稳定计算方式
        #    直接用 1/(1+exp(-x)) 在 x 很大时 exp 会溢出
        #    稳定做法：x>=0 时用 1/(1+exp(-x))，x<0 时用 exp(x)/(1+exp(x))
        #
        #    实际上 PyTorch 的 torch.sigmoid 已经做了这个优化，这里演示原理
        output = torch.sigmoid(x)  # 生产环境直接用 torch.sigmoid

        # 2. backward 需要用到前向输出 y，存起来
        ctx.save_for_backward(output)
        return output

    @staticmethod
    def backward(ctx, grad_output):
        output, = ctx.saved_tensors
        # sigmoid 的导数: y * (1 - y)
        grad_sigmoid = output * (1 - output)
        # 链式法则: ∂L/∂x = ∂L/∂y * ∂y/∂x
        grad_input = grad_output * grad_sigmoid
        return grad_input

# ===== 验证 =====
x = torch.randn(5, requires_grad=True)
y = MySigmoid.apply(x)
print("前向输出:", y)
y.sum().backward()
print("梯度:", x.grad)
```

### 手写自定义运算：多项式变换

假设你发明了一个新的激活函数 $f(x) = x + x^2 + x^3$，PyTorch 没有内置：

```python
import torch

class PolyActivation(torch.autograd.Function):
    """
    前向: y = x + x² + x³
    反向: ∂y/∂x = 1 + 2x + 3x²
    """
    @staticmethod
    def forward(ctx, x):
        # 保存 x，backward 时需要
        ctx.save_for_backward(x)
        return x + x ** 2 + x ** 3

    @staticmethod
    def backward(ctx, grad_output):
        x, = ctx.saved_tensors
        # 局部导数: 1 + 2x + 3x²
        local_grad = 1 + 2 * x + 3 * x ** 2
        grad_input = grad_output * local_grad
        return grad_input

# ===== 验证 =====
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

### 进阶：自定义不可微运算的梯度近似

**量化**（Quantization）是一个典型例子——`round()` 函数的导数处处为 0（除了在跳变点不可导），但我们希望通过它来训练。做法是：**前向用硬 round，反向直通（Straight-Through Estimator, STE）**。

> **STE 的核心思想**：前向传播时按真实操作（不可导）计算输出，反向传播时假装这个操作不存在（导数为 1），让梯度"直通"过去。虽然梯度不精确，但在实践中效果出奇地好。

```python
import torch

class STEQuantize(torch.autograd.Function):
    """
    前向：四舍五入到最近的整数（不可导：导数几乎处处为 0）
    反向：直通估计器（STE）——假装四舍五入没发生，梯度不变

    用途：量化感知训练（QAT, Quantization-Aware Training）
    """
    @staticmethod
    def forward(ctx, x):
        # 真四舍五入
        return torch.round(x)

    @staticmethod
    def backward(ctx, grad_output):
        # 关键：STE — 梯度直接穿过，不做任何修改
        return grad_output.clone()

# 测试
x = torch.tensor([1.3, 2.7, 3.5], requires_grad=True)
y = STEQuantize.apply(x)
print("前向（量化后）:", y)  # [1., 3., 4.]

# 反向：即使前向是 round 后的值，梯度照常传
y.sum().backward()
print("梯度（STE直通）:", x.grad)  # [1., 1., 1.] — 梯度没有衰减！
```

### 实战：完整的自定义层（整合 Layer + Function）

把一个自定义激活函数包装成 `nn.Module`，方便在模型中使用：

```python
import torch
import torch.nn as nn

# 第一步：定义 autograd.Function（底层算子）
class SwishFunction(torch.autograd.Function):
    """
    Swish 激活函数: f(x) = x * sigmoid(βx)

    导数: f'(x) = sigmoid(βx) + β * x * sigmoid(βx) * (1 - sigmoid(βx))
         = β * f(x) + sigmoid(βx) * (1 - β * f(x))   （化简后；β=1 时退化为 f(x) + sigmoid(x)(1 - f(x))）

    Swish 由 Google Brain 提出（2017），在深层网络上有时优于 ReLU。
    它的特点是：非单调、平滑、有下界无上界。
    """
    @staticmethod
    def forward(ctx, x, beta):
        # beta 可能是 Python 数或张量（如 nn.Parameter），统一转成张量保存
        # 注意：save_for_backward 只能调用一次，重复调用会覆盖之前保存的内容
        beta_t = beta if torch.is_tensor(beta) else torch.tensor(float(beta))
        sigmoid_bx = torch.sigmoid(beta_t * x)
        output = x * sigmoid_bx
        ctx.save_for_backward(x, sigmoid_bx, beta_t)
        return output

    @staticmethod
    def backward(ctx, grad_output):
        x, sigmoid_bx, beta = ctx.saved_tensors
        # Swish 导数:
        # f(x) = x * sigmoid(βx)
        # ∂f/∂x = sigmoid(βx) + β * x * sigmoid(βx) * (1 - sigmoid(βx))
        #        = sigmoid(βx) + β * f(x) * (1 - sigmoid(βx))
        #        = β * f(x) + sigmoid(βx) * (1 - β * f(x))
        f_x = x * sigmoid_bx
        local_grad = sigmoid_bx + beta * f_x * (1 - sigmoid_bx)
        grad_input = grad_output * local_grad
        # ∂f/∂β = x² * sigmoid(βx) * (1 - sigmoid(βx))；beta 是标量，需对所有元素的梯度求和
        # 只有当 beta 是需要梯度的张量（如 nn.Parameter）时才计算并返回，否则返回 None
        grad_beta = None
        if ctx.needs_input_grad[1]:
            grad_beta = (grad_output * x * x * sigmoid_bx * (1 - sigmoid_bx)).sum()
        return grad_input, grad_beta

# 第二步：包装成 nn.Module（方便使用）
class Swish(nn.Module):
    def __init__(self, beta=1.0):
        super().__init__()
        # beta 为可学习参数：SwishFunction.backward 已返回对 beta 的梯度，训练中会被更新
        # 若想固定 beta，可改用 self.register_buffer('beta', torch.tensor(beta))
        self.beta = nn.Parameter(torch.tensor(beta))

    def forward(self, x):
        return SwishFunction.apply(x, self.beta)

# ===== 在模型中使用 =====
class SwishMLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 256)
        self.swish1 = Swish(beta=1.0)    # 和 nn.ReLU() 一样用！
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = self.fc1(x)
        x = self.swish1(x)
        x = self.fc2(x)
        return x

model = SwishMLP()
x = torch.randn(32, 784)
print(f"输出形状: {model(x).shape}")  # (32, 10)
```

### 自定义 backward 的重要注意事项

| 要点 | 说明 |
|------|------|
| **grad_output 不要原地修改** | 用 `grad_output.clone()` 创建副本再操作，否则会影响计算图中其他节点 |
| **返回值数量 = forward 输入数量** | `forward(ctx, a, b)` → `backward` 必须 `return grad_a, grad_b`。不需要梯度的返回 `None` |
| **ctx.save_for_backward 只存张量** | 不能存 list、dict 等。非张量值直接赋值给 `ctx.attr = value` |
| **避免不必要的自定义 Function** | 能用 PyTorch 内置操作组合出来的就不要手写 backward——内置的更快、更少 bug |
| **用 torch.autograd.gradcheck 验证** | PyTorch 提供了数值梯度校验工具，验证你的 backward 是否正确 |

### 用 gradcheck 验证自定义 backward

这是**必做的一步**——用数值微分验证你的 backward 实现是否正确。

```python
import torch

# 测试自定义 Function 的梯度是否正确
# gradcheck 会用数值微分（有限差分）和你写的 backward 做对比
x = torch.randn(5, dtype=torch.double, requires_grad=True)

# 测试 MyReLU（前面定义的）
# 注意：gradcheck 默认 raise_exception=True——梯度不匹配时会直接抛出 GradcheckError
# 而不是返回 False；想拿到布尔结果做 if 判断，需显式传 raise_exception=False
test_passed = torch.autograd.gradcheck(
    MyReLU.apply,   # 要测试的 Function
    (x,),            # 输入（元组形式）
    eps=1e-6,        # 数值微分的步长
    atol=1e-4,       # 允许的绝对误差
    raise_exception=False  # 失败时返回 False 而非抛异常
)
print(f"MyReLU gradcheck: {'✅ 通过' if test_passed else '❌ 失败'}")

# 测试 MySigmoid
test_passed = torch.autograd.gradcheck(MySigmoid.apply, (x,), eps=1e-6, atol=1e-4, raise_exception=False)
print(f"MySigmoid gradcheck: {'✅ 通过' if test_passed else '❌ 失败'}")

# 测试 PolyActivation
test_passed = torch.autograd.gradcheck(PolyActivation.apply, (x,), eps=1e-6, atol=1e-4, raise_exception=False)
print(f"PolyActivation gradcheck: {'✅ 通过' if test_passed else '❌ 失败'}")
```

> **gradcheck 原理**：数值微分用 $f'(x) \approx \frac{f(x+\epsilon)-f(x-\epsilon)}{2\epsilon}$ 近似计算导数，然后和你写的 `backward` 结果做比较。如果差异超过 `atol`，说明 `backward` 实现有 bug。

---

## 三者关系总结

### 一个完整例子：三者同时登场

假设你要实现论文中的 **Parametric Contrastive Loss + L2-Normalized Linear + 自定义梯度裁剪**。下面这段代码把三者串在一起，帮你看清它们各自的位置：

```python
import torch
import torch.nn as nn

# ═══════════════════════════════════════════════════════════
# 第 3 层（最底层）：自定义求导规则
# ═══════════════════════════════════════════════════════════
class GradientClipFunction(torch.autograd.Function):
    """
    自定义反向传播：梯度超过阈值的部分被裁掉。
    前向 = 恒等映射，反向 = 对梯度做裁剪。
    """
    @staticmethod
    def forward(ctx, x, threshold):
        ctx.threshold = threshold
        return x.clone()

    @staticmethod
    def backward(ctx, grad_output):
        # 对回传的梯度做裁剪，防止某一步梯度过大
        return torch.clamp(grad_output, -ctx.threshold, ctx.threshold), None

def grad_clip(x, threshold=1.0):
    return GradientClipFunction.apply(x, threshold)


# ═══════════════════════════════════════════════════════════
# 第 2 层（中间层）：自定义网络层
# ═══════════════════════════════════════════════════════════
class L2NormalizedLinear(nn.Module):
    """
    对输入和权重都做 L2 归一化后再做线性变换。
    等价于计算余弦相似度（乘一个可学习的缩放因子）。
    常用于人脸识别、度量学习等任务。
    """
    def __init__(self, in_features, out_features):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(out_features, in_features))
        self.scale = nn.Parameter(torch.tensor(10.0))  # 可学习的缩放因子

    def forward(self, x):
        # 对输入和权重做 L2 归一化
        x_norm = nn.functional.normalize(x, p=2, dim=1)
        w_norm = nn.functional.normalize(self.weight, p=2, dim=1)
        # 余弦相似度 × 缩放因子
        cosine = x_norm @ w_norm.T
        return cosine * self.scale


# ═══════════════════════════════════════════════════════════
# 第 1 层（最顶层）：自定义损失函数
# ═══════════════════════════════════════════════════════════
class ContrastiveLoss(nn.Module):
    """
    对比损失（Contrastive Loss）：
    - 同类样本对 (label=1)：拉近距离
    - 异类样本对 (label=0)：推开距离（至少 margin 远）
    """
    def __init__(self, margin=1.0):
        super().__init__()
        self.margin = margin

    def forward(self, x1, x2, label):
        # x1, x2: 两个样本的特征向量 (batch, dim)
        # label: 1 表示同类，0 表示异类
        dist_sq = (x1 - x2).pow(2).sum(dim=1)   # 欧氏距离的平方 d²
        dist = torch.sqrt(dist_sq + 1e-9)       # 欧氏距离 d（加 eps 防止 sqrt(0) 处梯度 NaN）
        # 标准 Contrastive Loss（Hadsell et al. 2006）：
        # L = y·d² + (1-y)·max(0, margin - d)²   —— hinge 里比较的是距离 d 本身，margin 的量纲是"距离"
        loss_pos = label * dist_sq
        loss_neg = (1 - label) * torch.clamp(self.margin - dist, min=0).pow(2)
        return (loss_pos + loss_neg).mean()


# ═══════════════════════════════════════════════════════════
# 组装：三者协同工作
# ═══════════════════════════════════════════════════════════
class SimpleContrastiveModel(nn.Module):
    def __init__(self, input_dim=128, embed_dim=64):
        super().__init__()
        self.encoder = nn.Sequential(
            L2NormalizedLinear(input_dim, embed_dim),  # ← 自定义层
        )
        self.criterion = ContrastiveLoss(margin=1.0)    # ← 自定义损失

    def forward(self, x1, x2, label):
        # 编码两个输入
        e1 = self.encoder(x1)
        e2 = self.encoder(x2)
        # 对编码结果做梯度裁剪（防止某对样本的梯度炸掉）
        e1 = grad_clip(e1, threshold=5.0)              # ← 自定义求导
        e2 = grad_clip(e2, threshold=5.0)
        # 计算对比损失
        loss = self.criterion(e1, e2, label)
        return loss


# 跑一遍看三者如何配合
model = SimpleContrastiveModel()
x1 = torch.randn(8, 128)
x2 = torch.randn(8, 128)
label = torch.randint(0, 2, (8,)).float()

loss = model(x1, x2, label)   # 前向：依次经过 自定义层 → 自定义求导 → 自定义损失
loss.backward()                # 反向：自定义求导的 backward 被自动调用，裁剪梯度
print(f"Contrastive Loss: {loss.item():.4f}")
```

### 三者的定位

想象你在**盖一栋楼**：

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

| 维度 | 自定义损失函数 | 自定义层 | 自定义求导 |
|------|:---:|:---:|:---:|
| **基类** | 函数 / `nn.Module` | `nn.Module` | `torch.autograd.Function` |
| **需要手写 backward？** | ❌ 不需要 | ❌ 不需要 | ✅ 需要 |
| **管理可学习参数？** | 极少 | ✅ 是（`nn.Parameter`） | ❌ 否（无状态） |
| **典型产出** | 一个标量（loss 值） | 一个张量（特征/激活） | 一个张量 + 它的梯度规则 |
| **出错后果** | 模型学偏（方向错了） | 前向报错或效果差 | 梯度算错，模型根本不收敛 |
| **调 bug 难度** | ⭐ 低 | ⭐⭐ 中 | ⭐⭐⭐ 高 |
| **使用频率** | ⭐⭐⭐ 极高 | ⭐⭐ 中 | ⭐ 低 |

### 一句话记住

> **损失函数**定义目标，**自定义层**搭建结构，**自定义求导**打通梯度——损失在顶层定方向，层在中层管结构，求导在底层管流通。三层各司其职，协同一体。
