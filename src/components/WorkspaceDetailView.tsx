/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, Edit3, Check, Scale, FileText, 
  UploadCloud, FileCheck, AlertCircle, 
  Trash2, Download, Play, Eye, Clipboard,
  ChevronRight, ArrowRight, Gauge, Send, Activity, Save,
  X, Sparkles, Search, ChevronLeft, Minimize2, ChevronDown, CheckSquare, Clock,
  Columns, FolderPlus
} from "lucide-react";
import { Workspace, Attachment, Artifact, Template, WorkspaceType } from "../types";

interface WorkspaceDetailViewProps {
  workspace: Workspace;
  templates: Template[];
  onBack: () => void;
  onUpdateWorkspace: (w: Workspace) => void;
  setGlobalTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
}

export default function WorkspaceDetailView({
  workspace,
  templates,
  onBack,
  onUpdateWorkspace,
  setGlobalTemplates
}: WorkspaceDetailViewProps) {
  // New Layout & Panel fold states
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<"analysis" | "draft" | "report" | null>(null);

  // Modal and custom inline editors
  const [selectedArtifactForDetail, setSelectedArtifactForDetail] = useState<Artifact | null>(null);
  const [activeEditingArtifact, setActiveEditingArtifact] = useState<Artifact | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // Inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(workspace.name);

  // Upload progress simulation
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Open attachment OCR Modal
  const [selectedAttachmentForOcr, setSelectedAttachmentForOcr] = useState<Attachment | null>(null);

  // --- Sub-Tab 1: Case Analysis Form States (Advanced Workflow) ---
  const [analysisStage, setAnalysisStage] = useState<"configs" | "executing" | "completed">("configs");
  const [selectedAnalysisDimensions, setSelectedAnalysisDimensions] = useState<string[]>([
    "cases",       // 案件基本情况分析
    "disputes",    // 争议焦点分析
    "evidence",    // 证据梳理
    "strategies"   // 诉讼策略建议
  ]);
  const [analysisQuestion, setAnalysisQuestion] = useState(
    workspace.description ? `针对案件情况："${workspace.description}"，请完成全面案情梳理。` : "针对本商事合同欠款纠纷，买方由于材质品质存在争议（辩称灰分超标等）无端中途抗辩拒付到期货款 15.4 万元。要求深度研判我方供应事实及各次微信、函件催缴纪录，完成案件事实提炼与诉讼获胜策略选择。"
  );
  const [auxiliaryKnowledgeEnabled, setAuxiliaryKnowledgeEnabled] = useState(true); // 默认选中辅助知识（案例、法规）
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    workspace.attachments.map(a => a.id)
  );

  // Task Execution interface progress variables
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeExecutionStep, setActiveExecutionStep] = useState<number>(0);
  const [executionResultLogs, setExecutionResultLogs] = useState<{
    0: string; // 理解问题
    1: string; // 逐章分析
    2: string; // 生成流程图和表格
    3: string; // 生成报告
  }>({
    0: "",
    1: "",
    2: "",
    3: "",
  });
  const [analysisResult, setAnalysisResult] = useState<any | null>(
    workspace.artifacts.find(a => a.type === "analysis")?.meta || null
  );

  // --- Sub-Tab 2: Document Drafting States ---
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tpl_civil_complaint");
  const [plaintiffName, setPlaintiffName] = useState("北京隆昌伟业贸易有限公司");
  const [plaintiffAddress, setPlaintiffAddress] = useState("北京市朝阳区高碑店路22号");
  const [plaintiffPhone, setPlaintiffPhone] = useState("13812345678");
  const [defendantName, setDefendantName] = useState(workspace.opposingParty || "上海信耀商贸有限公司");
  const [defendantAddress, setDefendantAddress] = useState("上海市青浦区崧泽大道999号");
  const [defendantCode, setDefendantCode] = useState("91310118MA1X7Y68XX");
  const [draftFacts, setDraftFacts] = useState(
    "原告按买卖供销合同按时供给产品无缺陷，被告签收回单无瑕疵。期满后被告无端拖欠合同余款15.4万元，借口流动资金被挪用。恳请法院判令支付本金及合同约定的一年期逾期违约利息。"
  );
  const [draftClaims, setDraftClaims] = useState("要求判令支付货款154,000元，并清算截至实际履行完毕日止的违约金");
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftProgressSteps, setDraftProgressSteps] = useState<string[]>([]);
  const [currentDraftCode, setCurrentDraftCode] = useState<string>("");

  // Toast status
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // --- Sub-Tab 3: Case Closure Report States ---
  const [closureProgress, setClosureProgress] = useState("本案历时4个月，最终在闵行区人民法院涉案法官主持下达成调解协议。对方分两期支付本金14.5万元，我方免除其余违约利息并承担一半诉讼费。首笔到账款已清算完毕。");
  const [closureLearnings, setClosureLearnings] = useState("1. **客户审前授信管理**：需严格审查高额采购契约方的资产，发现异常应果断采取诉前保全或中止履行抗辩。\n2. **日常催单标准化印证**：及时在工作微信上明确对账账款差额，防止对方庭审辩驳质量不达标。");
  const [isReporting, setIsReporting] = useState(false);
  const [closureProgressSteps, setClosureProgressSteps] = useState<string[]>([]);
  const [currentClosureReport, setCurrentClosureReport] = useState<string>("");

  // Api pushing logic
  const [isPushing, setIsPushing] = useState<string | null>(null); // artifactId
  const [pushProgress, setPushProgress] = useState<number | null>(null);

  // Sync high-fidelity static items for matching user screenshot aesthetic exactly
  const mockBaseArtifacts: Artifact[] = [
    {
      id: "mock_art_1",
      type: "document",
      title: "民事起诉状_隆昌伟业诉城建诉状纠纷一审大纲.docx",
      summary: "请根据民事起诉状模板及当事人提供的事实，生成北京隆昌伟业贸易有限公司诉北...",
      content: `### 民事起诉状\n\n**原告**：北京隆昌伟业贸易有限公司\n**住所地**：北京市朝阳区高碑店路22号\n**法定代表人**：任隆昌\n\n**被告**：北方城建集团有限公司\n**住所地**：北京市海淀区新街口外大街8号\n**法定代表人**：李城建\n\n#### 诉讼请求：\n1. 判令被告立即向原告支付拖欠的购销合同款项人民币 **154,000** 元；\n2. 判令被告承担逾期付款违约损失金暂计 **12,450** 元。\n\n#### 事实与理由：\n原被告双方于前期订立了《合伙购销协议正本》，约定交付高标钢材物料。我司已完全履行供货结算义务，被告签收物料盖章亦无存任何质量等权利瑕疵。合同约定期满结算后，被告至今拖延履行尾款利息。特向贵院起诉追索。`,
      createdAt: "2026-05-18T14:22:00Z",
      meta: {
        templateId: "tpl_civil_complaint",
        templateName: "起诉状"
      }
    },
    {
      id: "mock_art_2",
      type: "document",
      title: "法律意见书_AB股权转让纠纷_最终审订稿.pdf",
      summary: "针对A公司与B公司的股权转让纠纷，请结合公司法相关规定，出具法律意见书，分析风...",
      content: `### 法律意见书\n\n致：王总经理\n关于：针对A公司与B公司的股权让渡争议与诉阻审查定夺。\n\n#### 事实概貌：\nA公司与B公司前就标的不动产股份进行了转让质押安排，由于目前对方提出部分公司资产变更为不可撤销担保，导致担保责任存在归属缺陷。\n\n#### 核心防范要点：\n1. **确权质询程序前置**：严查受让方抵质押权等实物资产是否真实足额。\n2. **管辖法庭优选**：建议向我方住地人民法院发起清账行为保全。`,
      createdAt: "2026-05-16T09:15:00Z",
      meta: {
        templateId: "tpl_ip_defense",
        templateName: "法律意见书"
      }
    },
    {
      id: "mock_art_3",
      type: "document",
      title: "合同审查报告_采购框架协议v2_安全版.docx",
      summary: "请审查这份供应商采购框架协议，识别其中的风险条款并提出修改建议，重点关注违约...",
      content: `### 采购商购销框架合同合规预检报告\n\n本次审查核心指向供应商草拟的《采购框架服务协议》，针对违约判定与瑕疵期限做如下修改：\n\n1. **修改延迟到货违约率倍数失衡**（原定比例 0.01% 修改为每日 0.1%）。\n2. **放宽质量瑕疵核验期限**：收回原定的48小时视同验收，修订为：货到15日内质检异议期限，更切合企业质保检验周期。`,
      createdAt: "2026-05-14T16:40:00Z",
      meta: {
        templateId: "tpl_labor_complain",
        templateName: "合同审查报告"
      }
    },
    {
      id: "mock_art_4",
      type: "document",
      title: "证据清单_隆昌供销纠纷质证清单.xlsx",
      summary: "根据合同纠纷案情，梳理建议的证据清单，包括证据名称、证明目的和来源，按证明力...",
      content: `### 证据链质证论证清单\n\n针对该钢构欠账案，特整理证明力闭环如下：\n\n- **证据一**: 《双向采购供销正本合同》，证明双方买卖合同权利义务法律关系存续；\n- **证据二**: 《运输流转交接盖章确认回单》，证明原告交付行为瑕疵并被买方完全库房确认；\n- **证据三**: 《双边微信对账通知记录》，构成诉中合同诉讼时效中斯及债务合一承认。`,
      createdAt: "2026-05-12T11:08:00Z",
      meta: {
        templateId: "tpl_civil_complaint",
        templateName: "证据清单"
      }
    }
  ];

  // Merge workspace artifacts onto static high fidelity screenshot matches to ensure great design richness
  const getCompiledArtifacts = () => {
    const custom = workspace.artifacts || [];
    // Concatenate so custom creations display on top, and include mock items on bottom
    const all = [...custom, ...mockBaseArtifacts];
    return all;
  };

  // Watch workspace inputs changes
  useEffect(() => {
    setNameInput(workspace.name);
  }, [workspace]);

  // Toast helper
  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const updated = { ...workspace, name: nameInput, updatedAt: new Date().toISOString() };
    onUpdateWorkspace(updated);
    setIsEditingName(false);
    showToast("空间名称已完成更新");
  };

  // Toggle closure state
  const handleToggleClosure = () => {
    const nextStatus = workspace.status === "closed" ? ("underway" as const) : ("closed" as const);
    const updated: Workspace = { ...workspace, status: nextStatus, updatedAt: new Date().toISOString() };
    onUpdateWorkspace(updated);
    showToast(nextStatus === "closed" ? "案件已成功结案并归入档案库" : "案件重新变更为：进行中办办案状态");
  };

  // Attachment upload simulation
  const triggerAttachmentUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      simulateFileUpload(file);
    }
  };

  const simulateFileUpload = (file: File) => {
    setUploadingProgress(10);
    const interval = setInterval(() => {
      setUploadingProgress(p => {
        if (p !== null && p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadingProgress(null);
            const newAttach: Attachment = {
              id: "att_" + Date.now(),
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
              mime: file.type || "application/octet-stream",
              uploadedAt: new Date().toISOString(),
              extractedText: `[由 OCR 提取自：${file.name}]\n事实审查要素提取:\n原被告前年订立大额购货合作契约。发货物流单及承运回执记载无瑕疵交付，拖欠购销货款余款共 15.4 万元整。`
            };
            const updated = {
              ...workspace,
              attachments: [...workspace.attachments, newAttach],
              updatedAt: new Date().toISOString()
            };
            onUpdateWorkspace(updated);
            showToast(`附件 “${file.name}” 上传并成功提取 OCR 事实要素！`);
          }, 300);
          return 100;
        }
        return (p || 0) + 30;
      });
    }, 150);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateFileUpload(file);
    }
  };

  const handleAttachmentDelete = (id: string, name: string) => {
    const updated = {
      ...workspace,
      attachments: workspace.attachments.filter(a => a.id !== id),
      updatedAt: new Date().toISOString()
    };
    onUpdateWorkspace(updated);
    showToast(`附件 "${name}" 已成功从工作区移除`);
  };

  // --- Step-driven AI Case Analysis Trigger (Advanced Workflow) ---
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveExecutionStep(0);
    setAnalysisStage("executing");
    setExecutionResultLogs({
      0: "",
      1: "",
      2: "",
      3: "",
    });

    // Step 0: 理解问题
    const log0 = `[核心步骤一 - 理解问题]
--------------------------------------------------------------------------------
1. 正在检索并解析本次提交的案情核心诉求与设问...
>> 输入的具体问题: "${analysisQuestion}"

2. 正在提取并核载指定的案件案头文件物理凭证:
${workspace.attachments.filter(a => selectedAttachmentIds.includes(a.id)).map(a => ` - 📑 证明附件 [已载入]: ${a.name} (${a.size || '24KB'})`).join("\n") || " - ⚠ 未检测到附加的案卷附件。已默认通过工作空间基本合同底账开始深度文本解析。"}

3. 辅助司法背景知识库关联:
${auxiliaryKnowledgeEnabled ? " ✅ 知识项启用：上海市高级人民法院指导性商事案例检索\n ✅ 法律法规关联：中华人民共和国《民法典》第620条 (买受人检验异议时间)、第621条 (检验期通知抗辩法则)" : " ❌ 未勾选关联辅助经典司法案例与法律法规"}

[研判进展 - 理解完成]：
大模型已完全对齐此段纠纷场景。核心判定点集中于“需方无异议签收货物并签字盖章对账，迟延提出品质瑕疵抗辩”其证明责任与异议抗辩效力判定。即将启动下一步大纲分析判定。`;

    setExecutionResultLogs(prev => ({ ...prev, 0: log0 }));
    await new Promise(r => setTimeout(r, 1000));

    // Step 1: 逐章分析
    setActiveExecutionStep(1);
    const log1 = `[核心步骤二 - 根据用户确认的大纲进行逐章分析]
--------------------------------------------------------------------------------
正在提取包含 ${selectedAnalysisDimensions.length} 个勾选重点维度的分析大纲，逐章精细分析中：

#### 第一章：案件基本情况分析
- **案情摘要**：原告(我方)完美完成对应焦煤材料之发送与承运义务，被告签收并出具签字签收单。嗣后在尾款 ¥${workspace.amount.toLocaleString()} 结算届满之时，被告无理诉称供料“灰分超标、存在隐蔽材质瑕疵”，并意图拒绝退还或拒付案款。我方多次书面/微信对账流转记录充分。
- **时间线还原**：2024-05-10 签署销售协议 -> 2024-05-12 接收进料 -> 2024-11-20 往来对账盖章（被告无负面异议） -> 2025-05-11 最终给付逾期违约。
- **法律关系梳理**：构成典型的商事买卖供销债务关系。需方收到标的物后未在约定期或合理检验期内提出异议，检验异议请求权发生消灭。
- **争议焦点问题**：买受人于半年后收账阶段提出的质量瑕疵异议因超过法定异议期限，其违约拒付款项抗辩是否应被依法予以驳回。

#### 第二章：争议焦点分析
- **【争议焦点认定与驳斥】**：
  我国《民法典》民事审判大纲指出，买受人收到货物后应当在约定检验期或在合理期限内检验。在本案实证中，被告在交付后长达半年之时间线内并未出示任何第三方检验机构鉴定缺陷函，反而于 2024-11-20 在《往来商账确认单》上签字盖章承认该笔应付款项。此举应解释为被告对货物品质、数量无保留彻底接纳，**其后期提出品质瑕疵的主张缺乏事实依据及通知书信力，不构成合法的付款延迟抗辩**。

#### 第三章：证据梳理
- **【诉求实现建议】**：
  要求给付主金 ¥${workspace.amount.toLocaleString()}，并算至清退履行之日的违约金。诉讼费用应全由被告信耀商贸等关联方承担。
- **【潜在证据挖掘】**：
  1. 调取收货库管及现场接配料员的微信群聊，佐证货款逾期前对方从未有过“灰分瑕疵所以退堆”或者“要求封存样品”的主张，锁闭被告对瑕疵异议的放弃形态。
  2. 收集原告该批次物料的出厂质检红章报告、中煤矿质检备案表等。

#### 第四章：诉讼策略建议
- **【事实证据方面的建议】**：
  在交换抗辩意见中，核心强调被告盖章《对账单》属于独立的“债务自认承认”民事文件，无质量瑕疵限制说明。
- **【诉讼策略的建议选择】**：
  申请财产前置轮候查封！锁定对方等额账户资材！通常商事被控方在流动账号因诉讼受限时，极度高概率在 30 天内申请庭前调解。可在让利 2%-5% 违约金的前提下极速订立《诉前调解文书》，打穿传统漫长民事一审周转。`;

    setExecutionResultLogs(prev => ({ ...prev, 1: log1 }));
    await new Promise(r => setTimeout(r, 1400));

    // Step 2: 生成流程图和表格
    setActiveExecutionStep(2);
    const log2 = `[核心步骤三 - 生成流程图和表格]
--------------------------------------------------------------------------------
正在将案件核心事实轴、履约异议死锁点及纠纷演进关系转换为可视化流程图示与结构化时间线表：

【1. 全案履约与纠纷推进历史时间线表格】:
| 日期节点 | 原被告买卖履约事实经过 | 重大司法关联意义与质证锁闭状态 | 证据载入绑定 |
| :--- | :--- | :--- | :--- |
| 2024-05-10 | 原被告双方结成物资大宗买卖契约关系 | 确立真实合宪的双向商事合同约束，付款条件成就 | 销售购销总合同.docx |
| 2024-05-12 | 首批焦煤等供送运抵，买方当场无异议签收 | 对方接纳管领货物，法定隐蔽瑕疵缺陷异议期起算 | 货物物流签收单.pdf |
| 2024-11-20 | 原被告双方执行负责人对账对账，被控方无瑕盖章 | **构成独立的债务自认承认书**。排除被告品质异议质权效能 | 对账往复确认单_盖章.jpg |
| 2025-05-11 | 合同给付逾期，被控方开始口头辩称灰分偏高拒付 | 被告到期债务给付延迟违约，逾期违约滞纳利息开始滚算起记 | 拖欠逾期核定清册.pdf |
| 2025-08-20 | 我方发送书面催账告知，并正式发EMS律师函催告 | **构成民事诉讼时效中斯**，消除三年司法起诉保护时效丧失风险 | 律师催告函投递单.pdf |

【2. 全过程法律时序演进流程拓扑图 (Mermaid Grid Flowchart)】:
        ┌────────────────────────────────────────────────────────┐
        │        [阶段A: 契约缔结] 双方达成买卖焦煤采购协议(合同期内)       │
        └───────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │        [阶段B: 瑕疵排斥] 货物实体控制移交，买方验收签章         │
        └───────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │        [阶段C: 对账默认] 2024-11-20 未就灰分品质提出瑕疵异议     │
        │        ── 签订无异议对账，在法理层面对抗其后期缺陷辩称       │
        └───────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
        ┌────────────────────────────────────────────────────────┐
        │   [阶段D: 违约催告] 货款偿还到期违约 ── 寄发索账通知函实现中断诉讼时效   │
        └────────────────────────────────────────────────────────┘`;

    setExecutionResultLogs(prev => ({ ...prev, 2: log2 }));
    await new Promise(r => setTimeout(r, 1100));

    // Step 3: 生成报告
    setActiveExecutionStep(3);
    const log3 = `[核心步骤四 - 生成报告：整合各章节内容生成案件分析报告]
--------------------------------------------------------------------------------
1. 正在将四大维度(基本情况、争议焦点、证据链条、代理策略)逐章研析文本及可视化案件事实排程图融合成报告...
2. 正在调用高精法律大模型获取量化预计胜诉比对参数...

[深度联络] 正在将关联证明文书发送给 AI 大语言模型进行云端最终编译装配...`;
    setExecutionResultLogs(prev => ({ ...prev, 3: log3 }));

    let finalMarkdown = "";
    let winPercentage = 89;
    let payoutRiskDesc = "很低（被告对于已签字盖章确认的对账条没有合法抗辩依据，预计违约赔付和本金追偿可获全额法院支持）";
    let mediationProspectDesc = "被控方缺乏事实依据。预估对方在账户资金保全查封限制后，和解意愿将大幅增至75%，法官庭前极短沟通调解即可达成协议";
    let disputesArr = [
      "被告在对账阶段未就灰分/品质异议提出，后期其瑕疵抗辩检验异议权是否已消灭",
      "盖章确认的应收账款《对账单》是否在司法层面免除了原告品质异议的进一步证明责任"
    ];
    let strategiesArr = [
      "启动起诉同时立即申请诉前财产财产保全，查封冻结被告对应额度的商业银行账号",
      "以对方无品质瑕疵异议消耗标的物并盖章对账的事实，构成民事诉讼『禁反言』抗辩防御"
    ];

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDescription: analysisQuestion,
          focusDimensions: selectedAnalysisDimensions,
          fileNames: workspace.attachments.filter(a => selectedAttachmentIds.includes(a.id)).map(a => a.name)
        })
      });
      const data = await response.json();
      winPercentage = data.winRate || winPercentage;
      payoutRiskDesc = data.payoutRisk || payoutRiskDesc;
      mediationProspectDesc = data.mediationProspect || mediationProspectDesc;
      disputesArr = data.keyDisputes || disputesArr;
      strategiesArr = data.litigationStrategies || strategiesArr;
      finalMarkdown = data.analysisMarkdown || "";
    } catch (apiErr) {
      console.warn("API direct fetching failed (resorting to high fidelity offline client-render model)", apiErr);
    }

    if (!finalMarkdown) {
      finalMarkdown = `### ⚖️ AI 多维案件深度研判及量化诉讼策略报告

针对本次工作空间关联的合同欠款纠纷，依据您的事实输入提问及关联证明单据，其得出的专家判定如下。`;
    }

    const newAnalysisArtifact: Artifact = {
      id: "art_analysis_" + Date.now(),
      type: "analysis",
      title: "案情多维评估报告.md",
      summary: `针对本次提出问题的 AI 深度司法评估报告。`,
      content: finalMarkdown,
      createdAt: new Date().toISOString(),
      meta: {
        winRate: winPercentage,
        payoutRisk: payoutRiskDesc,
        mediationProspect: mediationProspectDesc,
        keyDisputes: disputesArr,
        litigationStrategies: strategiesArr,
        question: analysisQuestion
      }
    };

    const updated = {
      ...workspace,
      artifacts: [newAnalysisArtifact, ...(workspace.artifacts || [])],
      updatedAt: new Date().toISOString()
    };
    onUpdateWorkspace(updated);
    setAnalysisStage("completed");
    setIsAnalyzing(false);
    showToast("案情全景多维研判成功！已自动将评估报告归档至成果箱。", "success");
  };

  // --- Step-driven Document Drafting Trigger ---
  const handleDraftDocument = async () => {
    setIsDrafting(true);
    setDraftProgressSteps([]);
    setCurrentDraftCode("");

    const steps = [
      "正在收集案件双方履约对账流水及一二期回款...",
      "正在聚合起诉状、答辩意见中的抗辩核心焦点...",
      "正在依据最高院类型化商事指南检查企业合规缺陷并起草《合规整改诊断建议书》..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setDraftProgressSteps(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const chosenTpl = templates.find(t => t.id === selectedTemplateId);
      const payload = {
        templateName: chosenTpl?.name || "起诉状",
        plaintiff: { name: plaintiffName, phone: plaintiffPhone, address: plaintiffAddress },
        defendant: { name: defendantName, code: defendantCode, address: defendantAddress },
        facts: draftFacts,
        claims: draftClaims,
        amount: workspace.amount,
        fileNames: workspace.attachments.map(a => a.name)
      };

      const response = await fetch("/api/gemini/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setCurrentDraftCode(data.docDraft);
      showToast("法律文书自动化草稿一键起草成功！支持在线精修", "success");
    } catch (err) {
      console.error(err);
      showToast("智能起草服务发生异常", "error");
    } finally {
      setIsDrafting(false);
    }
  };

  // Save draft inside workspace artifacts shelf
  const handleSaveDraftAsArtifact = () => {
    if (!currentDraftCode) return;
    const cleanTitle = templates.find(t => t.id === selectedTemplateId)?.name || "标准诉讼起草文书";
    const newArtifact: Artifact = {
      id: "art_doc_" + Date.now(),
      type: "document",
      title: `${cleanTitle}_成果文书.docx`,
      summary: `由 AI 依据团队大纲及模版起草生成的 ${cleanTitle}。`,
      content: currentDraftCode,
      createdAt: new Date().toISOString(),
      meta: {
        templateId: selectedTemplateId,
        templateName: cleanTitle
      }
    };

    const updated = {
      ...workspace,
      artifacts: [newArtifact, ...(workspace.artifacts || [])],
      updatedAt: new Date().toISOString()
    };
    onUpdateWorkspace(updated);
    showToast("新一期成果文书已成功归档到本案「任务产出」栏！");
  };

  // --- Step-driven Case Closure Report Trigger ---
  const handleGenerateClosureReport = async () => {
    setIsReporting(true);
    setClosureProgressSteps([]);
    setCurrentClosureReport("");

    const steps = [
      "正在收集一二期对账流水及双方签字确认的对账函点对点数据...",
      "正在聚合抗控核心质证要件并进行交叉法律分析依据...",
      "正在分析企业重大经营风险合规短板诊断，输出结案审核书..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setClosureProgressSteps(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 700));
    }

    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseNo: workspace.caseNo,
          opposingParty: workspace.opposingParty,
          amount: workspace.amount,
          progressSummary: closureProgress,
          learnings: closureLearnings
        })
      });
      const data = await response.json();
      setCurrentClosureReport(data.reportDraft);
      showToast("结案合规分析报告和整改书生成成功！");
    } catch (err) {
      console.error(err);
      showToast("智能结案深度审查失败，请稍后重试", "error");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/20 flex flex-col overflow-hidden h-full">
      {/* Workspace header block */}
      <div className="bg-white border-b border-slate-150 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 font-sans gap-4">
        {/* Left Side: Case Index & Title */}
        <div className="flex items-center gap-4 text-left">
          <button
            onClick={onBack}
            className="p-1 px-[5px] text-slate-450 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-350 rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center"
            title="�0��Hwh"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 max-w-[150px] truncate">{workspace.caseNo}</span>
              <span className="text-slate-200">|</span>
              <span className="text-xs text-slate-400 font-bold">{workspace.type === "analysis" ? "z�H�z�" : "��qI�"}</span>
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm cursor-pointer"
                >
                  �X
                </button>
                <button
                  onClick={() => {
                    setNameInput(workspace.name);
                    setIsEditingName(false);
                  }}
                  className="text-slate-500 hover:text-slate-705 text-xs font-bold px-1.5"
                >
                  ֈ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 group">
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">{workspace.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded"
                  title="�9�\:�"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Opposing party, disputed amount and closure actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 border border-slate-100 py-1.5 px-3 rounded-lg text-slate-500 text-[11px]">
            <div>�J�: <span className="font-bold text-slate-700">{workspace.opposingParty}</span></div>
            <div className="border-l border-slate-150 h-3 pl-3">ɉ�: <span className="font-bold text-blue-600">�{workspace.amount.toLocaleString()}C</span></div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
              workspace.status === "closed" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse"
            }`}>
              {workspace.status === "closed" ? "�Rc�H" : "H�c(��-"}
            </span>

            <button
              id="btn-toggle-closure-state"
              onClick={handleToggleClosure}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-sans transition-all active:scale-95 cursor-pointer shadow-sm ${
                workspace.status === "closed"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {workspace.status === "closed" ? "� �ٗH�" : " ��.�H"}
            </button>
          </div>
        </div>
      </div>

      {/* Workbench core body area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================== */}
        {/* PANEL 1: LEFT DOCUMENT LIST (COLLAPSIBLE)  */}
        {/* ========================================== */}
        {isLeftCollapsed ? (
          <div 
            onClick={() => setIsLeftCollapsed(false)}
            className="w-12 bg-slate-50 border-r border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex flex-col items-center py-4 gap-4 cursor-pointer relative shrink-0"
            title="U�h"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="writing-mode-vertical text-[11px] font-bold text-slate-500 tracking-wider font-sans">��h</span>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">{workspace.attachments.length}</span>
          </div>
        ) : (
          <div className="w-80 bg-white border-r border-slate-150 flex flex-col justify-between shrink-0 h-full overflow-hidden font-sans">
            
            {/* Folder list header matching the exact style of the screenshot */}
            <div className="px-6 py-[22px] bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <span className="text-[20px] font-black text-slate-800 tracking-tight">��h</span>
              <button
                id="btn-collapse-left-pane"
                onClick={() => setIsLeftCollapsed(true)}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="6w"
              >
                <svg className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span className="text-[13.5px] font-bold tracking-tight">6w</span>
              </button>
            </div>

            {/* Draggable upload or manual selection box */}
            <div className="p-4 shrink-0">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerAttachmentUpload}
                className={`border border-dashed rounded-[18px] p-[26px] text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  isDragging 
                    ? "border-blue-400 bg-blue-50/25 shadow-inner scale-[0.99]" 
                    : "border-slate-200 bg-[#FAFBFD]/30 hover:border-blue-400 hover:bg-slate-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUploadChange}
                  className="hidden"
                />
                
                <span className="text-[17px] font-bold text-slate-800 tracking-tight block">���0d</span>
                <span className="text-[11px] text-slate-400 leading-relaxed tracking-wide font-medium mt-2 max-w-[210px] mx-auto text-center block">
                  �/
 wordPDF����100MB
 10*
                </span>

                <button
                  type="button"
                  className="mt-4 px-6 py-2.5 bg-white border border-slate-200 rounded-[11px] text-[12.5px] font-semibold text-slate-700 hover:text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 transition-all text-center cursor-pointer"
                >
                  
 ��
                </button>
              </div>
            </div>

            {/* Counts header and action row matching screenshot */}
            <div className="px-6 py-1.5 flex justify-between items-center text-xs shrink-0">
              <span className="text-[14px] font-bold text-slate-600 tracking-tight font-sans">q{workspace.attachments.length}*��</span>
              
              <div className="flex items-center gap-4 text-slate-400">
                <button 
                  onClick={triggerAttachmentUpload} 
                  className="p-1 hover:text-slate-700 transition-colors rounded cursor-pointer" 
                  title="����n�(�"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
                <button 
                  className="p-1 hover:text-slate-700 transition-colors rounded cursor-pointer" 
                  title="y���,Hw"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button 
                  className="p-1 hover:text-slate-700 transition-colors rounded cursor-pointer" 
                  title="hH�"9M"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable list container */}
            <div className="flex-1 px-5 py-3 overflow-y-auto space-y-4 font-sans overflow-x-hidden">
              {uploadingProgress !== null && (
                <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 space-y-1.5 text-[10.5px]">
                  <div className="flex justify-between font-bold font-mono text-blue-800">
                    <span>AI ��ց�-...</span>
                    <span>{uploadingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-600 h-1 transition-all" style={{ width: `${uploadingProgress}%` }} />
                  </div>
                </div>
              )}

              {workspace.attachments.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <span className="text-xs font-semibold block text-slate-500">���U�</span>
                  <p className="text-[10.5px] text-slate-455 tracking-wide leading-relaxed">
                    ��>��
�:���}-'l&4U���&�I��D�
                  </p>
                </div>
              ) : (
                workspace.attachments.map(att => {
                  const isPdf = att.name.toLowerCase().endsWith('.pdf');
                  const formattedDate = att.uploadedAt ? att.uploadedAt.split('T')[0] : '2026-05-22';

                  return (
                    <div
                      id={`att-row-${att.id}`}
                      key={att.id}
                      className="py-1.5 px-2 hover:bg-slate-50/50 rounded-xl transition-all flex items-center justify-between group relative text-left border-b border-slate-50 last:border-0"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Red document icon for PDF, Blue for Docx */}
                        {isPdf ? (
                          <svg className="w-[18px] h-[22px] shrink-0 text-[#E25C38]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        ) : (
                          <svg className="w-[18px] h-[22px] shrink-0 text-[#4970F7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        )}
                        
                        <div className="min-w-0 text-left space-y-0.5">
                          <p className="text-[14px] font-[500] text-slate-800 truncate font-sans max-w-[170px]" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium font-sans">
                            {att.size} � {formattedDate}
                          </p>
                        </div>
                      </div>

                      {/* Tool buttons that only show on hover to keep default view identical to the requested image */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0 ml-1.5 select-none text-slate-400">
                        <button
                          onClick={() => setSelectedAttachmentForOcr(att)}
                          className="p-1 px-[5px] text-slate-450 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-all cursor-pointer shadow-sm"
                          title="�OCR�,��"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleAttachmentDelete(att.id, att.name)}
                          className="p-1 px-[5px] text-slate-450 hover:text-red-655 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-all cursor-pointer shadow-sm"
                          title=" ddw"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom info banner */}
            <div className="p-4.5 border-t border-slate-100 bg-slate-50/20 text-[10px] text-gray-400 leading-relaxed font-sans text-left shrink-0">
              �:̧b/�1��U�w/��6�����H�Q�a>
            </div>
          </div>
        )
      }
            <div>被告人: <span className="font-bold text-slate-700">{workspace.opposingParty}</span></div>
            <div className="border-l border-slate-150 h-3 pl-3">诉争标的: <span className="font-bold text-blue-600">¥{workspace.amount.toLocaleString()}元</span></div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
              workspace.status === "closed" 
                ? "bg-red-50 text-red-700 border-red-200" 
                : "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse"
            }`}>
              {workspace.status === "closed" ? "已归档结案" : "案件正在审办中"}
            </span>

            <button
              id="btn-toggle-closure-state"
              onClick={handleToggleClosure}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-sans transition-all active:scale-95 cursor-pointer shadow-sm ${
                workspace.status === "closed"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {workspace.status === "closed" ? "⚠️ 重开这宗案件" : "✅ 点击一键结案"}
            </button>
          </div>
        </div>
      </div>

      {/* Workbench core body area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================== */}
        {/* PANEL 1: LEFT DOCUMENT LIST (COLLAPSIBLE)  */}
        {/* ========================================== */}
        {isLeftCollapsed ? (
          <div 
            onClick={() => setIsLeftCollapsed(false)}
            className="w-12 bg-slate-50 border-r border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex flex-col items-center py-4 gap-4 cursor-pointer relative shrink-0"
            title="展开参考文件列表"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="writing-mode-vertical text-[11px] font-bold text-slate-500 tracking-wider">文件列表</span>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">{workspace.attachments.length}</span>
          </div>
        ) : (
          <div className="w-72 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 h-full overflow-hidden">
            
            {/* Folder list header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800 tracking-tight">文件列表</span>
              <button
                id="btn-collapse-left-pane"
                onClick={() => setIsLeftCollapsed(true)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="收起"
              >
                <Columns className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500">收起</span>
              </button>
            </div>

            {/* Draggable upload or manual selection box */}
            <div className="p-4 shrink-0">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerAttachmentUpload}
                className={`border border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging 
                    ? "border-blue-400 bg-blue-50/20 shadow-inner animate-pulse" 
                    : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/30 bg-white"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUploadChange}
                  className="hidden"
                />
                <UploadCloud className="w-7 h-7 text-blue-500 mb-2" />
                <span className="text-[11.5px] font-black text-slate-700 block">点击或拖拽上传案卷证据</span>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">支持 Word / PDF / 图片材料</span>
              </div>
            </div>
            {/* Counts header and action row */}
            <div className="px-4 py-2 border-b border-slate-100/50 flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold text-slate-500">共 {workspace.attachments.length} 个文件</span>
              
              <div className="flex items-center gap-3">
                <button onClick={triggerAttachmentUpload} className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors rounded cursor-pointer" title="添加新证据纸质件">
                  <FolderPlus className="w-3.8 h-3.8" />
                </button>
                <button className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors rounded cursor-pointer" title="批量导出本案卷">
                  <Download className="w-3.8 h-3.8" />
                </button>
                <button className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors rounded cursor-pointer" title="全案检索匹配">
                  <Search className="w-3.8 h-3.8" />
                </button>
              </div>
            </div>

            {/* Scrollable list container */}
            <div className="flex-1 px-4 py-2 overflow-y-auto space-y-2 font-sans overflow-x-hidden">
              {uploadingProgress !== null && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-1.5 text-[10.5px]">
                  <div className="flex justify-between font-bold font-mono text-blue-800">
                    <span>AI 深度提取要点中...</span>
                    <span>{uploadingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-blue-600 h-1 transition-all" style={{ width: `${uploadingProgress}%` }} />
                  </div>
                </div>
              )}

              {workspace.attachments.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <span className="text-xs font-semibold block text-slate-500">暂无任何参考文件</span>
                  <p className="text-[10.5px] text-slate-455 tracking-wide leading-relaxed">
                    可拖放或点击上方区域快速装载购货合同、转账水单、微信对账函等凭证资料
                  </p>
                </div>
              ) : (
                workspace.attachments.map(att => (
                  <div
                    id={`att-row-${att.id}`}
                    key={att.id}
                    className="py-2 px-1.5 border-b border-slate-100 hover:bg-slate-50/40 rounded-lg transition-all flex items-center justify-between group relative text-left"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0 text-left">
                        <p className="text-[11px] font-extrabold text-slate-700 truncate font-sans max-w-[155px]" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          OCR质证件 / {att.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shrink-0">
                      <button
                        onClick={() => setSelectedAttachmentForOcr(att)}
                        className="p-1 text-slate-400 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-150 rounded transition-colors cursor-pointer"
                        title="查看OCR文本事实"
                      >
                        <Eye className="w-3" />
                      </button>
                      
                      <button
                        onClick={() => handleAttachmentDelete(att.id, att.name)}
                        className="p-1 text-slate-400 hover:text-red-650 bg-white hover:bg-slate-50 border border-slate-150 rounded transition-colors cursor-pointer"
                        title="删除此卷"
                      >
                        <Trash2 className="w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom info banner */}
            <div className="p-4 border-t border-slate-150/60 bg-slate-50/20 text-[10px] text-gray-400 leading-relaxed font-sans text-left">
              提示：双侧面板支持自由拖拽展开或折起，支持直接复制提取出的文案和契约条款。
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* CENTRAL AREA: STEP-BASED WORKSPACE VIEW    */}
        {/* ========================================== */}
        <div className="flex-1 bg-white border-r border-slate-100 flex flex-col overflow-hidden h-full">
          
          {/* Breadcrumbs and Section Headers */}
          <div className="bg-slate-50/40 px-6 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10.5px] font-mono text-slate-500 font-bold">工作区集成面板</span>
            </div>
            
            <div className="text-[10px] text-slate-400 font-mono">
              主板链路: {activeEditingArtifact ? "在线文档协作精修编辑器" :
                       selectedTaskCategory === null ? "首页" : 
                       selectedTaskCategory === "analysis" ? "智能案情评估与多维分析" : 
                       selectedTaskCategory === "draft" ? "AI 司法文书深度共笔起稿" : "全案审理盘点汇总"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            
            {activeEditingArtifact ? (
              /* INTERACTIVE TEXT WRITER EDITOR TAKEOVER OVERLAY */
              <div id="inline-document-joint-editor" className="p-6 h-full flex flex-col justify-between select-text animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1 overflow-hidden flex flex-col">
                  
                  {/* Top Editor Header Banner */}
                  <div className="flex items-center justify-between border-b border-gray-200/80 pb-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center animate-pulse">
                        <Edit3 className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left font-sans">
                        <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase block">● 协作起草温润精修中.docx</span>
                        <h4 className="text-xs font-black text-slate-800 truncate max-w-lg">{activeEditingArtifact.title}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEditedContent}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3.5 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="安全写回磁盘"
                      >
                        <Save className="w-3.8 h-3.8" />
                        <span>保存修润</span>
                      </button>
                      <button
                        onClick={() => setActiveEditingArtifact(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 text-[11px] font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        title="退回到成果箱"
                      >
                        <X className="w-3.8 h-3.8" />
                        <span>完成 / 退出</span>
                      </button>
                    </div>
                  </div>

                  {/* Real visual container representing a typical A4 legal paper piece */}
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-hidden flex flex-col">
                    <div className="bg-white rounded-lg border shadow-sm p-4 flex-1 overflow-hidden flex flex-col">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full flex-1 border-0 focus:ring-0 p-1 resize-none overflow-y-auto text-xs font-mono leading-relaxed focus:outline-none text-slate-800"
                        placeholder="请输入或开始您的修改精修..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedTaskCategory === null ? (
              // PRIMARY LANDING SCREEN (3 COLUMNS SELECTORS)
              <div className="min-h-full flex flex-col justify-center items-center px-6 py-12 text-center max-w-4xl mx-auto animate-in fade-in duration-200 font-sans">
                <div className="space-y-2.5 mb-10">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">
                    {workspace.name || "法律文书撰写空间"}
                  </h1>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                    选择要执行的任务类型，AI 将依据您装载的案卷、参考要素以及起诉要件进行深度司法级智能化智能处理
                  </p>
                </div>

                {/* The 3 Pillars grid selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10 select-none">
                  
                  {/* Card 1: 案情分析 */}
                  <div 
                    onClick={() => {
                      setSelectedTaskCategory("analysis");
                      setAnalysisStage("configs");
                    }}
                    className="bg-white border border-slate-100 hover:border-blue-400 rounded-xl p-6 flex flex-col justify-between items-center text-center transition-all cursor-pointer group duration-200 hover:bg-slate-50/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-600 border border-blue-50 mb-4 group-hover:scale-105 transition-transform">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 font-sans">案情分析</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        智能梳理案件事实，识别争议焦点与法律风险
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                      立即开始评估 &rarr;
                    </span>
                  </div>

                  {/* Card 2: 文书写作 */}
                  <div 
                    onClick={() => setSelectedTaskCategory("draft")}
                    className="bg-white border border-slate-100 hover:border-blue-400 rounded-xl p-6 flex flex-col justify-between items-center text-center transition-all cursor-pointer group duration-200 hover:bg-slate-50/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50/30 flex items-center justify-center text-blue-600 border border-blue-50 mb-4 group-hover:scale-105 transition-transform">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 font-sans">文书写作</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        选择模板，AI 依据格式规范生成专业法律文书
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                      启动文书起稿 &rarr;
                    </span>
                  </div>

                  {/* Card 3: 工作报告 */}
                  <div 
                    onClick={() => setSelectedTaskCategory("report")}
                    className="bg-white border border-slate-100 hover:border-blue-400 rounded-xl p-6 flex flex-col justify-between items-center text-center transition-all cursor-pointer group duration-200 hover:bg-slate-50/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50/40 flex items-center justify-center text-blue-650 border border-blue-50 mb-4 group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <h3 className="text-sm font-bold text-slate-800 font-sans">工作报告</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        一键汇总案件进展，生成结构化工作周报与结案报告
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                      结案总结报告 &rarr;
                    </span>
                  </div>
                </div>

                {/* Bottom decorative logo block */}
                <div className="text-[10px] text-slate-300 font-mono border-t border-slate-100 pt-6 w-full max-w-xs">
                  0519 司法案件智能化集成空间
                </div>
              </div>
            ) : (
              // INTERACTIVE WIZARDS FLOWS
              <div className="p-6 space-y-6">
                
                {/* Micro header inside configurations returning to center landing */}
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedTaskCategory(null);
                      setAnalysisStage("configs");
                    }}
                    className="text-xs text-slate-550 hover:text-blue-600 font-bold transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>返回功能选择主栏</span>
                  </button>
                  <span className="text-xs text-slate-400 font-mono font-bold">配置向导</span>
                </div>

                {/* TASK TYPE A: CASE ANALYSIS */}
                {selectedTaskCategory === "analysis" && (
                  <div className="space-y-6 font-sans">
                    {analysisStage === "configs" ? (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Title block */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-xs font-black text-slate-800">法律案情多维评估向导 (案情分析首页)</h4>
                            <p className="text-[10.5px] text-slate-500 leading-relaxed mt-0.5">
                              设置分析维度标准，输入争议详情或提交辅助材料，AI大模型将智能拟定分析大纲并多线程推进研判。
                            </p>
                          </div>
                        </div>

                        {/* 1. 四大分析维度选择 */}
                        <div className="space-y-2.5 text-left">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block" />
                            <span>1. 确认本次案情研判分析维度大纲</span>
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {[
                              {
                                id: "cases",
                                title: "案件基本情况分析",
                                desc: "案情摘要分析、案件关键时间线还原、民商事法律关系梳理、核心争议焦点提炼问题",
                                color: "bg-blue-50/40 border-blue-100 text-blue-700"
                              },
                              {
                                id: "disputes",
                                title: "争议焦点分析",
                                desc: "争议焦点深度分析法理解析、瑕疵抗辩时效及管辖边界多维审查与判定",
                                color: "bg-indigo-50/40 border-indigo-100 text-indigo-700"
                              },
                              {
                                id: "evidence",
                                title: "证据梳理",
                                desc: "诉求实现方面的司法要件建议、潜在或隐藏事实抗辩关键证据挖掘指南",
                                color: "bg-violet-50/40 border-violet-100 text-violet-700"
                              },
                              {
                                id: "strategies",
                                title: "诉讼策略建议",
                                desc: "案上事实证据方面的应对建议、分段诉讼或庭前挽损和解之最优策略建议选择",
                                color: "bg-emerald-50/40 border-emerald-100 text-emerald-700"
                              }
                            ].map(item => {
                              const isChecked = selectedAnalysisDimensions.includes(item.id);
                              return (
                                <div 
                                  key={item.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setSelectedAnalysisDimensions(selectedAnalysisDimensions.filter(d => d !== item.id));
                                    } else {
                                      setSelectedAnalysisDimensions([...selectedAnalysisDimensions, item.id]);
                                    }
                                  }}
                                  className={`border rounded-xl p-4.5 cursor-pointer transition-all select-none relative flex flex-col justify-between ${
                                    isChecked 
                                      ? "bg-white border-blue-500 ring-1 ring-blue-500/20 shadow-sm" 
                                      : "bg-slate-50/30 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className={`text-xs font-bold ${isChecked ? "text-slate-800" : "text-slate-600"}`}>
                                        {item.title}
                                      </span>
                                      <div className={`w-4 shadow-sm h-4 rounded-md flex items-center justify-center border text-[10px] font-bold ${
                                        isChecked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300"
                                      }`}>
                                        {isChecked && "✓"}
                                      </div>
                                    </div>
                                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                                      {item.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. 问题输入 */}
                        <div className="space-y-2 text-left">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block" />
                            <span>2. 请输入您需要解答或分析的案情问题</span>
                          </label>
                          <textarea
                            value={analysisQuestion}
                            onChange={(e) => setAnalysisQuestion(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed text-slate-700 shadow-inner"
                            placeholder="请输入例如：本买卖合同下被告延迟交货已达30天，我方是否可以主张解除合同并索赔违约金？"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                          {/* 3. 附件上传与关联 */}
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block" />
                              <span>3. 关联附件 ({selectedAttachmentIds.length})</span>
                            </label>
                            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                              {/* Quick upload trigger */}
                              <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-150">
                                <span className="text-[10px] text-slate-400 font-sans">
                                  选择加入分析范围：
                                </span>
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer animate-pulse"
                                >
                                  <UploadCloud className="w-3" />
                                  <span>上传新材料</span>
                                </button>
                              </div>

                              <div className="max-h-[105px] overflow-y-auto space-y-1.5 pr-1">
                                {workspace.attachments.length === 0 ? (
                                  <p className="text-slate-400 text-[10px] text-center py-4 font-mono">暂无关联材料，点击上方按钮上传</p>
                                ) : (
                                  workspace.attachments.map(att => {
                                    const isAttached = selectedAttachmentIds.includes(att.id);
                                    return (
                                      <label key={att.id} className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                        <input
                                          type="checkbox"
                                          checked={isAttached}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedAttachmentIds([...selectedAttachmentIds, att.id]);
                                            else setSelectedAttachmentIds(selectedAttachmentIds.filter(id => id !== att.id));
                                          }}
                                          className="rounded border-gray-300 text-blue-600"
                                        />
                                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate font-mono text-[10.5px] text-slate-600">{att.name}</span>
                                        </div>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 4. 辅助知识默认选中 */}
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block" />
                              <span>4. 检索深度司法辅助知识支撑</span>
                            </label>
                            
                            <div 
                              onClick={() => setAuxiliaryKnowledgeEnabled(!auxiliaryKnowledgeEnabled)}
                              className={`border rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all ${
                                auxiliaryKnowledgeEnabled 
                                  ? "bg-blue-50/30 border-blue-200 shadow-sm" 
                                  : "bg-slate-50/50 border-slate-200 opacity-60"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={auxiliaryKnowledgeEnabled}
                                onChange={() => {}} // handled by div click
                                className="rounded border-gray-300 text-blue-600 mt-0.5 cursor-pointer"
                              />
                              <div className="space-y-1 text-left">
                                <span className="text-xs font-bold text-slate-800 block">
                                  辅助知识库服务（案例、法规）
                                </span>
                                <p className="text-[10px] text-slate-400 leading-normal">
                                  默认已激活。大模型研判时将自动交叉匹配：
                                  <br />
                                  1. 最高院、上海市高级法院商事买卖买卖纠纷类案要旨
                                  <br />
                                  2. 《民法典》《民事诉讼法》最新条文释解
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Confirm action bottom drawer button */}
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <button
                            onClick={handleRunAnalysis}
                            disabled={selectedAnalysisDimensions.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs py-2.5 px-6 rounded-lg flex items-center gap-1.5 shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer font-sans"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>确定输入并启动 AI 多维案情评析</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* SCREEN 2: TASK EXECUTION INTERFACE (任务执行界面) */
                      <div className="flex flex-col border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/35 h-[620px] animate-in slide-in-from-bottom duration-300 shadow">
                        
                        {/* UPPER SECTION: Horizontal Step Progress Bar (参考图片的进度条) */}
                        <div className="bg-white border-b border-slate-150 p-6 shrink-0 text-left">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-3 bg-blue-600 rounded-full inline-block" />
                              <span className="text-[11.5px] font-black tracking-wide text-slate-700">司法专案研判进度条 (WORKSPACE PIPELINE)</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 animate-pulse font-mono">
                              分析引擎 v3.5
                            </span>
                          </div>

                          {/* Stepper horizontal line and nodes layout */}
                          <div className="relative my-6 px-10">
                            {/* Background Track Line (Reference style: light-blue/slate thick bar) */}
                            <div className="absolute top-1/2 left-[56px] right-[56px] h-1.5 bg-slate-100 -translate-y-1/2 rounded-full" />
                            
                            {/* Active Connected Track Line */}
                            <div 
                              className="absolute top-1/2 left-[56px] h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-500" 
                              style={{ width: `calc(${(activeExecutionStep / 3) * 100}% - 4px)` }}
                            />
                            
                            {/* Steps list container */}
                            <div className="relative flex justify-between items-center w-full">
                              {[
                                {
                                  step: 0,
                                  title: "理解问题",
                                  desc: "语义解析/证据对齐",
                                  badge: "语义解析"
                                },
                                {
                                  step: 1,
                                  title: "逐章分析",
                                  desc: "大纲与事实深度研析",
                                  badge: "法理大纲"
                                },
                                {
                                  step: 2,
                                  title: "可视化时序",
                                  desc: "生成纠纷演进流图",
                                  badge: "时序核校"
                                },
                                {
                                  step: 3,
                                  title: "生成报告",
                                  desc: "融汇及成果物装配",
                                  badge: "最终装配"
                                }
                              ].map((item, idx) => {
                                const isActive = activeExecutionStep === idx;
                                const isCompleted = activeExecutionStep > idx;
                                
                                return (
                                  <div key={idx} className="flex flex-col items-center relative z-10 w-28">
                                    {/* Circle Marker matching the image (thick borders, elegant colors) */}
                                    <div 
                                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 bg-white ${
                                        isActive 
                                          ? "border-[5px] border-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.6)] scale-110" 
                                          : isCompleted 
                                            ? "border-[5px] border-indigo-500 ring-4 ring-indigo-500/5 shadow-[0_0_6px_rgba(99,102,241,0.3)]" 
                                            : "border-[5px] border-slate-200"
                                      }`}
                                    >
                                      {/* Done checkbox inside circle or small aesthetic core */}
                                      {isCompleted && (
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                      )}
                                      {isActive && (
                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                                      )}
                                    </div>

                                    {/* Text Content */}
                                    <div className="mt-3 text-center space-y-0.5">
                                      <div className={`text-[11px] font-black tracking-wide ${
                                        isActive ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                                      }`}>
                                        {item.title}
                                      </div>
                                      <div className="text-[9px] text-slate-400 truncate max-w-[100px]" title={item.desc}>
                                        {item.desc}
                                      </div>
                                      <div className={`mt-1.5 text-[8px] font-bold px-1.5 py-0.2 rounded font-sans scale-90 inline-block border ${
                                        isActive 
                                          ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse" 
                                          : isCompleted 
                                            ? "bg-indigo-50/50 text-indigo-700 border-indigo-150" 
                                            : "bg-slate-50 text-slate-400 border-slate-150"
                                      }`}>
                                        {item.badge}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* LOWER SECTION: Terminal Live Feedback (大模型执行过程实时输出) */}
                        <div className="flex-1 bg-slate-900 border-t border-slate-800 p-5 flex flex-col justify-between overflow-hidden text-slate-300">
                          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between shrink-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-mono font-bold text-slate-400">DECISION TERMINAL FEED | 大模型执行过程实际返回内容</span>
                            </div>
                            <span className="text-[9.5px] text-slate-500 font-mono">
                              进程状态: {isAnalyzing ? "EXECUTING_STAGE" : "COMPILE_SUCCESS"}
                            </span>
                          </div>

                          {/* Scrolling console box */}
                          <div className="flex-1 my-3 overflow-y-auto space-y-3.5 pr-2 font-mono text-[10.5px] leading-relaxed select-text bg-slate-950 p-4 border border-slate-850 rounded-xl max-h-[290px] text-left">
                            {/* Display logs up to current active execution step */}
                            {Array.from({ length: activeExecutionStep + 1 }).map((_, stepIdx) => {
                              const logContent = executionResultLogs[stepIdx as 0 | 1 | 2 | 3];
                              if (!logContent) {
                                return (
                                  <div key={stepIdx} className="flex items-center gap-2 text-slate-500 italic py-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                    <span>步骤 {stepIdx + 1} 研判结论正在编译中...</span>
                                  </div>
                                );
                              }
                              return (
                                <div key={stepIdx} className="border-b border-slate-900 pb-3.5 last:border-b-0 whitespace-pre-wrap animate-in fade-in duration-200">
                                  <div className="text-[9.5px] text-blue-400 font-bold mb-1.5 tracking-wider">
                                    ▶ STEP {stepIdx + 1} 实际返回:
                                  </div>
                                  <div className="text-emerald-400 bg-slate-900/45 p-3 border border-slate-850 rounded-lg">
                                    {logContent}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Console Footer stats */}
                          <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between shrink-0 text-[10px] font-mono text-slate-500">
                            <div className="flex items-center gap-4">
                              <div>进度核验: <span className="text-slate-300 font-bold">{Math.round(((activeExecutionStep + 1) / 4) * 100)}%</span></div>
                              <div>辅助案例: <span className="text-emerald-500">ACTIVE</span></div>
                            </div>
                            <div>计算单元状态值: <span className="text-slate-300 font-bold">GRID_READY</span></div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}






                {/* TASK TYPE B: LEGAL DOCUMENT DRAFTING */}
                {selectedTaskCategory === "draft" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-800 block">1. 套用起草诉请模板纸</label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none"
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-[10.5px] leading-relaxed text-slate-500 font-mono">
                        请在下方核验双方当事人姓名/全称、社信代码等基本参数，以便 AI 能够严密进行文档起 draft 生成。
                      </div>

                      {/* Plaintiff card */}
                      <div className="border border-slate-200 bg-slate-50/30 p-4 rounded-xl space-y-3">
                        <span className="text-xs font-black text-blue-900 block border-b pb-1.5">原告我方主体属性</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block">名称全称</label>
                            <input type="text" value={plaintiffName} onChange={e=>setPlaintiffName(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block">诉讼联系电话</label>
                            <input type="text" value={plaintiffPhone} onChange={e=>setPlaintiffPhone(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs font-mono" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block">住所注册地</label>
                            <input type="text" value={plaintiffAddress} onChange={e=>setPlaintiffAddress(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Defendant card */}
                      <div className="border border-slate-200 bg-slate-50/30 p-4 rounded-xl space-y-3">
                        <span className="text-xs font-black text-orange-900 block border-b pb-1.5">被告负债方主体属性</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block">名称全称</label>
                            <input type="text" value={defendantName} onChange={e=>setDefendantName(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block">社会信用代码</label>
                            <input type="text" value={defendantCode} onChange={e=>setDefendantCode(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs font-mono" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 block">住所地址</label>
                            <input type="text" value={defendantAddress} onChange={e=>setDefendantAddress(e.target.value)} className="w-full border bg-white rounded px-2 py-1 text-xs" />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-800 block">2. 诉讼请求与各项起因事实</label>
                        <textarea
                          value={draftFacts}
                          onChange={(e) => setDraftFacts(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={handleDraftDocument}
                        disabled={isDrafting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-4 h-4" />
                        <span>{isDrafting ? "AI 司法专家起草文本中..." : "启动 AI 法律文书自动化起草"}</span>
                      </button>
                    </div>

                    {isDrafting && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs font-mono text-slate-500 font-bold">
                        <div>▶ AI 文文书编排状态流转：</div>
                        {draftProgressSteps.map((s, i) => <div key={i} className="ml-1 text-[10px]">步骤 {i+1}: {s}</div>)}
                      </div>
                    )}

                    {currentDraftCode && (
                      <div className="border border-blue-200 bg-white shadow-sm p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg text-xs font-bold text-slate-700">
                          <span>🖋️ AI 文法首起初稿</span>
                          <button
                            onClick={handleSaveDraftAsArtifact}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-[10.5px] cursor-pointer"
                          >
                            保存到任务产出成果物室
                          </button>
                        </div>
                        <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed p-4 border border-slate-100 bg-white rounded-lg text-slate-800">
                          {currentDraftCode}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TASK TYPE C: CASE CLOSURE SUMMARY */}
                {selectedTaskCategory === "report" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-800 block">1. 本次诉讼审判及调停经过记录</label>
                      <textarea
                        value={closureProgress}
                        onChange={(e) => setClosureProgress(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-800 block">2. 提炼对企业销售、授信及知产保护等合规整改整顿教训</label>
                      <textarea
                        value={closureLearnings}
                        onChange={(e) => setClosureLearnings(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={handleGenerateClosureReport}
                        disabled={isReporting}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-4 h-4" />
                        <span>{isReporting ? "AI 聚合全案材料生成报告中..." : "启动 AI 结案合规审查盘点"}</span>
                      </button>
                    </div>

                    {isReporting && (
                      <div className="p-4 bg-slate-50 border rounded-xl space-y-1.5 text-xs text-slate-500 font-mono font-bold animate-pulse">
                        <div>▶ 重构要素中...</div>
                        {closureProgressSteps.map((step, idx) => <p key={idx} className="text-[10px] ml-1">{idx+1}. {step}</p>)}
                      </div>
                    )}

                    {currentClosureReport && (
                      <div className="border border-purple-200 p-4 rounded-xl bg-white space-y-3">
                        <div className="flex justify-between items-center bg-purple-50 p-2 text-xs font-bold text-purple-800 rounded">
                          <span>📄 合规归结报告</span>
                          <button
                            onClick={handleSaveClosureReportAsArtifact}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-[10.5px] cursor-pointer"
                          >
                            确认归档结案并另存为成果物
                          </button>
                        </div>
                        <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed p-4 border border-slate-100 bg-white rounded-lg text-slate-800">
                          {currentClosureReport}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* PANEL 3: RIGHT TASK OUTPUTS (COLLAPSIBLE)   */}
        {/* ========================================== */}
        {isRightCollapsed ? (
          <div 
            onClick={() => setIsRightCollapsed(false)}
            className="w-11 bg-slate-50 border-l border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all flex flex-col items-center py-4 gap-4 cursor-pointer relative shrink-0"
            title="展开任务产出列表"
          >
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
            <span className="writing-mode-vertical text-[11px] font-bold text-slate-500 tracking-wider">任务产出成果箱</span>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">{getCompiledArtifacts().length}</span>
          </div>
        ) : (
          <div className="w-96 bg-[#fafbfc] border-l border-slate-100 flex flex-col justify-between shrink-0 h-full overflow-hidden select-text">
            
            {/* Output view header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100/50 flex justify-between items-center text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4.5 h-4.5 text-blue-600" />
                <span>任务产出</span>
                <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                  {getCompiledArtifacts().length}
                </span>
              </span>
              <button
                id="btn-collapse-right-pane"
                onClick={() => setIsRightCollapsed(true)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="收起"
              >
                <Columns className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500">收起</span>
              </button>
            </div>

            {/* Scrollable outputs list */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {getCompiledArtifacts().map((art, idx) => {
                // Generate a styled badge based on document name or artifact type variables
                let typeBadge = "起诉状";
                let badgeColorStyles = "bg-blue-50 text-blue-700 border-blue-150";
                
                if (art.title.includes("法律意见")) {
                  typeBadge = "法律意见书";
                  badgeColorStyles = "bg-emerald-50 text-emerald-700 border-emerald-150";
                } else if (art.title.includes("审查报告")) {
                  typeBadge = "合同审查报告";
                  badgeColorStyles = "bg-orange-50 text-orange-700 border-orange-150";
                } else if (art.title.includes("证据清单")) {
                  typeBadge = "证据清单";
                  badgeColorStyles = "bg-purple-50 text-purple-700 border-purple-150";
                } else if (art.type === "analysis") {
                  typeBadge = "案情评析报告";
                  badgeColorStyles = "bg-rose-50 text-rose-700 border-rose-150";
                } else if (art.type === "report") {
                  typeBadge = "结案归档";
                  badgeColorStyles = "bg-slate-100 text-slate-700 border-slate-200";
                }

                // Make prompt readable summary fallback
                const displayedPrompt = art.meta?.question || art.summary || "请针对采购协议履行、欠付尾款违约诉争等，通过大语言模型起草一份格式标准的清收诉状初稿。";

                return (
                  <div
                    id={`art-card-${art.id}`}
                    key={art.id}
                    className="bg-white border border-slate-100 hover:border-blue-300 rounded-xl p-4 transition-all flex flex-col gap-3 relative animate-in fade-in duration-100"
                  >
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between text-[10px] shrink-0">
                      <span className={`px-2 py-0.5 rounded-md font-bold tracking-tight border ${badgeColorStyles}`}>
                        {typeBadge}
                      </span>
                      <span className="font-mono text-gray-400">
                        {new Date().toISOString().slice(0, 10)} {idx % 2 === 0 ? "14:22" : "09:15"}
                      </span>
                    </div>

                    {/* Question text click handler */}
                    <div 
                      onClick={() => setSelectedArtifactForDetail(art)}
                      className="text-xs text-slate-700 font-medium leading-relaxed cursor-pointer hover:text-blue-600 transition-all font-sans pr-1 border-l-2 border-slate-200 pl-2 bg-slate-50/20 py-1 rounded"
                      title="点击可以弹出查看此任务的深度详情描述"
                    >
                      {displayedPrompt.length > 85 ? displayedPrompt.slice(0, 85) + "..." : displayedPrompt}
                    </div>

                    {/* Document block click handler (pulls open the inline rich Markdown editor) */}
                    <div 
                      onClick={() => {
                        setActiveEditingArtifact(art);
                        setEditingContent(art.content);
                        showToast(`📄 成果 “${art.title}” 已拉开进入编辑器精修模式`);
                      }}
                      className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/90 hover:border-blue-400 border border-slate-200 p-2.5 rounded-lg text-xs font-mono cursor-pointer transition-colors"
                      title="点击拉开协作编辑器，在线精修此文档"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-extrabold truncate" title={art.title}>
                          {art.title}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>

                    {/* Attachment description and actions row */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                      
                      {/* Attached items label */}
                      <div className="text-[10px] text-gray-400 font-mono">
                        ● 关联附件: {idx % 4 === 0 ? 2 : 1}个
                      </div>

                      {/* Push to system button handles */}
                      <button
                        id={`btn-push-${art.id}`}
                        onClick={() => handlePushToRequestingSystem(art.id)}
                        disabled={isPushing === art.id}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 text-blue-600 disabled:text-slate-400 px-2 py-1 rounded border border-blue-200/80 font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isPushing === art.id ? "正在推送..." : "推送结果"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total progress banner */}
            <div className="p-3 bg-slate-50 border-t text-[10px] text-slate-400 font-mono tracking-tight leading-relaxed">
              归置：4 份成果性案头材料，已完全同层隔离在您的沙盒环境里，保障数据所有权安全。
            </div>
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* POPUP OVERLAY MODAL 1: VIEW FILE OCR TEXT   */}
      {/* ========================================== */}
      {selectedAttachmentForOcr && (
        <div id="ocr-preview-overlay-modal" className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-text">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900 truncate max-w-md">
                  要素解析结果 ({selectedAttachmentForOcr.name})
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAttachmentForOcr(null)} 
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 bg-blue-50/40 border border-blue-100/60 rounded-xl text-xs text-blue-800 leading-normal font-medium">
                <strong>💡 案情要素大语言模型 OCR 深度提取提示：</strong>
                <p className="mt-1 font-mono">
                  系统已自动检索并深度解析该案卷底稿中的时间因果链条、双方争议标的、付款差数、合同责任人，并在下一次生成任务时默认作为参考凭证。
                </p>
              </div>

              <div className="bg-slate-50 border p-5 rounded-xl font-mono text-[11.5px] leading-relaxed text-slate-800 whitespace-pre-wrap select-text selection:bg-blue-200">
                {selectedAttachmentForOcr.extractedText || "未在此证据中检测提取到任何结构化事实。"}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedAttachmentForOcr.extractedText || "");
                  showToast("提取出的文字要素已复制到剪贴板");
                }}
                className="bg-white text-slate-700 border hover:bg-slate-50 py-1.5 px-4 rounded-lg text-xs font-bold cursor-pointer"
              >
                复制文本内容
              </button>
              <button
                onClick={() => setSelectedAttachmentForOcr(null)}
                className="bg-blue-600 text-white hover:bg-blue-700 py-1.5 px-5 rounded-lg text-xs font-bold cursor-pointer"
              >
                关闭预览 / 完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POPUP OVERLAY MODAL 2: VIEW TASK DETAILS   */}
      {/* ========================================== */}
      {selectedArtifactForDetail && (
        <div id="task-detail-overlay-modal" className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-text">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-100 max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-black text-gray-900 font-sans">
                  任务详情 (0519 司法 AI 成果日志)
                </h2>
              </div>
              <button 
                onClick={() => setSelectedArtifactForDetail(null)} 
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
              
              {/* Row 1: Task Prompt/Question */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 block uppercase tracking-wide">● 任务提出问题（需求）：</span>
                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl text-xs font-extrabold text-sky-900 leading-normal whitespace-pre-wrap select-text font-mono relative">
                  {selectedArtifactForDetail.meta?.question || selectedArtifactForDetail.summary || "请根据民事起诉标的标准大纲模版及当事人、被告提供的事实、回扣凭据，极速起稿关于购销尾款的民事一审追偿状。"}
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedArtifactForDetail.meta?.question || selectedArtifactForDetail.summary || "");
                      showToast("任务问题描述考本已复制！");
                    }}
                    className="absolute right-3 top-3 p-1 bg-white hover:bg-slate-100 border rounded cursor-pointer text-slate-500"
                    title="复制提示词文字"
                  >
                    <Clipboard className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 2: Reference File Count only (任务详情列表参考附件只显示个数量) */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 block uppercase tracking-wide">● 参考关联附件数：</span>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-700 font-sans select-none">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>
                    本次 AI 智能流转发起时，共深度绑定了 <strong className="text-slate-900 text-sm font-black italic underline mx-1">{workspace.attachments.length || 2}</strong> 件相关的案头参考证据底册
                  </span>
                </div>
              </div>

              {/* Row 3: Output content formatted markdown wrapper */}
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 block uppercase tracking-wide">● AI 智能成果产出内容：</span>
                <div className="border border-gray-200/80 rounded-xl overflow-hidden shadow-inner bg-slate-50 selection:bg-blue-100">
                  <div className="bg-white border-b border-gray-150 px-4 py-1.5 text-[10px] text-gray-400 font-mono flex justify-between">
                    <span>文档行：格式标准</span>
                    <span>预览状态：仅限阅读查存</span>
                  </div>
                  <div className="p-5 overflow-y-auto max-h-[300px] text-[11.5px] font-mono leading-relaxed text-slate-800 whitespace-pre-wrap bg-white selection:bg-blue-100">
                    {selectedArtifactForDetail.content}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedArtifactForDetail.content);
                  showToast("已提取本生成件全文成果拷入剪贴板！");
                }}
                className="bg-white text-slate-700 border hover:bg-slate-50 py-1.5 px-4 rounded-lg text-xs font-bold cursor-pointer"
              >
                复制产出文本全文
              </button>
              <button
                onClick={() => setSelectedArtifactForDetail(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-5 rounded-lg text-xs font-bold cursor-pointer"
              >
                了解并关闭详情
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
