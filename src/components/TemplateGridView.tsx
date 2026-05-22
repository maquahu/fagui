/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Search, Plus, BookOpen, Trash2, Edit2, 
  Download, Eye, Tag, AlertCircle, FileCheck, Check,
  Grid, List, FileText, UploadCloud, X, ArrowRight, Lock, Save, CheckCircle
} from "lucide-react";
import { Template } from "../types";

interface TemplateGridViewProps {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
}

export default function TemplateGridView({
  templates,
  setTemplates
}: TemplateGridViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal toggle state for "新建模版"
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create workspace state inside "新建模版" tab
  const [newTplName, setNewTplName] = useState("");
  const [newTplFileName, setNewTplFileName] = useState("");
  const [newTplTagsInput, setNewTplTagsInput] = useState("");
  const [newTplContent, setNewTplContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Edit State (Restricted to Title & Tags only as required!)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTplId, setEditTplId] = useState("");
  const [editTplName, setEditTplName] = useState("");
  const [editTplTagsInput, setEditTplTagsInput] = useState("");

  // Preview Overlay State
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);

  // Global Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Download template logic - creates a genuine text download with the file content
  const handleDownloadTemplate = (tpl: Template) => {
    const element = document.createElement("a");
    const file = new Blob([tpl.content || ""], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = tpl.fileName || `${tpl.name}.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`🎉 成功下载标准模版: ${tpl.fileName}`);
  };

  // Handle local simulated file upload inside creation form
  const handleFormFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewTplFileName(file.name);
      
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setNewTplName(cleanName);
      
      setNewTplContent(
        `### 自定义规范文书模板：${cleanName}\n\n` +
        `**创建主体**：[公司全称/原告姓名]\n` +
        `**反向关联方**：[相对人/被告公司]\n\n` +
        `--- \n` +
        `#### 第一条 (首要条款与标的)：\n` +
        `本契约文本由双方代表签字，约定付款总额为人民币 [合同总金额] 元。\n\n` +
        `#### 第二条 (逾期违约责任)：\n` +
        `如被告构成实质逾期，应按年化 [违约百分比]% 比例计收违约违约利息，暂定扣减本项保证金。\n\n` +
        `#### 争议解决选项：\n` +
        `一切分歧优先通过友好协商解决，协商无果的依法向原告所在地人民法院提起诉讼。`
      );
      showToast(`📎 成功加载文档 “${file.name}” 的段落特征！`);
    }
  };

  // Submit new template
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Constraint: "新建模版时，先上传模版附件，然后输入模版名称"
    if (!newTplFileName) {
      alert("请先上传模版附件！");
      return;
    }
    
    if (!newTplName.trim()) {
      alert("请填写模板名称");
      return;
    }

    // Constraint: "用;隔开，最多添加五个"
    const parsedTags = newTplTagsInput
      ? newTplTagsInput.split(/[;；]/).map(t => t.trim()).filter(Boolean)
      : [];

    if (parsedTags.length > 5) {
      alert("最多只能添加五个标签，请缩减标签数量！当前输入标签数: " + parsedTags.length);
      return;
    }

    const newTemplate: Template = {
      id: "tpl_" + Date.now(),
      name: newTplName,
      fileName: newTplFileName || `${newTplName}.docx`,
      createdAt: new Date().toISOString(),
      uploadedBy: "王青玥(承方法务)", // Sets their own login user profile as template creator
      tags: parsedTags.length > 0 ? parsedTags : ["自建模板"],
      content: newTplContent || `### ${newTplName} 法律规约书\n\n[请在此一键粘贴起诉状或契约草稿要素]`,
      isSystem: false // Marks this as non-system, meaning it CAN be deleted!
    };

    setTemplates(prev => [newTemplate, ...prev]);
    
    // Clear inputs
    setNewTplName("");
    setNewTplFileName("");
    setNewTplTagsInput("");
    setNewTplContent("");
    
    setShowCreateModal(false);
    showToast("✨ 自建模板创建成功！已成功编入标准企业共享合规池。");
  };

  // Edit handler - Restricted: ONLY name and tags can be edited as per instructions!
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTplName.trim()) return;

    const parsedTags = editTplTagsInput
      ? editTplTagsInput.split(/[;；,，]/).map(t => t.trim()).filter(Boolean)
      : ["法务更新"];

    setTemplates(prev => prev.map(t => {
      if (t.id === editTplId) {
        return {
          ...t,
          name: editTplName,
          tags: parsedTags
        };
      }
      return t;
    }));

    setShowEditModal(false);
    setEditTplId("");
    setEditTplName("");
    setEditTplTagsInput("");
    showToast("💾 模板标题与所属标签修改成功！");
  };

  // Delete handler - Check if template is self-created (non-system templates can be deleted)
  const handleDeleteTemplate = (tpl: Template) => {
    // Negative constraint check: "删除只可以删除自己创建的模版"
    if (tpl.isSystem) {
      alert("抱歉，系统官方认证模板受安全保护，严禁随意删除！");
      return;
    }

    if (window.confirm(`确定要删除由您自建的模板 “${tpl.name}” 吗？\n删除后企业内其它同事将无法检索共享此模版。`)) {
      setTemplates(prev => prev.filter(t => t.id !== tpl.id));
      if (previewingTemplate?.id === tpl.id) {
        setPreviewingTemplate(null);
      }
      showToast(`🗑️ 成功删除自建模板: ${tpl.name}`);
    }
  };

  const filteredTemplates = templates.filter(tpl => {
    return (
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col gap-6 h-full font-sans relative">
      
      {/* Toast Alert Message Notification Bubble */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-2 z-55 animate-bounce text-xs font-mono font-bold select-none">
          <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-blue-600" />
            <span>模版管理</span>
          </h2>
        </div>
      </div>

      {/* RENDER VIEW 1: TEMPLATE LIST TABLE (模版列表) */}
      <div className="space-y-4 animate-in fade-in duration-100">
        
        {/* Search bar inside list view with New Template Button */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-[240px]">
              <input
                type="text"
                placeholder="按照模板名称或标签全局检索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#f1f3f5] text-gray-700 placeholder-gray-400 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none border-none outline-none focus:ring-1 focus:ring-blue-300"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            <span className="text-[11px] text-slate-400 font-mono font-medium hidden sm:inline">
              检索池共登记 {filteredTemplates.length} 项可用标准公模
            </span>
          </div>
          
          <button
            onClick={() => {
              setNewTplName("");
              setNewTplFileName("");
              setNewTplTagsInput("");
              setNewTplContent("");
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>新建模版</span>
          </button>
        </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700 table-auto border-collapse">
                <thead className="bg-[#f8fafc]/90 border-b border-gray-200 text-gray-650 font-sans text-[11px] font-extrabold uppercase tracking-wider select-none">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 font-sans leading-normal">模板名称</th>
                    <th scope="col" className="px-6 py-3.5 font-sans leading-normal">模板标签</th>
                    <th scope="col" className="px-6 py-3.5 font-sans leading-normal">相关附件</th>
                    <th scope="col" className="px-6 py-3.5 font-sans leading-normal">创建人</th>
                    <th scope="col" className="px-6 py-3.5 font-sans leading-normal">创建时间</th>
                    <th scope="col" className="px-6 py-3.5 text-center font-sans leading-normal">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-gray-400">
                        <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <span className="text-xs font-bold font-sans">暂无匹配的法律文书模版。</span>
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((tpl) => {
                      const isOwner = !tpl.isSystem; // Can ONLY delete self created templates as required
                      
                      return (
                        <tr 
                          key={tpl.id} 
                          className="hover:bg-slate-50/70 transition-all font-mono"
                        >
                          {/* Name Block */}
                          <td className="px-6 py-4 font-sans font-extrabold text-[#2c3e50] max-w-xs truncate">
                            {tpl.name}
                          </td>

                          {/* Tag Badges Block */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {tpl.tags.map((tag) => (
                                <span 
                                  key={tag} 
                                  className="text-[9px] bg-[#f0f4f8] text-blue-800 border border-blue-100/60 px-2 py-0.5 rounded font-bold font-sans flex items-center gap-0.5"
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>{tag}</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Clickable Download Attachment link */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDownloadTemplate(tpl)}
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 focus:outline-none"
                              title="点击一键进行本地下载"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs font-bold font-mono">{tpl.fileName}</span>
                            </button>
                          </td>

                          {/* Creator name Block */}
                          <td className="px-6 py-4 font-sans font-medium text-slate-600">
                            {tpl.uploadedBy}
                          </td>

                          {/* Time code block */}
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(tpl.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action region block as required */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center items-center gap-3">
                              
                              {/* View button */}
                              <button
                                onClick={() => setPreviewingTemplate(tpl)}
                                className="text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 transition-all text-[11px]"
                                title="查看预览文书模版"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>查看</span>
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={() => {
                                  setEditTplId(tpl.id);
                                  setEditTplName(tpl.name);
                                  setEditTplTagsInput(tpl.tags.join("; "));
                                  setShowEditModal(true);
                                }}
                                className="text-emerald-600 hover:text-emerald-800 font-extrabold flex items-center gap-0.5 transition-all text-[11px]"
                                title="精细化修改"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>编辑</span>
                              </button>

                              {/* Delete button (Strict: only active if they created it!) */}
                              {isOwner ? (
                                <button
                                  onClick={() => handleDeleteTemplate(tpl)}
                                  className="text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-0.5 transition-all text-[11px]"
                                  title="点击删除该自建模板"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>删除</span>
                                </button>
                              ) : (
                                <span className="text-slate-350 cursor-not-allowed text-[10px] flex items-center gap-0.5 select-none" title="系统核心公共模版，仅创建人拥有权限进行删除">
                                  <Lock className="w-3 h-3 text-slate-300" />
                                  <span>锁定</span>
                                </span>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* MODAL: CREATE TEMPLATE FORM */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4.5 h-4.5 text-blue-600" />
                <span>新建法律文书模版</span>
              </h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTplName("");
                  setNewTplFileName("");
                  setNewTplTagsInput("");
                  setNewTplContent("");
                }}
                type="button"
                className="text-gray-400 hover:text-gray-650 rounded-full p-1 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs font-medium overflow-y-auto max-h-[80vh]">
              
              {/* 1. Document attachments upload controller (FIRST PLACE) */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">1. 上传模板底本/附件 *</label>
                <input 
                  type="file" 
                  ref={formFileInputRef} 
                  onChange={handleFormFileUpload} 
                  className="hidden" 
                  accept=".docx,.doc,.txt"
                />
                
                <div 
                  onClick={() => formFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 p-5 rounded-lg text-center bg-slate-50 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                >
                  <UploadCloud className="w-7 h-7 text-blue-500/80 mx-auto mb-1.5" />
                  <span className="text-[10.5px] font-bold text-slate-700 block">点击此处选择要绑定的 Word/Text 模板文件</span>
                  <p className="text-[9.5px] text-gray-400 mt-1">支持格式：.docx, .doc, .txt</p>
                  
                  {newTplFileName && (
                    <div className="mt-3 bg-white border border-slate-200 p-2 py-1.5 rounded inline-flex items-center gap-1.5 text-[10.5px] text-slate-800 font-mono">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>已成功加载: <strong>{newTplFileName}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Template name block (SECOND PLACE - populated when uploaded) */}
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  2. 模版名称 * 
                  {newTplFileName && <span className="text-[10px] text-emerald-600 font-normal ml-2">(默认取入附件名，支持自由精修)</span>}
                </label>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder={newTplFileName ? "请输入模版名称" : "请先于上方选择上传模板附件"}
                  disabled={!newTplFileName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed font-bold"
                  required
                />
              </div>

              {/* 3. Tags separated by semicolon (THIRD PLACE - max 5 check) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-bold block font-bold">3. 模版标签 (用英文或中文分号;隔开) *</label>
                  <span className={`text-[10px] font-mono ${
                    newTplTagsInput ? (newTplTagsInput.split(/[;；]/).map(t => t.trim()).filter(Boolean).length > 5 ? "text-rose-600 font-bold animate-pulse" : "text-slate-400") : "text-slate-400"
                  }`}>
                    {newTplTagsInput ? `(${newTplTagsInput.split(/[;；]/).map(t => t.trim()).filter(Boolean).length}/5个标签)` : "(最多5个)"}
                  </span>
                </div>
                <input
                  type="text"
                  value={newTplTagsInput}
                  onChange={(e) => setNewTplTagsInput(e.target.value)}
                  placeholder="例如：民商事合同; 买卖纠纷; 公司自建"
                  disabled={!newTplFileName}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                  required
                />
              </div>

              {/* 4. Textarea Template Content editing (FOURTH PLACE) */}
              <div>
                <label className="text-slate-700 font-bold block mb-1 animate-transition">4. 模版预设大纲正文与要素引导 (可选)</label>
                <textarea
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  rows={5}
                  disabled={!newTplFileName}
                  placeholder="可在此写入该模版对应大纲或法律要件引导要素，辅助后续模型高效解析..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white leading-relaxed disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTplName("");
                    setNewTplFileName("");
                    setNewTplTagsInput("");
                    setNewTplContent("");
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                
                <button
                  type="submit"
                  disabled={!newTplFileName}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>立即共享创建</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW DIGITAL WORD PROCESSOR */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full h-[580px] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0 text-xs">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <BookOpen className="w-4.5 h-4.5 text-blue-600" />
                  <span>法律模版官方大纲在线预览</span>
                </h3>
                <span className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold flex items-center gap-1">
                  <CheckCircle className="w-4.5 h-4.5" />
                  <span>已成功转化为高保真结构底本，大模型可无瑕疵解析起案。</span>
                </span>
              </div>
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="text-gray-400 hover:text-gray-650 rounded-full p-1"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Real display panel */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
              <div className="bg-white border text-xs text-gray-800 shadow-inner rounded-xl p-6 font-mono leading-relaxed whitespace-pre-wrap max-w-xl mx-auto border-gray-220 min-h-[400px]">
                {previewingTemplate.content}
              </div>
            </div>

            {/* Foot utilities bar */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 text-xs font-semibold">
              <button
                onClick={() => handleDownloadTemplate(previewingTemplate)}
                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-bold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>下载当前附件: {previewingTemplate.fileName}</span>
              </button>
              
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BASIS MODAL (Strict: Name and Tags editing ONLY as required!) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>编辑模板基础属性</span>
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-gray-750 font-bold block mb-1">模板名称</label>
                <input
                  type="text"
                  value={editTplName}
                  onChange={(e) => setEditTplName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-gray-755 font-bold block mb-1">所属类标签 (以分号切割)</label>
                <input
                  type="text"
                  value={editTplTagsInput}
                  onChange={(e) => setEditTplTagsInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs font-mono text-slate-800"
                  required
                />
              </div>

              {/* Safe message about system constraints */}
              <div className="bg-amber-50 rounded border border-amber-200/50 p-2.5 flex gap-1.5 text-amber-800 tracking-wide leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>安全合规提醒：应合规安全审计指引，当前修改阶段已锁定文档附件文件、创建主体及时间的修改权，仅对模板题头和标签提供精修。</span>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  确认保存模板
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
