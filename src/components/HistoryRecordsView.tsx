/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Trash2, Edit3, Search, X, Save
} from "lucide-react";
import { QaRecord } from "../types";

interface HistoryRecordsViewProps {
  qaHistory: QaRecord[];
  setQaHistory: React.Dispatch<React.SetStateAction<QaRecord[]>>;
}

export default function HistoryRecordsView({
  qaHistory,
  setQaHistory
}: HistoryRecordsViewProps) {
  const [editingRecord, setEditingRecord] = useState<QaRecord | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  
  // Search state for filtering
  const [searchTerm, setSearchTerm] = useState("");

  // Accordion state to expand history QA responses
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("确定要删除这条过往对话记录吗？此操作无法撤销。")) {
      setQaHistory(prev => prev.filter(item => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleStartEdit = (record: QaRecord) => {
    setEditingRecord(record);
    setEditQuestion(record.question);
    setEditAnswer(record.answer);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setQaHistory(prev => prev.map(item => {
      if (item.id === editingRecord.id) {
        return {
          ...item,
          question: editQuestion,
          answer: editAnswer
        };
      }
      return item;
    }));

    setEditingRecord(null);
  };

  // Convert Date strings to YYYY-MM-DD HH:mm:ss as shown in the mockup
  const formatDateString = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return isoStr;
    }
  };

  const filteredHistory = qaHistory.filter(item => {
    return (
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8 h-full font-sans select-none">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        
        {/* Top Header Row matching the mockup perfectly */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3.5 mb-2 shrink-0 text-left">
          <div className="flex items-center gap-6">
            <h2 className="pb-1 text-[16px] font-black text-slate-900 tracking-tight">
              历史对话
            </h2>
          </div>

          {/* Right Search Box */}
          <div className="relative w-full max-w-[240px]">
            <input
              type="text"
              placeholder="请输入您要查找的内容"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#f1f3f5] text-gray-700 placeholder-gray-400 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none border-none outline-none focus:ring-1 focus:ring-blue-300"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto pr-2 mt-1">
          {filteredHistory.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <p className="text-xs">未找到任何过往的咨询问答记录。</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="py-5 border-b border-slate-100 flex flex-col gap-1 transition-all"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 text-left">
                      {/* Question Text */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-[13px] text-zinc-800 leading-relaxed font-sans font-medium hover:text-blue-600 transition-colors cursor-pointer text-left select-text block w-full outline-none focus:outline-none"
                        title="点击展开查看人工智能回复"
                      >
                        {item.question}
                      </button>
                    </div>

                    {/* Right Align Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-all cursor-pointer"
                        title="编辑问题与回复"
                      >
                        <Edit3 className="w-3.8 h-3.8" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                        title="删除当前记录"
                      >
                        <Trash2 className="w-3.8 h-3.8" />
                      </button>
                    </div>
                  </div>

                  {/* Left Lower Timestamp */}
                  <div className="text-[10.5px] text-slate-400 mt-1 font-sans font-normal text-left">
                    {formatDateString(item.createdAt)}
                  </div>

                  {/* Collapsible Elegant AI Reply box */}
                  {expandedId === item.id && (
                    <div className="mt-4 p-4.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 select-text text-left">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-dashed border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] text-slate-700 font-bold font-sans tracking-wide">【企业法务智能助手】智脑专家深合回复:</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium font-sans leading-relaxed whitespace-pre-wrap pl-1 bg-transparent">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Dialog Modal popup (Q&A chats editing) */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-55 flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-left">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>编辑智能问答日志</span>
              </h3>
              <button 
                onClick={() => setEditingRecord(null)}
                className="text-gray-450 hover:text-gray-650 rounded-full p-1 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs font-medium text-left">
              <div>
                <label className="text-gray-700 font-bold block mb-1">问题描述 (Question):</label>
                <textarea
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 text-[12.5px] leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-gray-700 font-bold block mb-1">AI 智脑核心解答 (Answer):</label>
                <textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 text-[12px] leading-relaxed"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-650 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存修改内容</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
