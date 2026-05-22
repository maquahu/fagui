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

  // --- Sub-Tab 1: Case Analysis Form States ---
  const [analysisFacts, setAnalysisFacts] = useState(
    workspace.description || "本案争议核心为货款纠纷。买方辩称合同到期未支付货尾款15.4万元，理由是供销货物存在缺陷（灰分偏高）。我方已发送多道催款通知信及正式律师函。主要有发货物流及部分付款流水记录。"
  );
  const [focusDimensions, setFocusDimensions] = useState<string[]>(["违约判定"]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>(
    workspace.attachments.map(a => a.id)
  );
  const [analysisProgressSteps, setAnalysisProgressSteps] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // --- Step-driven AI Case Analysis Trigger ---
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgressSteps([]);
    setAnalysisResult(null);

    const steps = [
      "正在深度提取关联法案、民诉法律法规及上海高院商事买卖审判定规...",
      "正在审查由于灰分超标被告提出的品质瑕疵抗辩效力评定与论据比对...",
      "正在计算转账凭证加发货回执对诉讼时效中斯与债务确认的胜算闭环模型...",
      "正在最终生成完备量化的胜诉预测大盘数值与风险控制代理路径建议..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setAnalysisProgressSteps(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 700));
    }

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDescription: analysisFacts,
          focusDimensions: focusDimensions,
          fileNames: workspace.attachments.filter(a => selectedAttachmentIds.includes(a.id)).map(a => a.name)
        })
      });
      const data = await response.json();

      setAnalysisResult(data);

      const newArtifact: Artifact = {
        id: "art_analysis_" + Date.now(),
        type: "analysis",
        title: "AI 案情评析及量化胜诉预测报告",
        summary: `利用 AI 大语言模型对本案进行量化研判，预计胜诉率: ${data.winRate || 85}%。`,
        content: data.analysisMarkdown || "案情分析内容",
        createdAt: new Date().toISOString(),
        meta: {
          winRate: data.winRate,
          payoutRisk: data.payoutRisk,
          mediationProspect: data.mediationProspect,
          keyDisputes: data.keyDisputes,
          litigationStrategies: data.litigationStrategies,
          timelineEvents: data.timelineEvents
        }
      };

      const updated = {
        ...workspace,
        artifacts: [newArtifact, ...(workspace.artifacts || [])],
        updatedAt: new Date().toISOString()
      };
      onUpdateWorkspace(updated);
      showToast("案情深度分析及 3D 大盘量化预测完成并归置在成果栏！", "success");
    } catch (err) {
      console.error(err);
      showToast("案情分析服务调用异常", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Step-driven Document Drafting Trigger ---
  const handleDraftDocument = async () => {
    setIsDrafting(true);
    setDraftProgressSteps([]);
    setCurrentDraftCode("");

    const steps = [
      "正在套用所选法务模板格式标准...",
      "正在提取关联原被告主体法人代码、住所通讯资质参数...",
      "正在整理事实理由事实合规质词与拖欠利息加罚诉讼主张...",
      "正在智能编译匹配拼装并输出标准民事文书大底..."
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
      "正在收集案件双方履约对账流水及一二期回款...",
      "正在聚合庭前最终合意调停 and 案件裁定内容...",
      "正在多级提炼逆向企业防范要旨并整合法务防守方略报告..."
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
      showToast("企业内审复盘式结案报告已成功起稿！", "success");
    } catch (err) {
      console.error(err);
      showToast("结案智能总结系统连接异常", "error");
    } finally {
      setIsReporting(false);
    }
  };

  const handleSaveClosureReportAsArtifact = () => {
    if (!currentClosureReport) return;
    const newArtifact: Artifact = {
      id: "art_report_" + Date.now(),
      type: "report",
      title: "标准合规结案审查归档报告.pdf",
      summary: "包含债务对账复盘及下步防范机制的企业全过程结案报告。",
      content: currentClosureReport,
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...workspace,
      status: "closed" as const,
      artifacts: [newArtifact, ...(workspace.artifacts || [])],
      updatedAt: new Date().toISOString()
    };
    onUpdateWorkspace(updated);
    showToast("全案顺利结案归档！结案报告已安全入库。");
  };

  // Push artifact callback directly (simulating request to ERP system)
  const handlePushToRequestingSystem = (artId: string) => {
    setIsPushing(artId);
    setPushProgress(10);

    const intvl = setInterval(() => {
      setPushProgress(p => {
        if (p !== null && p >= 100) {
          clearInterval(intvl);
          setTimeout(() => {
            setIsPushing(null);
            setPushProgress(null);
            showToast(`🚀 [推送成功] 已将所选成果物和质证项安全同步至对方协同综合系统端。`, "success");
          }, 300);
          return 100;
        }
        return (p || 0) + 30;
      });
    }, 200);
  };

  // Inline Custom Editor: Save handler
  const handleSaveEditedContent = () => {
    if (!activeEditingArtifact) return;
    const updatedArtifacts = getCompiledArtifacts().map(art => {
      if (art.id === activeEditingArtifact.id) {
        return { ...art, content: editingContent, createdAt: new Date().toISOString() };
      }
      return art;
    });

    // Write back to workspace state
    const cleanRealArtifacts = updatedArtifacts.filter(art => !art.id.startsWith("mock_"));
    const updated = {
      ...workspace,
      artifacts: cleanRealArtifacts,
      updatedAt: new Date().toISOString()
    };
    onUpdateWorkspace(updated);
    showToast("文书修改已安全存盘！在线编辑内容更新成功。");
  };

  return (
    <div id="workspace-detail-workbench" className="flex-1 overflow-hidden bg-white flex flex-col h-full font-sans select-none">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div id="workbench-popup-toast" className={`fixed top-4 right-4 z-[9999] p-4 rounded-xl shadow-xl flex items-center gap-2 border text-xs font-bold tracking-tight transform transition-all animate-bounce ${
          toastType === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toastType === "error" ? "bg-red-50 text-red-800 border-red-200" :
          "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="bg-white px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 font-sans">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-list"
            onClick={onBack}
            className="p-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="返回工作空间列表"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs text-slate-600 hidden sm:inline">工作空间</span>
          </button>
          
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    id="ws-rename-inline-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="border border-blue-400 bg-white px-2 py-0.5 text-sm font-bold text-slate-900 rounded focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button onClick={handleSaveName} className="p-1 bg-emerald-600 text-white rounded cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="p-1 bg-slate-200 text-slate-700 rounded cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 id="workspace-detail-title" className="text-sm font-bold text-slate-800 tracking-tight">
                    {workspace.name}
                  </h3>
                  <button 
                    id="btn-edit-ws-name"
                    onClick={() => setIsEditingName(true)} 
                    className="p-0.5 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-400 text-left">
              司法案号: {workspace.caseNo || "(2026)沪01民初0519号"}
            </p>
          </div>
        </div>

        {/* Action badges and state controller */}
        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="hidden lg:flex items-center gap-3 bg-slate-50/50 border border-slate-100 py-1.5 px-3 rounded-lg text-slate-500 text-[11px]">
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
            <div className="p-4">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerAttachmentUpload}
                className={`border border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging 
                    ? "border-blue-400 bg-blue-50/20" 
                    : "border-slate-300 hover:border-slate-400 bg-white"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUploadChange}
                  className="hidden"
                />
                
                <span className="text-[13px] font-bold text-slate-700 font-sans tracking-wide">将文件拖到此处</span>
                <p className="text-[10.5px] text-slate-400 leading-relaxed mt-2 text-center max-w-[210px] font-sans">
                  仅支持上传word、PDF、jpg、png文件，且不超过100MB，
                  <br />
                  最多上传10个
                </p>
                <button
                  type="button"
                  className="mt-4 px-5 py-1.8 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  上传文件
                </button>
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
            <div className="flex-1 px-4 py-2 overflow-y-auto space-y-2 font-sans">
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
                    className="py-3.5 border-b border-slate-100 hover:bg-slate-50/40 rounded-lg px-2.5 transition-all flex items-center justify-between group relative text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Document icon representing file format */}
                      <div className="w-8 h-8 rounded-lg bg-[#f1f3f5] flex items-center justify-center shrink-0 border border-slate-200/20">
                        <FileText className="w-4.5 h-4.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate font-sans" title={att.name}>
                          {att.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {att.size}
                        </p>
                      </div>
                    </div>

                    {/* Quick overlay controls appearing on hover */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-white py-1 px-2 rounded-lg border border-slate-100 shadow-sm z-10">
                      <button
                        id={`btn-ocr-preview-${att.id}`}
                        onClick={() => setSelectedAttachmentForOcr(att)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded cursor-pointer"
                        title="在线预览 OCR 智能提取内容"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        id={`btn-del-file-${att.id}`}
                        onClick={() => handleAttachmentDelete(att.id, att.name)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors rounded cursor-pointer"
                        title="删除该文件"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <div className="flex-1 bg-white border-r border-slate-100 flex flex-col overflow-hidden h-full">
          
          {/* Breadcrumbs and Section Headers */}
          <div className="bg-slate-50/40 px-6 py-2 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-sans">
              <button onClick={onBack} className="hover:text-blue-600 font-semibold transition-colors cursor-pointer">
                工作空间
              </button>
              <span>/</span>
              <button 
                onClick={() => {
                  setSelectedTaskCategory(null);
                  setActiveEditingArtifact(null);
                }} 
                className={`font-semibold transition-colors cursor-pointer ${selectedTaskCategory ? "hover:text-blue-600 text-gray-500" : "text-gray-900"}`}
              >
                功能选择
              </button>

              {selectedTaskCategory && (
                <>
                  <span>/</span>
                  <span className="text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                    {selectedTaskCategory === "analysis" ? "案情分析" : selectedTaskCategory === "draft" ? "文书写作" : "工作报告"}
                  </span>
                </>
              )}

              {activeEditingArtifact && (
                <>
                  <span>/</span>
                  <span className="text-amber-800 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                    成果修改精修
                  </span>
                </>
              )}
            </div>

            {/* Screen Centered workspace marker title */}
            <div id="section-centered-marker" className="font-sans text-[11.5px] font-extrabold text-slate-700">
              {workspace.name || "法律文书撰写空间"}
            </div>

            {/* System license right badge */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 border border-slate-200/80 px-2 py-0.5 rounded bg-white font-mono font-bold select-none">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-0.5" />
              <span>机构版</span>
            </div>
          </div>

          {/* Central Workspace Main Views Flow */}
          <div className="flex-1 overflow-y-auto bg-white">
            
            {/* INLINE RICH EDITOR TAKEOVER MODE (产出物点击之后拉开编辑器) */}
            {activeEditingArtifact ? (
              <div className="h-full flex flex-col p-6 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        在线编辑器
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-800">
                        {activeEditingArtifact.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      支持手动直接在下方对 AI 成果件进行精修编辑和增补，精修后一键存盘更新即可。
                    </p>
                  </div>

                  {/* Editor actions and retract buttons */}
                  <div className="flex items-center gap-2 font-bold text-xs shrink-0">
                    <button
                      id="btn-close-rich-editor"
                      onClick={() => {
                        setActiveEditingArtifact(null);
                        showToast("已成功收回并收归成果物编辑器");
                      }}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg flex items-center gap-1 cursor-pointer"
                      title="收回编辑器"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>收回编辑器</span>
                    </button>

                    <button
                      id="btn-save-interactive-editor"
                      onClick={handleSaveEditedContent}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 shadow cursor-pointer active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>保存修改</span>
                    </button>
                  </div>
                </div>

                {/* Editor canvas wrapping paper standard layout */}
                <div className="flex-1 border border-slate-100 rounded-xl overflow-hidden shadow-inner flex flex-col bg-slate-50/50">
                  <div className="bg-white border-b px-4 py-2 text-[10px] text-gray-400 font-mono flex justify-between">
                    <span>文档行宽：100% 页面缩放占比</span>
                    <span>字符数：{editingContent.length} 码</span>
                  </div>
                  <textarea
                    id="canvas-markdown-rich-textarea"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="flex-1 w-full bg-white p-6 font-mono text-[12.5px] text-slate-800 leading-relaxed focus:outline-none resize-none overflow-y-auto border-0 select-text"
                    placeholder="请输入或开始您的修改精修..."
                  />
                </div>
              </div>
            ) : selectedTaskCategory === null ? (
              // PRIMARY LANDING SCREEN (3 COLUMNS SELECTORS)
              <div className="min-h-full flex flex-col justify-center items-center px-6 py-12 text-center max-w-4xl mx-auto">
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
                    onClick={() => setSelectedTaskCategory("analysis")}
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
                    <div className="w-12 h-12 rounded-xl bg-blue-50/40 flex items-center justify-center text-blue-600 border border-blue-50 mb-4 group-hover:scale-105 transition-transform">
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
                    onClick={() => setSelectedTaskCategory(null)}
                    className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>返回功能选择主栏</span>
                  </button>
                  <span className="text-xs text-slate-400 font-mono font-bold">配置向导</span>
                </div>

                {/* TASK TYPE A: CASE ANALYSIS */}
                {selectedTaskCategory === "analysis" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-800 block">1. 核心专案事实原委描述与争议主张</label>
                      <textarea
                        value={analysisFacts}
                        onChange={(e) => setAnalysisFacts(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        placeholder="请输入案件买卖发生纠纷经过，或微信对账记录，AI 会解析并抽取这些事实要点..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-800 block">2. 指定预测重点防守维度</label>
                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          {["违约判定", "担保效力", "合营主体责任", "交货瑕疵抗辩", "诉讼时效中斯"].map(dim => (
                            <label key={dim} className="flex items-center gap-2 border border-slate-200/80 rounded p-2 hover:bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={focusDimensions.includes(dim)}
                                onChange={(e) => {
                                  if (e.target.checked) setFocusDimensions([...focusDimensions, dim]);
                                  else setFocusDimensions(focusDimensions.filter(d => d !== dim));
                                }}
                                className="rounded border-gray-300 text-blue-600"
                              />
                              <span className="text-slate-600 font-bold">{dim}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-800 block">3. 绑定关联作为计算大纲的纠纷证据</label>
                        <div className="border border-slate-200 rounded-lg p-3 max-h-[110px] overflow-y-auto space-y-1.5 text-[10.5px]">
                          {workspace.attachments.length === 0 ? (
                            <p className="text-slate-400 text-[10px] leading-relaxed">暂无关联材料(请在左侧文件区添加)</p>
                          ) : (
                            workspace.attachments.map(att => (
                              <label key={att.id} className="flex items-center gap-2 hover:text-blue-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedAttachmentIds.includes(att.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAttachmentIds([...selectedAttachmentIds, att.id]);
                                    else setSelectedAttachmentIds(selectedAttachmentIds.filter(id => id !== att.id));
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="truncate flex-1 font-mono text-[10px] text-slate-600">{att.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-4 h-4" />
                        <span>{isAnalyzing ? "正在进行多维司法比对评析中..." : "启动 AI 司法大模型评估并预测胜诉率"}</span>
                      </button>
                    </div>

                    {isAnalyzing && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
                        <span className="font-bold text-slate-700 block animate-pulse">▶ AI 自主司法推理步骤链演进中：</span>
                        {analysisProgressSteps.map((s, i) => (
                          <div key={i} className="text-slate-500 font-bold text-[10px] list-decimal ml-1">
                            {i+1}. {s}
                          </div>
                        ))}
                      </div>
                    )}

                    {analysisResult && (
                      <div className="border border-emerald-200 bg-emerald-50/20 p-5 rounded-xl space-y-4">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 font-sans">预计一审胜诉几率</span>
                            <span className="text-3xl font-black font-mono text-emerald-600 mt-1">{analysisResult.winRate || 85}%</span>
                          </div>
                          
                          <div className="flex-1 space-y-1.5 text-xs text-slate-600">
                            <p><strong>💶 赔偿与追索经济风险估算:</strong> {analysisResult.payoutRisk}</p>
                            <p><strong>🤝 审前和解及调解窗口展望:</strong> {analysisResult.mediationProspect}</p>
                          </div>
                        </div>

                        <div className="whitespace-pre-wrap text-[11px] font-mono leading-relaxed bg-white border border-emerald-100 p-3.5 rounded-lg text-slate-700">
                          {analysisResult.analysisMarkdown}
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
