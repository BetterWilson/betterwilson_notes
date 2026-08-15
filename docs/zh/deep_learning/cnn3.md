# 卷积神经网络CNN3

## 优化器

### 随机梯度下降--**SGD**优化器

**SGD原理：** 与传统的梯度下降（Batch Gradient Descent，每次用全部数据计算梯度）不同，**严格意义上的 SGD** 每次只使用一个样本来计算梯度，因此具有随机性。但在实际使用中，我们通常使用的是 **Mini-batch SGD**（小批量随机梯度下降），每次使用一小批样本（如 32 或 64 张图片）来计算梯度——既保留了随机性带来的泛化优势，又能利用 GPU 的并行计算能力。

**SGD公式：** $\theta_{t+1}=\theta_t-\eta \nabla_{\theta}J(\theta_t)$

- $\theta_t$是第$t$次迭代的参数
- $\eta$是学习率
- $\nabla_{\theta}J(\theta_t)$是损失函数对参数的梯度

**带动量的SGD公式：** $v_t=\gamma v_{t-1} + \eta \nabla_{\theta}J(\theta_t)$，$\theta_{t+1}=\theta_t - v_t$

- $v_t$是动量项
- $\gamma$是动量系数（通常设为0.9）
- 如果有了动量，错误方向上的梯度将会被抵消，会沿着最正确的方向更新梯度

> **补充：Nesterov 加速梯度（NAG，Nesterov Accelerated Gradient）**
>
> NAG 是动量方法的改进版。标准动量是"先在当前位置算梯度，再结合历史动量更新"；NAG 则是**先沿着动量方向"偷跑一步"，在"前瞻位置"算梯度**，相当于"看一眼前面的路况再调整步伐"：
>
> 标准动量：$v_t = \gamma v_{t-1} + \eta \nabla_{\theta}J(\theta_t)$，更新：$\theta_{t+1} = \theta_t - v_t$
>
> Nesterov：$v_t = \gamma v_{t-1} + \eta \nabla_{\theta}J(\theta_t - \gamma v_{t-1})$，更新：$\theta_{t+1} = \theta_t - v_t$
>
> 注意梯度是在 $\theta_t - \gamma v_{t-1}$（前瞻位置）计算的，而不是当前位置。这通常能让收敛更快、更稳定。PyTorch 中使用方法：`optim.SGD(params, lr=0.01, momentum=0.9, nesterov=True)`

#### SGD优化器的优缺点

- 优点：
  - 算法简单，易于实现，资源消耗较少
  - 动量（Momentum）等技巧可缓解优化陷入局部极值（鞍点）的风险，加速收敛（加速正确方向，抑制震荡方向）
  - 每迭代只用一个或少量样本，内存占用低，支持大规模训练
  - 能较好地处理在线学习和动态数据集
- 缺点：
  - 学习率调参敏感，初始学习率若设置不合适易造成训练不稳定或收敛缓慢
  - 每个参数采用相同学习率，不能自适应每一维度，稀疏特征学习效果不佳
  - 容易在鞍点或局部最优附近徘徊，收敛速度慢
  - 损失函数震荡大，更新不稳定，常需结合动量、学习率衰减等方法提升效果

### AdaGrad优化器（Adaptive Gradient 自适应梯度）

**调整学习率：** 学习率随着训练次数的增加越来越小

**AdaGrad公式：** $G_t=G_{t-1}+g_t^2$， $\theta_{t+1}=\theta_t-\frac{\eta}{\sqrt{G_t+\epsilon}} · g_t$

- $G_t$是梯度平方的累计和
- $g_t$是第$t$次迭代的梯度
- $\epsilon$是平滑项（防止分母为0，通常为1e-8）

#### AdaGrad算法特点

- **前期：** regularizer（分母）较小，放大梯度
- **后期：** regularizer（分母）较大，缩小梯度，梯度随训练次数降低

- 每个分量有不同的学习率

- **优点：** 相对简单易实现，适用于稀疏数据和非平稳目标函数

- **非平稳目标函数：** 目标函数的性质（如梯度、局部最小值、全局最小值等）会随时间或迭代次数发生变化。这种变化可能是由于数据分布的变化、模型参数的更新或其他外部因素引起的

- **缺点：** 初始学习率设置太大会导致 regularizer（分母）影响过于敏感；后期 regularizer（分母）累积值太大，容易提前结束训练；学习率衰减过快，难以选择合适的初始学习率

### RMSProp优化器

RMSProp全名Root Mean Square Propagation（自适应 均方根 梯度优化）方法，是一种基于梯度平方信息来自适应调整学习率的算法

与AdaGrad不同的是，它考虑了当前和之前一段时间内的梯度平方和的加权平均值，**并通过对梯度做指数加权移动平均来缓解累计梯度平方和带来的影响**

**RMSProp公式：** $E[g^2]_t=\beta E[g^2]_{t-1}+(1-\beta)g_t^2$，$\theta_{t+1}=\theta_t-\frac{\eta}{\sqrt{E[g^2]_t+\epsilon}} ·g_t$

- $E[g^2]_t$是梯度平方的指数移动平均
- $\beta$是衰减率（通常设置为0.9）
- $g_t$是第$t$次迭代的梯度
- $\epsilon$是平滑项（防止分母为0）

**优点：** 相对稳定，更适合处理非平稳和异方差问题。

> **补充：什么是"异方差"？** 在深度学习中，"异方差"指的是不同参数（或不同维度）的梯度在不同训练阶段的波动幅度不一致。比如有些参数的梯度一直很大，有些一直很小。RMSProp 通过为每个参数自适应调整学习率（梯度平方大的参数学习率自动变小），缓解了这种不平衡。

**缺点：** 可能会过度减小学习率。

### Adam优化器

Adam全名Adaptive Momentum Estimation（自适应动量）方法，是一种结合了Momentum和 RMSProp思想的算法。它既考虑了梯度的一阶矩估计（即梯度的指数移动平均），又考虑了梯度的二阶矩估计（即梯度平方的指数移动平均），并通过偏置校正来修正由于梯度估计不准确导致的偏差。

**核心思想：** 同时利用**动量法**（M，管方向）和**RMSProp**（R，管步长）

Adam的主要工作流程：

- **方向估计（动量法）：** 利用梯度的指数加权平均，$m_t=\beta_1m_{t-1}+(1-\beta_1)g_t$
- **步长估计（RMSProp思想）：** 利用梯度平方的指数加权平均，$v_t=\beta_2 v_{t-1}+(1-\beta_2)g_t^2$
- **参数更新：** 用动量分子、RMSProp分母的合体式，$\theta_{t+1}=\theta_t-\frac{\eta \cdot \hat{m_t}}{\sqrt{\hat{v_t}}+\epsilon}$
- **要注意两个$\beta$：** $\beta_1$用于一阶矩（动量），$\beta_2$用于二阶矩（方差），不是一个参数

**为什么Adam更新初始时不准？要偏差修正！**

默认$m_0=0,v_0=0$，第一步算出的$m_1$其权重大部分其实还在"0"，导致数值偏小，不反映实际梯度

**原因：** 加权平均在初始阶段偏向0，需要校正（偏差修正Bias Correction）

**修正方法：** 每次将$m_t,v_t$分别除以$(1-\beta_1^t),(1-\beta_2^t)$，还原实际量级

所以 Adam 的偏差修正推导与意义——真正原因在于初始化0，前期权重的偏置

**Adam公式：** $m_t=\beta_1m_{t-1}+(1-\beta_1)g_t$，$v_t=\beta_2 v_{t-1}+(1-\beta_2)g_t^2$，$\hat{m_t}=\frac{m_t}{1-\beta_1^t}$，$\hat{v_t}=\frac{v_t}{1-\beta_2^t}$，$\theta_{t+1}=\theta_t-\frac{\eta \cdot \hat{m_t}}{\sqrt{\hat{v_t}}+\epsilon}$

- $m_t$是梯度的一阶矩估计（动量项）
- $v_t$是梯度的二阶矩估计（梯度平方的移动平均项）
- $\hat{m_t}$和$\hat{v_t}$是偏置校正后的估计
- $\beta_1$和$\beta_2$是指数衰减率（通常$\beta_1=0.9$，$\beta_2=0.999$）
- $t$是时间步

> **补充：Adam 偏差修正的直观验证**
>
> 假设每步梯度恒为 1，$\beta_1=0.9$，来看看前几步 $m_t$ 的变化：
>
> | 步数 t | 原始 $m_t$ | 修正后 $\hat{m}_t$ | 真实期望 |
> |--------|-----------|-------------------|---------|
> | 1 | 0.100 | 1.000 | 1.0 |
> | 2 | 0.190 | 1.000 | 1.0 |
> | 3 | 0.271 | 1.000 | 1.0 |
> | 5 | 0.410 | 1.000 | 1.0 |
> | 10 | 0.651 | 1.000 | 1.0 |
>
> 原始 $m_t$ 在前几步被严重"缩水"，除以 $1-\beta_1^t$ 后立即恢复到真实期望值。

**优点：** 在训练的初期和中期能够快速收敛，同时也具有一定的鲁棒性

**缺点：** 需要进行大量的超参数调整，否则可能会导致性能下降

#### AdamW

**AdamW公式：** $m_t=\beta_1m_{t-1}+(1-\beta_1)g_t$，$v_t=\beta_2 v_{t-1}+(1-\beta_2)g_t^2$，$\hat{m_t}=\frac{m_t}{1-\beta_1^t}$，$\hat{v_t}=\frac{v_t}{1-\beta_2^t}$，$\theta_{t+1}=\theta_t-\eta (\frac{\hat{m_t}}{\sqrt{\hat{v_t}}+\epsilon}+\lambda \theta_t)$

- $\lambda$是权重衰减系数（weight decay）
- $\lambda \theta_t$是**解耦的权重衰减项**（注意：在 Adam 等自适应优化器中，它与传统 L2 正则化**不等价**）
- 其余参数与Adam相同

**AdamW与Adam的区别：**  AdamW将权重衰减从梯度计算中分离出来，直接应用于参数更新，这样可以更好地控制正则化效果。

> **关键理解：为什么 AdamW 要把 weight decay "解耦"出来？**
>
> 在传统 Adam 中，如果把 L2 正则化加在损失函数里（$L_{total} = L_{original} + \frac{\lambda}{2}\|\theta\|^2$），梯度变为 $g_t = \nabla L_{original} + \lambda\theta_t$。这个梯度进入 Adam 后，Adam 会按**梯度平方的移动平均 $\sqrt{\hat{v}_t}$** 来缩放更新步长——这意味着每个参数被衰减的力度不一样，L2 正则化的效果被"扭曲"了。
>
> AdamW 的做法是：**把 $\lambda\theta_t$ 直接从梯度中拿掉**，在参数更新时单独减去 $\eta\lambda\theta_t$。这样所有参数以统一速率衰减，正则化效果更好、更可控。实验证明 AdamW 的泛化性能通常优于 Adam + L2 正则化。
>
> **一句话区分**：SGD 中 weight decay = L2 正则化（等价）；Adam 中 weight decay ≠ L2 正则化（所以需要 AdamW）。

#### weight_decay

weight_decay是一种正则化技术，用于防止神经网络过拟合。它通过在优化过程中对权重施加惩罚来限制权重的大小，从而使模型更加简单和平滑

**L2正则化损失函数：** $L_{total}=L_{original}+\frac{\lambda}{2} \sum_i \theta_i^2$

- $L_{original}$是原始损失函数
- $\lambda$是权重衰减系数（weight decay coefficient）
- $\theta_i$是模型的第$i$个参数

**权重更新公式：** 对于每一个模型参数$\theta$，weight_decay的梯度计算：
$$
\frac{\partial L_{total}}{\partial \theta}=\frac{\partial L_{original}}{\partial \theta}+\lambda \theta
$$

**在SGD优化器中的参数更新：** 在PyTorch中，当使用`torch.optim.SGD`优化器时，`weight_decay`会在每次参数更新时按以下公式计算：
$$
\theta_{t+1}=\theta_{t}-\eta(\frac{\partial L_{original}}{\partial \theta_t} + \lambda \theta_t)
$$

- $\theta_t$是第$t$次迭代的参数值
- $\eta$是学习率
- $\frac{\partial L_{original}}{\partial \theta_t}$是原始损失函数对参数的梯度
- $\lambda$是权重衰减系数
- $\lambda \theta_t$是L2正则化项

**在Adam优化器中的应用：** 在Adam等自适应优化器中，权重衰减通常有两种实现方式：

- **L2正则化方式（传统Adam）：** 将权重衰减项加入到梯度中，$g_t=\nabla L_{original}(\theta_{t-1})+\lambda\theta_{t-1}$
- **解耦权重衰减方式（AdamW)：** 直接在参数更新时应用权重衰减，$\theta_t=\theta_{t-1}-\eta(\frac{\hat{m}_t}{\sqrt{\hat{v}_t}+\epsilon}+\lambda \theta_{t-1})$

权重衰减系数的选择：

- 常用值范围：1e-5 到 1e-2

- 较小的值（如1e-5）适用于预训练模型的微调
- 较大的值（如1e-2）适用于从头开始训练的模型
- 需要通过验证集性能来调优确定最佳值

---

## 优化器代码示例：直观感受不同优化器的行为

```python
import torch
import torch.optim as optim
import matplotlib.pyplot as plt

# 用一个简单的二次函数 f(w)=w² 来直观感受不同优化器的收敛行为
# 目标：从 w=3 出发，找到最小值 w=0

def demo_optimizer(optimizer_name, lr=0.1, epochs=20):
    """演示不同优化器在 f(w)=w² 上的收敛轨迹"""
    w = torch.tensor([3.0], requires_grad=True)  # 从 w=3 开始
    w_history = []

    if optimizer_name == "SGD":
        opt = optim.SGD([w], lr=lr)
    elif optimizer_name == "SGD_Momentum":
        opt = optim.SGD([w], lr=lr, momentum=0.9)
    elif optimizer_name == "SGD_NAG":
        opt = optim.SGD([w], lr=lr, momentum=0.9, nesterov=True)
    elif optimizer_name == "AdaGrad":
        opt = optim.Adagrad([w], lr=lr)
    elif optimizer_name == "RMSProp":
        opt = optim.RMSprop([w], lr=lr)
    elif optimizer_name == "Adam":
        opt = optim.Adam([w], lr=lr)

    for _ in range(epochs):
        opt.zero_grad()
        loss = w ** 2          # 目标函数 f(w) = w²
        loss.backward()
        opt.step()
        w_history.append(w.item())

    return w_history

# 对比所有优化器
plt.figure(figsize=(12, 6))
for name in ["SGD", "SGD_Momentum", "SGD_NAG", "AdaGrad", "RMSProp", "Adam"]:
    hist = demo_optimizer(name, lr=0.3)
    plt.plot(hist, label=name, marker='.', markersize=4)

plt.axhline(y=0, color='gray', linestyle='--', alpha=0.5)  # 最优解 w=0
plt.xlabel("迭代次数 (Iteration)")
plt.ylabel("参数 w 的值")
plt.title("不同优化器在 f(w)=w² 上的收敛对比（初始 w=3）")
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# 观察结论：
# - 普通 SGD 震荡明显，缓慢逼近最优解
# - SGD+Momentum 利用历史梯度抵消震荡、加速正确方向
# - SGD+NAG（Nesterov）在动量基础上"提前看一眼"，收敛更平稳
# - AdaGrad 后期学习率衰减太快，还没到最优解就几乎不动了
# - RMSProp 使用指数移动平均避免了 AdaGrad 的学习率过快衰减问题
# - Adam 结合动量 + 自适应学习率 + 偏差修正，收敛最快
```

---

## 优化器对比

![image-20260725161044326](assets/image-20260725161044326.png)

### Adagrad（Adaptive Gradient Algorithm）：

- **适用场景：** 适合处理稀疏数据和具有不同尺度的特征的问题。由于Adagrad可以根据每个参数的历史梯度调整学习率，它在处理具有不同尺度特征的问题时更具优势。对于很多NLP任务，如自然语言处理，输入数据通常是稀疏的，Adagrad也表现良好。

- **注意事项：** Adagrad在训练过程中会累积梯度的平方，导致学习率逐渐减小。这可能会导致后期的学习率过小，导致学习速度减慢。因此，在一些问题中，Adagrad可能不太适合。

### RMSprop（Root Mean Square Propagation）：

- **适用场景：** 适合处理非平稳和具有不同尺度特征的问题。RMSprop通过采用指数加权平均来平衡学习率，从而有效地处理非平稳问题。它也可以缓解Adagrad学习率过快减小的问题。

- **注意事项：** RMSprop在某些情况下仍然可能遭受学习率逐渐减小的问题，尤其是在长时间的训练中。因此，尽管RMSprop在很多情况下表现良好，但在一些问题上可能还需要进一步调优。

### Adam（Adaptive Moment Estimation）：

- **适用场景：** Adam综合了Momentum和RMSprop的优点，适用于大多数深度学习任务。 Adam在处理大规模训练数据和高维特征空间的问题时表现优异，通常是一种可靠且高效的优化器选择。

- **注意事项：** 尽管Adam在很多问题上表现良好，但在某些情况下，它可能对超参数敏感。需要仔细调整学习率、动量和指数衰减率等超参数，以获得最佳性能。

总体来说，对于大多数深度学习问题，Adam是一个不错的默认选择，因为它通常能在训练过程中自适应地调整学习率，并对不同类型的问题表现良好。然而，对于一些特殊的问题，如稀疏数据或非平稳问题，Adagrad和RMSprop可能会更适合。最终，选择哪个优化器应该基于具体问题和实验结果来做出决策。

## 学习率自适应（学习率图）

K是一个系数，t是迭代次数（**注意：t 是 iteration（迭代次数），不是 epoch！** 一个 epoch 包含多次 iteration。例如 10000 张训练图片、batch_size=64，则 1 个 epoch ≈ 157 次 iteration）。学习率调度通常按 iteration 来调整，因为每一步参数更新（iteration）后都可以改变学习率。

![image-20260725170126307](assets/image-20260725170126307.png)

### 经验

- 对于稀疏数据，使用学习率可自适应方法

- SGD通常训练时间更长，最终效果比较好，但需要好的初始化和learning rate

- 需要训练较深较复杂的网络且需要快速收敛时，推荐使用Adam，设定一个比较小的learning rate值

- Adagrad、RMSprop、Adam是比较相近的算法，在相似的情况下表现差不多

### 学习率调整建议

学习率是深度学习中一个重要的超参数，它控制着模型参数在每一次迭代中的更新幅度。学习率设置合适与否对模型的训练和性能影响很大。然而，合适的学习率并没有一个固定的数值，它取决于许多因素，包括数据集、模型复杂度、优化算法等。

**初始设定：** 通常，初始学习率可以设置为较小的值，例如0.001或0.01。对于预训练模型，可以使用更小的学习率，因为模型参数已经相对接近较好的解。（借助AI来问初始学习率）

**学习率调度（Learning Rate Scheduling）：** 学习率调度可以帮助模型在训练过程中动态地调整学习率。例如，随着训练的进行，可以逐渐降低学习率，以便在接近收敛时更加稳定地优化模型。常见的学习率调度方法包括Step Decay、Exponential Decay和Cosine Annealing等。

> **三种常见学习率调度策略详解：**
>
> | 策略 | 行为 | 公式 | 适用场景 |
> |------|------|------|----------|
> | **StepLR** | 每隔 N 步，lr × gamma | $lr = lr_0 \times \gamma^{\lfloor t / N \rfloor}$ | 最简单常用，如每 30 epoch 减半 |
> | **ExponentialLR** | 每步 lr × gamma | $lr = lr_0 \times \gamma^t$ | 平滑连续衰减 |
> | **CosineAnnealingLR** | 按余弦曲线降到最低 | $lr = lr_{min} + \frac{1}{2}(lr_0 - lr_{min})(1 + \cos(\frac{t}{T_{max}}\pi))$ | SOTA 训练常用，如 ResNet、EfficientNet |
>
> ```python
> import torch.optim as optim
> import torch.optim.lr_scheduler as lr_scheduler
> import matplotlib.pyplot as plt
>
> # 模拟三种学习率调度策略的曲线
> model_params = [torch.nn.Parameter(torch.tensor([0.0]))]  # 虚拟参数
>
> schedulers_config = {
>     "StepLR (每30步×0.5)": lambda opt: lr_scheduler.StepLR(opt, step_size=30, gamma=0.5),
>     "ExponentialLR (γ=0.95)": lambda opt: lr_scheduler.ExponentialLR(opt, gamma=0.95),
>     "CosineAnnealing (T_max=100)": lambda opt: lr_scheduler.CosineAnnealingLR(opt, T_max=100),
> }
>
> plt.figure(figsize=(10, 5))
> for name, sched_fn in schedulers_config.items():
>     opt = optim.SGD(model_params, lr=0.1)
>     sched = sched_fn(opt)
>     lrs = []
>     for _ in range(100):
>         lrs.append(opt.param_groups[0]['lr'])
>         sched.step()
>     plt.plot(lrs, label=name)
>
> plt.xlabel("迭代次数 (Iteration)")
> plt.ylabel("学习率")
> plt.title("三种学习率调度策略对比")
> plt.legend()
> plt.grid(True, alpha=0.3)
> plt.show()
> ```

**学习率范围测试（Learning Rate Range Test）：** 这是一种试探性的方法，通过在较大范围内增加学习率来观察损失函数值的变化，从而找到一个合适的学习率范围。然后，可以在找到的学习率范围内进行进一步的训练。

**试错法：** 尝试不同的学习率，并观察模型在验证集上的性能。如果学习率过小，模型收敛速度会很慢；如果学习率过大，可能会导致模型发散。通过多次试验，找到一个在训练过程中收敛较快并且在验证集上表现较好的学习率。

**使用自适应学习率方法：** 一些自适应学习率优化算法（如Adam、Adagrad、RMSprop等）可以自动调整学习率，根据参数的历史梯度信息来更新学习率。这些算法通常能够在不同任务和数据集上表现较好，减轻了手动调节学习率的工作。

## 网络初始化（w和b）

### 如何分析初始化结果好不好？

卷积神经网络中的kernel（卷积核）初始化方式可以影响每一层的激活分布，进而影响整个网络的性能。不同的kernel初始化方式可能会导致不同的样本分布，因此观察样本分布可以帮助我们选择合适的初始化策略。

具体来说，当使用随机初始化的卷积核时，如果权重初始化得太小，那么将难以通过较浅的网络学习到复杂的特征，也就是所谓的"梯度消失"问题。但是，如果权重初始化得太大，则可能会导致数值不稳定和错误的收敛。为了避免这些问题，通常会使用一些先进的卷积核初始化方法，如Xavier Initialization（Glorot）或He Initialization。

在实践中，我们可以通过观察激活分布的标准差和均值来评估kernel初始化的效果，并确定是否需要调整初始化策略。例如，在网络训练过程中，如果发现激活分布的方差和平均值发生剧烈变化，那么就意味着当前的kernel初始化方式可能存在问题，需要考虑更改初始化策略或者增加正则化项来提高模型的稳定性。

**查看初始化后各层的激活值分布：** 激活值就是经过激活函数后的值（就是样本值），如果分布是固定的在[-1,1]，或者[0,1]之间，那没问题，如果集中在某一个值，那就不太好。

> **两种最重要的初始化方法（公式与代码）：**
>
> | 初始化方法 | 适用激活函数 | 权重采样分布 | 核心思想 |
> |-----------|-------------|-------------|----------|
> | **Xavier（Glorot）** | Sigmoid, Tanh | $W \sim \mathcal{N}(0, \frac{2}{n_{in} + n_{out}})$ | 同时考虑前向和反向传播，取输入输出神经元数的调和平均 |
> | **He（Kaiming）** | ReLU, LeakyReLU | $W \sim \mathcal{N}(0, \frac{2}{n_{in}})$ | ReLU 会"杀死"一半神经元，方差需×2补偿；只考虑前向 |
>
> 其中 $n_{in}$ = 输入神经元数，$n_{out}$ = 输出神经元数。
>
> ```python
> import torch
> import torch.nn as nn
>
> # 体会不同初始化对激活值分布的影响
> def check_init(init_name, n_layers=10, n_neurons=500):
>     """模拟多层网络前向传播，观察不同初始化下激活值标准差的变化"""
>     x = torch.randn(1000, n_neurons)  # 1000 个样本
>
>     for i in range(n_layers):
>         W = torch.randn(n_neurons, n_neurons)
>         if init_name == "Xavier":
>             W *= (2.0 / (n_neurons + n_neurons)) ** 0.5   # std = sqrt(2/(nin+nout))
>         elif init_name == "He":
>             W *= (2.0 / n_neurons) ** 0.5                  # std = sqrt(2/nin)
>         elif init_name == "Bad_Small":
>             W *= 0.01                                       # 太小 → 梯度消失
>         elif init_name == "Bad_Large":
>             W *= 1.0                                        # 太大 → 梯度爆炸
>
>         x = x @ W  # 线性变换（模拟无激活函数时的传播）
>
>     print(f"{init_name:12s}: 最终输出标准差 = {x.std().item():.4f}")
>
> for method in ["Xavier", "He", "Bad_Small", "Bad_Large"]:
>     check_init(method)
> # 输出示例:
> # Xavier      : 最终输出标准差 ≈ 1.0（稳定！）
> # He          : 最终输出标准差 ≈ 1.0（稳定！）
> # Bad_Small   : 最终输出标准差 ≈ 0.0000（消失！）
> # Bad_Large   : 最终输出标准差 ≈ 10^15（爆炸！）
>
> # PyTorch 中的实际用法：
> conv = nn.Conv2d(64, 128, kernel_size=3)
> nn.init.kaiming_normal_(conv.weight, mode='fan_out', nonlinearity='relu')  # He 初始化
> # 或
> nn.init.xavier_normal_(conv.weight)  # Xavier 初始化
> ```

### 初始化方式不好，怎么办？

**每个batch在每一层上都做归一化**

这就是 **Batch Normalization（BN，批归一化）** 的核心思想。BN 在训练时对每个 mini-batch 的数据做标准化（减均值、除标准差），然后通过可学习的参数 $\gamma$（缩放）和 $\beta$（平移）恢复网络的表达能力。详细推导见 `神经网络概念.md` 中"归一化与批归一化"章节。

为什么很早没有人去做这个事呢？因为当数据量很大时，因为是在每个batch上去做归一化，每一个batch并不能反映整体数据的分布，对每一个样本提取出来一个特征，在batch与batch之间不能区分出特征的样本了，因此又加入了逆归一化，当归一化不起作用时，去除归一化。

为了确保归一化能够起到作用，另设两个参数来逆归一化，通过$\gamma$和$\beta$来做逆归一化。

> **BN 的四个步骤（简要）：**
> 1. 计算 batch 均值：$\mu_B = \frac{1}{m}\sum x_i$
> 2. 计算 batch 方差：$\sigma_B^2 = \frac{1}{m}\sum (x_i - \mu_B)^2$
> 3. 标准化：$\hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}$
> 4. 缩放平移：$y_i = \gamma \hat{x}_i + \beta$
>
> $\gamma$ 和 $\beta$ 是可学习参数——如果标准化后的分布就是最优的，网络可以学出 $\gamma\approx1, \beta\approx0$；如果需要恢复到原始分布，网络也能学回去（$\gamma=\sigma, \beta=\mu$）。这就是"逆归一化"的真正含义。

## 常见问题

![image-20260725173513982](assets/image-20260725173513982.png)

- **第一个图（损失剧烈震荡）：** 原因可能是学习率过大，导致参数更新步长太大，在最优解附近来回跳跃而无法收敛。解决方法：降低学习率。

- **第二个图（验证损失开始上升）：** 有一些过拟合。训练损失持续下降但验证损失在后期开始上升——模型开始"背诵"训练数据而非学习通用规律。解决方法：增加 Dropout、weight_decay、数据增强，或使用早停（Early Stopping）。

- **第三个图（训练和验证严重分离）：** 过拟合很明显。训练损失很低但验证损失很高且持续上升，两条曲线严重分叉。解决方法同上，且程度需要更大。

- **第四个图（两曲线缓慢下降、趋势一致）：** 学习率偏小，模型学得太慢，但方向是正确的（没有过拟合迹象）。可以**适当增大学习率**，同时继续训练更多 epoch，两条曲线都还有下降空间。

- **第五个图（前期几乎不动、后期开始下降）：** 没有初始化好 w（模型的激活函数），导致一开始训练比较慢。可能是权重初始化不当，或者激活函数选择不合适（如 Sigmoid 在深层网络中的梯度消失），使得前期梯度非常小，参数更新几乎没有效果。

- **第六个图（损失不降反升）：** 梯度加错方向了，优化目标设成了相反值。例如损失函数取了负号，或者梯度上升代替了梯度下降。检查损失函数定义和优化器的更新方向。

---

## 优化器选择速查指南

```
你要训练什么模型？
├── 传统 CNN / MLP（图像分类等）
│   ├── 追求最佳效果、有调参经验 → SGD + Momentum + CosineAnnealing
│   ├── 快速原型验证、懒得调参 → Adam / AdamW（默认推荐）
│   └── 数据稀疏（如 NLP 词向量）→ AdaGrad / Adam
├── Transformer / 大语言模型 → AdamW（标配，weight_decay=0.01~0.1）
├── GAN / 生成对抗网络 → Adam（β₁=0.5, β₂=0.999）
├── 强化学习 → Adam / RMSProp
└── 需要极致收敛精度（打比赛）→ SGD + Momentum + 精心调参的学习率衰减
```

**一句话总结**：不知道该用什么的时候，**先用 Adam/AdamW 跑起来**。它收敛快、对超参数不敏感，适合快速迭代。等 baseline 稳定了，如果想榨干最后一点性能，再换 SGD + Momentum 精调。

## 精调示例

```python
# ============================================================================
# CIFAR-10 VGG11 图像分类完整流程
# 包含：数据加载 → 模型定义 → 训练器 → 训练 → 精调(Fine-tuning)
# ============================================================================

# ============================================================================
# 第一部分：导入必要的库
# ============================================================================
import torch  # 导入 PyTorch 深度学习框架核心库
import torch.nn as nn  # 导入神经网络模块（Conv2d、Linear、ReLU 等层）
import torch.optim  # 导入优化器模块（Adam、SGD 等参数更新算法）
from torch.utils.data import Dataset  # 导入 Dataset 基类，用于自定义数据集
from torch.utils.data import DataLoader  # 导入 DataLoader，用于批量加载和打乱数据
import torchvision.transforms as transforms  # 导入 transforms 模块，用于图像预处理和数据增强
from torch.utils.tensorboard import SummaryWriter  # 导入 SummaryWriter，用于写 TensorBoard 日志
from PIL import Image  # 导入 PIL 图像库，用于读取 PNG/JPG 图片文件
import pandas as pd  # 导入 pandas，用于读取和处理 CSV 标签文件
import matplotlib.pyplot as plt  # 导入 matplotlib，用于绘制训练损失和准确率曲线
import os  # 导入 os 模块，用于文件和目录操作（创建文件夹、检查文件是否存在）

# ============================================================================
# 第二部分：定义数据预处理管道（图像增强 + 归一化）
# ============================================================================

# --- 训练集数据预处理：包含图像增强，提高模型泛化能力 ---
train_transform = transforms.Compose([  # Compose 将多个变换操作按顺序组合成一个管道
    transforms.Resize((32, 32)),  # 将所有图片统一缩放到 32×32 像素（CIFAR-10 的标准输入尺寸）
    transforms.ToTensor(),  # 将 PIL Image（值域 0~255）转为 torch.Tensor（值域 0.0~1.0），维度 H×W×C → C×H×W
    transforms.RandomRotation(40),  # 随机旋转图像，最大旋转角度 ±40 度（数据增强，模拟不同拍摄角度）
    transforms.RandomHorizontalFlip(),  # 以 50% 概率随机水平翻转图像（数据增强，增加样本多样性）
    transforms.Normalize((0.4915, 0.4821, 0.4464), (0.2472, 0.2437, 0.2617))  # 用 CIFAR-10 三通道均值和标准差做标准化
])

# --- 验证集数据预处理：不做图像增强，仅缩放和归一化 ---
val_transform = transforms.Compose([  # Compose 将多个变换操作按顺序组合
    transforms.Resize((32, 32)),  # 将所有图片统一缩放到 32×32 像素
    transforms.ToTensor(),  # 将 PIL Image 转为 torch.Tensor
    transforms.Normalize((0.4915, 0.4821, 0.4464), (0.2472, 0.2437, 0.2617))  # 使用与训练集相同的均值和标准差进行标准化
])

# ============================================================================
# 第三部分：数据路径配置与训练/验证集划分
# ============================================================================

img_dir = '../data/cifar-10/train/train'  # 训练图片所在文件夹的路径（原始字符串 r"..." 避免反斜杠转义）
labels_file = '../data/cifar-10/trainLabels.csv'  # 图片标签 CSV 文件的路径（包含 id 和 label 两列）

labels_df = pd.read_csv(labels_file)  # 使用 pandas 读取标签 CSV 文件到 DataFrame

# 划分训练集和验证集：共 50000 张图片，45000 张用于训练，5000 张用于验证
train_size = 45000  # 训练集样本数量
val_size = 5000  # 验证集样本数量
train_df = labels_df.iloc[:train_size]  # 取前 45000 行作为训练集的标签数据
val_df = labels_df.iloc[train_size:]  # 取第 45001~50000 行作为验证集的标签数据

# ============================================================================
# 第四部分：自定义 CIFAR-10 数据集类
# ============================================================================

class CIFAR10CustomDataset(Dataset):  # 定义自定义数据集类，必须继承 torch.utils.data.Dataset
    """CIFAR-10 自定义数据集类：从文件夹读取 PNG 图片，从 DataFrame 获取标签，支持 transform 预处理"""

    def __init__(self, img_dir, df, transform=None):  # 构造函数：接收图片目录、标签 DataFrame、可选的 transform
        self.img_dir = img_dir  # 保存图片文件夹的路径
        self.df = df.reset_index(drop=True)  # 重置 DataFrame 行索引为 0,1,2,...（丢弃旧索引，避免索引空洞）
        self.img_names = self.df['id'].tolist()  # 从 DataFrame 的 'id' 列提取所有图片文件名，转为 Python 列表
        self.labels = self.df['label'].tolist()  # 从 DataFrame 的 'label' 列提取所有类别标签，转为 Python 列表
        self.transform = transform  # 保存图像预处理/增强方法（训练用增强版，验证用基础版）
        self.class_to_idx = {  # 类别名称 → 数字标签的映射字典（CIFAR-10 共有 10 个类别）
            'airplane': 0,  # 飞机 → 类别索引 0
            'automobile': 1,  # 汽车 → 类别索引 1
            'bird': 2,  # 鸟 → 类别索引 2
            'cat': 3,  # 猫 → 类别索引 3
            'deer': 4,  # 鹿 → 类别索引 4
            'dog': 5,  # 狗 → 类别索引 5
            'frog': 6,  # 青蛙 → 类别索引 6
            'horse': 7,  # 马 → 类别索引 7
            'ship': 8,  # 船 → 类别索引 8
            'truck': 9  # 卡车 → 类别索引 9
        }

    def __len__(self):  # 必须实现：返回数据集的样本总数（DataLoader 通过此方法知道数据集大小）
        return len(self.img_names)  # 返回图片文件名列表的长度，即样本总数

    def __getitem__(self, idx):  # 必须实现：根据索引 idx 返回单个样本 (图片, 标签)
        img_name = self.img_names[idx]  # 根据索引获取对应的图片文件名（不含 .png 扩展名）
        img_path = f"{self.img_dir}\\{img_name}.png"  # 拼接完整的图片文件路径（Windows 反斜杠路径格式）
        image = Image.open(img_path).convert('RGB')  # 用 PIL 打开图片并强制转换为 RGB 三通道模式
        label = self.labels[idx]  # 获取该图片对应的类别标签（可能是字符串类别名或整数）
        if isinstance(label, str):  # 如果标签是字符串类型（即类别名称，如 'cat'）
            label = self.class_to_idx[label]  # 通过映射字典将类别名称转换为整数索引 0~9
        if self.transform:  # 如果定义了数据预处理/增强管道
            image = self.transform(image)  # 对图片应用 transform（ToTensor + 数据增强 + 归一化）
        else:  # 如果没有定义 transform（兜底情况）
            image = transforms.ToTensor()(image)  # 至少将 PIL Image 转为 PyTorch Tensor
        return image, label  # 返回 (图像张量, 整数标签) 的元组

# --- 创建训练集和验证集的 Dataset 实例 ---
train_dataset = CIFAR10CustomDataset(img_dir, train_df, train_transform)  # 训练集：使用含数据增强的 train_transform
val_dataset = CIFAR10CustomDataset(img_dir, val_df, val_transform)  # 验证集：使用仅归一化的 val_transform（不做增强）

# ============================================================================
# 第五部分：创建 DataLoader 数据加载器
# ============================================================================

batch_size = 32  # 定义每批处理的样本数量（每次送入模型 32 张图片）

# --- 训练集 DataLoader ---
train_loader = DataLoader(  # 用 DataLoader 包装训练集 Dataset，实现批量加载
    train_dataset,  # 传入训练集 Dataset 实例
    batch_size=batch_size,  # 设置每批的样本数为 32
    shuffle=True  # 每个 epoch 开始时随机打乱数据顺序（防止模型记住数据排列规律）
)

# --- 验证集 DataLoader ---
val_loader = DataLoader(  # 用 DataLoader 包装验证集 Dataset
    val_dataset,  # 传入验证集 Dataset 实例
    batch_size=batch_size,  # 设置每批的样本数为 32
    shuffle=False  # 验证集不需要打乱（打乱与否不影响损失和准确率的计算结果）
)

# ============================================================================
# 第六部分：VGG11 卷积神经网络模型定义
# ============================================================================

class VGG11(nn.Module):  # 定义 VGG11 模型类，继承自 nn.Module（所有 PyTorch 模型的基类）
    """VGG11 卷积神经网络：5 个卷积块 + 全连接分类器，用于 CIFAR-10 十分类任务"""

    def __init__(self, num_classes=10):  # 构造函数：num_classes 为输出类别数，CIFAR-10 默认为 10
        super(VGG11, self).__init__()  # 调用父类 nn.Module 的构造函数（必须调用，否则模型无法注册参数）

        # ================================================================
        # 特征提取层：5 个卷积块，每个块包含卷积层 + ReLU 激活 + 池化
        # 输入形状: (batch, 3, 32, 32)
        # 输出形状: (batch, 512, 1, 1)
        # ================================================================
        self.features = nn.Sequential(  # Sequential 容器按顺序堆叠各层，前向传播时自动依次执行
            # --- 卷积块1：3 → 64 通道，32×32 → 16×16 ---
            nn.Conv2d(3, 64, kernel_size=3, padding=1),  # 卷积层：输入 3 通道(RGB)，输出 64 通道，3×3 卷积核，padding=1 保持尺寸
            nn.ReLU(inplace=True),  # ReLU 激活函数（inplace=True 原地操作节省内存）
            nn.MaxPool2d(kernel_size=2, stride=2),  # 2×2 最大池化，步长 2，特征图尺寸减半：32×32 → 16×16

            # --- 卷积块2：64 → 128 通道，16×16 → 8×8 ---
            nn.Conv2d(64, 128, kernel_size=3, padding=1),  # 卷积层：输入 64 通道，输出 128 通道
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.MaxPool2d(kernel_size=2, stride=2),  # 最大池化：16×16 → 8×8

            # --- 卷积块3：128 → 256 通道（两层卷积），8×8 → 4×4 ---
            nn.Conv2d(128, 256, kernel_size=3, padding=1),  # 卷积层：输入 128 通道，输出 256 通道
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.Conv2d(256, 256, kernel_size=3, padding=1),  # 卷积层：输入 256 通道，输出 256 通道（VGG 块内双卷积设计）
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.MaxPool2d(kernel_size=2, stride=2),  # 最大池化：8×8 → 4×4

            # --- 卷积块4：256 → 512 通道（两层卷积），4×4 → 2×2 ---
            nn.Conv2d(256, 512, kernel_size=3, padding=1),  # 卷积层：输入 256 通道，输出 512 通道
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.Conv2d(512, 512, kernel_size=3, padding=1),  # 卷积层：输入 512 通道，输出 512 通道（VGG 块内双卷积设计）
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.MaxPool2d(kernel_size=2, stride=2),  # 最大池化：4×4 → 2×2

            # --- 卷积块5：512 → 512 通道（两层卷积），2×2 → 1×1 ---
            nn.Conv2d(512, 512, kernel_size=3, padding=1),  # 卷积层：输入 512 通道，输出 512 通道
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.Conv2d(512, 512, kernel_size=3, padding=1),  # 卷积层：输入 512 通道，输出 512 通道（VGG 块内双卷积设计）
            nn.ReLU(inplace=True),  # ReLU 激活函数
            nn.MaxPool2d(kernel_size=2, stride=2),  # 最大池化：2×2 → 1×1，此时输出为 (512, 1, 1)
        )

        # ================================================================
        # 分类器（全连接层）：将 512 维特征映射到 10 个类别
        # ================================================================
        self.classifier = nn.Sequential(  # Sequential 容器堆叠全连接分类层
            nn.Linear(512, 128),  # 全连接层：输入 512 维（展平后的特征向量），输出 128 维隐藏特征
            nn.ReLU(True),  # ReLU 激活函数（参数 True 等同于 inplace=True）
            nn.Dropout(),  # Dropout 层：训练时以 50% 概率随机丢弃神经元，防止过拟合
            nn.Linear(128, num_classes)  # 全连接层：输入 128 维，输出 num_classes(10) 维（每个类别的得分/logits）
        )

        self._initialize_weights()  # 调用自定义方法对所有权重进行初始化

    def forward(self, x):  # 前向传播函数：定义输入 x 在模型中的数据流动路径
        x = self.features(x)  # 通过 5 个卷积块提取特征，输出形状 (batch, 512, 1, 1)
        x = x.view(x.size(0), -1)  # 将特征图展平为二维向量：(batch, 512, 1, 1) → (batch, 512)
        x = self.classifier(x)  # 通过全连接分类器得到各类别的原始得分 (batch, 10)
        return x  # 返回 logits（未经 softmax 的原始输出，CrossEntropyLoss 内部会自动做 softmax）

    def _initialize_weights(self):  # 自定义权重初始化方法（好的初始化能加速收敛、提升精度）
        for m in self.modules():  # 遍历模型中的所有子模块（递归遍历）
            if isinstance(m, nn.Conv2d):  # 如果当前模块是二维卷积层
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')  # Kaiming 正态初始化卷积权重（专为 ReLU 设计）
                if m.bias is not None:  # 如果卷积层有偏置参数
                    nn.init.zeros_(m.bias)  # 将偏置初始化为全零
            elif isinstance(m, nn.Linear):  # 如果当前模块是全连接层
                nn.init.xavier_uniform_(m.weight)  # Xavier 均匀分布初始化全连接层权重（保持输入输出方差一致）
                nn.init.zeros_(m.bias)  # 将偏置初始化为全零

# ============================================================================
# 第七部分：通用训练器类（整合自 wangdao_train.py）
# 支持：分类/回归训练、早停(Early Stopping)、TensorBoard、训练曲线绘制
# ============================================================================

class Trainer:  # 定义通用训练器类，封装训练循环、评估、早停、日志和可视化
    """通用训练器：支持分类和回归任务，内置早停、TensorBoard 日志和训练曲线绘制"""

    def __init__(  # 训练器构造函数，可配置的参数非常丰富
        self,  # 实例自身
        model,  # 待训练的 PyTorch 模型（必须是 nn.Module 的实例）
        trainloader,  # 训练集的 DataLoader（提供批量训练数据）
        valloader,  # 验证集的 DataLoader（提供批量验证数据）
        criterion,  # 损失函数（分类用 CrossEntropyLoss，回归用 MSELoss 等）
        optimizer,  # 优化器（如 Adam、SGD，负责根据梯度更新模型参数）
        device='cuda',  # 训练设备：'cuda' 使用 GPU，'cpu' 使用 CPU
        epochs=10,  # 训练的总 epoch 数，默认 10 轮
        early_stopping=True,  # 是否启用早停机制（验证集不再提升时自动停止训练）
        patience=5,  # 早停容忍度：连续 patience 个 epoch 指标无提升则触发早停
        save_path="best_model.pth",  # 最优模型的保存路径和文件名
        early_stop_mode="loss",  # 早停监控的指标类型："loss"（监控损失）或 "acc"（监控准确率）
        maximize_acc=True,  # 当 early_stop_mode="acc" 时：True=准确率越大越好，False=准确率越小越好
        use_tensorboard=False,  # 是否启用 TensorBoard 日志记录（可视化训练过程）
        log_dir='tensorboard_logs'  # TensorBoard 日志文件的保存目录
    ):
        self.model = model  # 保存模型引用
        self.trainloader = trainloader  # 保存训练集 DataLoader
        self.valloader = valloader  # 保存验证集 DataLoader
        self.criterion = criterion  # 保存损失函数
        self.optimizer = optimizer  # 保存优化器
        self.device = device  # 保存训练设备名称（'cuda' 或 'cpu'）
        self.epochs = epochs  # 保存训练总轮数
        self.train_losses = []  # 初始化训练集损失记录列表（每个 epoch 一个值）
        self.val_losses = []  # 初始化验证集损失记录列表
        self.train_accuracies = []  # 初始化训练集准确率记录列表
        self.val_accuracies = []  # 初始化验证集准确率记录列表

        self.early_stopping = early_stopping  # 保存早停功能开关
        self.patience = patience  # 保存早停容忍度
        self.save_path = save_path  # 保存最优模型存储路径
        self.early_stop_mode = early_stop_mode  # 保存早停监控模式
        self.maximize_acc = maximize_acc  # 保存准确率优化方向

        # 初始化早停相关的内部状态变量
        self.best_metric = None  # 当前最优指标值（None 表示尚未记录任何指标）
        self.early_stop_counter = 0  # 早停计数器：记录连续未提升的 epoch 数
        self.best_epoch = 0  # 记录最优模型出现在第几个 epoch

        # TensorBoard 相关初始化
        self.use_tensorboard = use_tensorboard  # 保存 TensorBoard 开关标志
        self._writer = None  # TensorBoard SummaryWriter 实例，初始为 None
        if self.use_tensorboard:  # 如果用户启用了 TensorBoard
            if not os.path.exists(log_dir):  # 检查日志保存目录是否存在
                os.makedirs(log_dir)  # 如果目录不存在则递归创建
            self._writer = SummaryWriter(log_dir)  # 创建 SummaryWriter 实例，准备写入 TensorBoard 日志

    # ============================================================
    # 分类任务评估方法
    # ============================================================
    def evaluating(self, dataloader):  # 在给定 DataLoader 上评估分类模型的损失和准确率
        self.model.eval()  # 将模型切换到评估模式（冻结 BatchNorm 统计量、关闭 Dropout）
        correct = 0  # 累计正确预测的样本数量
        total = 0  # 累计处理的样本总数
        running_loss = 0.0  # 累计损失值（用于计算平均损失）
        with torch.no_grad():  # 上下文管理器：关闭自动求导（评估时不需要梯度，可节省大量显存）
            for images, labels in dataloader:  # 遍历 DataLoader 中的每个批次
                images = images.to(self.device)  # 将图像张量转移到目标设备（GPU 或 CPU）
                labels = labels.to(self.device)  # 将标签张量转移到目标设备
                outputs = self.model(images)  # 前向传播：输入图像，得到模型的预测输出 (logits)
                loss = self.criterion(outputs, labels)  # 计算模型输出与真实标签之间的损失值
                running_loss += loss.item()  # 累加当前批次的损失（loss.item() 将标量 Tensor 转为 Python float）
                predicted = torch.argmax(outputs, dim=1)  # 沿第 1 维（类别维）取最大值的索引，得到预测类别
                total += labels.size(0)  # 累加当前批次的样本数量
                correct += (predicted == labels).sum().item()  # 统计预测正确的样本数（bool 求和后转为 Python 整数）
        acc = 100 * correct / total if total > 0 else 0  # 计算整体准确率（百分比），防止除零错误
        avg_loss = running_loss / len(dataloader)  # 计算所有批次的平均损失值
        return avg_loss, acc  # 返回 (平均损失, 准确率%)

    # ============================================================
    # 回归任务评估方法
    # ============================================================
    def regression_evaluating(self, dataloader):  # 在给定 DataLoader 上评估回归模型的平均损失
        self.model.eval()  # 切换到评估模式
        running_loss = 0.0  # 累计损失值
        with torch.no_grad():  # 关闭自动求导，加速推理
            for data, target in dataloader:  # 遍历每个批次（data=输入特征，target=回归目标值）
                data = data.to(self.device)  # 将输入数据转移到设备
                target = target.to(self.device)  # 将目标值转移到设备
                output = self.model(data)  # 前向传播得到模型预测值
                loss = self.criterion(output, target)  # 计算预测值与真实目标之间的损失
                running_loss += loss.item()  # 累加当前批次损失
        avg_loss = running_loss / len(dataloader)  # 计算平均损失
        return avg_loss  # 返回平均损失（回归任务不计算准确率）

    # ============================================================
    # 回归任务训练方法
    # ============================================================
    def regression_train(self):  # 回归任务的完整训练流程（只记录损失，不计算准确率）
        self.model.to(self.device)  # 将模型参数迁移到目标设备
        for epoch in range(self.epochs):  # 外层循环：遍历每个训练 epoch
            self.model.train()  # 切换到训练模式（启用 Dropout，BatchNorm 使用批次统计量）
            running_loss = 0.0  # 初始化当前 epoch 的累计训练损失
            for batch_idx, (inputs, targets) in enumerate(self.trainloader):  # 内层循环：遍历训练集每个批次
                inputs = inputs.to(self.device)  # 将输入数据转移到设备
                targets = targets.to(self.device)  # 将目标值转移到设备
                self.optimizer.zero_grad()  # 清空上一轮迭代的梯度缓存（PyTorch 默认累加梯度，必须手动清零）
                outputs = self.model(inputs)  # 前向传播：计算模型输出
                loss = self.criterion(outputs, targets)  # 计算损失值
                loss.backward()  # 反向传播：自动计算损失对所有参数的梯度
                self.optimizer.step()  # 优化器根据梯度更新模型参数
                running_loss += loss.item()  # 累加当前批次的损失值
                if (batch_idx + 1) % 100 == 0:  # 每 100 个批次打印一次训练进度
                    print(f"[Regression] Epoch [{epoch + 1}/{self.epochs}], Step [{batch_idx + 1}/{len(self.trainloader)}], Loss: {loss.item():.4f}")  # 打印当前步的损失
            avg_train_loss = running_loss / len(self.trainloader)  # 计算当前 epoch 的平均训练损失
            train_loss = self.regression_evaluating(self.trainloader)  # 在整个训练集上评估损失
            val_loss = self.regression_evaluating(self.valloader)  # 在整个验证集上评估损失
            self.train_losses.append(train_loss)  # 记录本轮训练集损失到历史列表
            self.val_losses.append(val_loss)  # 记录本轮验证集损失到历史列表
            print(f"[Regression] Epoch [{epoch + 1}/{self.epochs}], Loss: {avg_train_loss:.4f}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")  # 打印本轮汇总信息

            # --- TensorBoard 日志记录 ---
            if self.use_tensorboard and self._writer is not None:  # 如果启用了 TensorBoard 且写入器已创建
                self._writer.add_scalar('Train/Loss', train_loss, epoch + 1)  # 写入训练损失曲线
                self._writer.add_scalar('Val/Loss', val_loss, epoch + 1)  # 写入验证损失曲线
                for i, param_group in enumerate(self.optimizer.param_groups):  # 遍历优化器的参数组（支持分组学习率）
                    self._writer.add_scalar(f'LR/group_{i}', param_group['lr'], epoch + 1)  # 记录每组的学习率变化

            # --- 早停检查与模型保存 ---
            metric = val_loss  # 回归任务以验证损失作为早停监控的唯一指标
            if self.early_stopping:  # 如果启用了早停机制
                if self.best_metric is None or metric < self.best_metric:  # 第一个 epoch 或当前损失优于历史最优
                    self.best_metric = metric  # 更新最优损失值
                    self.early_stop_counter = 0  # 重置早停计数器
                    self.best_epoch = epoch + 1  # 记录最优模型所在的 epoch 编号
                    torch.save(self.model.state_dict(), self.save_path)  # 保存当前模型的权重到文件
                    print(f"[Info][Regression] Model improved at epoch {epoch+1}, saving to {self.save_path}")  # 打印保存信息
                else:  # 当前损失没有优于历史最优
                    self.early_stop_counter += 1  # 早停计数器加 1
                    print(f"[Info][Regression] Early stop counter: {self.early_stop_counter}/{self.patience}")  # 打印早停计数状态
                    if self.early_stop_counter >= self.patience:  # 如果连续未提升达到容忍度上限
                        print(f"[Regression] Early stopping triggered at epoch {epoch+1}. Best epoch: {self.best_epoch}, Best Loss: {self.best_metric:.4f}")  # 打印早停触发信息
                        if os.path.isfile(self.save_path):  # 检查最优模型文件是否存在
                            self.model.load_state_dict(torch.load(self.save_path, map_location=self.device))  # 加载最优权重恢复模型
                        if self.use_tensorboard and self._writer is not None:  # 如果使用了 TensorBoard
                            self._writer.close()  # 关闭 TensorBoard 写入器
                        return  # 提前结束训练

        # 训练正常结束后的收尾处理（未触发早停的情况）
        if self.early_stopping and self.best_metric is not None:  # 如果启用了早停且至少保存过一次模型
            print(f"[Regression] Training finished. Loading best model from {self.save_path}")  # 打印加载信息
            if os.path.isfile(self.save_path):  # 检查最优模型文件是否存在
                self.model.load_state_dict(torch.load(self.save_path, map_location=self.device))  # 加载最优权重
        if self.use_tensorboard and self._writer is not None:  # 如果使用了 TensorBoard
            self._writer.close()  # 关闭写入器，确保所有日志写入磁盘

    # ============================================================
    # 早停判断辅助方法
    # ============================================================
    def _is_improvement(self, metric):  # 判断当前指标 metric 是否优于历史最优 best_metric
        if self.best_metric is None:  # 如果是第一个 epoch（尚未记录最优指标）
            return True  # 总是返回 True，第一个 epoch 必然"有提升"
        if self.early_stop_mode == "loss":  # 如果监控模式是损失（越小越好）
            return metric < self.best_metric  # 当前损失小于历史最优损失时返回 True
        elif self.early_stop_mode == "acc":  # 如果监控模式是准确率
            if self.maximize_acc:  # 如果准确率越大越好（最常见的情况）
                return metric > self.best_metric  # 当前准确率大于历史最优时返回 True
            else:  # 如果准确率越小越好（特殊场景，如错误率）
                return metric < self.best_metric  # 当前准确率小于历史最优时返回 True
        else:  # 如果 early_stop_mode 值不合法
            raise ValueError("Unknown early_stop_mode: {}".format(self.early_stop_mode))  # 抛出异常告知用户

    # ============================================================
    # 获取早停监控指标
    # ============================================================
    def _get_val_metric(self, val_loss, val_acc):  # 根据配置的监控模式返回对应的验证集指标
        if self.early_stop_mode == "loss":  # 如果监控模式是损失
            return val_loss  # 返回验证集损失值
        elif self.early_stop_mode == "acc":  # 如果监控模式是准确率
            return val_acc  # 返回验证集准确率
        else:  # 如果模式值不合法
            raise ValueError("Unknown early_stop_mode: {}".format(self.early_stop_mode))  # 抛出异常

    # ============================================================
    # 分类任务训练方法（主训练循环）
    # ============================================================
    def train(self):  # 分类任务的完整训练流程：训练 → 评估 → 早停 → 保存 → 日志
        self.model.to(self.device)  # 将模型的所有参数和缓冲区迁移到目标设备（GPU/CPU）
        for epoch in range(self.epochs):  # 外层循环：遍历每个训练 epoch（0 ~ epochs-1）
            self.model.train()  # 将模型设置为训练模式（启用 Dropout、BatchNorm 使用批次统计量）
            running_loss = 0.0  # 初始化当前 epoch 的累计损失（用于计算平均训练损失）
            for batch_idx, (images, labels) in enumerate(self.trainloader):  # 内层循环：遍历训练集 DataLoader 的每个批次
                images = images.to(self.device)  # 将这批图像张量转移到目标设备
                labels = labels.to(self.device)  # 将这批标签张量转移到目标设备
                self.optimizer.zero_grad()  # 清空优化器中累积的梯度（PyTorch 梯度默认累加，每步必须清零）
                outputs = self.model(images)  # 前向传播：输入图像，得到模型输出的 logits
                loss = self.criterion(outputs, labels)  # 计算模型输出与真实标签之间的损失值
                loss.backward()  # 反向传播：根据损失自动计算所有可训练参数的梯度
                self.optimizer.step()  # 优化器根据计算出的梯度更新模型参数
                running_loss += loss.item()  # 累加当前批次的损失值（用于后续计算平均）
                if (batch_idx + 1) % 100 == 0:  # 每 100 个批次打印一次训练进度
                    print(f'Epoch [{epoch + 1}/{self.epochs}], Step [{batch_idx + 1}/{len(self.trainloader)}], Loss: {loss.item():.4f}')  # 打印当前步损失

            avg_train_loss = running_loss / len(self.trainloader)  # 计算当前 epoch 所有批次的平均训练损失
            train_loss, train_acc = self.evaluating(self.trainloader)  # 在训练集上评估损失和准确率
            val_loss, val_acc = self.evaluating(self.valloader)  # 在验证集上评估损失和准确率

            self.train_losses.append(train_loss)  # 将本轮训练损失追加到历史记录列表
            self.val_losses.append(val_loss)  # 将本轮验证损失追加到历史记录列表
            self.train_accuracies.append(train_acc)  # 将本轮训练准确率追加到历史记录列表
            self.val_accuracies.append(val_acc)  # 将本轮验证准确率追加到历史记录列表
            print(f'Epoch [{epoch + 1}/{self.epochs}], Loss: {avg_train_loss:.4f}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, Train Acc: {train_acc:.2f}%, Val Acc: {val_acc:.2f}%')  # 打印本轮汇总指标

            # --- TensorBoard 日志记录 ---
            if self.use_tensorboard and self._writer is not None:  # 如果启用了 TensorBoard 日志功能
                self._writer.add_scalar('Train/Loss', train_loss, epoch + 1)  # 将本轮训练损失写入 TensorBoard
                self._writer.add_scalar('Train/Accuracy', train_acc, epoch + 1)  # 将本轮训练准确率写入 TensorBoard
                self._writer.add_scalar('Val/Loss', val_loss, epoch + 1)  # 将本轮验证损失写入 TensorBoard
                self._writer.add_scalar('Val/Accuracy', val_acc, epoch + 1)  # 将本轮验证准确率写入 TensorBoard
                for i, param_group in enumerate(self.optimizer.param_groups):  # 遍历优化器的所有参数组（支持分组学习率）
                    self._writer.add_scalar(f'LR/group_{i}', param_group['lr'], epoch + 1)  # 记录各组当前学习率

            # --- 早停检查与最优模型保存 ---
            metric = self._get_val_metric(val_loss, val_acc)  # 根据监控模式获取当前 epoch 的验证指标
            if self.early_stopping:  # 如果启用了早停功能
                if self._is_improvement(metric):  # 判断当前指标是否优于历史最优
                    self.best_metric = metric  # 更新历史最优指标值
                    self.early_stop_counter = 0  # 重置早停计数器（因为模型有了新的提升）
                    self.best_epoch = epoch + 1  # 记录最优模型所在的 epoch 编号
                    torch.save(self.model.state_dict(), self.save_path)  # 保存当前模型权重到文件
                    print(f"[Info] Model improved at epoch {epoch+1}, saving to {self.save_path}")  # 打印模型保存信息
                else:  # 当前指标没有优于历史最优
                    self.early_stop_counter += 1  # 早停计数器加 1
                    print(f"[Info] Early stop counter: {self.early_stop_counter}/{self.patience}")  # 打印早停计数状态
                    if self.early_stop_counter >= self.patience:  # 如果连续未提升的 epoch 数达到容忍度上限
                        print(f"Early stopping triggered at epoch {epoch+1}. Best epoch: {self.best_epoch}, Best metric: {self.best_metric:.4f}")  # 打印早停触发信息
                        if os.path.isfile(self.save_path):  # 检查最优模型文件是否存在
                            self.model.load_state_dict(torch.load(self.save_path, map_location=self.device))  # 将模型恢复到最优权重
                        if self.use_tensorboard and self._writer is not None:  # 如果使用了 TensorBoard
                            self._writer.close()  # 关闭写入器
                        return  # 提前终止训练

        # 所有 epoch 完成后（未触发早停）的收尾处理
        if self.early_stopping and self.best_metric is not None:  # 如果启用了早停且至少保存过一次模型
            print(f"Training finished. Loading best model from {self.save_path}")  # 打印加载最优模型的信息
            if os.path.isfile(self.save_path):  # 检查最优模型文件是否存在
                self.model.load_state_dict(torch.load(self.save_path, map_location=self.device))  # 加载最优权重
        if self.use_tensorboard and self._writer is not None:  # 如果使用了 TensorBoard
            self._writer.close()  # 关闭写入器，确保所有日志写入磁盘

    # ============================================================
    # 训练曲线绘制方法
    # ============================================================
    def plot(self, acc=True):  # 绘制训练过程的损失和准确率曲线（acc=True 分类任务，acc=False 回归任务）
        epochs_range = range(1, len(self.train_losses) + 1)  # 生成 epoch 编号列表（从 1 到 实际训练轮数）
        if acc:  # 如果是分类任务（需要同时绘制损失和准确率）
            plt.figure(figsize=(14, 5))  # 创建一个宽 14 英寸、高 5 英寸的画布
            # --- 左子图：损失曲线 ---
            plt.subplot(1, 2, 1)  # 创建 1 行 2 列的子图布局，选中第 1 个子图
            plt.plot(epochs_range, self.train_losses, label='Train Loss')  # 绘制训练损失随 epoch 变化的曲线
            plt.plot(epochs_range, self.val_losses, label='Validation Loss')  # 绘制验证损失随 epoch 变化的曲线
            plt.xlabel('Epoch')  # 设置 x 轴标签为 "Epoch"
            plt.ylabel('Loss')  # 设置 y 轴标签为 "Loss"
            plt.title('Training and Validation Loss')  # 设置子图标题
            plt.legend()  # 显示图例（区分训练/验证曲线）
            plt.grid(True)  # 显示网格线（便于精确读数）
            # --- 右子图：准确率曲线 ---
            plt.subplot(1, 2, 2)  # 选中第 2 个子图
            plt.plot(epochs_range, self.train_accuracies, label='Train Accuracy')  # 绘制训练准确率变化曲线
            plt.plot(epochs_range, self.val_accuracies, label='Validation Accuracy')  # 绘制验证准确率变化曲线
            plt.xlabel('Epoch')  # 设置 x 轴标签
            plt.ylabel('Accuracy (%)')  # 设置 y 轴标签（百分比）
            plt.title('Training and Validation Accuracy')  # 设置子图标题
            plt.legend()  # 显示图例
            plt.grid(True)  # 显示网格线
            plt.tight_layout()  # 自动调整子图之间的间距（防止标签和标题重叠）
            plt.show()  # 显示绘制的图像
        else:  # 如果是回归任务（只绘制损失曲线）
            plt.figure(figsize=(7, 5))  # 创建一个宽 7 英寸、高 5 英寸的画布
            plt.plot(epochs_range, self.train_losses, label='Train Loss')  # 绘制训练损失曲线
            plt.plot(epochs_range, self.val_losses, label='Validation Loss')  # 绘制验证损失曲线
            plt.xlabel('Epoch')  # 设置 x 轴标签
            plt.ylabel('Loss')  # 设置 y 轴标签
            plt.title('Training and Validation Loss')  # 设置图标题
            plt.legend()  # 显示图例
            plt.grid(True)  # 显示网格线
            plt.tight_layout()  # 自动调整布局
            plt.show()  # 显示图像

# ============================================================================
# 第八部分：主程序入口 —— 第一阶段训练（从零开始训练 VGG11）
# ============================================================================

if __name__ == "__main__":  # Python 主程序入口保护：仅当直接运行本文件时执行以下代码（被 import 时不执行）

    # ============================================================
    # 8.1 实例化 VGG11 模型
    # ============================================================
    model = VGG11()  # 创建一个 VGG11 模型实例（默认 num_classes=10，适配 CIFAR-10）

    # ============================================================
    # 8.2 定义损失函数和优化器
    # ============================================================
    criterion = torch.nn.CrossEntropyLoss()  # 使用交叉熵损失函数（多分类任务的标准选择，内部自动做 softmax）
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)  # 使用 Adam 优化器，学习率设为 0.001

    # ============================================================
    # 8.3 设置训练设备（GPU 优先，没有 GPU 则用 CPU）
    # ============================================================
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")  # 检测是否有 NVIDIA GPU，有则用 cuda，无则用 cpu
    model = model.to(device)  # 将模型的参数和缓冲区迁移到选定的设备

    # ============================================================
    # 8.4 设置训练参数
    # ============================================================
    num_epochs = 30  # 设置第一阶段训练的 epoch 总数（可根据显存和时间灵活调整）

    # ============================================================
    # 8.5 创建 Trainer 训练器实例
    # ============================================================
    trainer = Trainer(  # 实例化 Trainer 类，传入各项配置
        model=model,  # 传入待训练的 VGG11 模型
        trainloader=train_loader,  # 传入训练集 DataLoader（注意参数名是 trainloader，值是 train_loader）
        valloader=val_loader,  # 传入验证集 DataLoader（参数名 valloader，值是 val_loader）
        criterion=criterion,  # 传入损失函数（交叉熵）
        optimizer=optimizer,  # 传入优化器（Adam, lr=0.001）
        device=device,  # 传入训练设备（cuda 或 cpu）
        epochs=num_epochs,  # 设置训练总轮数为 30
        early_stopping=True,  # 启用早停机制（验证损失不再下降时自动停止）
        patience=5,  # 早停容忍度为 5 个 epoch（连续 5 轮不提升则停止）
        save_path='best_model.pth',  # 最优模型保存为 best_model.pth
        early_stop_mode="loss"  # 以验证损失作为早停监控指标（越小越好）
    )

    # ============================================================
    # 8.6 开始第一阶段训练
    # ============================================================
    trainer.train()  # 启动训练循环（自动进行前向、反向、评估、早停检查和模型保存）

    # ============================================================
    # 8.7 绘制训练曲线
    # ============================================================
    trainer.plot()  # 展示训练过程中的损失和准确率随 epoch 的变化曲线

    # ============================================================
    # 8.8 第一阶段最终评估
    # ============================================================
    val_loss, val_acc = trainer.evaluating(val_loader)  # 在验证集上评估第一阶段训练后模型的性能
    print(f"第一阶段最终验证集损失: {val_loss:.4f}, 准确率: {val_acc:.4f}")  # 打印验证集损失和准确率

    # ============================================================================
    # 第九部分：模型精调（Fine-tuning）
    # 策略：加载第一阶段最优权重 → 重置分类层 → 分组学习率 → 再训练
    # ============================================================================

    # ============================================================
    # 9.1 加载第一阶段保存的最优模型权重
    # ============================================================
    best_model_path = 'checkpoints/best_model.pth'  # 第一阶段最优模型权重的文件路径
    model.load_state_dict(torch.load(best_model_path, map_location=device))  # 将保存的权重加载到模型中（map_location 确保在正确设备上加载）

    # ============================================================
    # 9.2 重新初始化分类器的最后一层（为精调任务重置决策边界）
    # ============================================================
    if hasattr(model, 'classifier'):  # 检查模型是否具有 'classifier' 属性（VGG11 的分类层名称）
        if isinstance(model.classifier, torch.nn.Sequential):  # 如果 classifier 是 Sequential 容器
            if hasattr(model.classifier[-1], 'reset_parameters'):  # 如果最后一层（通常是 Linear）有 reset_parameters 方法
                model.classifier[-1].reset_parameters()  # 调用 PyTorch 内置方法重置最后一层的权重和偏置
                print('模型最后一层重新初始化成功')  # 打印成功提示
            else:  # 如果最后一层没有 reset_parameters 方法（兜底方案）
                for param in model.classifier[-1].parameters():  # 遍历最后一层的所有参数
                    if param.dim() >= 2:  # 参数维度 >= 2 说明是权重矩阵（而非偏置向量）
                        torch.nn.init.kaiming_normal_(param)  # 用 Kaiming 正态分布重新初始化权重
                    else:  # 参数维度 < 2 说明是偏置向量
                        torch.nn.init.zeros_(param)  # 将偏置初始化为零
        elif hasattr(model.classifier, 'reset_parameters'):  # 如果 classifier 本身就有 reset_parameters（非 Sequential 的情况）
            model.classifier.reset_parameters()  # 直接调用重置方法
    elif hasattr(model, 'fc'):  # 如果模型的分类层叫 'fc'（全连接层的常见命名）
        model.fc.reset_parameters()  # 重置 fc 层参数
    elif hasattr(model, 'head'):  # 如果模型的分类层叫 'head'（某些预训练模型的命名习惯）
        model.head.reset_parameters()  # 重置 head 层参数
    elif hasattr(model, 'cls'):  # 如果模型的分类层叫 'cls'（精调任务中常见的缩写命名）
        model.cls.reset_parameters()  # 重置 cls 层参数

    model = model.to(device)  # 确保模型在参数修改后仍然位于正确的设备上

    # ============================================================
    # 9.3 设置分组学习率（精调的核心策略之一）
    # ============================================================
    optimizer = torch.optim.Adam(  # 使用 Adam 优化器
        [  # 参数分组列表：不同组可以使用不同的学习率
            {  # 第一组：特征提取层（不含 'cls' 的层）—— 使用较小学习率
                "params": [value for key, value in model.named_parameters() if "cls" not in key],  # 筛选参数名不含 "cls" 的参数（特征提取层）
                "lr": 0.0001  # 特征层学习率设为 0.0001（较小的 lr，防止破坏预训练好的特征表示）
            },
            {  # 第二组：分类层（含 'cls' 的层）—— 使用较大学习率
                "params": [value for key, value in model.named_parameters() if "cls" in key],  # 筛选参数名含 "cls" 的参数（新初始化的分类层）
                "lr": 0.0005  # 分类层学习率设为 0.0005（较大的 lr，加速学习新的分类决策边界）
            },
        ]
    )

    # ============================================================
    # 9.4 精调训练
    # ============================================================
    num_epochs_finetune = 10  # 精调阶段训练轮数（通常比第一阶段少，因为模型已有较好的特征提取能力）
    trainer_finetune = Trainer(  # 创建新的 Trainer 实例用于精调阶段
        model=model,  # 传入已加载预训练权重并重置了分类层的模型
        trainloader=train_loader,  # 传入训练集 DataLoader
        valloader=val_loader,  # 传入验证集 DataLoader
        criterion=criterion,  # 传入损失函数（与第一阶段相同）
        optimizer=optimizer,  # 传入分组学习率的优化器
        device=device,  # 传入训练设备
        epochs=num_epochs_finetune  # 设置精调训练轮数为 10
    )

    trainer_finetune.train()  # 启动精调训练循环
    trainer_finetune.plot()  # 绘制精调过程的训练曲线

    # ============================================================
    # 9.5 精调后的最终评估
    # ============================================================
    val_loss, val_acc = trainer_finetune.evaluating(val_loader)  # 在验证集上评估精调后模型的最终性能
    print(f"精调后最终验证集损失: {val_loss:.4f}, 准确率: {val_acc:.4f}")  # 打印最终结果
```

