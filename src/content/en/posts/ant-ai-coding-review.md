---
title: "Ant AI Coding Assessment: A Retrospective"
date: "2026-03-19T22:00:00+08:00"
topics:
  - ai-coding
  - exam-review
  - agent-engineering
summary: Preparation, execution, pitfalls, and a timeline of an Ant AI coding assessment.
cover:
  src: ../../posts/covers/ant-ai-coding-review.png
  alt: Cover of the Ant AI coding assessment retrospective
---

## Timeline: the 18th

This was probably the day I properly began preparing. I did not normally write long, comprehensive prompts for coding agents, so I was worried about my ability to write prompts during the assessment. I also lacked experience using an agent to build a complete, business-level application.[^note-1]

[^note-1]: The deeper issue here was a lack of experience developing with agents. Prompt length was the surface symptom; experience had a larger influence on the result.

I decided to work on two fronts:

1. Researching the assessment itself.
2. Improving my vibe-coding abilities.

## 1. Researching the assessment

From posts on Xiaohongshu, I reasoned that there were too many candidates for every submission to be reviewed entirely by humans. Assuming AI-assisted grading, one idea immediately came to mind: prompt injection.[^note-2]

[^note-2]: AI-assisted grading does not mean prompt injection alone will earn a high score. A more reliable approach is to keep the structure, tests, and documentation consistent with one another.

Beyond prompt injection, I also considered catering to other perceived AI preferences: large amounts of text, exaggerated claims about the code, and excessive documentation praising its performance and structure.

## 2. Researching vibe coding

I came to see the prompt as a major factor in an agent’s performance. Even a prompt generated directly by another agent seemed better than the one or two sentences I usually supplied.

I also needed to work out general principles for vibe coding, including tests first, planning before implementation, and reasoning from first principles.

I asked Grok and GPT to investigate useful skills, rules, and `agents.md` files. I read a great deal, but ultimately did not use most of those skills and rules. I adapted Everything Claude Code, distilled and compressed it, and produced a Chinese version. Even then, I do not think I put all of it to use.[^note-3]

[^note-3]: This kind of preparation can turn into the illusion of progress through collecting tools: many rules have been read, but they have not become an executable workflow.

## During the assessment

I was nervous at first. I pasted in my prepared prompt, discovered that Git was available, and cloned the agent toolbox I had prepared. I then began feeding the toolbox’s guidance to Ant’s Code Fuse. From a quick search, it appeared to have existed since around 2023 or 2024, although it had not attracted much attention.

The agent read `agents.md` by default, but did not seem to examine the whole toolbox in depth. I initially tried opening several sessions for parallel work. Different agents reacted differently to the same `agents.md`, and opening a new session interrupted the previous one. Eventually, I settled on an agent that understood the documentation reasonably well and started developing.[^note-4]

[^note-4]: The platform’s behavior is part of the assessment. Interrupted sessions, inconsistent context loading, and which files are read by default are all practical constraints.

I encountered these problems, in order:

- The agent did not create a separate `app` or `src` directory for the application.
- My prepared prompt had no workflow for architecture or technology selection. The agent began implementing directly from `agents.md`, without an overall plan. Interfaces for optional features were not reserved, leading to repeated changes and errors later.
- I emphasized a minimal MVP too strongly, and the agent began with an extremely small product.[^note-5]
- Opening a new session interrupted the old one, preventing parallel work.
- Context even appeared to leak between agents. Near the end, while completing documentation, an agent seemed to execute a prompt I was still preparing for another session.
- Incremental development on top of a confused early architecture made later features difficult to integrate. For example, the end-to-end encryption module was not wired in correctly.
- Tests were ad hoc scripts rather than `pytest` tests, so I could not establish correctness reliably.[^note-6]
- Dependencies were not recorded properly. The agent even assumed that packages already installed in its environment did not need to be installed elsewhere.

[^note-5]: This matters: an MVP should reduce implementation complexity without reducing the product below a useful acceptance threshold.

[^note-6]: Tests are part of the deliverable in this kind of assessment. Without reliable tests, many claims of completion are only superficial.

---

## Timeline

### 0–5 minutes

Installed the toolbox and prepared the session context.

### 5–10 minutes

Gave up trying to perfect the setup, picked a usable agent, and started development. This produced a very minimal MVP—apparently just two files.

### 10–20 minutes

Asked the agent to rewrite guidance such as `timeline.md`, follow a strict table format, and implement required features.

### 30–45 minutes

Continued adding the required functionality and asked the agent to produce detailed tests.

### 45–60 minutes

Realized that simply watching the agent work was not useful. I created a human-maintained to-do document to organize the agent’s tasks and construct prompts, while waiting for the security requirements to be implemented.[^note-7]

[^note-7]: This was a useful move. A human needs a task board independent of the agent; otherwise, the agent’s local outputs can end up determining the entire direction.

### 60–75 minutes

The AI produced some simple security-related code that I had not yet understood. I realized I could add rules, beginning with first-principles reasoning and a requirement to inspect the code.

### 75–100 minutes

Asked the agent to add optional functionality and intelligent algorithms, and to strengthen the security algorithms. I added rules emphasizing TDD: design tests before writing implementation, and plan before coding.

### 100–110 minutes

Prepared two prompts: one to organize the feature documentation and another to explain security and performance. I refined the text of the deliverables and tried to avoid exposing weaknesses in the test report, then ran the prompts.[^note-8]

[^note-8]: By this point, the focus had shifted from adding features to organizing deliverables and managing how the work was presented, including which weaknesses were exposed.

### 110–120 minutes

Ran those prompts, found that the requirements file was poorly written, and asked for improvements. I only just made the deadline.
