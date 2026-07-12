# Pytorch安装

## 1.查看显卡驱动

```bash
nvidia-smi
```

![image-20260630111626841](assets/image-20260630111626841.png)

## 2.根据显卡驱动去nvidia官网查看pytorch下载链接

[nvidia官网pytorch下载](https://pytorch.org/get-started/locally/)

```bash
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu126
```

## 3.检查是否安装完成

```python
import torch

# 打印torch版本信息
print(torch.__version__)

# 检查 CUDA 是否可用
print(torch.cuda.is_available())

2.12.1+cu132
True
```

