/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Search, Plus, BookOpen, Trash2, Edit2, 
  Download, Eye, Tag, AlertCircle, FileCheck, Check
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
  
  // Create state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplFileName, setNewTplFileName] = useState("");
  const [newTplTagsInput, setNewTplTagsInput] = useState("");
  const [newTplContent, setNewTplContent] = useState("");

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTplId, setEditTplId] = useState("");
  const [editTplName, setEditTplName] = useState("");
  const [editTplTagsInput, setEditTplTagsInput] = useState("");

  // Preview state
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewTplFileName(file.name);
      
      // Auto-populate name if empty
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setNewTplName(prev => prev || cleanName);
      
      // Auto pre-populate dummy template body
      setNewTplContent(`### 自定义规范文书：${cleanName}\n\n**原告**：[姓名]\n**被告**：[姓名/公司]\n\n--- \n#### 诉讼请求与主张：\n1. 要求给付人民币款项 [金额] 元；\n\n#### 法律事实论证与理由：\n依据相关买卖合同约定，被告收到款项拒绝履约，特此具状起诉。`);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;

    const parsedTags = newTplTagsInput
      ? newTplTagsInput.split(/[;；,，]/).map(t => t.trim()).filter(Boolean)
      : ["法务自建", "标准模版"];

    const newTemplate: Template = {
      id: "tpl_" + Date.now(),
      name: newTplName,
      fileName: newTplFileName || `${newTplName}.docx`,
      createdAt: new Date().toISOString(),
      uploadedBy: "王青玥(法务专家)",
      tags: parsedTags,
      content: newTplContent || `### ${newTplName} 模版\n\n[请输入要素以供AI套用]`,
      isSystem: false
    };

    setTemplates(prev => [newTemplate, ...prev]);
    
    // Reset
    setNewTplName("");
    setNewTplFileName("");
    setNewTplTagsInput("");
    setNewTplContent("");
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTplName.trim()) return;

    const parsedTags = editTplTagsInput
      ? editTplTagsInput.split(/[;；,，]/).map(t => t.trim()).filter(Boolean)
      : ["团队核准"];

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
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (window.confirm(`确定删除法律模板 “${name}” 吗？此操作将立即从标准共享库移除`)) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (previewingTemplate?.id === id) {
        setPreviewingTemplate(null);
      }
    }
  };

  const filteredTemplates = templates.filter(tpl => {
    return (
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tpl.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col gap-6 h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            团队法律文书模版库 (Templates)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            正向分发中心：维护和分发公司级的起诉状及析产协议，支持办案成果一键逆向沉淀入库。
          </p>
        </div>
        <button
          id="btn-open-add-tpl"
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>上传并新增文书模版</span>
        </button>
      </div>

      {/* Search filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            id="tpl-search-input"
            type="text"
            placeholder="按模版名称/标签检索标准规范..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">
          共收录 {filteredTemplates.length} 规约
        </span>
      </div>

      {/* Grid of Standard templates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            id={`tpl-card-${tpl.id}`}
            key={tpl.id}
            className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 p-5 flex flex-col justify-between shadow-sm transition-all group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-1">
                <BookOpen className="w-8 h-8 text-blue-500/80 shrink-0" />
                {tpl.isSystem ? (
                  <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                    系统默认标杆
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100 font-mono">
                    法务逆向自建
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {tpl.name}
                </h4>
                <p className="text-[10px] text-gray-400 truncate font-mono">
                  {tpl.fileName}
                </p>
              </div>

              {/* Tag badges list */}
              <div className="flex flex-wrap gap-1">
                {tpl.tags.map((tag) => (
                  <span key={tag} className="text-[9px] bg-gray-50 text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5 text-gray-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action footer */}
            <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono font-medium">
              <span className="text-gray-400">
                上传者: {tpl.uploadedBy}
              </span>

              <div className="flex gap-2">
                <button
                  id={`tpl-preview-btn-${tpl.id}`}
                  onClick={() => setPreviewingTemplate(tpl)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] flex items-center gap-0.5"
                  title="套用或核阅文书起案大纲"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>预览模版</span>
                </button>

                <button
                  id={`tpl-edit-btn-${tpl.id}`}
                  onClick={() => {
                    setEditTplId(tpl.id);
                    setEditTplName(tpl.name);
                    setEditTplTagsInput(tpl.tags.join("; "));
                    setShowEditModal(true);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  title="修改名称标签"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {!tpl.isSystem && (
                  <button
                    id={`tpl-delete-btn-${tpl.id}`}
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                    className="text-red-500 hover:text-red-700"
                    title="彻底删除此模版"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload/Add standard template form modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>新增公司司法合规标准文书模板</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                上传一份 Word 文件后，可在主文本编辑框内预填并标注占位特征符（如原告、被告），供 AI 起草直接识别匹配。
              </p>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    文书附件上传 (必填，DOCX/PDF)
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border rounded px-3 py-1.5 font-bold hover:shadow"
                    >
                      选择模板源文件
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="upload-tpl-file"
                      onChange={handleFileUploadSimulate}
                      className="hidden"
                    />
                    {newTplFileName ? (
                      <p className="mt-2 text-[11px] text-emerald-600 font-mono font-bold flex items-center justify-center gap-1">
                        <FileCheck className="w-4 h-4" />
                        <span>已选文件: {newTplFileName}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-gray-400">尚未选择任何文件</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    文书模板命名 (自动提取)
                  </label>
                  <input
                    type="text"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder="例如: 货运交付协议标准模板"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 focus:outline-none"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    标签（以英文/中文分号分割）
                  </label>
                  <input
                    type="text"
                    value={newTplTagsInput}
                    onChange={(e) => setNewTplTagsInput(e.target.value)}
                    placeholder="合同纠纷; 诉讼时效"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    模板格式事实正文占位段 (自拟以供AI填充)
                  </label>
                  <textarea
                    value={newTplContent}
                    onChange={(e) => setNewTplContent(e.target.value)}
                    rows={4}
                    placeholder="### 民事起诉状例稿\n原告: [原告]\n被告: [被告]\n诉讼事项：判令给付本金..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-650 rounded-lg"
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

      {/* Edit standard template details modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-905 mb-4">修改模板基础字段</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-gray-700 block mb-1">模板标题名</label>
                <input
                  type="text"
                  value={editTplName}
                  onChange={(e) => setEditTplName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1"
                  required
                />
              </div>

              <div>
                <label className="text-gray-700 block mb-1">修改所属标签 (分号切割)</label>
                <input
                  type="text"
                  value={editTplTagsInput}
                  onChange={(e) => setEditTplTagsInput(e.target.value)}
                  placeholder="合同纠纷; 诉讼"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-bold"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIVE BOILERPLATE WORD PROCESSOR VIEWER */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-2xl w-full h-[580px] flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                  司法部官方标准核准模版预览器
                </h3>
                <span className="text-[10px] text-emerald-600 font-mono mt-0.5 font-bold flex items-center gap-1">
                  <FileCheck className="w-4.5 h-4.5" />
                  <span>已完成标准 DOCX 转化。大模型能无瑕疵拼装原被告。</span>
                </span>
              </div>
              <button
                id="preview-tpl-close-btn"
                onClick={() => setPreviewingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Template markup body text processor layout */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="bg-white border rounded-lg p-6 font-mono text-xs text-gray-800 shadow-inner leading-relaxed select-text whitespace-pre-wrap max-w-xl mx-auto border-gray-220 min-h-[400px]">
                {previewingTemplate.content}
              </div>
            </div>

            {/* Foot utilities bar */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 text-xs">
              <button
                id="tpl-download-raw-btn"
                onClick={() => {
                  const element = document.createElement("a");
                  const file = new Blob([previewingTemplate.content], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = previewingTemplate.fileName;
                  document.body.appendChild(element);
                  element.click();
                }}
                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-bold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>下下载原始模板.docx</span>
              </button>
              
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
              >
                退出预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
