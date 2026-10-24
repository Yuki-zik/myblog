---
title: "DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection"
subtitle: Universal multilingual adversarial perturbations for speech privacy against Whisper
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
abstract: This work addresses privacy risks from multilingual automatic speech recognition models such as Whisper through DUAP, a universal adversarial perturbation method based on language feature disentanglement. The method first separates and reconstructs language-related features in latent space, then uses gradient optimization to disrupt language identification, providing protection across languages, model sizes, and digital and physical settings.
summary: Language feature disentanglement and gradient optimization produce transferable perturbations that reduce Whisper’s ability to transcribe sensitive speech.
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
cover:
  src: ../../papers/covers/duap-lfd-overview.png
  alt: "DUAP Figure 3: language and content encoders, feature-swapping reconstruction, Whisper, and three loss functions."
  figureLabel: Fig. 3
  caption: "Language feature disentanglement (LFD): separating language and content features, then reconstructing exchanged features to generate Mel spectrograms with target-language features."
featured: true
---

## Research background

Multilingual automatic speech recognition models improve cross-language transcription, while also increasing the risk that sensitive conversations captured by hidden microphones or network attacks will be transcribed automatically. Existing adversarial-example-based privacy protection methods have largely been optimized for monolingual models or English, limiting their cross-language transfer.

## Method

DUAP uses a two-stage language attack. First, a language feature disentanglement model separates and reconstructs language-related features in latent space to generate initial adversarial examples. Gradient optimization then further disrupts Whisper’s language identification module, allowing the perturbations to remain effective across languages and model sizes.

## Experimental results

The paper evaluates the perturbations in digital and physical settings. According to the abstract available in publisher and indexing metadata, DUAP raises English word error rates above 95% across three Whisper model sizes, above 85% for other languages, and above 87% in physical settings. It also retains strong attack effectiveness after AAC and MP3 compression.

## Publication details

- **Journal:** IEEE Transactions on Information Forensics and Security
- **Volume and pages:** Volume 21, pages 3703–3718
- **DOI:** [10.1109/TIFS.2026.3671687](https://doi.org/10.1109/TIFS.2026.3671687)

The metadata for this page was discovered through the author’s Google Scholar profile and cross-checked against Crossref, OpenAlex, and Semantic Scholar. Citation counts are dynamic and are therefore not stored in the repository.
