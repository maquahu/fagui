/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Scale, FileText, Layout, History, BookOpen, LogOut, UserCheck } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: "home", label: "首页", icon: Scale },
    { id: "workspaces", label: "工作空间", icon: Layout },
    { id: "templates", label: "模版管理", icon: BookOpen },
    { id: "history", label: "办案历史", icon: History },
  ];

  return (
    <aside id="main-sidebar" className="w-64 bg-[#f8fafc] text-slate-700 flex flex-col justify-between shrink-0 border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">0519 智能办案</h1>
            <p className="text-xs text-slate-400 font-mono">V2.0 Core Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-btn-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className="w-5 h-5 text-current" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-100/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            薇
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-800 font-semibold truncate block">王青玥(承方法务)</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-medium">承办</span>
            </div>
            <span className="text-[11px] text-slate-500 truncate block">vivianmax0530@gmail</span>
          </div>
        </div>
        <div className="mt-4 flex gap-1 justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-3">
          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="text-slate-500 font-mono font-medium">● RBAC 授权中</span>
          </div>
          <span className="font-mono text-[10px]">v2.0</span>
        </div>
      </div>
    </aside>
  );
}
