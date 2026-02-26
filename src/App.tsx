/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, Cpu, Layout, Sparkles, Send, User, Bot, Trash2, 
  ChevronRight, Code, Settings, Search, FileText, Rocket,
  ThumbsUp, ThumbsDown, Copy, Check
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateResponse, ServiceMode } from "./services/geminiService";

interface Message {
  role: "user" | "model";
  content: string;
  reaction?: "like" | "dislike";
}

type ServiceHistories = Record<ServiceMode, Message[]>;

export default function App() {
  const [activeTab, setActiveTab] = useState<ServiceMode>("chat");
  const [histories, setHistories] = useState<ServiceHistories>({
    chat: [],
    architecture: [],
    code: [],
    specs: [],
    deployment: [],
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = histories[activeTab];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeTab]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const currentMode = activeTab;

    setHistories((prev) => ({
      ...prev,
      [currentMode]: [...prev[currentMode], userMessage],
    }));
    
    setInput("");
    setIsLoading(true);

    try {
      const historyForAPI = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

      const response = await generateResponse(input, historyForAPI, currentMode);
      if (response) {
        setHistories((prev) => ({
          ...prev,
          [currentMode]: [...prev[currentMode], { role: "model", content: response }],
        }));
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setHistories((prev) => ({
        ...prev,
        [currentMode]: [...prev[currentMode], { role: "model", content: "Error: Failed to connect to Cudious systems. Please check your connection." }],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = (index: number, reaction: "like" | "dislike") => {
    setHistories((prev) => {
      const newHistory = [...prev[activeTab]];
      newHistory[index] = { ...newHistory[index], reaction: newHistory[index].reaction === reaction ? undefined : reaction };
      return { ...prev, [activeTab]: newHistory };
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setHistories((prev) => ({
      ...prev,
      [activeTab]: [],
    }));
  };

  const serviceConfig = {
    chat: {
      title: "Workspace",
      icon: Bot,
      tagline: "What do you want me to generate today?",
      description: "Please be specific about the sections (Specs, Code, UI, Tests, etc.) you want, and I will provide only those with explanations.",
      suggestions: [
        "Generate Specs for a Todo app",
        "Write Code for a Python calculator",
        "Create UI for a login button",
        "Write Tests for a sorting function"
      ]
    },
    architecture: {
      title: "Architecture",
      icon: Cpu,
      tagline: "What architecture do you want me to design?",
      description: "Specify the system or flow you need, and I will provide the structure with explanations.",
      suggestions: [
        "Flow for a user registration system",
        "Architecture for a microservices app",
        "Diagram for a database schema",
        "Structure for a serverless API"
      ]
    },
    code: {
      title: "Code",
      icon: Code,
      tagline: "What code do you want me to write?",
      description: "Provide the logic or function you need, and I will provide the implementation with explanations.",
      suggestions: [
        "React hook for local storage",
        "Express middleware for logging",
        "Python script for web scraping",
        "Java class for a bank account"
      ]
    },
    specs: {
      title: "Specs",
      icon: FileText,
      tagline: "What specifications do you want me to generate?",
      description: "Describe your project idea, and I will provide the requirements and user stories.",
      suggestions: [
        "Specs for a weather app",
        "Requirements for a chat platform",
        "User stories for a blog site",
        "Functional specs for a task manager"
      ]
    },
    deployment: {
      title: "Deployment",
      icon: Rocket,
      tagline: "What deployment configuration do you need?",
      description: "Specify the platform or tool, and I will provide the setup instructions and templates.",
      suggestions: [
        "Dockerfile for a Vite app",
        "GitHub Actions for testing",
        "Terraform for an AWS bucket",
        "Vercel deployment guide"
      ]
    }
  };

  const config = serviceConfig[activeTab];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold tracking-tighter text-xl italic uppercase">CUDIOUS <span className="text-emerald-500">AI</span></span>
          </div>

          <nav className="space-y-1">
            {(Object.keys(serviceConfig) as ServiceMode[]).map((id) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === id ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {(() => {
                  const Icon = serviceConfig[id].icon;
                  return <Icon className={`w-4 h-4 ${activeTab === id ? "text-emerald-500" : ""}`} />;
                })()}
                <span className="text-sm font-medium">{serviceConfig[id].title}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase tracking-widest mb-2">
              <Sparkles className="w-3 h-3" />
              System Status
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed font-light">
              Agentic mode active. Connected to Gemini 3.1 Pro.
            </div>
          </div>
          
          <button onClick={clearChat} className="w-full flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors text-sm">
            <Trash2 className="w-4 h-4" />
            Clear {config.title}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col relative">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Cudious</span>
            <ChevronRight className="w-4 h-4 opacity-30" />
            <span className="text-white font-medium">{config.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth z-10">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <config.icon className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight italic">{config.tagline}</h2>
              <p className="text-zinc-500 leading-relaxed">
                {(config as any).description}
              </p>
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                {config.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left text-sm text-zinc-400 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div className={`p-4 rounded-2xl ${
                    msg.role === "user" ? "bg-blue-500/10 border border-blue-500/20" : "bg-white/5 border border-white/5"
                  }`}>
                    <div className="prose prose-invert max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                  </div>
                  
                  {msg.role === "model" && (
                    <div className="flex items-center gap-2 px-2">
                      <button 
                        onClick={() => handleReaction(i, "like")}
                        className={`p-1.5 rounded-lg transition-colors ${msg.reaction === "like" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleReaction(i, "dislike")}
                        className={`p-1.5 rounded-lg transition-colors ${msg.reaction === "dislike" ? "bg-red-500/20 text-red-400" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"}`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors ml-auto"
                      >
                        {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent z-10">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
            <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-zinc-900 border border-white/10 focus-within:border-emerald-500/50 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Ask ${config.title} anything...`}
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-sm placeholder:text-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
            Cudious AI Workspace // Powered by Gemini 3.1 Pro
          </p>
        </div>
      </main>
    </div>
  );
}
