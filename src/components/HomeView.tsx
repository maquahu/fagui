/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Send, Scale, FileText, UploadCloud, 
  Clock, Plus, FileCheck, Search, Edit3, 
  Shield, Layers, AlertCircle, Grid, BookOpen, 
  Users, ChevronRight, HelpCircle
} from "lucide-react";
import { Workspace, WorkspaceType } from "../types";

interface HomeViewProps {
  workspaces: Workspace[];
  setActiveTab: (tab: string) => void;
  onCreateWorkspace: (w: { name: string; description: string; type: WorkspaceType; file?: any }) => Workspace;
  onSelectWorkspace: (id: string, viewSubTab?: string) => void;
}

export default function HomeView({ 
  workspaces, 
  setActiveTab, 
  onCreateWorkspace, 
  onSelectWorkspace 
}: HomeViewProps) {
  
  // States
  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Workspace Creation Modal state
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [targetTaskType, setTargetTaskType] = useState<WorkspaceType>("general");
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [wsSelectionMode, setWsSelectionMode] = useState<"create" | "link">("create");
  const [selectedExistingWsId, setSelectedExistingWsId] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Launch the corresponding workspace dialog
  const launchCapability = (type: WorkspaceType) => {
    setTargetTaskType(type);
    const dateStr = new Date().toISOString().slice(0, 10);
    let typeName = "";
    if (type === "case_analysis") typeName = "案情多维评估";
    if (type === "draft") typeName = "文书智能起草";
    if (type === "report") typeName = "结案审查总结";
    if (type === "general") typeName = "标准模版分发";
    
    setNewWsName(`${typeName}_${dateStr}`);
    setNewWsDesc(`针对该【${typeName}】类型任务创建的独立办案工作台。主要用于跟踪争议要素、生成OCR结果与AI草案沉淀。`);
    
    if (workspaces.length === 0) {
      setWsSelectionMode("create");
    } else {
      setWsSelectionMode("create");
      setSelectedExistingWsId(workspaces[0].id);
    }
    
    setShowWorkspaceModal(true);
  };

  // Handle submit query from prompt block
  const handleQuestionSubmit = () => {
    if (!questionText.trim()) return;
    const text = questionText.trim();
    setIsSubmittingQuestion(true);
    
    // Automated intent classification routing
    let detectedType: WorkspaceType = "draft";
    let detectedTypeName = "文书写作";
    
    if (/分析|评估|胜诉|几率|比例|概率|防守|争议|借贷|瑕疵|欠款/i.test(text)) {
      detectedType = "case_analysis";
      detectedTypeName = "案情分析";
    } else if (/起草|写作|起诉|纠纷律师函|诉状|文书|合同|协议|书稿/i.test(text)) {
      detectedType = "draft";
      detectedTypeName = "文书写作";
    } else if (/结案|总结|总结报告|复盘|经验/i.test(text)) {
      detectedType = "report";
      detectedTypeName = "结案报告";
    }
    
    setTimeout(() => {
      setIsSubmittingQuestion(false);
      setTargetTaskType(detectedType);
      const dateStr = new Date().toISOString().slice(0, 10);
      setNewWsName(`智能引导_${detectedTypeName}_${dateStr}`);
      setNewWsDesc(`基于您提出的问题：\n"${text}"\n系统智能解析并为您专门构建的本案专项托管空间，支持一键调取案情深度评估大盘。`);
      
      setWsSelectionMode("create");
      if (workspaces.length > 0) {
        setSelectedExistingWsId(workspaces[0].id);
      }
      
      setShowWorkspaceModal(true);
      showToast(`🤖 智脑已智能为您匹配【${detectedTypeName}】专项工作流！`);
    }, 1000);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsSelectionMode === "create") {
      if (!newWsName.trim()) return;
      const created = onCreateWorkspace({
        name: newWsName,
        description: newWsDesc,
        type: targetTaskType
      });
      setShowWorkspaceModal(false);
      onSelectWorkspace(created.id, targetTaskType);
    } else {
      if (!selectedExistingWsId) return;
      setShowWorkspaceModal(false);
      onSelectWorkspace(selectedExistingWsId, targetTaskType);
    }
  };

  // Sections definitions as listed in the user's reference designs
  const sections = [
    {
      name: "案件智能化助手",
      cards: [
        {
          id: "case_analysis",
          title: "案情分析",
          icon: Search,
          bgColor: "bg-[#2563eb]", // corporate blue
          isActive: true,
          type: "case_analysis" as WorkspaceType
        },
        {
          id: "draft",
          title: "文书写作",
          icon: Edit3,
          bgColor: "bg-[#8b5cf6]", // purple
          isActive: true,
          type: "draft" as WorkspaceType
        },
        {
          id: "report",
          title: "结案报告",
          icon: FileCheck,
          bgColor: "bg-[#10b981]", // emerald green
          isActive: true,
          type: "report" as WorkspaceType
        },
        {
          id: "phase_report",
          title: "阶段报告",
          icon: Clock,
          bgColor: "bg-[#14b8a6]", // teal
          isActive: false
        }
      ]
    },
    {
      name: "合同智能化助手",
      cards: [
        {
          id: "contract_audit",
          title: "合同审查",
          icon: Shield,
          bgColor: "bg-[#f59e0b]", // orange
          isActive: false
        },
        {
          id: "contract_compare",
          title: "合同比对",
          icon: Layers,
          bgColor: "bg-[#0d9488]", // teal
          isActive: false
        },
        {
          id: "risk_identify",
          title: "风险条款识别",
          icon: AlertCircle,
          bgColor: "bg-[#ef4444]", // red
          isActive: false
        },
        {
          id: "template_library",
          title: "合同模板库",
          icon: Grid,
          bgColor: "bg-[#ec4899]", // pink
          isActive: false
        }
      ]
    },
    {
      name: "法律研究助手",
      cards: [
        {
          id: "statute_search",
          title: "法规检索",
          icon: BookOpen,
          bgColor: "bg-[#3b82f6]", // blue
          isActive: false
        },
        {
          id: "case_search",
          title: "类案检索",
          icon: Users,
          bgColor: "bg-[#8b5cf6]", // violet
          isActive: false
        },
        {
          id: "opinion_letter",
          title: "法律意见书",
          icon: FileText,
          bgColor: "bg-[#10b981]", // green
          isActive: false
        }
      ]
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-10 py-12 flex flex-col justify-between items-center w-full min-h-screen font-sans relative">
      
      {/* Toast popup alerts */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700/85 text-xs font-bold tracking-wide flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Centered container */}
      <div className="max-w-5xl w-full space-y-8 flex-1">
        
        {/* Header Branding Panel (Centered, exactly like screenshot) */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-sans">
            法务工作智能助手
          </h1>
          <p className="text-sm text-slate-500 font-medium font-sans">
            更懂企业法务需求的智能助理
          </p>
        </div>

        {/* Textarea question input card (Centered, exactly like screenshot) */}
        <div className="relative bg-white border border-slate-100 rounded-xl p-6 max-w-4xl mx-auto w-full transition-all focus-within:border-blue-400">
          <textarea
            id="home-question-input"
            className="w-full bg-white text-slate-800 text-[13px] leading-relaxed placeholder-slate-400 focus:outline-none resize-none pb-12 outline-none border-none min-h-[90px]"
            placeholder="请输入您的问题，例如：分析这份合同中的风险条款..."
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleQuestionSubmit();
              }
            }}
          />
          <button
            id="btn-send-question"
            onClick={handleQuestionSubmit}
            disabled={isSubmittingQuestion || !questionText.trim()}
            className="absolute bottom-4 right-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSubmittingQuestion ? "解析中..." : "发送"}</span>
          </button>
        </div>

        {/* Categories layout with customized grid cards */}
        <div className="space-y-8 pt-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4">
              {/* Bullets Category name */}
              <div className="flex items-center gap-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block shrink-0" />
                <h3 className="text-[13px] font-bold text-slate-800 tracking-tight">
                  {section.name}
                </h3>
              </div>

              {/* Grid block for category */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {section.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      id={`home-card-${card.id}`}
                      key={card.id}
                      onClick={() => {
                        if (card.isActive && card.type) {
                          launchCapability(card.type);
                        } else {
                          showToast(`💡 “${card.title}” 服务建设部署中，敬请期待！`);
                        }
                      }}
                      className={`relative bg-white border rounded-xl p-6 py-8 flex flex-col items-center justify-center select-none transition-all ${
                        card.isActive 
                          ? "border-slate-100 hover:border-blue-400 cursor-pointer hover:bg-slate-50/50" 
                          : "border-slate-100 opacity-55 grayscale cursor-not-allowed bg-slate-50/40"
                      }`}
                    >
                      {/* Top right "Expecting" label for inactive elements */}
                      {!card.isActive && (
                        <span className="absolute top-2.5 right-2.5 text-[8.5px] font-bold text-slate-400/80 font-mono tracking-tight bg-slate-100 px-1 rounded">
                          期待
                        </span>
                      )}

                      {/* Unified icon with dynamic color background circle */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bgColor} text-white shadow-inner mb-3.5`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      {/* Display label centered */}
                      <span className="text-[12.5px] font-bold text-slate-850 font-sans tracking-tight text-center">
                        {card.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Choose / Create Workspace Modal (Fully Integrated to provide functional flow) */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-blue-600" />
                <span>一键调遣此案专属行动空间</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                为了对材料及评估结论进行加密存证，请为该专项办案分配独立托管空间。
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 text-xs font-medium">
              {/* Radio Group Selection */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-4">
                <label className={`p-3 border rounded-xl cursor-pointer flex flex-col gap-1 text-center transition-all ${
                  wsSelectionMode === "create" 
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10" 
                    : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input 
                    type="radio" 
                    name="wsMode" 
                    checked={wsSelectionMode === "create"} 
                    onChange={() => setWsSelectionMode("create")} 
                    className="sr-only"
                  />
                  <span className="text-xs font-bold text-slate-900">✨ 开辟全新空间</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">初始化新案件档案</span>
                </label>
                
                <label className={`p-3 border rounded-xl cursor-pointer flex flex-col gap-1 text-center transition-all ${
                  wsSelectionMode === "link" 
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10" 
                    : "border-slate-200 hover:bg-slate-50"
                } ${workspaces.length === 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <input 
                    type="radio" 
                    name="wsMode" 
                    checked={wsSelectionMode === "link"} 
                    onChange={() => workspaces.length > 0 && setWsSelectionMode("link")} 
                    className="sr-only"
                    disabled={workspaces.length === 0}
                  />
                  <span className="text-xs font-bold text-slate-900">🔗 归并到已有案件</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {workspaces.length > 0 ? `已有 ${workspaces.length} 项空间档案` : "暂无归属空间"}
                  </span>
                </label>
              </div>

              {wsSelectionMode === "create" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      办案空间名称 (必填)
                    </label>
                    <input 
                      type="text" 
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="如: 上海信耀货款纠纷案..."
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      起案事实指引及描述说明
                    </label>
                    <textarea 
                      value={newWsDesc}
                      onChange={(e) => setNewWsDesc(e.target.value)}
                      rows={3}
                      placeholder="描述案件的核心事实以便大模型进行推导..."
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    指定链接已有存案工作空间
                  </label>
                  <select 
                    value={selectedExistingWsId}
                    onChange={(e) => setSelectedExistingWsId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.type === "case_analysis" ? "案情分析" : ws.type === "draft" ? "文书起草" : "结案归档"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action utilities buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 text-xs">
                <button 
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  确立极速穿越 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decorative anti-slop simple clean footer */}
      <footer className="text-[10px] text-slate-400 font-mono tracking-wide py-4">
        © 0519 司法平台智能专家系统 Pro
      </footer>
    </div>
  );
}
