/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Search, Plus, Trash2, Edit2, 
  MoreVertical, AlertTriangle
} from "lucide-react";
import { Workspace, WorkspaceType } from "../types";

interface WorkspaceListViewProps {
  workspaces: Workspace[];
  onCreateWorkspace: (w: { name: string; description: string; type: WorkspaceType; opposingParty: string; amount: number; caseNo: string }) => Workspace;
  onDeleteWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onSelectWorkspace: (id: string) => void;
}

export default function WorkspaceListView({
  workspaces,
  onCreateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
  onSelectWorkspace
}: WorkspaceListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [newWsType, setNewWsType] = useState<WorkspaceType>("case_analysis");
  const [opposingParty, setOpposingParty] = useState("");
  const [amount, setAmount] = useState<number>(10000);
  const [caseNo, setCaseNo] = useState("");

  // Rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState("");
  const [renameValue, setRenameValue] = useState("");

  // Delete modal confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // Context menus for card actions
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Helper function to format timestamp beautifully
  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (num: number) => String(num).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return dateStr;
    }
  };

  // Filter workspaces by search term
  const filteredWorkspaces = workspaces.filter(ws => {
    return ws.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    
    const resolvedCaseNo = caseNo.trim() || `(2026)京01民初0${Math.floor(100 + Math.random() * 900)}号`;
    
    onCreateWorkspace({
      name: newWsName,
      description: newWsDesc,
      type: newWsType,
      opposingParty: opposingParty.trim() || "未指定对手方",
      amount: amount || 0,
      caseNo: resolvedCaseNo
    });

    // Reset fields
    setNewWsName("");
    setNewWsDesc("");
    setNewWsType("case_analysis");
    setOpposingParty("");
    setAmount(10000);
    setCaseNo("");
    setShowCreateModal(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    onRenameWorkspace(renameTargetId, renameValue);
    setShowRenameModal(false);
    setRenameTargetId("");
    setRenameValue("");
  };

  const confirmDelete = () => {
    onDeleteWorkspace(deleteTargetId);
    setShowDeleteModal(false);
    setDeleteTargetId("");
    setDeleteTargetName("");
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#fafbfc] flex flex-col gap-6 h-full font-sans">
      {/* Top Header bar matches layout styled exactly as requested and shown in screenshot */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          欢迎加入工作空间!
        </h2>
      </div>

      {/* Styled tabs row & search block combined perfectly */}
      <div className="flex flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
        {/* Left tabs: Single static '我的空间' active tab */}
        <div className="flex bg-[#f1f3f7] p-1 rounded-xl w-fit">
          <button className="bg-white text-gray-800 shadow-sm px-4 py-1.5 rounded-lg font-bold text-xs cursor-default">
            我的空间
          </button>
        </div>

        {/* Right side search bar */}
        <div className="relative w-full max-w-[240px]">
          <input
            id="ws-search-input"
            type="text"
            placeholder="搜索空间名称"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f1f3f5] text-gray-700 placeholder-gray-400 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none border-none outline-none focus:ring-1 focus:ring-blue-300"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Grid of workspace Cards - max 7 cards per row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Card 1: Create Workspace trigger (First position) */}
        <div
          onClick={() => {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
            setNewWsName(`新建空间_${dateStr}`);
            setShowCreateModal(true);
          }}
          className="bg-[#edf4ff]/95 hover:bg-[#e2efff] border border-[#d6e4ff]/70 rounded-2xl p-5 flex flex-col items-center justify-center h-36 cursor-pointer hover:scale-[1.01] hover:shadow-xs transition-all group select-none"
        >
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#2563eb] group-hover:scale-105 transition-transform mb-2.5 shadow-[0_2px_8px_rgba(37,99,235,0.06)] border border-blue-50/50">
            <Plus className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-[13px] font-bold text-slate-800 tracking-tight">创建空间</span>
        </div>

        {/* Dynamic workspaces cards */}
        {filteredWorkspaces.map((ws) => {
          return (
            <div
              id={`ws-card-${ws.id}`}
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className="bg-[#edf4ff]/90 rounded-2xl border border-[#d6e4ff]/70 p-5 flex flex-col justify-between transition-all relative group h-36 overflow-hidden hover:bg-[#e2efff] hover:scale-[1.01] hover:shadow-xs cursor-pointer select-none"
            >
              {/* Stacked sheets absolute background graphic */}
              <div className="absolute right-0 bottom-0 w-32 h-24 pointer-events-none select-none z-0 overflow-hidden">
                {/* Back sheet */}
                <div className="absolute right-3 bottom-5 w-24 h-20 bg-[#d1e3fd] rounded-lg transform rotate-3 opacity-60" />
                {/* Front sheet */}
                <div className="absolute right-0 -bottom-3 w-28 h-20 bg-white rounded-xl shadow-[0_2px_4px_rgba(37,99,235,0.03)] border border-slate-100 flex flex-col p-4 space-y-1.5 pt-4">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full" />
                  <div className="w-10 h-1.5 bg-slate-100/70 rounded-full" />
                </div>
              </div>

              {/* Top Row: Title */}
              <div className="space-y-1 z-10 relative pr-4">
                <div className="flex items-center gap-1.5 min-h-[14px]">
                  {/* Handle sample templates indicators matches image mockup style */}
                  {ws.name.includes("示例") && (
                    <span className="text-[9px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                      示例
                    </span>
                  )}
                </div>

                <h4 className="text-[13.5px] font-bold text-slate-800 line-clamp-2 hover:text-blue-750 cursor-pointer tracking-tight leading-relaxed transition-colors mt-0.5">
                  {ws.name}
                </h4>
              </div>

              {/* Bottom Row: Date + Size & Settings Button */}
              <div className="flex items-center justify-between text-[10.5px] text-[#64748b] font-medium z-10 relative">
                <div className="line-clamp-1 max-w-[70%] select-text" onClick={(e) => e.stopPropagation()}>
                  <span>{formatTimestamp(ws.createdAt).slice(0, 16)}</span>
                  <span className="mx-1 text-slate-300">|</span>
                  <span>
                    {ws.attachments.length} {ws.attachments.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                {/* Vertical menu dots inside custom white box as shown in the screenshot */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    id={`ws-menu-btn-${ws.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === ws.id ? null : ws.id);
                    }}
                    className="w-7 h-7 flex items-center justify-center border border-slate-200 hover:border-slate-300 rounded-lg bg-white shadow-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown Action list */}
                  {activeMenuId === ws.id && (
                    <div className="absolute right-0 bottom-8 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-24 z-30 text-[11px] font-semibold animate-in fade-in slide-in-from-bottom-2 duration-100">
                      {/* Rename action is only supported for MANUAL workspace types */}
                      {!ws.isApiCreated && (
                        <button
                          id={`ws-rename-action-${ws.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTargetId(ws.id);
                            setRenameValue(ws.name);
                            setShowRenameModal(true);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-slate-705 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>重命名</span>
                        </button>
                      )}
                      <button
                        id={`ws-delete-action-${ws.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(ws.id);
                          setDeleteTargetName(ws.name);
                          setShowDeleteModal(true);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 font-bold"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>删除</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Creation Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-gray-100 bg-gray-50/70">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-blue-600" />
                <span>新建独立办案工作空间</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">
                建立专案专区有利于深度将合同归类、定向追踪证据以及一键调取量化预测。
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">工作空间名称 (必填)</label>
                  <input
                    type="text"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="如: 买卖合同拖欠货款一审空间"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">主线办案类型</label>
                  <select
                    value={newWsType}
                    onChange={(e) => setNewWsType(e.target.value as WorkspaceType)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="case_analysis">案情多维评估与预测</option>
                    <option value="draft">法律文书起草协同</option>
                    <option value="report">合规结案报告拟定</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">备案司法案号</label>
                  <input
                    type="text"
                    value={caseNo}
                    onChange={(e) => setCaseNo(e.target.value)}
                    placeholder="如: (2026)京01民初0519号"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">对方当事人 (被告/对手)</label>
                  <input
                    type="text"
                    value={opposingParty}
                    onChange={(e) => setOpposingParty(e.target.value)}
                    placeholder="如: 上海信耀商贸有限公司"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 block mb-1">诉争总标的金额 (元)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="标的金额"
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">专案事实概要描述 (选填)</label>
                  <textarea
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    rows={2}
                    placeholder="记叙双方交易背景，违约详情等..."
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  确立创建空间
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Workspace Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-gray-900 mb-3">修改工作空间名称</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  保存命名
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">确认删除该工作空间吗？</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  您正在发起删除：<span className="font-bold text-gray-800">“{deleteTargetName}”</span>。  
                  此空间关联的<b>所有附件及生成的 AI 成果物将一并清理且永久不可撤销</b>！
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-gray-200 text-gray-500 rounded-lg font-medium hover:bg-slate-50"
              >
                我不删了
              </button>
              <button
                id="btn-confirm-delete-ws"
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm"
              >
                确认并强制销毁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
