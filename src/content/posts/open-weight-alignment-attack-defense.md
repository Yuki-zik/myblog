---
title: "谁能关闭模型的安全开关？——开放权重大模型的对齐攻防"
date: "2026-10-24T21:00:00+08:00"
draft: false
topics:
  - ai-safety
summary: "从 Steering、稀疏剪枝和恶意微调出发，理解安全对齐为何易受修改；对照 RepNoise、Circuit Breaker、TAR、SGT 与预训练数据过滤，讨论抗篡改防御的边界。"
---

一个经过安全对齐的大模型，面对危险请求会拒绝回答。发布方可以展示拒绝率、红队测试和安全评估，告诉使用者：这个模型已经接受过安全训练。

接下来发生的事却很有意思。有人下载了模型权重，改变内部的一小部分表示或参数，模型的通用能力没有明显下降，拒绝行为却发生了显著变化。模型没有被完整重新训练，甚至不需要接触它最初的对齐数据。

**安全对齐可以被有效地训练出来，为什么又会被相对低成本的修改破坏？** 这正是我想讨论的问题。

这里聚焦开放权重模型（open-weight models）：任何人都能够获得并在本地修改参数。开放权重与严格意义上的开源 AI 有不同的许可和材料披露要求，本文讨论的风险核心是**权重可访问、可修改，以及发布之后开发者无法强制约束衍生模型**。开放带来研究复现、透明审计和本地部署的价值；2026 年《International AI Safety Report》同时指出，权重一旦广泛传播便无法整体召回，原有安全措施也更容易被移除。[^ref-iasr]

## 01 · 被保护的究竟是什么：能力，还是拒绝行为？

讨论攻击之前，需要把两个经常混在一起的概念分开。

**能力（capability）**是模型完成某类任务所拥有的知识与推理能力；**安全对齐（safety alignment）**更常在行为层面约束模型，要求它识别风险、拒绝不当请求，并在正常任务上继续提供帮助。

二者密切相关，却没有完全重合。在具体模型里，拒绝决策的部分机制能够被局部干预，而一般任务能力仍然保留。由此出现一个危险的组合：模型知道如何完成某些任务，也能正常推理，只是停止执行原先的拒绝策略。

这并不意味着所有安全对齐都只是薄薄的一层「开关」。拒绝可能依赖多个层、方向和上下文机制；不同模型、攻击目标和评测分布也会产生不同结果。更准确的研究问题是：**安全相关行为与通用效用能在多大程度上被分离？**

另一个容易被忽略的因素是**攻击者权限**。仅有聊天窗口的用户，只能改变输入；掌握推理服务的用户可以干预激活值；掌握权重的用户还可以修改参数、剪枝、微调或重新部署模型。安全保证的有效范围，必须随这些权限改变而重新定义。

| 攻击者能够控制什么 | 代表性方式 | 安全边界面临的挑战 |
| --- | --- | --- |
| 输入与上下文 | 提示注入、对抗提示 | 原有拒绝策略能否识别变形输入 |
| 推理过程中的隐藏状态 | Activation Steering、激活干预 | 拒绝表征能否被绕开 |
| 权重的局部结构 | 剪枝、低秩修改、定向参数编辑 | 安全关键子空间是否易于定位与移除 |
| 后训练过程 | LoRA / 全参数微调、模型合并 | 安全行为能否经受目标函数变化 |
| 独立的部署环境 | 移除过滤器、接入工具和检索 | 发布方还能否强制执行监控与约束 |

## 02 · 攻击：为什么少量干预就能改变安全行为？

### Steering：操控拒绝的内部方向

Steering 的基本思路，是在模型推理期间对隐藏状态施加某种方向性的干预，促使模型的行为发生可预测的改变。对安全问题而言，研究者关心的是：模型内部是否存在与「拒绝」高度相关、并对输出具有因果影响的表征？

Arditi 等人在 NeurIPS 2024 的研究中分析了 13 个开放权重聊天模型，发现模型拒绝行为能够被残差流中的一个方向显著控制。抑制这个方向会削弱拒绝，增强它甚至会让模型拒绝无害请求。论文还将这一发现转化为低秩权重编辑，展示了无需常规微调就能影响拒绝的攻击面。[^ref-direction]

这项结果的意义超出「找到一根神奇向量」。它提示我们：**部分对齐后形成的安全行为，在表示空间中具有足够集中的可操控结构。** 这样的结构帮助可解释性研究者理解模型，同样也让拥有白盒访问权限的人获得了更直接的干预手段。

但不能据此认定所有模型都存在通用、唯一、稳定的拒绝方向。跨架构、跨语言、长上下文、多轮交互，乃至实际有害能力，都需要独立验证。对一个方向的成功干预，也不自动等价于模型在现实任务中具有更高的危险能力。[^note-direction]

### 剪枝与低秩修改：对齐可能比想象中稀疏

如果安全行为部分依赖较集中的参数或子空间，就有机会通过结构性修改破坏它。

ICML 2024 的 *Assessing the Brittleness of Safety Alignment via Pruning and Low-Rank Modifications* 从神经元与低秩成分两种尺度考察了这个问题。作者在所研究的模型与设置下，定位到约占参数层面 3%、秩层面 2.5% 的安全关键区域；干预这些区域能够明显削弱安全性，同时在所报告的通用效用测试中保持相对较小的影响。更值得注意的是，即便限制对这些区域的修改，模型仍会受到其他低成本微调攻击。[^ref-pruning]

这提供了两层信息。首先，在部分模型上，安全相关参数并未均匀分散到全部能力中；其次，**守住已定位的「安全神经元」，也无法保证其他参数路径不会产生不安全行为。**

这里需要纠正一个直觉：剪枝本身既不是天然攻击，也不是天然防御。有研究观察到适度、特定策略的剪枝能够提升一些模型的越狱抵抗能力。真正重要的是剪掉了什么、保留了什么，以及评估的是哪类攻击。[^ref-protect-pruning]

### 恶意微调：改变目标函数，安全行为可以被重新学习

比结构编辑更常见的路径，是在已经对齐的模型上继续训练。合法使用者会微调模型以适配新领域；恶意使用者则能够把优化目标改为规避原本的拒绝行为。这两种情境共享同一套技术基础。

Qi 等人在 ICLR 2024 的研究表明，少量专门设计的微调数据就足以显著损害部分模型的安全对齐；即使使用无恶意的常见下游数据，也观察到一定程度的安全退化。其著名的十条样本案例来自当时可微调的 GPT-3.5 Turbo API，**不是「所有现代开放模型十条数据都能攻破」的普遍结论**。[^ref-finetune]

这类现象指向一种优化冲突：后续训练在最大化新的任务表现时，并不天然维护之前学到的拒绝边界。LoRA 降低了适配成本，但具体攻击成败仍取决于模型、训练数据、更新范围、训练预算和评价方式。

安全失效也不限于开头几个生成 token。ICLR 2025 的 *Safety Alignment Should Be Made More Than Just a Few Tokens Deep* 指出，一些安全训练过度依赖回答开头的拒绝模式；ICLR 2026 的后续研究进一步展示了更深层的微调攻击，说明即使初始文本看起来在拒绝，也不能只凭前几个 token 判定后续内容安全。[^ref-shallow][^ref-deeper]

这些研究让我更愿意把问题表述为：**后训练是否真正改变了模型对危险任务的完整生成策略，还是只提高了某种容易被局部修改的拒绝概率？**

## 03 · 防御：我们究竟在保护模型的哪一层？

攻击不只有一种入口，防御自然也出现了多个方向。它们各自都有合理的机制与实验成绩；理解其局限，首先要弄清楚它们到底准备抵抗哪一种修改。

### 让安全行为更深：深层对齐与对抗训练

最直接的防御，是让拒绝和安全响应贯穿更多生成位置，而不只集中在回答开始。前述 ICLR 2025 工作通过更深的安全对齐及约束微调，改善了若干攻击场景下的鲁棒性。另一类方法使用已知攻击进行对抗训练，使模型学会抵御特定分布的攻击。[^ref-shallow]

这里的边界在于分布覆盖和攻击者权限。训练可以提高对特定攻击的成本，却无法仅凭固定测试集证明面对新目标、新算法或权重修改时仍然安全。拒绝过度强化还会伤害正常问题的可用性。

### 直接作用于表示：RepNoise、Circuit Breakers 与 SGT

相比训练更多拒绝样本，一些工作直接干预内部表征。

NeurIPS 2024 的 **Representation Noising（RepNoise）**试图在多层表示中弱化与有害行为相关的信息，使恶意微调更难将其恢复。论文强调对表示进行足够深入的处理，并报告了能够抵抗一部分有害微调的实验结果，同时承认方法存在失效区域。[^ref-repnoise]

同样在 NeurIPS 2024，**Circuit Breakers** 选择在模型形成有害输出的内部表示时中断其生成轨迹。这为安全防御提供了另一种思路：直接干预导致不安全输出的表示，而不只依赖一句「我无法帮助」。论文在文本、多模态和 Agent 场景报告了提升，但这类干预本身仍需要接受更强的跨攻击、参数修改和效用评估。[^ref-circuit]

ACL 2026 的 **Safety Guidance Trigger（SGT）**把安全触发方向作为训练期的表征目标，使模型在不依赖推理时保留特殊触发词的情况下，学习更稳定的安全表征。它的目标是提高恶意微调重新改变行为所需的数据成本。论文报告了对恶意微调的鲁棒性改善。[^ref-sgt]

这三类方法的共同问题值得继续研究：**怎样辨认「真正应当抑制的有害行为表示」，同时不损伤完成正常任务所需的相同知识与能力？** 进一步地，如果攻击者可以直接编辑表示、换用其它层或持续训练，已构造的安全子空间还能保持多大范围的有效性？

### 抗篡改训练：TAR 希望把拆除防线的成本抬高

ICLR 2025 的 **Tamper-Resistant Safeguards（TAR）**直接以恶意后续微调为威胁模型训练防御。论文报告其安全机制在多种测试中能够承受数百步对抗微调，同时维持正常任务表现。[^ref-tar]

这里最重要的研究目标从「初始拒绝率有多高」变成了「要投入多少资源才能破坏它」。这是更适合开放权重场景的评价方式。

不过，**对某一种微调预算具有耐久性，并不能推出对 Steering、低秩编辑、剪枝、模型合并和外部知识注入也有同等耐久性**。ICLR 2025 的 *On Evaluating the Durability of Safeguards for Open-Weight LLMs* 专门展示了抗篡改防御评估中容易高估鲁棒性的多种问题，主张把安全声明限制在清楚定义、经强对抗验证的威胁模型内。[^ref-durability]

### 更早地限制危险知识：Deep Ignorance

上述方法大多希望让模型保留一般能力，同时守住拒绝或抑制危险行为。ICLR 2026 的 **Deep Ignorance** 把防线前移：在预训练数据阶段过滤部分高风险主题的内容，尝试减少模型所内化的特定危险知识。论文在生物风险相关的代理任务上报告了对长时间对抗微调的显著耐受性，实验覆盖至多 10,000 步与 3 亿 token 的相关训练数据。[^ref-ignorance]

这是一个重要变化。如果模型原本就没有掌握某一项危险知识，攻击者仅仅移除拒绝策略，不会凭空得到相同能力。代价是需要界定哪些知识属于高风险，以及怎样在科学、医疗等双用途领域保持正常效用。

论文自己也指出了明确边界：当相关知识从上下文或搜索工具重新提供时，模型仍可以利用它。**限制模型内部知识和限制整个系统能够获得的知识，是两个不同层次的安全问题。**

## 04 · 为什么很难有一种防御覆盖所有攻击？

把这些工作并排看，我认为存在四个相互关联的难点。

**第一，攻击面不封闭。** 把拒绝方向保护起来，攻击者还可以尝试参数微调；提高微调耐久性，攻击者又可以考虑推理激活修改；减少内化知识，外部工具仍能补充信息。不同攻击作用于输入、激活、参数、训练过程和系统边界，一个局部修复通常难以获得跨层保证。

**第二，模型能力与安全行为会共享表示。** 完全剥离某一类危险能力，常常涉及与正常知识、推理和专业用途的重叠；专门加强拒绝行为，也会引入过度拒绝风险。今天所谓「安全子空间」，既是有价值的可解释性发现，也存在过度简化复杂机制的风险。我们仍需要证明它在不同模型、层次与任务上到底具有什么因果作用。

**第三，攻击者会针对防御作出适应性调整。** 固定攻击集上的高拒绝率，只能证明对那批攻击有效。USENIX Security 2026 的 *The Attacker Moves Second* 在提示越狱和提示注入场景针对十二种防御进行适应性测试，多数防御在更强攻击下出现高于 90% 的攻击成功率。该结论直接针对输入层防御评估，**不能把这个数字套用为所有开放权重抗篡改方法的失效率**；它说明的是评价原则：防御必须经得起「攻击者看过你的防御设计之后再出手」。[^ref-adaptive]

**第四，我们常把容易测量的指标当作真正想保护的目标。** 有害问题拒绝率、越狱成功率、分类器判断和真实世界危害之间存在差距。一次拒绝失败，不一定意味着模型具有可执行的危险能力；一次拒绝成功，也不能证明长链路工具使用、外部检索与后续动作安全。只报告攻击成功率，却缺少正常效用、误拒率、攻击预算与评判器可靠性，容易得到失真的攻防结论。[^note-metrics]

因此，「目前没有普遍有效的技术保障」是一种关于**现有证据覆盖范围**的判断；它并不是一条已经证明「永远不可能实现稳健对齐」的数学定理。认真区分二者，才有机会知道下一步应当解决什么。

## 05 · 如何更严肃地评估开放权重安全？

我更希望未来论文把「安全」写成一条可以检验的具体声明：

> 在明确的模型、危险能力范围、攻击者权限与资源预算下，防御是否显著提高了让模型产生危险行为的成本，并且保持合理的正常用途？

为此，至少需要同时交代以下四组证据。

| 评估维度 | 需要回答的问题 |
| --- | --- |
| **攻击覆盖** | 是否同时评估 Steering、稀疏编辑、剪枝、LoRA／全参微调，以及适应性组合攻击？ |
| **成本曲线** | 安全性能随训练步数、数据量、算力与允许修改的参数范围如何变化？ |
| **效用和误拒** | 正常任务表现、回答质量、误拒率与专业知识是否受损？ |
| **真实风险与泛化** | 是否跨模型与安全领域验证？是否检验多轮、工具、检索和评判器误差？ |

对抗测试还应避免「攻击者只用论文作者替他设计好的基线」：攻击者应获得与实际威胁模型一致的信息，允许根据防御机制适应性调整，并记录完整试验预算。[^ref-durability]

## 结语 · 开放权重之后，安全还能依赖谁？

开放权重模型的核心难题，是发布方与最终控制者发生了分离。模型开发者可以训练一个默认安全的检查点，却不能要求所有衍生版本保留同样的激活、权重、解码器与外部约束。

Steering、剪枝与微调的研究告诉我们：在一些模型上，安全拒绝行为具有可定位、可改变的机制。RepNoise、Circuit Breakers、TAR、SGT 与预训练数据过滤则说明，**提高篡改成本并非无望**，不同技术正在沿不同层次把边界向前推进。

真正困难的是把局部实验成功提升为可信的系统保证。对于开放权重发布，我倾向于同时考察模型具有什么能力、解除约束需要多少成本、发布后还能执行哪些措施，以及开放发布究竟带来多少额外风险。开放本身具有研究与社会价值，风险管理也需要与能力水平相匹配。

最后留下一个研究问题：**如果攻击者可以完全控制模型权重与运行时，我们应当追求一种经受特定攻击的稳健拒绝机制，还是重新设计危险能力、外部权限与可验证执行约束之间的边界？** 我认为，后者将成为越来越重要的方向。

[^note-direction]: 此处的「方向」是给定模型与层次上的因果性实验结果，不能直接推断每一种有害任务只有一个方向，也不能将拒绝率变化视作危害能力变化。
[^note-metrics]: 建议联合报告有害输出的人工复核或可靠判别器评估、正常任务表现、误拒率、修改预算及跨攻击迁移；不同论文的 ASR 不宜在缺少统一设置时直接横比。
[^ref-iasr]: [International AI Safety Report 2026，§3.4 Open-weight models](https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026)。
[^ref-direction]: Arditi et al., [Refusal in Language Models Is Mediated by a Single Direction](https://papers.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract-Conference.html), NeurIPS 2024。
[^ref-pruning]: Wei et al., [Assessing the Brittleness of Safety Alignment via Pruning and Low-Rank Modifications](https://proceedings.mlr.press/v235/wei24f.html), ICML 2024。
[^ref-protect-pruning]: Hasan et al., [Pruning for Protection: Increasing Jailbreak Resistance in Aligned LLMs Without Fine-Tuning](https://aclanthology.org/2024.blackboxnlp-1.26/), BlackboxNLP 2024。
[^ref-finetune]: Qi et al., [Fine-tuning Aligned Language Models Compromises Safety, Even When Users Do Not Intend To!](https://proceedings.iclr.cc/paper_files/paper/2024/hash/83b7da3ed13f06c13ce82235c8eedf35-Abstract-Conference.html), ICLR 2024。
[^ref-shallow]: Qi et al., [Safety Alignment Should Be Made More Than Just a Few Tokens Deep](https://proceedings.iclr.cc/paper_files/paper/2025/hash/88be023075a5a3ff3dc3b5d26623fa22-Abstract-Conference.html), ICLR 2025。
[^ref-deeper]: Kazdan et al., [No, of Course I Can! Deeper Fine-Tuning Attacks That Bypass Token-Level Safety Mechanisms](https://proceedings.iclr.cc/paper_files/paper/2026/hash/71f21ac7a1985e1d7d9a4ecd0a03e993-Abstract-Conference.html), ICLR 2026。
[^ref-repnoise]: Rosati et al., [Representation Noising: A Defence Mechanism Against Harmful Finetuning](https://proceedings.neurips.cc/paper_files/paper/2024/hash/172be8b0b88fc2b4aee74237d43f8c04-Abstract-Conference.html), NeurIPS 2024。
[^ref-circuit]: Zou et al., [Improving Alignment and Robustness with Circuit Breakers](https://papers.nips.cc/paper_files/paper/2024/hash/97ca7168c2c333df5ea61ece3b3276e1-Abstract-Conference.html), NeurIPS 2024。
[^ref-sgt]: Shin et al., [SGT: Securing Open-Source LLMs Against Malicious Fine-tuning via Safety Guidance Trigger](https://aclanthology.org/2026.acl-long.463/), ACL 2026。
[^ref-tar]: Tamirisa et al., [Tamper-Resistant Safeguards for Open-Weight LLMs](https://proceedings.iclr.cc/paper_files/paper/2025/hash/fc49a629d33bc2461ed7a715ce44da68-Abstract-Conference.html), ICLR 2025。
[^ref-durability]: Qi et al., [On Evaluating the Durability of Safeguards for Open-Weight LLMs](https://proceedings.iclr.cc/paper_files/paper/2025/hash/9d3a4cdf6f70559e8c6fe02170fba568-Abstract-Conference.html), ICLR 2025。
[^ref-ignorance]: O'Brien et al., [Deep Ignorance: Filtering Pretraining Data Builds Tamper-Resistant Safeguards into Open-Weight LLMs](https://proceedings.iclr.cc/paper_files/paper/2026/hash/3bf80b34f731313b8292f4578e820c90-Abstract-Conference.html), ICLR 2026。
[^ref-adaptive]: Nasr et al., [The Attacker Moves Second: Stronger Adaptive Attacks Bypass Defenses Against LLM Jailbreaks and Prompt Injections](https://www.usenix.org/conference/usenixsecurity26/presentation/nasr), USENIX Security 2026。
