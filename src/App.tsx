/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import HomeView from "./components/HomeView";
import WorkspaceListView from "./components/WorkspaceListView";
import WorkspaceDetailView from "./components/WorkspaceDetailView";
import TemplateGridView from "./components/TemplateGridView";

import { 
  INITIAL_TEMPLATES, 
  INITIAL_WORKSPACES 
} from "./initialData";

import { 
  Workspace, 
  Template, 
  WorkspaceType, 
  Artifact 
} from "./types";

import { 
  History, 
  Scale, 
  Layers, 
  Clock, 
  ArrowRight, 
  Building 
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Core application States
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Local storage binding hook on startup
  useEffect(() => {
    const cachedWs = localStorage.getItem("0519_judicial_workspaces");
    const cachedTpls = localStorage.getItem("0519_judicial_templates");

    if (cachedWs) {
      try {
        setWorkspaces(JSON.parse(cachedWs));
      } catch (e) {
        setWorkspaces(INITIAL_WORKSPACES);
      }
    } else {
      setWorkspaces(INITIAL_WORKSPACES);
    }

    if (cachedTpls) {
      try {
        setTemplates(JSON.parse(cachedTpls));
      } catch (e) {
        setTemplates(INITIAL_TEMPLATES);
      }
    } else {
      setTemplates(INITIAL_TEMPLATES);
    }
  }, []);

  // Sync to local storage on modifications
  const handleUpdateWorkspaces = (nextWs: Workspace[]) => {
    setWorkspaces(nextWs);
    localStorage.setItem("0519_judicial_workspaces", JSON.stringify(nextWs));
  };

  const handleUpdateTemplates = (nextTpls: React.SetStateAction<Template[]>) => {
    setTemplates(prev => {
      const resolved = typeof nextTpls === "function" ? nextTpls(prev) : nextTpls;
      localStorage.setItem("0519_judicial_templates", JSON.stringify(resolved));
      return resolved;
    });
  };

  // Create Workspace Callback
  const handleCreateWorkspace = (options: {
    name: string;
    description: string;
    type: WorkspaceType;
    opposingParty?: string;
    amount?: number;
    caseNo?: string;
  }) => {
    const dateStr = new Date().toISOString();
    const newWs: Workspace = {
      id: "ws_" + Date.now().toString(),
      name: options.name,
      description: options.description || "一个新创设的工作空间协同域。",
      type: options.type,
      isApiCreated: false,
      caseNo: options.caseNo || `(2026)京01民初0${Math.floor(100 + Math.random() * 899)}号`,
      opposingParty: options.opposingParty || "未定第三方",
      amount: options.amount || 100000,
      status: "underway",
      createdAt: dateStr,
      updatedAt: dateStr,
      attachments: [],
      artifacts: []
    };

    const nextList = [newWs, ...workspaces];
    handleUpdateWorkspaces(nextList);
    return newWs;
  };

  const handleDeleteWorkspace = (id: string) => {
    const nextList = workspaces.filter(w => w.id !== id);
    handleUpdateWorkspaces(nextList);
    if (selectedWorkspaceId === id) {
      setSelectedWorkspaceId(null);
    }
  };

  const handleRenameWorkspace = (id: string, nextName: string) => {
    const nextList = workspaces.map(w => {
      if (w.id === id) {
        return { ...w, name: nextName, updatedAt: new Date().toISOString() };
      }
      return w;
    });
    handleUpdateWorkspaces(nextList);
  };

  const handleSingleWorkspaceUpdate = (nextWorkspace: Workspace) => {
    const nextList = workspaces.map(w => w.id === nextWorkspace.id ? nextWorkspace : w);
    handleUpdateWorkspaces(nextList);
  };

  const handleSelectWorkspace = (id: string, defaultSubTab?: string) => {
    setSelectedWorkspaceId(id);
    setActiveTab("workspaces");
    // State management handles loading the correct sub-tab inside Detail View component
  };

  const getActiveWorkspace = () => {
    return workspaces.find(w => w.id === selectedWorkspaceId) || null;
  };

  // Compile full list of executed artifacts across all vaults to render the History Logs View
  const getFullHistoryArtifacts = () => {
    let list: { wsName: string; type: string; title: string; date: string }[] = [];
    workspaces.forEach(ws => {
      ws.artifacts.forEach(art => {
        list.push({
          wsName: ws.name,
          type: art.type === "analysis" ? "⚖️ 胜诉预测模型" : art.type === "document" ? "📝 文书草案" : "📌 结案复盘报告",
          title: art.title,
          date: art.createdAt
        });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div id="app-root-container" className="h-screen w-screen flex overflow-hidden bg-gray-50 text-gray-800 antialiased font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tbl) => {
          setActiveTab(tbl);
          setSelectedWorkspaceId(null); // Return to standard lists
        }} 
      />

      {/* Main Dynamic View Panels Area */}
      <main className="flex-1 flex flex-col overflow-hidden h-full relative">
        
        {/* Render Workspace Detail Workbench if workspace selected */}
        {activeTab === "workspaces" && selectedWorkspaceId && getActiveWorkspace() ? (
          <WorkspaceDetailView 
            workspace={getActiveWorkspace()!} 
            templates={templates}
            onBack={() => setSelectedWorkspaceId(null)}
            onUpdateWorkspace={handleSingleWorkspaceUpdate}
            setGlobalTemplates={handleUpdateTemplates}
          />
        ) : (
          <>
            {/* Standard Primary directory views */}
            {activeTab === "home" && (
              <HomeView 
                workspaces={workspaces}
                setActiveTab={setActiveTab}
                onCreateWorkspace={handleCreateWorkspace}
                onSelectWorkspace={handleSelectWorkspace}
              />
            )}

            {activeTab === "workspaces" && (
              <WorkspaceListView 
                workspaces={workspaces}
                onCreateWorkspace={handleCreateWorkspace}
                onDeleteWorkspace={handleDeleteWorkspace}
                onRenameWorkspace={handleRenameWorkspace}
                onSelectWorkspace={(id) => handleSelectWorkspace(id)}
              />
            )}

            {activeTab === "templates" && (
              <TemplateGridView 
                templates={templates}
                setTemplates={handleUpdateTemplates}
              />
            )}

            {activeTab === "history" && (
              <div className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col gap-6 h-full font-sans">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    <span>智能办案历史记录与核验审计轨</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    系统审计轨迹：追溯由 AI 大模型自动辅助完成的全部文发起草、胜诉评析及结案成果归档。
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
                  <div className="text-sm font-bold text-gray-700 pb-3 border-b">
                    历史成果审计日志 Timeline
                  </div>

                  {getFullHistoryArtifacts().length === 0 ? (
                    <div className="py-20 text-center text-gray-300 text-xs text-sans">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <span>暂无任何 AI 办案审计发生记录。</span>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                        当您在特定工作空间启用“大模型评估”或“一键起草文书并保存”后，系统审计轨迹将在此永久体现。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFullHistoryArtifacts().map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start text-xs border-l-2 border-blue-500 pl-4 py-1 ml-1 select-text">
                          <div className="w-24 shrink-0 font-mono text-gray-400">
                            {new Date(item.date).toLocaleString()}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 font-bold mr-2">
                              {item.type}
                            </span>
                            <span className="font-bold text-gray-800 font-mono">
                              {item.title}
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
                              所署专案工作台: <span className="font-medium text-gray-600">{item.wsName}</span>
                            </p>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-gray-300 self-center" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
