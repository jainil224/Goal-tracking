import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Link, Check, Trophy } from "lucide-react";
import { Goal, Subtask } from "../db";

interface GoalModalProps {
  goal?: Goal | null; // If null, we are in "Create" mode
  allGoals: Goal[];
  onClose: () => void;
  onSave: (goalData: {
    title: string;
    description: string;
    progress: number;
    streak: number;
    connections: string[];
    subtasks: Subtask[];
  }) => void;
  onDelete?: (id: string) => void;
}

export default function GoalModal({ goal, allGoals, onClose, onSave, onDelete }: GoalModalProps) {
  const isEdit = !!goal;

  const [title, setTitle] = useState(goal ? goal.title : "");
  const [description, setDescription] = useState(goal ? goal.description : "");
  const [progress, setProgress] = useState(goal ? goal.progress : 0);
  const [streak, setStreak] = useState(goal ? goal.streak : 0);
  const [connections, setConnections] = useState<string[]>(goal ? goal.connections : []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(goal ? goal.subtasks : []);

  // Subtask local states
  const [newSubtaskText, setNewSubtaskText] = useState("");

  // Filter out the current goal itself from connection options
  const connectableGoals = allGoals.filter((g) => !goal || g.id !== goal.id);

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const newTask: Subtask = {
      id: "sub-" + Math.random().toString(36).substring(2, 9),
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newTask]);
    setNewSubtaskText("");
  };

  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setSubtasks(updated);

    // Auto calculate progress based on subtasks if desired, or let the user choose
    const completed = updated.filter(t => t.completed).length;
    if (updated.length > 0) {
      setProgress(Math.round((completed / updated.length) * 100));
    }
  };

  const handleDeleteSubtask = (id: string) => {
    const updated = subtasks.filter(t => t.id !== id);
    setSubtasks(updated);
    if (updated.length > 0) {
      const completed = updated.filter(t => t.completed).length;
      setProgress(Math.round((completed / updated.length) * 100));
    }
  };

  const handleToggleConnection = (id: string) => {
    if (connections.includes(id)) {
      setConnections(connections.filter((c) => c !== id));
    } else {
      setConnections([...connections, id]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      progress,
      streak,
      connections,
      subtasks
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-stone-950 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative my-8"
      >
        {/* Accent Glow */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-inter font-black text-xl text-stone-150 tracking-tight">
              {isEdit ? "CALIBRATE STAR" : "IGNITE NEW STAR"}
            </h2>
            <p className="font-courier text-[10px] text-stone-500 mt-1">
              {isEdit ? "Modify gravitational goal coordinates" : "Create new vector in galaxy"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors p-1.5 rounded-full border border-transparent hover:border-stone-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
              Goal Title (Star Name)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Build Solar Engine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500/50 text-stone-100 font-inter text-sm px-4 py-3 rounded-lg outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
              Star description (Vector Log)
            </label>
            <textarea
              placeholder="e.g. Assemble fusion cooling rings and hook up energy converters."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500/50 text-stone-100 font-inter text-sm px-4 py-3 rounded-lg outline-none transition-all resize-none"
            />
          </div>

          {/* Progress Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
                Orbital Progress
              </label>
              <span className="font-mono text-xs font-bold text-orange-400">{progress}%</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-orange-500 h-1 bg-stone-900 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Streak Indicator */}
          <div className="space-y-1">
            <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
              Ignition Streak (Days)
            </label>
            <div className="relative">
              <Trophy className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                value={streak}
                onChange={(e) => setStreak(Math.max(0, Number(e.target.value)))}
                className="w-full bg-stone-900 border border-stone-800 focus:border-orange-500/50 text-stone-100 font-inter text-sm px-10 py-3 rounded-lg outline-none transition-all"
              />
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2.5">
            <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
              Subtask Checklist (Orbital Milestones)
            </label>
            
            {/* List */}
            {subtasks.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 border border-stone-900 bg-stone-950 p-2.5 rounded-lg">
                {subtasks.map((task) => (
                  <div key={task.id} className="flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(task.id)}
                      className={`flex items-center gap-2 text-left cursor-pointer group flex-1`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        task.completed
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-stone-700 bg-stone-900 group-hover:border-stone-500"
                      }`}>
                        {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={`font-inter text-xs transition-colors ${
                        task.completed ? "line-through text-stone-500" : "text-stone-300"
                      }`}>
                        {task.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(task.id)}
                      className="text-stone-600 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Add */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add subtask text..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                className="flex-1 bg-stone-900 border border-stone-850 text-stone-100 font-inter text-xs px-3 py-2 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 bg-stone-800 hover:bg-orange-500 hover:text-white text-stone-300 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            </div>
          </div>

          {/* Constellation Links Selector */}
          {connectableGoals.length > 0 && (
            <div className="space-y-2">
              <label className="font-courier text-[9px] text-stone-400 uppercase tracking-widest block font-bold">
                Constellation Links (Connect Stars)
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 border border-stone-900 bg-stone-950 rounded-lg">
                {connectableGoals.map((g) => {
                  const isLinked = connections.includes(g.id);
                  return (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => handleToggleConnection(g.id)}
                      className={`px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-tight transition-all cursor-pointer flex items-center gap-1 ${
                        isLinked
                          ? "bg-orange-950/40 border-orange-500/50 text-orange-400"
                          : "bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700"
                      }`}
                    >
                      <Link className="w-2.5 h-2.5" />
                      <span>{g.title.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            {/* Delete button (if edit mode) */}
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(goal.id)}
                className="px-4 py-3 bg-transparent border border-red-900/50 hover:bg-red-950/25 text-red-400 font-inter font-bold text-xs tracking-[0.2em] uppercase rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer order-last sm:order-first"
              >
                <Trash2 className="w-4 h-4" />
                <span>COLLAPSE STAR</span>
              </button>
            )}

            <div className="flex-1 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-stone-900 hover:bg-stone-850 text-stone-400 font-inter font-bold text-xs tracking-[0.2em] uppercase rounded-lg transition-colors cursor-pointer text-center"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-inter font-bold text-xs tracking-[0.2em] uppercase rounded-lg transition-colors cursor-pointer text-center"
              >
                {isEdit ? "SAVE CORE" : "IGNITE MATRIX"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
