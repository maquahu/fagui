/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Send, Scale, FileText, UploadCloud, 
  Clock, Plus, FileCheck, Search, Edit3, 
  Shield, Layers, AlertCircle, Grid, BookOpen, 
  Users, ChevronRight, HelpCircle, ArrowRight,
  CheckSquare, BookMarked, Globe, Terminal, User, Sparkles, Database
} from "lucide-react";
import { Workspace, WorkspaceType, QaRecord } from "../types";

interface HomeViewProps {
  workspaces: Workspace[];
  setActiveTab: (tab: string) => void;
  onCreateWorkspace: (w: { name: string; description: string; type: WorkspaceType; file?: any }) => Workspace;
  onSelectWorkspace: (id: string, viewSubTab?: string) => void;
  qaHistory: QaRecord[];
  setQaHistory: React.Dispatch<React.SetStateAction<QaRecord[]>>;
}

export default function HomeView({ 
  workspaces, 
  setActiveTab, 
  onCreateWorkspace, 
  onSelectWorkspace,
  qaHistory,
  setQaHistory
}: HomeViewProps) {
  
  // States
  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Attachment and Knowledge assistance states
  const [useCaseData, setUseCaseData] = useState(true); // Default active as per screenshots
  const [useStatuteData, setUseStatuteData] = useState(true); // Default active as per screenshots
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, 4500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newList: { name: string; size: string }[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;
        newList.push({ name: file.name, size: sizeStr });
      }
      setUploadedFiles(prev => [...prev, ...newList]);
      showToast(`📂 成功关联本地附件 ${newList.length} 份作为背景案情特征。`);
    }
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
    
    setWsSelectionMode("create");
    if (workspaces.length > 0) {
      setSelectedExistingWsId(workspaces[0].id);
    }
    setShowWorkspaceModal(true);
  };

  // Handle submit query from prompt block
  const handleQuestionSubmit = () => {
    if (!questionText.trim()) return;
    const text = questionText.trim();
    setIsSubmittingQuestion(true);
    
    // Generate AI legal responses using professional templates based on key phrases
    let finalAnswer = "";
    if (/学校|教师|正常|管训|民主/i.test(text)) {
      finalAnswer = `关于学校与教师行使常规管教管训权同家长合法民主监督权力范畴之界分：\n\n1. **教师纪律管教权自主律**：根据教育部《中小学教育惩戒规则（试行）》，学校和教师自主执行口头诫勉、课堂纠偏等正规约束属于职权保障范畴。在没有过度手段的前提下，家属无理干涉甚至恶意投诉不获支持。\n2. **免责条例设计机制**：建议法务部在《家校共育备忘录》中约定：‘家长一方明确保证，排除因一般正常校纪课纪规范措施引起的轻微心理敏感或主观情绪波动索赔权利，赋予正当授课教师职业职务豁免保障。’`;
    } else if (/拖欠|违约|利息|最高|合同|货款/i.test(text)) {
      finalAnswer = `关于违约货款拖欠利息与诉中起诉请求大纲的编写要旨：\n\n1. **诉状标准范式**：在诉讼请求起草中，利息或违约金部分应当准确，并随本金一同挂载。例如：‘判令被告向原告支付利息（利息以未付清账款为基数，自到期日 2024年11月15日起至实际清账之日止，约定年利率 13.8% 计算）。’\n2. **司法解释利率最高上限**：合同约定的利息通常不超过全国银行间同业拆借中心公布 of 贷款市场报价利率（LPR）的四倍。目前 LPR 四倍大约为年利率 13%-14% 左右。超出部分法院依法予以调减撇除。若无明文约定，则以标准 LPR 托底核算。`;
    } else if (/铁块|绊倒|公共|设施|侵权/i.test(text)) {
      finalAnswer = `关于志愿者或家长强行私自‘美化’公共设施造成他人伤害的侵权赔偿分拨认定：\n\n1. **是否构成事实侵权**：出于善良初中而私自动用非标水泥、彩绘涂布遮盖，若在雨雪天气增加路面滑腻性或在夜间造成视觉阻断，造成路过师生、行人摔伤，依照《侵权责任法》，行为人存在实质性过失，仍应分担补充民事过错侵权责任。\n2. **合规防御路径**：任何非权属管理范畴的危险裸露隐患，均应即时向安全管理室或公共市政部（12345）提单记录挂红线，由专职主体在法定范围内纠正排险，排除自担代位求偿风险。`;
    } else {
      finalAnswer = `您提出的问题：\n"${text}"\n\n企业法务智能助手解析意见如下：\n\n1. **基本法理分析**：本项商业行为具有明显的法定合规权约保障。调用${useCaseData ? "【最高院指导案例大盘检索】" : ""}与${useStatuteData ? "【国家现行司法法规速查】" : ""}数据，该类事件主要受物权保障与违约救济条例监管。\n2. **最佳行动策略**：由于您目前 ${uploadedFiles.length > 0 ? `已挂载上传了 ${uploadedFiles.length} 个证明底本附件` : "未在底栏挂载额外相关证据"}，建议即刻建立专项协同空间（Workspace），以便 AI 大模型为您自动化执行要素比对与起诉状逆向精修生成。`;
    }

    // Construct the brand new Q&A record object
    const newRecord: QaRecord = {
      id: "qa_" + Date.now().toString(),
      question: text,
      answer: finalAnswer,
      useCaseData: useCaseData,
      useStatuteData: useStatuteData,
      attachments: [...uploadedFiles],
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmittingQuestion(false);
      setQaHistory(prev => [newRecord, ...prev]);
      
      // Reset text inputs but preserve assists toggled as safe defaults
      setQuestionText("");
      setUploadedFiles([]);
      
      showToast("🎉 问答分析成功！系统已为您在“历史记录”选项卡中新建一条协作日志，支持随时前去精修编辑。");
    }, 1200);
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

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] text-slate-800 font-sans w-full h-full overflow-hidden">
      
      {/* Toast popup warnings */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#1e293b] text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700/50 text-xs font-bold tracking-wide flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Single-Column Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-12 md:py-16">
        <div className="max-w-[1000px] mx-auto space-y-10">
          
          {/* 1. Header Area with exact title and slogan */}
          <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-top-3 duration-300">
            <h1 className="text-3xl font-extrabold text-[#1a202c] tracking-tight">法务工作智能助手</h1>
            <p className="text-[13px] text-slate-500 font-medium tracking-wide">更懂企业法务工作的智能助手</p>
          </div>

          {/* 2. Text Input Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all duration-300 relative">
            {/* Real local hidden input file trigger */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
            />

            {/* Display currently uploaded file chips if any */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-slate-100">
                {uploadedFiles.map((fileObj, fIdx) => (
                  <div 
                    key={fIdx} 
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-0.5 text-[10.5px] font-mono flex items-center gap-1.5 select-text"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{fileObj.name} ({fileObj.size})</span>
                    <button 
                      type="button" 
                      onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== fIdx))}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 text-xs px-0.5 cursor-pointer"
                      title="点击移除此附件"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              id="workspace-chat-prompt-textarea"
              className="w-full text-slate-800 text-sm leading-relaxed placeholder-slate-400 focus:outline-none resize-none pb-12 min-h-[140px] border-none bg-transparent"
              placeholder="请输入您的问题，例如：分析这份合同中的风险条款..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleQuestionSubmit();
                }
              }}
            />
            
            {/* Bottom Controls Strip */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
              {/* Folder Icon Attachment Selector */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-center text-slate-500 hover:text-[#2563eb]"
                title="选择案例背景/质证附件"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>

              {/* Send Airplane Button */}
              <button
                type="button"
                onClick={handleQuestionSubmit}
                disabled={!questionText.trim() || isSubmittingQuestion}
                className="p-2 text-slate-300 hover:text-[#2563eb] transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                title="发送问题"
              >
                {isSubmittingQuestion ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4.5 h-4.5 transform rotate-45 animate-pulse/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 3. Knowledge Base Selector Checkboxes */}
          <div className="flex items-center gap-4 text-[12px] text-slate-500 font-medium px-1 select-none pt-2">
            <span className="font-bold text-slate-800">知识数据：</span>
            
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={useCaseData} 
                onChange={(e) => setUseCaseData(e.target.checked)}
                className="rounded border-slate-300 text-slate-800 focus:ring-slate-800 w-4 h-4 cursor-pointer accent-slate-800"
              />
              <span className="text-slate-600 group-hover:text-slate-900 font-bold">案例数据</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={useStatuteData} 
                onChange={(e) => setUseStatuteData(e.target.checked)}
                className="rounded border-slate-300 text-slate-800 focus:ring-slate-800 w-4 h-4 cursor-pointer accent-slate-800"
              />
              <span className="text-slate-600 group-hover:text-slate-900 font-bold">法规数据</span>
            </label>
          </div>

          {/* 4. Section 1: 案件智能化助手 */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold select-none pl-1">
              <span className="text-slate-400 text-lg leading-none">•</span>
              <span className="text-slate-805 tracking-wider text-sm font-bold font-sans">案件智能化助手</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: 案情分析 */}
              <div
                onClick={() => launchCapability("case_analysis")}
                className="bg-white border border-slate-200/65 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xs hover:scale-[1.01] transition-all duration-200 min-h-[140px] select-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <FileText className="w-5 h-5 text-slate-650" />
                </div>
                <span className="text-xs font-bold text-slate-800">案情分析</span>
              </div>

              {/* Card 2: 文书写作 */}
              <div
                onClick={() => launchCapability("draft")}
                className="bg-white border border-slate-200/65 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xs hover:scale-[1.01] transition-all duration-200 min-h-[140px] select-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Edit3 className="w-5 h-5 text-slate-655" />
                </div>
                <span className="text-xs font-bold text-slate-800">文书写作</span>
              </div>

              {/* Card 3: 结案报告 */}
              <div
                onClick={() => launchCapability("report")}
                className="bg-white border border-slate-200/65 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xs hover:scale-[1.01] transition-all duration-200 min-h-[140px] select-none"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <FileCheck className="w-5 h-5 text-slate-655" />
                </div>
                <span className="text-xs font-bold text-slate-800">结案报告</span>
              </div>

              {/* Card 4: 阶段报告 (敬请期待) */}
              <div
                onClick={() => showToast("💡 阶段报告生成系统正在设计中，敬请期待新版本发布！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Clock className="w-5 h-5 text-slate-450" />
                </div>
                <span className="text-xs font-bold text-slate-800">阶段报告</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1">敬请期待</span>
              </div>
            </div>
          </div>

          {/* 5. Section 2: 合同智能化助手 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold select-none pl-1">
              <span className="text-slate-400 text-lg leading-none">•</span>
              <span className="text-slate-805 tracking-wider text-sm font-bold font-sans">合同智能化助手</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: 合同审查 */}
              <div
                onClick={() => showToast("💡 合同审查系统暂缓中，正加速进行法务合规研判定制，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">合同审查</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>

              {/* Card 2: 合同比对 */}
              <div
                onClick={() => showToast("💡 合同全差异比对及越权条款检索机制暂缓中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Layers className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">合同比对</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>

              {/* Card 3: 风险条款识别 */}
              <div
                onClick={() => showToast("💡 第三方履约保证和风险条款深度扫描识别模式暂缓中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <AlertCircle className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">风险条款识别</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>

              {/* Card 4: 合同模板库 */}
              <div
                onClick={() => showToast("💡 集团全栈劳动、采购、外包合规合同底本模板库开发中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Grid className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">合同模板库</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>
            </div>
          </div>

          {/* 6. Section 3: 法律研究助手 */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-extrabold select-none pl-1">
              <span className="text-slate-400 text-lg leading-none">•</span>
              <span className="text-slate-805 tracking-wider text-sm font-bold font-sans">法律研究助手</span>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: 法规检索 */}
              <div
                onClick={() => showToast("💡 全网现行司法法规极速智能全要素检索库暂缓中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">法规检索</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>

              {/* Card 2: 类案检索 */}
              <div
                onClick={() => showToast("💡 最高院指导审判定案及争议裁处类案精准对齐系统暂缓中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">类案检索</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>

              {/* Card 3: 法律意见书生成 */}
              <div
                onClick={() => showToast("💡 意见书主文提要、背景认定、抗辩风险智能总结系统暂缓中，敬请期待！")}
                className="bg-white border border-slate-200/65 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-350 hover:shadow-xs select-none min-h-[140px] col-span-2 lg:col-span-1"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 mb-2.5">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">法律意见书生成</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">暂缓</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Brand Signoffs Footer */}
      <div className="w-full text-center py-4 text-[10px] text-slate-400 font-mono select-none bg-transparent">
        企业法务智能平台 | LawTech Suite v2.0
      </div>

      {/* Choose / Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-[#f8fafc]">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>一键调遣此案专属行动空间</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                为了对材料及评估结论进行加密存证，请为该专项办案分配独立托管空间。
              </p>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4 text-xs font-semibold">
              {/* Radio Group Selection */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-4">
                <label className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 text-center transition-all ${
                  wsSelectionMode === "create" 
                    ? "border-blue-500 bg-blue-50/20" 
                    : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input 
                    type="radio" 
                    name="wsMode" 
                    checked={wsSelectionMode === "create"} 
                    onChange={() => setWsSelectionMode("create")} 
                    className="sr-only"
                  />
                  <span className="text-[12px] font-bold text-slate-900">✨ 开辟全新空间</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">初始化新案件档案</span>
                </label>
                
                <label className={`p-3 border rounded-lg cursor-pointer flex flex-col gap-1 text-center transition-all ${
                  wsSelectionMode === "link" 
                    ? "border-blue-500 bg-blue-50/20" 
                    : "border-slate-200 hover:bg-slate-50"
                } ${workspaces.length === 0 ? "opacity-30 cursor-not-allowed" : ""}`}>
                  <input 
                    type="radio" 
                    name="wsMode" 
                    checked={wsSelectionMode === "link"} 
                    onChange={() => workspaces.length > 0 && setWsSelectionMode("link")} 
                    className="sr-only"
                    disabled={workspaces.length === 0}
                  />
                  <span className="text-[12px] font-bold text-slate-900">🔗 归并到已有案件</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {workspaces.length > 0 ? `已有 ${workspaces.length} 项空间档案` : "暂无归属空间"}
                  </span>
                </label>
              </div>

              {wsSelectionMode === "create" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      办案空间名称 (必填)
                    </label>
                    <input 
                      type="text" 
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="如: 劳动合规审查空间..."
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      起案事实指引及描述说明
                    </label>
                    <textarea 
                      value={newWsDesc}
                      onChange={(e) => setNewWsDesc(e.target.value)}
                      rows={3}
                      placeholder="描述案件的核心事实以便大模型进行推导..."
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    指定链接已有存案工作空间
                  </label>
                  <select 
                    value={selectedExistingWsId}
                    onChange={(e) => setSelectedExistingWsId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-[11.5px] focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.type === "case_analysis" ? "案情分析" : ws.type === "draft" ? "文书起草" : "结案归档"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 text-[11px]">
                <button 
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  确立办案 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
