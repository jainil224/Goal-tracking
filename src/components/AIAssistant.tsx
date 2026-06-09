import { useState } from "react";
import { Sparkles, ArrowRight, User, Terminal, Loader2 } from "lucide-react";
import { Goal, Subtask } from "../db";

interface AIAssistantProps {
  goals: Goal[];
  onInjectSubtasks: (goalId: string, subtasks: Subtask[]) => void;
  onInjectNewGoal: (title: string, description: string, subtasks: Subtask[]) => void;
}

export default function AIAssistant({ goals, onInjectSubtasks, onInjectNewGoal }: AIAssistantProps) {
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "ai" | "user"; text: string; data?: any }[]>([
    {
      sender: "ai",
      text: "INCOMING AI SIGNAL: Select a goal matrix to dissect into orbital milestones, or ask for a new cosmic vector."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const simulateAI = async (promptText: string, aiResponseText: string, data?: any) => {
    setLoading(true);
    setChatLog((prev) => [...prev, { sender: "user", text: promptText }]);
    
    // Simulate thinking duration
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setChatLog((prev) => [...prev, { sender: "ai", text: aiResponseText, data }]);
    setLoading(false);
  };

  const handleBreakdown = () => {
    const target = goals.find((g) => g.id === selectedGoalId);
    if (!target) return;

    // Generate custom milestones based on the title
    const prompt = `Deconstruct "${target.title}" into task milestones.`;
    
    // Custom presets based on titles, or dynamic defaults
    let tasks: Subtask[] = [];
    const t = target.title.toLowerCase();

    if (t.includes("fusion") || t.includes("core") || t.includes("reactor")) {
      tasks = [
        { id: "ai-s1", text: "Vacuum core containment test", completed: false },
        { id: "ai-s2", text: "Stabilize laser confinement array", completed: false },
        { id: "ai-s3", text: "Achieve ignition heat threshold", completed: false }
      ];
    } else if (t.includes("irrigation") || t.includes("bio") || t.includes("farm") || t.includes("crop")) {
      tasks = [
        { id: "ai-s4", text: "Balance mineral-to-water ratios", completed: false },
        { id: "ai-s5", text: "Introduce nitrogen-fixing bacteria colonies", completed: false },
        { id: "ai-s6", text: "Setup automated root spray feeds", completed: false }
      ];
    } else if (t.includes("colony") || t.includes("base") || t.includes("mars")) {
      tasks = [
        { id: "ai-s7", text: "Anchor solar panel grids", completed: false },
        { id: "ai-s8", text: "Pressurize airlock chambers", completed: false },
        { id: "ai-s9", text: "Synthesize base brick modules", completed: false }
      ];
    } else {
      // General fallbacks
      tasks = [
        { id: "ai-s10", text: "Analyze core system requirements", completed: false },
        { id: "ai-s11", text: "Develop prototype baseline model", completed: false },
        { id: "ai-s12", text: "Conduct feedback calibration loops", completed: false }
      ];
    }

    const response = `LOGIC GRID LOCKED. Discovered 3 critical dependency vectors for "${target.title}". Would you like to inject them into the star matrix?`;
    simulateAI(prompt, response, { type: "breakdown", goalId: target.id, tasks });
  };

  const handleSuggestGoal = (type: string) => {
    let title = "";
    let description = "";
    let tasks: Subtask[] = [];

    if (type === "space") {
      title = "Holographic Cartography";
      description = "Scan the planetary ring system to construct full 3D navigation sectors.";
      tasks = [
        { id: "ai-1", text: "Deploy orbital sensor satellites", completed: false },
        { id: "ai-2", text: "Synthesize light diffraction feeds", completed: false },
        { id: "ai-3", text: "Index gravity distortion coordinates", completed: false }
      ];
    } else if (type === "engineering") {
      title = "Neural Interface Mesh";
      description = "Build a localized synaptic router translating thought patterns to binary inputs.";
      tasks = [
        { id: "ai-4", text: "Calibrate electrode headband sensor array", completed: false },
        { id: "ai-5", text: "Train deep learning classification layer", completed: false },
        { id: "ai-6", text: "Bind interface outputs to keyboard macros", completed: false }
      ];
    } else {
      title = "Quantum Memory Cache";
      description = "Stabilize subatomic registers using laser refrigeration modules.";
      tasks = [
        { id: "ai-7", text: "Calibrate laser cooling grids", completed: false },
        { id: "ai-8", text: "Deploy silicon vacancies core chips", completed: false }
      ];
    }

    const prompt = `Generate a ${type} vector suggestion.`;
    const response = `VECTOR GENERATED: "${title}". Description: ${description}. Ready to register this star into your galaxy.`;
    simulateAI(prompt, response, { type: "newGoal", title, description, tasks });
  };

  const handleAction = (data: any) => {
    if (data.type === "breakdown") {
      onInjectSubtasks(data.goalId, data.tasks);
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "SUCCESS: Orbital milestones injected into star system!" }
      ]);
    } else if (data.type === "newGoal") {
      onInjectNewGoal(data.title, data.description, data.tasks);
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "SUCCESS: New star ignited in your coordinates!" }
      ]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-stone-950 border border-stone-850 rounded-2xl overflow-hidden shadow-2xl relative select-none">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 bg-stone-900/60 border-b border-stone-850/60 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <span className="font-inter font-black text-xs text-stone-200 tracking-wider">AI GALAXY ADVISOR</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-courier text-[8px] text-stone-500 uppercase">ONLINE</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {chatLog.map((log, i) => (
          <div
            key={i}
            className={`flex gap-2 max-w-[85%] ${
              log.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
              log.sender === "user"
                ? "bg-stone-900 border-stone-800 text-stone-400"
                : "bg-orange-950/20 border-orange-500/30 text-orange-500"
            }`}>
              {log.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
            </div>
            
            <div className="space-y-2">
              <div className={`p-3 rounded-lg leading-relaxed ${
                log.sender === "user"
                  ? "bg-stone-900 text-stone-300"
                  : "bg-stone-950 border border-stone-900 text-stone-400"
              }`}>
                {log.text}
              </div>

              {/* Action Buttons inside chat bubble */}
              {log.data && (
                <button
                  onClick={() => handleAction(log.data)}
                  className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500 border border-orange-500/40 text-orange-400 hover:text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{log.data.type === "breakdown" ? "INJECT TASKS" : "IGNITE SUGGESTED STAR"}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-stone-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
            <span>PROCESSING VECTORS...</span>
          </div>
        )}
      </div>

      {/* Input / Control Panel */}
      <div className="p-3 bg-stone-900/60 border-t border-stone-850/60 space-y-2">
        {goals.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="flex-1 bg-stone-950 border border-stone-800 focus:border-orange-500/50 text-stone-300 font-inter text-xs px-2 py-1.5 rounded outline-none"
            >
              <option value="">-- Select Star to Dissect --</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleBreakdown}
              disabled={!selectedGoalId || loading}
              className="px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-stone-850 disabled:text-stone-600 text-white rounded font-inter font-bold text-[10px] tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span>DISSECT</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-stone-600 font-courier text-center py-1">
            (Create goals to enable deconstruction)
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1 justify-center">
          <button
            onClick={() => handleSuggestGoal("space")}
            disabled={loading}
            className="px-2 py-1 bg-stone-950 hover:bg-stone-850 border border-stone-850 hover:border-stone-750 text-stone-500 hover:text-stone-300 rounded text-[9px] font-mono transition-all cursor-pointer"
          >
            + SPACE VECTOR
          </button>
          <button
            onClick={() => handleSuggestGoal("engineering")}
            disabled={loading}
            className="px-2 py-1 bg-stone-950 hover:bg-stone-850 border border-stone-850 hover:border-stone-750 text-stone-500 hover:text-stone-300 rounded text-[9px] font-mono transition-all cursor-pointer"
          >
            + SYNT SYNAPSE
          </button>
        </div>
      </div>
    </div>
  );
}
