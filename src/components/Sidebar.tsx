/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Scale, 
  Layout, 
  History, 
  BookOpen, 
  Home,
  User,
  ShieldAlert
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unresolvedCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: "home", label: "首页", icon: Home },
    { id: "workspaces", label: "工作空间", icon: Layout },
    { id: "templates", label: "模版管理", icon: BookOpen },
    { id: "history", label: "历史记录", icon: History },
  ];

  return (
    <aside id="main-sidebar" className="w-56 bg-[#f0f2f5] text-slate-700 flex flex-col justify-between shrink-0 border-r border-[#e1e4e8]/60 font-sans select-none">
      
      {/* Top Brand Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2">
          {/* Elegant Circular colored legal-tech logo indicator */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500/90 flex items-center justify-center text-white shadow-inner">
            <Scale className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black text-[#1e293b] tracking-tight">企业法务智能助手</span>
            <span className="text-[9.5px] text-blue-600 font-semibold tracking-tighter block mt-0.5">更懂企业法务工作的智能助手</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-btn-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-[#e2e5e9] text-slate-950 font-bold"
                  : "text-slate-650 hover:bg-slate-200/55 hover:text-slate-900"
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Area containing Login Avatar as in the prompt specification */}
      <div className="p-4 border-t border-[#e1e4e8]/60 bg-[#edf0f3]/40 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white select-none">
            青
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-800 font-bold truncate block">王青玥(承方法务)</span>
            <span className="text-[10px] text-slate-400 truncate block font-mono">vivianmax0530@gmail</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>已登录商用授权内网</span>
        </div>
      </div>
    </aside>
  );
}

