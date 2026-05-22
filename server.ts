/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry.
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini GenAI SDK successfully initialized on the server-side.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not configured. Server will run in High-Fidelity Mock Mode.");
}

// -------------------------------------------------------------
// AI API Endpoints
// -------------------------------------------------------------

/**
 * Endpoint 1: Smart chat assistant Q&A
 */
app.post("/api/gemini/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Fallback realistic responses if Gemini isn't available
  const lowerMsg = message.toLowerCase();
  let mockReply = "";
  let suggestedAction: any = undefined;

  if (lowerMsg.includes("起诉") || lowerMsg.includes("写文书") || lowerMsg.includes("模版")) {
    mockReply = "您好！我已理解您的办案述求。我们可以在当前工作空间中使用您团队中的【民事起诉状（合同纠纷）】模版或者【离婚协议标准书】来为您智能起草一份正式文档。我会为您匹配最新的案件事实，提取最完整的原告与被告信息。\n\n**是否需要前往工作空间立即开始“文书起草”？**";
    suggestedAction = {
      label: "创建/跳转到文书起草空间",
      type: "create_workspace",
      payload: { type: "draft", name: "民事起诉文书协同空间_" + new Date().toISOString().slice(0, 10) }
    };
  } else if (lowerMsg.includes("分析") || lowerMsg.includes("预测") || lowerMsg.includes("胜诉")) {
    mockReply = "好的，我已经针对您提交的案情和证据材料做了全方位的检索与匹配。我们可以立刻开启【案情分析】，计算其胜诉概率。我还会给出精准的违约争议焦点，提取关键案卷时间线以及诉讼防范策略。\n\n**是否立即开启“案情分析及胜诉概率预测”？**";
    suggestedAction = {
      label: "前往案情分析空间",
      type: "go_analyze",
      payload: { type: "case_analysis" }
    };
  } else if (lowerMsg.includes("结案") || lowerMsg.includes("报告") || lowerMsg.includes("总结")) {
    mockReply = "没问题。在一键结案模块中，我可以帮您把审理过程、代理意见、判决情况以及后续执行状态整合成一份极其标准的公司合规结案报告，无需再手动汇总繁琐文件。\n\n**是否进入空间自动编写“结案报告”？**";
    suggestedAction = {
      label: "一键生成结案总结",
      type: "go_report",
      payload: { type: "report" }
    };
  } else {
    mockReply = "您好！我是 0519 案件智能化系统办案助手。很高兴能协助您推进法律日常案卷整理，以及全流程智能化办案事务。\n\n您可以对我提问，例如：\n- *“分析一下关于民间借贷纠纷案件的违约胜诉概率”*\n- *“帮我起草一份买卖合同纠纷的民事起诉状初稿”*\n- *“汇总案件进展，一键生成结案总结报告”*";
  }

  if (!ai) {
    return res.json({ text: mockReply, suggestedAction });
  }

  try {
    const prompt = `你是一个高度专业的法律司法AI助手。用户询问: "${message}"。
请分析用户的真实法条/文书/意图并给予富有同理心且简明专业的建议。
如果用户的消息表示想:
1. "起草"、"写诉状"、"拟起诉书"、"文书相关"，请说明可以帮他快速起草文书，并在回答文本中提及支持一键创建文书撰写空间。
2. "分析案件"、"胜诉率"、"赢的可能性"、"法律关系分析"，请说明可以进行精准量化案情预测并提供胜诉预测图。
3. "结案报告"、"结案总结"、"写结案"、"总结案件"，请说明智能助手能一键聚合流转材料，提供标准化结案合规报告。
对于上述行为，在回答后返回最友好的问候。

提供简短（不超过250字）的Markdown格式中文回答。`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // Add current prompt
    chatHistory.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatHistory,
      config: {
        temperature: 0.7,
      }
    });

    const reply = response.text || mockReply;
    return res.json({ text: reply, suggestedAction });
  } catch (err: any) {
    console.error("Gemini Chat API Error:", err);
    return res.json({ text: mockReply, suggestedAction, error: err.message });
  }
});

/**
 * Endpoint 2: Advanced Case Analysis & Win-Rate Structurer
 */
app.post("/api/gemini/analyze", async (req, res) => {
  const { caseDescription, focusDimensions, fileNames } = req.body;

  const defaultResult = {
    winRate: 75,
    payoutRisk: "中低（预估赔付在 10% - 15% 核心违约金区间，由于我方履行了主要催收告知义务）",
    mediationProspect: "双方针对利息计算仍有争议，建议调解让步5k到1.2w，和解概率约65%",
    keyDisputes: [
      "借款事实是否真实存在以及款项支付流水是否完整闭环",
      "逾期利息的计算标准是否超出国家法律保护的司法利率红线上限",
      "合同约定管辖法院条款是否真实有效，是否符合约定自愿原则"
    ],
    litigationStrategies: [
      "强化转账凭证与辅助微信聊天记录的言辞印证关联，形成无瑕疵证据链",
      "若对方提出诉讼时效抗辩，应立刻出示近两年来不间断发送的电子催款函及EMS快递单",
      "在庭前调解中表现出强硬但可退让姿态，缩短诉讼周期以达到极速回款目的"
    ],
    timelineEvents: [
      { date: "2024-05-10", event: "原被告双方签订《民间借贷借款合同》，约定金额10万元，期限1年" },
      { date: "2024-05-11", event: "原告通过个人银行账户向被告成功转账共计10万元，完成合同交付" },
      { date: "2025-05-11", event: "借款期满，被告未按约定清偿本息，原告进行第一次电话正式催收" },
      { date: "2025-08-20", event: "原告通过微信发送正式催款告知书，被告承诺分期返还" },
      { date: "2026-02-15", event: "原告委托律师发送正式律师函，并妥善保留EMS司法回执单证" }
    ],
    analysisMarkdown: `### ⚖️ 案情深度剖析与论证报告

本系列纠纷符合**买卖与民间借贷复合型**交易特征。根据提交的说明，核心主张成立，债务边界边界清晰，借贷要件（合意+交付）基本具备。

#### 一、 证明力审查要点
1. **款项实际交付**：银行汇款10万元凭证直接确立了资金拆借的法律事实，证据等级为**A级（最高）**。
2. **催款效力连续**：2025年后的微信联络与邮寄的律师函，成功构成了**诉讼时效中斯**的发生，消除了时效抗辩阻碍。

#### 二、 防范及抗辩策略
- **针对被告利率抗辩**：建议将利息追索范围严格限定在约定上限（不超过合同成立时一年期贷款市场报价利率【LPR】的四倍）。
- **管辖权博弈**：守信于原告住所地，防止诉讼周期因管辖权异议审查而再行拖延。`
  };

  if (!ai) {
    return res.json(defaultResult);
  }

  try {
    const prompt = `你是一个极其资深的民商事审判法官兼企业高级法律合规顾问。
请分析以下案件事实，输出结构化的纠纷要点评析、赔付风险、调解可能性、诉讼策略及时间线。

【案情描述】：
${caseDescription || "无描述"}

【关注核心维度】：
${focusDimensions?.join(", ") || "无指定"}

【参考关联附件档案】：
${fileNames?.join(", ") || "未提供附件"}

注意：你必须严格遵循预先定义的 JSON Schema 返回结果。所有输出必须为专业的中文表述（请不要包含额外的英文属性）。
请确保计算得出一个合理的合理胜诉概率（数字1-99，由于民商事案件无100%，多介于30-90%之间），整理关键的争议焦点（最少2条），诉讼策略（最少2条），和真实连贯的时间线。并在 analysisMarkdown 中提供专业的分析。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winRate: {
              type: Type.INTEGER,
              description: "预计胜诉概率得到的百分比数字 (1 to 99)"
            },
            payoutRisk: {
              type: Type.STRING,
              description: "简明赔付与经济损失风险评估"
            },
            mediationProspect: {
              type: Type.STRING,
              description: "案件和解或法院调解前景分析"
            },
            keyDisputes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "整理的核心争议焦点列表"
            },
            litigationStrategies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "针对性的诉讼/争议解决防范策略列表"
            },
            timelineEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "事件时间，格式 YYYY-MM-DD" },
                  event: { type: Type.STRING, description: "事件发生的具体说明" }
                },
                required: ["date", "event"]
              },
              description: "基于本案材料梳理出的事实时间线"
            },
            analysisMarkdown: {
              type: Type.STRING,
              description: "使用Markdown格式书写的深度案情评析与论证报告。包含一级、二级标题，条理清晰"
            }
          },
          required: ["winRate", "payoutRisk", "mediationProspect", "keyDisputes", "litigationStrategies", "timelineEvents", "analysisMarkdown"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : null;
    if (bodyText) {
      const parsed = JSON.parse(bodyText);
      return res.json(parsed);
    } else {
      return res.json(defaultResult);
    }
  } catch (err: any) {
    console.error("Gemini Analysis API Error:", err);
    return res.json({ ...defaultResult, apiErr: err.message });
  }
});

/**
 * Endpoint 3: Intelligence Document Drafting
 */
app.post("/api/gemini/draft", async (req, res) => {
  const { templateName, plaintiff, defendant, facts, claims, fileNames } = req.body;

  const demoComplaint = `### 民事起诉状

**原告**：${plaintiff?.name || "张三"}，${plaintiff?.gender || "男"}，${plaintiff?.birth || "1988年3月5日出生"}，民族：汉，联系电话：${plaintiff?.phone || "13800001234"}，住址：${plaintiff?.address || "北京市海淀区中关村南大街1号"}。
${plaintiff?.extra || ""}

**被告**：${defendant?.name || "北京华夏某科技有限公司"}，统一社会信用代码：${defendant?.code || "91110108MA00XXXXXX"}，注册地址：${defendant?.address || "北京市朝阳区建国门外大街88号"}，法定代表人：${defendant?.legalPerson || "李四"}，电话：${defendant?.phone || "010-88889999"}。
${defendant?.extra || ""}

---

#### 诉讼请求：
1. 判令被告立即向原告支付到期未付的借款本金人民币 **${req.body.amount || "100,000"}** 元；
2. 判令被告向原告支付逾期未还违约金（按年利率12%计算，自2025年5月1日起计算至被告实际履行返还义务之日止。暂计人民币： **6,200** 元）；
3. 本案所有案件受理费、邮寄送达费等诉讼维权必要成本全部由被告悉数承担。

#### 事实与理由：
${facts || `原被告系长期合作伙伴。原告于2024年5月10日向被告转账借出款据，双方签订《借款协议》明确约定借款期限12个月，年息6%。然而合同借款到期后被告屡次以各种借口搪塞拖延，至今未归还。原告为维护自身合法民事权益，特向贵院提起人诉讼，恳请予以公正裁判和执行。`}

【所附原始档案凭证证据】：
${fileNames?.length ? fileNames.map((f: string) => `- 证据关联项：${f}`).join("\n") : "- 银行流水转账截图证明.png\n- 催收短信复印录音.pdf"}

此致
**人民法院**

具状人（签字）：_________________
日期：2026年5月22日`;

  if (!ai) {
    return res.json({ docDraft: demoComplaint });
  }

  try {
    const prompt = `你是一个极其严谨规范的法院执业律师。请起草一份符合我国《民事诉讼法》起起诉标准格式的文书稿件（例如：民事起诉状、答辩状等）。
你应当优先套用指定的模版名称：【${templateName || "民事起诉状"}】。

原告基本信息：
- 姓名/公司名：${plaintiff?.name || "张三"}
- 性别/证件类型等：${plaintiff?.gender || "未知"} ${plaintiff?.birth || ""}
- 地址与诉讼联系电话：${plaintiff?.address || "未提供"}, ${plaintiff?.phone || "未提供"}

被告基本信息：
- 姓名/商事名称：${defendant?.name || "李四"}
- 注册代码或证件：${defendant?.code || "未提供"}
- 地址与联系：${defendant?.address || "未提供"}, ${defendant?.phone || "未提供"}

起草的关键事实与法理依据：
${facts || "买卖合同约定违约不履行给付义务"}

诉讼主张/抗辩意图核心：
${claims || "要求支付货款及合同违约赔偿金"}

关联的起诉证据说明：
${fileNames?.join(", ") || "未提供"}

请按照我国诉讼司法文书体例，返回完整、可直接用作答辩起诉材料的Markdown普通法律文件，要求逻辑缜密。不要包含任何无意义的助词，直接输出符合起诉书框架风格的内容。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    const resultDoc = response.text || demoComplaint;
    return res.json({ docDraft: resultDoc });
  } catch (err: any) {
    console.error("Gemini Draft API Error:", err);
    return res.json({ docDraft: demoComplaint, apiErr: err.message });
  }
});

/**
 * Endpoint 4: One-Click Structural Case Closure Report
 */
app.post("/api/gemini/report", async (req, res) => {
  const { caseNo, opposingParty, amount, progressSummary, learnings } = req.body;

  const defaultReport = `### 📌 【公司法务合规归档】智能化结案审查报告

---

#### 一、 案件基本概况与标的流向
1. **案件编号**：${caseNo || "(2026)京01民初0519号"}
2. **诉讼对手**：${opposingParty || "某信息科技服务有限公司"}
3. **诉累总标的**：人民币 **${amount || "100,000"}** 元
4. **结案归档日期**：2026年5月22日

#### 二、 审理事实、过程推进与核心代理词
- **合同签署与纠纷起源**：于销售服务合同有效期内，对方发生资金断裂引起拖延，原告随即采取诉前保全行动。
- **审判定音**：案件采取法庭调解途径。我司团队根据详实证据主张了全部核心本金。对方妥协并分期返还了共计 $90,000$ 元，并于指定到期日完全结算。
- **阶段性处置情况**：已落实执行终结，无遗留负债漏洞。

#### 三、 诉讼抗辩过程与经验教训总结（合规建议）
- **经验沉淀**：
  ${learnings || `1. **应收账款预警前移**：合同内应当提前配置账期催支自动提醒，逾期达到15天立即书面固定违约事实。
  2. **诉前证据链闭环**：日常销售沟通记录应指定专人备份，尤其是包含确认账款对账单的盖章扫描件。`}
- **后续复盘**：相关合同标准模版已同步逆向分发到公司大系统。

报告审查人：高级合规专家王青玥  
0519 案件智能化办案中心复核归档（已电子存根）`;

  if (!ai) {
    return res.json({ reportDraft: defaultReport });
  }

  try {
    const prompt = `你是一个跨国公司的高级法务合规合伙人。需要针对一份结案的诉讼案，生成企业法务标准的归档复盘总结报告（结案报告）。
案件详细档案：
- 案件编号：${caseNo}
- 对手方：${opposingParty}
- 诉讼总涉案金额：${amount} 元
- 办案过程总结：${progressSummary || "无总结"}
- 经验与教训沉淀：${learnings || "无总结"}

请用客观、逻辑自洽的高管复盘口吻，输出一份全面的Markdown格式合规复盘结案报告。要求格式精美、富有见地，给企业非法律业务人员提供有据可依的合规建议。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
      }
    });

    return res.json({ reportDraft: response.text || defaultReport });
  } catch (err: any) {
    console.error("Gemini Report API Error:", err);
    return res.json({ reportDraft: defaultReport, apiErr: err.message });
  }
});

// Serve Vite middleware or public/dist assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static handler folder routing set to:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted and listening on standard port ${PORT}`);
  });
}

startServer();
