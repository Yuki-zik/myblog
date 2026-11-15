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
  src: ../../papers/covers/duap-lfd-overview.png
  alt: "DUAP Figure 3: language and content encoders, feature-swapping reconstruction, Whisper, and three loss functions."
  figureLabel: Fig. 3
  caption: "Language feature disentanglement (LFD): separating language and content features, then reconstructing exchanged features to generate Mel spectrograms with target-language features."
featured: true
---

## Key takeaway and scope

**DUAP** (Disentanglement-Based Universal Adversarial Perturbations, by Qianli Ma et al., *IEEE Transactions on Information Forensics and Security*, Vol. 21, pp. 3703–3718, 2026) is a universal speech privacy protection framework targeting multilingual automatic speech recognition (ASR) models such as OpenAI **Whisper**. Whereas conventional monolingual universal adversarial perturbations (UAPs) lose effectiveness outside English, DUAP combines **Language Feature Disentanglement (LFD)** with **gradient optimization against Whisper’s language identification module** to prevent unauthorized automatic transcription across languages, model scales, lossy codecs, and physical over-the-air capture.

## Research background: why monolingual UAPs fail on multilingual Whisper

End-to-end multilingual ASR systems such as Whisper route spoken audio through unified language identification tokens before autoregressive text decoding, making mass automated transcription of intercepted or hidden-microphone recordings practical across dozens of languages. Prior adversarial speech privacy methods are predominantly optimized against single-language (mostly English) acoustic transcription losses, creating two structural bottlenecks:

1. **Entangled acoustic representations limit cross-lingual transfer**: Spoken utterances entangle lexical content with language-specific phonetic cues, causing perturbations fitted to English token distributions to degrade sharply on non-English speech.
2. **Unaddressed language-routing bottleneck**: Whisper’s decoder conditions heavily on its front-end language identification stage; perturbations that do not systematically shift latent language representations allow the decoder to recover sensitive text from contextual redundancy.

| Aspect | Monolingual UAPs | DUAP (IEEE TIFS 2026) |
| --- | --- | --- |
| Core mechanism | Direct perturbation on single-language ASR loss | Language Feature Disentanglement (LFD) + language-ID gradient attack |
| Cross-lingual transfer | Primarily English or training language | Multilingual (> 95% WER on English, > 85% WER on other languages) |
| Scale transferability | Tied to a single surrogate checkpoint | Transfers across 3 Whisper model sizes |
| Channel robustness | Fragile under codecs and room acoustics | > 87% WER over the air; resilient to AAC and MP3 compression |

## Method: Language Feature Disentanglement (LFD) and two-stage attack

As illustrated in **Fig. 3**, DUAP couples a latent **Language Feature Disentanglement (LFD)** swap-reconstruction network in Stage 1 with universal gradient optimization in Stage 2:

### 1. Dual-encoder disentanglement of language and content

Given a source Mel spectrogram $\mathbf{m}_s$ (`Source.Mel`, the sensitive utterance to protect) and a target-language Mel spectrogram $\mathbf{m}_t$ (`Target.Mel`), LFD decomposes acoustic features into two orthogonal latent streams:

- **Language Encoder ($E_l$)**: Extracts utterance-level language representations $Z_{l_s} = E_l(\mathbf{m}_s)$ and $Z_{l_t} = E_l(\mathbf{m}_t)$ invariant to specific words.
- **Content Encoder ($E_c$)**: Extracts linguistic and prosodic content representations $Z_{c_s} = E_c(\mathbf{m}_s)$ and $Z_{c_t} = E_c(\mathbf{m}_t)$ stripped of source language identity.

### 2. Swap concatenating reconstruction and three loss functions

A shared decoder $D$ concatenates ($\parallel$) language and content codes along the channel axis to run two symmetric branches: self-reconstruction ($D(Z_{l_s} \parallel Z_{c_s})$ as `Recon.Source.Mel` and $D(Z_{l_t} \parallel Z_{c_t})$ as `Recon.Target.Mel`) and bidirectional cross-language swap reconstruction producing $\hat{\mathbf{m}}_{s \to t} = D(Z_{l_t} \parallel Z_{c_s})$ (`Transformed.Source.Mel`, which embeds target-language cues into the source speech carrier as an initial adversarial spectrogram) alongside its symmetric counterpart $\hat{\mathbf{m}}_{t \to s} = D(Z_{l_s} \parallel Z_{c_t})$ (`Transformed.Target.Mel`). Training optimizes three complementary objectives shown in Fig. 3:

- **Language Attack Loss (`lang Loss`, $\mathcal{L}_{\text{lang}}$)**: Minimizes the cross-entropy loss $\mathcal{L}_{CE}(F_{\text{lid}}(\hat{\mathbf{m}}_{s \to t}), y_t)$ through Whisper’s language identification module $F_{\text{lid}}$ so swapped spectrograms are routed toward target language $y_t$.
- **Self-Reconstruction Loss (`reg Loss`, $\mathcal{L}_{\text{reg}}$)**: Enforces an $\ell_2$-norm reconstruction constraint between original inputs ($\mathbf{m}_s, \mathbf{m}_t$) and `Recon.Source.Mel` / `Recon.Target.Mel` to preserve encoder-decoder completeness.
- **Cross-Transformation Fidelity Loss (`rec Loss`, $\mathcal{L}_{\text{rec}}$)**: Bounds the $\ell_2$-norm distance between original Mel spectrograms and `Transformed.Source.Mel` / `Transformed.Target.Mel` so perceptual speech quality for human listeners stays intact while machine language identification flips.

### 3. Stage 2: universal gradient optimization on language identification

Building on the LFD-initialized adversarial spectrograms, Stage 2 aggregates gradients directly against Whisper’s language identification module across utterances to synthesize a **utterance-agnostic Universal Adversarial Perturbation (UAP)**. A single precomputed perturbation can then protect arbitrary unseen speech across speakers, languages, and Whisper model scales without per-utterance optimization.

## Quantitative evaluation and robustness

DUAP is evaluated across digital multilingual benchmarks, physical over-the-air playback-and-recording environments, and lossy audio compression pipelines across three Whisper model sizes (higher Word Error Rate indicates stronger protection against unauthorized ASR transcription):

| Evaluation setting | Test condition | Whisper Word Error Rate (WER) |
| --- | --- | --- |
| English speech privacy | Digital audio across 3 Whisper model sizes | **> 95%** |
| Multilingual privacy | Non-English cross-lingual speech evaluation | **> 85%** |
| Physical scenarios | Over-the-air speaker playback to microphone | **> 87%** |
| Lossy compression | Post-processing under **AAC** and **MP3** codecs | **Retains high attack effectiveness** |

## Technical Q&A and threat model scope

### Why target Whisper’s language identification module instead of token-level transcription logits alone?

Multilingual Whisper conditions every downstream decoding step on its detected language token. Redirecting the front-end language identification representation triggers cascading decoding failures across the entire utterance at a tighter perturbation budget, yielding substantially stronger transfer across non-English languages and unseen Whisper model sizes.

### Which real-world speech privacy threat scenarios does DUAP address?

DUAP addresses two passive eavesdropping threat models: (1) **digital channel interception**, where voice messages or cloud recordings undergo AAC or MP3 lossy compression before bulk ASR scraping, and (2) **physical acoustic eavesdropping**, where playing or mixing a universal perturbation in the environment disrupts unauthorized transcription by nearby hidden microphones.

## Publication details

- **Journal:** IEEE Transactions on Information Forensics and Security (IEEE TIFS)
- **Volume and pages:** Volume 21, pages 3703–3718 (2026)
- **DOI:** [10.1109/TIFS.2026.3671687](https://doi.org/10.1109/TIFS.2026.3671687)
- **Lead author and persistent IDs:** Qianli Ma (ORCID: [0009-0005-2060-4172](https://orcid.org/0009-0005-2060-4172), [Google Scholar](https://scholar.google.com/citations?user=NTwrnCIAAAAJ), [Author research blog](/en/author))

The bibliographic metadata and architecture figure (Fig. 3) on this page are supplied and verified by the first author and cross-checked against IEEE Xplore, Crossref, OpenAlex, and Semantic Scholar. Dynamic citation counts are intentionally omitted from static repository source files.
