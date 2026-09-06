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
featured: true
---

## 研究背景

多语种自动语音识别模型提升了跨语言转写能力，也扩大了敏感对话被隐藏麦克风或网络攻击捕获后自动转写的风险。既有基于对抗样本的隐私保护方法大多围绕单语种模型或英语优化，跨语言迁移能力有限。

## 方法

DUAP 使用两阶段语言攻击流程。首先，语言特征解耦模型在潜在空间中分离并重构语言相关特征，生成初始对抗样本；随后，通过梯度优化进一步干扰 Whisper 的语言识别模块，使扰动能跨语言和模型规模保持效果。

## 实验结果

论文在数字和物理场景中评估扰动。根据出版社与索引元数据中的摘要，DUAP 在三种 Whisper 模型规模上使英语词错误率超过 95%，其他语言超过 85%，物理场景超过 87%；在 AAC 与 MP3 压缩后仍保持较高攻击效果。

## 发表信息

- **期刊：** IEEE Transactions on Information Forensics and Security
- **卷页：** Volume 21, pages 3703–3718
- **DOI：** [10.1109/TIFS.2026.3671687](https://doi.org/10.1109/TIFS.2026.3671687)

本页元数据由作者 Google Scholar 主页发现，并通过 Crossref、OpenAlex 与 Semantic Scholar 交叉核验。引用次数属于动态数据，因此不写入仓库。
