# AI_잡돌이 Project

Korean-language content creation project focused on AI monetization strategies and YouTube content production.

## Overview

**AI_잡돌이** creates educational content teaching Korean audiences how to leverage AI for income generation through psychology-driven YouTube narration scripts.

## 🎯 Core Purpose

- Create psychology-driven YouTube narration scripts optimized for Korean audiences
- Develop frameworks for AI-powered content monetization
- Target Korean viewers interested in "집에서 쉽게" (easy home-based) income opportunities

## 📁 Repository Structure

### Key Files

**`youtube_narration_framework.md`** - Master template for Korean YouTube video scripts
- 7-section psychological framework (HOOK → PROBLEM → AGITATE → SOLUTION → VALUE → PROOF → CTA)
- Korean audience psychology optimization (무료→유료 funnel, efficiency obsession, FOMO triggers)
- 10-minute video structure with retention hooks at 3min, 5min, 7min marks
- Includes complete worked example: "AI로 월 300만원 버는 법"

**`아무도 알려주지 않은 AI 수익화.md`** - Sample narration copy
- Introductory script for AI monetization content
- Target audience: Korean speakers wanting to learn AI or generate AI-based income

### Claude Skills

**`.claude/skills/youtube-narration-coach/`** - YouTube Script Coaching Skill
- Interactive coach for analyzing and improving Korean YouTube scripts
- Framework-based feedback with specific questions
- Guides users through the 7-section framework
- Provides structured analysis and improvement suggestions

## 🎬 Content Creation Workflow

### Creating New YouTube Scripts

1. **Define Variables** - Use the worksheet in `youtube_narration_framework.md`:
   - Target audience (직장인/주부/학생/프리랜서)
   - Result promise (월 OO만원/시간 절약)
   - Timeframe (3일/2주/1달)
   - Method name (specific system/process)

2. **Apply 7-Section Structure**:
   - **HOOK** (0-15s): Strong number/result to grab attention
   - **PROBLEM** (15-45s): 3 pain points for empathy
   - **AGITATE** (45s-1:30): Explain why they haven't succeeded yet
   - **SOLUTION INTRO** (1:30-2:00): Tease the solution
   - **VALUE DELIVERY** (2:00-8:00): 3-5 step process with examples
   - **SOCIAL PROOF** (8:00-9:00): 3 case studies with diverse profiles
   - **CTA** (9:00-10:00): 3-tier funnel (무료 → 무료+ → 유료)

3. **Insert Psychological Triggers** - Minimum 2 per section:
   - 호기심갭 (curiosity gap)
   - 손실회피 (loss aversion)
   - 사회적증거 (social proof)
   - FOMO (fear of missing out)
   - 즉각보상 (instant gratification)

4. **Add Retention Hooks** at critical dropout points:
   - 3:00 mark: "⚠️ 잠깐! 다음 단계 놓치면..."
   - 5:00 mark: "여기서 80%가 실수하는 부분"
   - 7:00 mark: "마지막 핵심, 집중하세요"

## 🤖 Using the YouTube Narration Coach

The YouTube Narration Coach skill helps you analyze and improve your scripts through interactive coaching:

### Activation

In Claude Code, invoke the skill:
```
youtube-narration-coach
```

Or let Claude automatically detect when you're working with YouTube scripts.

### Features

**1. Framework Analysis**
- Analyzes your script against the 7-section framework
- Identifies missing or weak sections
- Provides specific, actionable feedback

**2. Guided Improvement**
- Asks targeted questions to help you strengthen each section
- Uses the framework principles to explain why changes are needed
- Iterative approach: one section at a time

**3. Korean Psychology Optimization**
- Checks for psychological triggers in each section
- Ensures Korean audience patterns are followed
- Validates 무료→유료 funnel structure

**4. Writing Support**
- Only writes for you when explicitly requested
- Focuses on coaching you to write better yourself
- Provides examples and templates when needed

### Example Usage

```markdown
User: "이 대본 좀 봐줘"
[paste script]

Coach:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 대본 분석 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ HOOK 섹션 분석

현재 문제점:
❌ 강력한 숫자/결과 제시 없음
❌ 타겟이 너무 넓음

🤔 구체화 질문:
1. 이 영상을 보면 시청자가 얻는 구체적 결과는?
2. 타겟 청중을 좁힐 수 있나요?
...
```

## 📝 Korean Audience Psychology Patterns

### Critical Cultural Insights

1. **"집에서 쉽게, 돈 안들고"** - Low barrier entry is essential
   - Always start with free/low-cost approach
   - Emphasize "at home" and "easy" messaging

2. **Efficiency Obsession** - Time-saving is premium value
   - Korean audiences will pay to save time after seeing value
   - Frame paid offerings as "시간 절약" not just content access

3. **Free-to-Premium Funnel** - Standard conversion path:
   - Level 1: Free content (video save, subscribe)
   - Level 2: Free resources (PDF checklist, community)
   - Level 3: Paid shortcut (course, consulting, templates)

## 🎨 Content Guidelines

### Korean Language Style
- Use casual but authoritative tone (반말 in examples, but 존댓말 to viewer)
- Include specific numbers and results (월 300만원, 하루 2시간)
- Emphasize social proof with Korean name format (김OO, 박OO)

### Prohibited Elements (Causes Viewer Dropout)
- ❌ Long self-introductions before 15 seconds
- ❌ Abstract concepts without concrete numbers/examples
- ❌ Valueless intros (get to the point immediately)
- ❌ Missing or unclear CTA
- ❌ Inconsistent energy/tone throughout

### Success Metrics
- **Retention Rate**: Target 50%+ at 3min mark
- **CTR**: Hook should achieve >8% click-through
- **Completion Rate**: 30%+ viewers should reach CTA section

## 📊 File Naming Conventions

- Use Korean for content files: `[주제]` or `[영상제목]`
- Use descriptive English for framework files: `youtube_narration_framework.md`
- Keep files in project root (no complex directory structure yet)

## 🚀 Future Development

When expanding this repository:
- Create `/templates` directory for reusable script templates
- Add `/examples` for successful script case studies
- Consider `/scripts` for automation tools (AI prompt generators, etc.)
- Potential `/analytics` for tracking video performance metrics

---

**Project**: AI_잡돌이
**Framework Version**: v1.0
**Last Updated**: 2025-11-07
