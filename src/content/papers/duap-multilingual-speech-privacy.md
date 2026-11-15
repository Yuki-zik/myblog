---
title: "DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection"
subtitle: 面向 Whisper 的多语种通用对抗扰动与语音隐私保护
authors:
  - name: Qianli Ma
    url: https://scholar.google.com/citations?user=NTwrnCIAAAAJ
    orcid: 0009-0005-2060-4172
    self: true
  - name: Wenjie Zhang
    orcid: 0009-0004-4401-2385
  - name: Jiahao Chen
    orcid: 0000-0002-5894-662X
  - name: Jiazhen Jia
    orcid: 0009-0009-5033-626X
  - name: Rangding Wang
  - name: Diqun Yan
    orcid: 0000-0002-5241-7276
abstract: 该工作面向 Whisper 等多语种自动语音识别模型带来的隐私泄露风险，提出基于语言特征解耦的通用对抗扰动方法 DUAP。方法先在潜在空间中分离并重构语言相关特征，再用梯度优化干扰语言识别模块，从而在多语种、不同模型规模以及数字和物理场景中提供稳定保护。
summary: 用语言特征解耦与梯度优化生成可跨语种迁移的通用扰动，降低 Whisper 对敏感语音的转写能力。
year: 2026
updated: "2026-11-16T00:00:00+08:00"
venue:
  name: IEEE Transactions on Information Forensics and Security
  short: IEEE TIFS
  type: journal
status: published
keywords:
  - speech privacy
  - adversarial perturbation
  - multilingual ASR
  - Whisper
  - language disentanglement
citation: "Qianli Ma, Wenjie Zhang, Jiahao Chen, Jiazhen Jia, Rangding Wang, and Diqun Yan. DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection. IEEE Transactions on Information Forensics and Security, 21:3703–3718, 2026."
identifiers:
  doi: 10.1109/TIFS.2026.3671687
  scholar: NTwrnCIAAAAJ:9yKSN-GCB0IC
resources:
  - type: publisher
    label: IEEE Xplore
    url: https://doi.org/10.1109/TIFS.2026.3671687
bibtex: |-
  @article{ma2026duap,
    author = {Qianli Ma and Wenjie Zhang and Jiahao Chen and Jiazhen Jia and Rangding Wang and Diqun Yan},
    title = {DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection},
    journal = {IEEE Transactions on Information Forensics and Security},
    volume = {21},
    pages = {3703--3718},
    year = {2026},
    doi = {10.1109/TIFS.2026.3671687}
  }
cover:
  src: ./covers/duap-lfd-overview.png
  alt: DUAP论文图3，展示语言和内容编码器、特征交换重建、Whisper与三类损失的关联。
  figureLabel: "Fig. 3"
  caption: 语言特征解耦（LFD）：分离语言与内容特征，通过交换重建生成含目标语言特征的Mel频谱。
featured: true
---

## 核心结论与研究定位

**DUAP**（Disentanglement-Based Universal Adversarial Perturbations，Qianli Ma 等，发表于 *IEEE Transactions on Information Forensics and Security* 2026, Vol. 21, pp. 3703–3718）是面向 OpenAI **Whisper** 等多语种自动语音识别（ASR）模型的通用语音隐私保护方法。针对单语种通用对抗扰动（UAP）在跨语言场景下迁移率急剧衰减的瓶颈，DUAP 通过**语言特征解耦（Language Feature Disentanglement, LFD）**与**语言识别模块（Language Identification）梯度优化**两阶段机制，在不依赖特定说话人或固定语种的前提下，阻断隐藏麦克风拾音或信道窃听后的自动化批量转写。

## 研究背景：为什么传统单语种 UAP 难以保护多语种语音？

Whisper 等大规模多语种端到端语音识别模型采用“先识别语种标记、再条件解码文本”的统一多任务范式，大幅降低了攻击者跨语种批量窃取敏感语音内容的门槛。然而，传统语音对抗样本与单语种通用对抗扰动（Monolingual UAP）通常围绕单一语言（主要是英语）的声学转录损失进行端到端优化，存在两项结构性局限：

1. **特征耦合导致跨语种迁移受限**：语音信号中的语义内容特征与语种声学特征高度纠缠，仅针对单一语种词元分布训练的扰动在切换到非英语语种时容易失效。
2. **未针对多语种路由瓶颈建模**：Whisper 的多语种解码高度依赖前端语言识别（Language Identification）路由；若扰动未能系统性偏转潜在空间中的语言表征，模型仍可利用上下文冗余恢复部分转写文本。

| 对比维度 | 传统单语种 UAP | DUAP（本文方法） |
| --- | --- | --- |
| 核心作用机制 | 针对单语种声学解码损失直接叠加扰动 | 语言特征解耦（LFD）交换重建 + 语言识别梯度干扰 |
| 跨语种迁移能力 | 局限于英语或训练语种，跨语种衰减显著 | 覆盖多语种（英语 WER > 95%，非英语 WER > 85%） |
| 跨模型规模泛化 | 常受限于单一代理模型架构 | 在 3 种不同参数规模的 Whisper 模型上保持高保护率 |
| 真实信道鲁棒性 | 易被有损音频压缩或空气声学信道削弱 | 物理重放场景 WER > 87%，耐受 AAC 与 MP3 有损压缩 |

## 方法：语言特征解耦（LFD）与两阶段语言攻击架构

如论文 **Fig. 3** 所示，DUAP 由第一阶段的**语言特征解耦（LFD）交换重建网络**与第二阶段的**通用梯度优化**串联构成：

### 1. 语言编码器与内容编码器的双流解耦与交换重建

面向 Whisper 的语言特征解耦（LFD）通过语言编码器与内容编码器的交换重建，从源语音与参考语音的 Mel 频谱中分离语种与语义表征。给定待保护源语音的 Mel 频谱 $\mathbf{m}_s$（Source Mel）与目标干扰语种的参考 Mel 频谱 $\mathbf{m}_t$（Target Mel），LFD 模块通过两个独立编码器在潜在空间显式分离表征：

- **语言编码器（Language Encoder, $E_l$）**：提取与具体词汇内容解耦的语种判别表征 $Z_{l_s} = E_l(\mathbf{m}_s)$ 与 $Z_{l_t} = E_l(\mathbf{m}_t)$。
- **内容编码器（Content Encoder, $E_c$）**：提取保留语音结构与韵律骨架的内容表征 $Z_{c_s} = E_c(\mathbf{m}_s)$ 与 $Z_{c_t} = E_c(\mathbf{m}_t)$。

### 2. 潜在空间交换拼接（Swap Concatenating）与三类损失约束

解码器 $D$ 在通道维度拼接（$\parallel$）语言与内容潜变量，并行执行两类对称重建支路：自重建支路输出 $D(Z_{l_s} \parallel Z_{c_s})$（`Recon.Source.Mel`）与 $D(Z_{l_t} \parallel Z_{c_t})$（`Recon.Target.Mel`）以锚定表征完备性；跨语种交换支路双向交叉拼接生成 $\hat{\mathbf{m}}_{s \to t} = D(Z_{l_t} \parallel Z_{c_s})$（`Transformed.Source.Mel`，将目标语种特征注入源语音内容作为初始对抗频谱）与对称支路 $\hat{\mathbf{m}}_{t \to s} = D(Z_{l_s} \parallel Z_{c_t})$（`Transformed.Target.Mel`）。整个 LFD 网络由三项互补损失联合驱动：

- **语言攻击损失（`lang Loss`, $\mathcal{L}_{\text{lang}}$）**：将交换生成频谱送入 Whisper 语言识别模块 $F_{\text{lid}}$，最小化其与目标语种标签 $y_t$ 的交叉熵损失 $\mathcal{L}_{CE}(F_{\text{lid}}(\hat{\mathbf{m}}_{s \to t}), y_t)$，诱导 Whisper 将受保护语音误判为目标语种。
- **自重建正则损失（`reg Loss`, $\mathcal{L}_{\text{reg}}$）**：约束原始 Mel 频谱与自重建频谱之间的 $\ell_2$ 范数距离，确保 $E_l$ 与 $E_c$ 不丢失基础声学信息。
- **跨变换保真损失（`rec Loss`, $\mathcal{L}_{\text{rec}}$）**：约束原始源频谱与交换变换频谱之间的 $\ell_2$ 范数距离，在翻转机器语种判别的同时控制人耳可感知失真。

### 3. 第二阶段：面向语言识别模块的通用扰动梯度优化

在 LFD 生成含目标语种特征的初始对抗样本后，第二阶段围绕 Whisper 的语言识别模块执行跨样本梯度聚合与投影优化，将逐句语言特征偏移收束为一条**与具体语音内容无关的通用对抗扰动（Universal Adversarial Perturbation）**，使单一扰动即可实时叠加于任意未知语音片段，并在不同参数规模的 Whisper 模型间迁移。

## 实验结果与鲁棒性评估

论文在多语种数字音频、物理空气信道（Over-the-Air）重放以及主流有损音频编码条件下，跨越三种不同规模的 Whisper 模型评估了 DUAP 的隐私保护强度（词错误率 WER 越高代表攻击者自动转写失败率越高、隐私保护越充分）：

| 评估维度 | 实验设置与信道条件 | Whisper 自动转写词错误率（WER） |
| --- | --- | --- |
| 英语语音保护 | 跨越 3 种 Whisper 模型规模的数字音频测试 | **> 95%** |
| 多语种语音保护 | 非英语多语种跨语言数字音频测试 | **> 85%** |
| 物理真实场景 | 扬声器播放与麦克风远场拾音（Over-the-Air） | **> 87%** |
| 有损压缩鲁棒性 | 经受 **AAC** 与 **MP3** 主流有损音频压缩编码 | **保持高攻击成功率与保护稳健性** |

## 关键技术问答与适用边界

### DUAP 为什么优先攻击 Whisper 的语言识别模块而非直接扰动解码词元？

多语种 Whisper 的解码器强依赖前置语种标记路由。一旦通用扰动在浅层声学—语种特征空间将输入稳定引导至错误的语种分支，后续自回归解码链条会产生级联错位，从而用更小的扰动范数换取更强的跨语种与跨模型规模迁移能力。

### 该方法覆盖哪些实际隐私威胁模型？

DUAP 面向两类被动语音窃取威胁：（1）**数字信道截获**，如社交语音消息或录音文件在经受 AAC / MP3 压缩传输后被批量拉取转写；（2）**物理空间窃听**，即在受保护声源旁播放或混入通用保护扰动，抵御周边隐藏麦克风的自动语音转写。

## 发表信息与学术标识

- **期刊：** IEEE Transactions on Information Forensics and Security (IEEE TIFS)
- **卷页：** Volume 21, pages 3703–3718 (2026)
- **DOI：** [10.1109/TIFS.2026.3671687](https://doi.org/10.1109/TIFS.2026.3671687)
- **第一作者与学术档案：** Qianli Ma（马千里，ORCID: [0009-0005-2060-4172](https://orcid.org/0009-0005-2060-4172)，[Google Scholar](https://scholar.google.com/citations?user=NTwrnCIAAAAJ)，[作者研究主页](/author)）

本页元数据与方法图（Fig. 3）由第一作者核对提供，并与 IEEE Xplore、Crossref、OpenAlex 及 Semantic Scholar 索引记录交叉验证。引用次数属于动态外部指标，因此不在仓库内静态硬编码。
