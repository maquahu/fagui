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
import HistoryRecordsView from "./components/HistoryRecordsView";

import { 
  INITIAL_TEMPLATES, 
  INITIAL_WORKSPACES,
  INITIAL_QA_HISTORY
} from "./initialData";

import { 
  Workspace, 
  Template, 
  WorkspaceType, 
  Artifact,
  QaRecord
} from "./types";

import { 
  History, 
  Scale, 
  Layers, 
  Clock, 
  ArrowRight, 
  Building,
  Edit2,
  Trash2,
  FileText,
  MessageSquareCode,
  CheckCircle,
  FolderLock
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  // Core application States
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [qaHistory, setQaHistory] = useState<QaRecord[]>([]);

  // Local storage binding hook on startup
  useEffect(() => {
    const cachedWs = localStorage.getItem("0519_judicial_workspaces");
    const cachedTpls = localStorage.getItem("0519_judicial_templates");
    const cachedQa = localStorage.getItem("amicus_qa_history");

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

    if (cachedQa) {
      try {
        setQaHistory(JSON.parse(cachedQa));
      } catch (e) {
        setQaHistory(INITIAL_QA_HISTORY);
      }
    } else {
      setQaHistory(INITIAL_QA_HISTORY);
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

  const handleUpdateQaHistory = (nextQa: React.SetStateAction<QaRecord[]>) => {
    setQaHistory(prev => {
      const resolved = typeof nextQa === "function" ? nextQa(prev) : nextQa;
      localStorage.setItem("amicus_qa_history", JSON.stringify(resolved));
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
                qaHistory={qaHistory}
                setQaHistory={handleUpdateQaHistory}
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
              <HistoryRecordsView 
                qaHistory={qaHistory}
                setQaHistory={handleUpdateQaHistory}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
