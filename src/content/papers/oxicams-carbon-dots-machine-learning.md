---
title: Ratiometric Determination and Discrimination of Oxicams via Dual-Excitation Carbon Dots Assisted by Machine Learning
subtitle: 双激发碳点与机器学习辅助的昔康类药物比率检测和判别
authors:
  - name: Yihao Zhang
  - name: Qianli Ma
    url: https://scholar.google.com/citations?user=NTwrnCIAAAAJ
    self: true
  - name: Sineng Gao
  - name: Xinru Liu
  - name: Haoming Xing
  - name: Houwen Hu
  - name: Linfan Wang
  - name: Weihao Li
  - name: Ting Zhang
  - name: Yafei Hou
    orcid: 0000-0002-9240-0743
  - name: Da Chen
    orcid: 0000-0002-0334-9502
abstract: 该工作提出一种用于检测和区分昔康类非甾体抗炎药的荧光方法。系统利用氟氮共掺杂碳点在两个激发峰下的强度比变化进行定量检测，并结合 XGBoost 与卷积神经网络完成低浓度样本判别和真实样本浓度预测。
summary: 结合双激发荧光比率、碳点传感与机器学习，实现昔康类药物的高灵敏定量检测和类别判别。
year: 2025
publicationDate: "2025-09-25T00:00:00Z"
venue:
  name: Analytical Chemistry
  short: Anal. Chem.
  type: journal
status: published
keywords:
  - carbon dots
  - oxicams
  - fluorescence sensing
  - XGBoost
  - convolutional neural network
citation: "Yihao Zhang, Qianli Ma, Sineng Gao, Xinru Liu, Haoming Xing, Houwen Hu, Linfan Wang, Weihao Li, Ting Zhang, Yafei Hou, and Da Chen. Ratiometric Determination and Discrimination of Oxicams via Dual-Excitation Carbon Dots Assisted by Machine Learning. Analytical Chemistry, 97(39):21428–21437, 2025."
identifiers:
  doi: 10.1021/acs.analchem.5c03226
  scholar: NTwrnCIAAAAJ:d1gkVwhDpl0C
resources:
  - type: publisher
    label: ACS
    url: https://doi.org/10.1021/acs.analchem.5c03226
  - type: supplement
    label: Supporting Information
    url: https://doi.org/10.1021/acs.analchem.5c03226.s001
bibtex: |-
  @article{zhang2025ratiometric,
    author = {Yihao Zhang and Qianli Ma and Sineng Gao and Xinru Liu and Haoming Xing and Houwen Hu and Linfan Wang and Weihao Li and Ting Zhang and Yafei Hou and Da Chen},
    title = {Ratiometric Determination and Discrimination of Oxicams via Dual-Excitation Carbon Dots Assisted by Machine Learning},
    journal = {Analytical Chemistry},
    volume = {97},
    number = {39},
    pages = {21428--21437},
    year = {2025},
    doi = {10.1021/acs.analchem.5c03226}
  }
---

## 研究背景

昔康类药物属于常见的非甾体抗炎药。对这类药物进行灵敏检测与类别判别，有助于药物分析和风险监测。该研究把荧光传感与机器学习结合，避免只依赖单一光谱读数。

## 传感方法

研究通过水热法制备氟氮共掺杂碳点。材料在 280 nm 和 340 nm 附近具有两个激发峰；固定发射波长后，两个激发强度之比会随昔康类药物浓度变化。工作以美洛昔康作为模型化合物验证定量能力。

## 机器学习判别

在比较多种算法后，研究使用 XGBoost 处理低浓度范围内的昔康类药物判别，并进一步构建卷积神经网络辅助的传感平台，用于真实样本中的浓度预测。

根据索引元数据中的摘要，该方法对美洛昔康的检测限为 97 nM，覆盖 0.097–25 μM 的浓度范围；XGBoost 在给定实验数据中的未知样本判别达到 100% 准确率。这里保留的是论文报告结果，不将其扩展解释为超出原实验范围的普遍性能。

## 发表信息

- **期刊：** Analytical Chemistry
- **卷期页码：** Volume 97, Issue 39, pages 21428–21437
- **在线发表：** 2025-09-25
- **DOI：** [10.1021/acs.analchem.5c03226](https://doi.org/10.1021/acs.analchem.5c03226)

本页元数据由作者 Google Scholar 主页发现，并通过 Crossref、OpenAlex 与 Semantic Scholar 交叉核验。引用次数属于动态数据，因此不写入仓库。
