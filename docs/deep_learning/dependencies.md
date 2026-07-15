# Pytorch安装

## 1.查看显卡驱动

```bash
nvidia-smi
```

![image-20260630111626841](assets/image-20260630111626841.png)

## 2.根据显卡驱动支持的CUDA版本，去PyTorch官网查看下载命令

[PyTorch官网下载页](https://pytorch.org/get-started/locally/)

```bash
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu132
```

## 3.检查是否安装完成

```python
import torch

# 打印torch版本信息
print(torch.__version__)

# 检查 CUDA 是否可用
print(torch.cuda.is_available())

# 示例输出（版本号与 CUDA 后缀以实际安装为准，需与上面安装命令的索引一致，如 cu132）
2.12.1+cu132
True
```

