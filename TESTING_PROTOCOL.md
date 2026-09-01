# AI Teacher Conversational Testing Protocol

This document defines the standardized test suite to verify that the **AI Teacher** application reliably:
1. Answers general academic and educational questions using the full **Gemini 3.1 Flash native knowledge base**.
2. Accurately prioritizes **Teacher Memory / Institutional Knowledge** for academy-specific queries.
3. Successfully retrieves and verifies **Current Events & Live GK** via real-time search grounding and primary sources.
4. Executes real-time **Tool Actions** (e.g. `openWebsite`) without interrupting the conversational flow.

---

## Pre-Requisites & Environment Setup

- **Platform**: Web Audio 16kHz input / 24kHz PCM output via WebSocket or HTTP voice fallback.
- **Model**: `gemini-3.1-flash-live-preview` (Voice: `Kore`).
- **Target Response Format**: Voice-to-Voice (1 to 3 snappy, conversational sentences in Hindi, Hinglish, or English).

---

## 1. General Knowledge & Academic Probes (Baseline AI Verification)

*Objective*: Confirm that the AI uses its native intelligence across sciences, math, history, and reasoning without artificial restrictions.

| Test ID | Spoken / Audio Input Prompt | Expected Response Summary | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **GK-01** | *"What is photosynthesis?"* or *"प्रकाश संश्लेषण क्या होता है?"* | Explains the conversion of sunlight, water, and $CO_2$ into glucose and oxygen in a concise, engaging way. | Answers accurately using native biological knowledge. |
| **GK-02** | *"Why do objects fall towards the earth?"* or *"गुरुत्वाकर्षण (Gravity) क्या है?"* | Explains gravitational pull and Newton/Einstein principles simply. | Demonstrates fundamental physics understanding. |
| **GK-03** | *"What is the capital of France?"* or *"फ्रांस की राजधानी क्या है?"* | Directly identifies **Paris**. | Quick, direct factual retrieval. |
| **GK-04** | *"What is 25 multiplied by 16?"* or *"25 गुणा 16 कितना होता है?"* | Correctly calculates and states **400**. | Accurate real-time mathematical reasoning. |
| **GK-05** | *"Who was the first President of India?"* or *"भारत के प्रथम राष्ट्रपति कौन थे?"* | Names **Dr. Rajendra Prasad**. | Accurately retrieves standard historical facts. |

---

## 2. Institutional & Teacher Memory Probes (Custom Memory Priority)

*Objective*: Verify that specific institutional and custom academy records take priority over generic AI responses.

| Test ID | Spoken / Audio Input Prompt | Expected Response Summary | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **INST-01** | *"Who created you?"* or *"तुम्हें किसने बनाया है?"* | Proudly acknowledges creator **SP** and developer/producer **Mithila Academy**. | Reflects institutional memory; does not invent third-party names. |
| **INST-02** | *"What is your name?"* or *"आपका नाम क्या है?"* | Identifies herself as **AI Teacher** at Mithila Academy. | Adheres to official persona and academy identity. |
| **INST-03** | *"What is Mithila Academy?"* or *"मिथिला एकेडमी क्या है?"* | Explains that it is the educational institution founded by SP for student mentoring. | Uses registered Teacher Knowledge repository. |
| **INST-04** | *"यह उत्तर गलत है"* (Student correction feedback) | Responds with: *"धन्यवाद, मैंने इस प्रश्न को Teacher review के लिए दर्ज कर लिया है।"* | Logs feedback into the review system seamlessly. |
| **INST-05** | *"Teacher PIN: SP @9631"* (Teacher Mode) | Acknowledges verification of Teacher SP and enters secure administrative mode. | Verifies voice authentication and admin session state. |

---

## 3. Current Events & Live Grounding Probes (Real-Time Functionality)

*Objective*: Confirm that time-sensitive facts and current affairs leverage real-time search grounding and official primary sources.

| Test ID | Spoken / Audio Input Prompt | Expected Response Summary | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **LIVE-01** | *"Who is the current President of India?"* | Identifies **Droupadi Murmu** (or latest verified incumbent). | Validates current constitutional post accuracy. |
| **LIVE-02** | *"Who won the latest cricket / sports tournament?"* | Searches live primary sources and delivers the verified outcome with date context. | Uses live search grounding tool when needed. |
| **LIVE-03** | *"What is the latest space mission by ISRO?"* | Delivers updated mission data verified from ISRO / PIB. | Reflects recent updates without hallucination. |

---

## 4. Browser Actions & Tool Probes (Voice-to-Action)

*Objective*: Verify that tool calls execute immediately on the client browser while maintaining voice conversation.

| Test ID | Spoken / Audio Input Prompt | Expected Response Summary | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **TOOL-01** | *"Open YouTube"* or *"यूट्यूब खोलो"* | Executes `openWebsite` for `https://youtube.com` and provides a witty spoken confirmation. | Opens target URL in new tab / window. |
| **TOOL-02** | *"Open Google"* or *"गूगल खोल दो"* | Executes `openWebsite` for `https://google.com`. | Tool call completes with status `opened`. |

---

## Execution Workflow & Pass / Fail Standard

1. **Pass Standard**:
   - Spoken latency $\le 1.5\text{s}$ over high-speed connection.
   - All **General Knowledge** questions answer immediately from base intelligence.
   - All **Institutional** questions prioritize registered Teacher Knowledge.
   - All **Live Events** cross-reference primary sources when queried.
   - No audio stream lockups or unexpected session disconnections.
2. **Failure Remedy**:
   - If quota exhaustion occurs on live search, verify that local fallback knowledge answers gracefully without throwing 429 exceptions to the student.
