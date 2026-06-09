import { useRef, useEffect, useState } from "react";
import { Goal } from "../db";
import { Sparkles, Trophy } from "lucide-react";

interface GalaxyCanvasProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  readOnly?: boolean;
}

interface AmbientStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  phase: number;
}

export default function GalaxyCanvas({ goals, onSelectGoal, readOnly = false }: GalaxyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport panning state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffsetStart = useRef({ x: 0, y: 0 });
  const totalDragDist = useRef(0);

  // Hover states
  const [hoveredGoal, setHoveredGoal] = useState<Goal | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Ambient background stars
  const ambientStars = useRef<AmbientStar[]>([]);

  // Initialize ambient stars
  useEffect(() => {
    const stars: AmbientStar[] = [];
    const count = 250;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    ambientStars.current = stars;
  }, []);

  // Frame animation loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Subtle drift speed
    let time = 0;

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2 + pan.x;
      const centerY = canvas.height / 2 + pan.y;

      // 1. Draw Ambient Background Stars
      ambientStars.current.forEach((star) => {
        // Soft pulsing alpha
        const alpha = Math.max(0.1, Math.min(1, star.alpha + Math.sin(time * star.speed * 10 + star.phase) * 0.25));
        ctx.fillStyle = `rgba(245, 245, 244, ${alpha})`;
        
        // Map relative to center and pan
        const sx = star.x + centerX * 0.1; // Parallax effect
        const sy = star.y + centerY * 0.1;

        // Wrap around screen coordinates
        const wrapX = ((sx % canvas.width) + canvas.width) % canvas.width;
        const wrapY = ((sy % canvas.height) + canvas.height) % canvas.height;

        ctx.beginPath();
        ctx.arc(wrapX, wrapY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Compute dynamic floating positions for the goals
      const positionedGoals = goals.map((goal, idx) => {
        // Floating drift based on goal index for unique phases
        const phaseX = idx * 1.5;
        const phaseY = idx * 2.3;
        const driftX = Math.sin(time + phaseX) * 12;
        const driftY = Math.cos(time + phaseY) * 12;

        return {
          ...goal,
          canvasX: goal.x + centerX + driftX,
          canvasY: goal.y + centerY + driftY,
          size: 5 + (goal.progress / 100) * 8 // size maps to progress
        };
      });

      // 3. Draw Constellation Connection Lines
      ctx.strokeStyle = "rgba(249, 115, 22, 0.15)";
      ctx.lineWidth = 1;
      
      const drawnConnections = new Set<string>();

      positionedGoals.forEach((goal) => {
        goal.connections.forEach((connId) => {
          const target = positionedGoals.find((g) => g.id === connId);
          if (target) {
            const pairKey = [goal.id, target.id].sort().join("-");
            if (!drawnConnections.has(pairKey)) {
              drawnConnections.add(pairKey);

              // Draw neon pulsing line
              const pulse = 0.5 + Math.sin(time * 8 + idxToNum(goal.id)) * 0.5; // gentle pulses
              ctx.strokeStyle = `rgba(249, 115, 22, ${0.1 + pulse * 0.2})`;
              ctx.lineWidth = 1.2 + pulse * 0.8;

              ctx.beginPath();
              ctx.moveTo(goal.canvasX, goal.canvasY);
              ctx.lineTo(target.canvasX, target.canvasY);
              ctx.stroke();

              // Draw active energy flow nodes along the constellation lines
              const progressFraction = (time * 1.5 + idxToNum(goal.id) / 10) % 1;
              const flowX = goal.canvasX + (target.canvasX - goal.canvasX) * progressFraction;
              const flowY = goal.canvasY + (target.canvasY - goal.canvasY) * progressFraction;
              
              ctx.fillStyle = `rgba(253, 186, 116, ${0.4 + pulse * 0.3})`;
              ctx.beginPath();
              ctx.arc(flowX, flowY, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      });

      // 4. Draw Goal Stars
      positionedGoals.forEach((goal) => {
        const isHovered = hoveredGoal && hoveredGoal.id === goal.id;
        const pulseGlow = Math.sin(time * 6 + idxToNum(goal.id)) * 0.15;
        const streakMultiplier = 1 + Math.min(goal.streak, 30) * 0.05; // Streaks make stars look larger & brighter

        // Radial glow
        const glowRadius = goal.size * (2.8 + pulseGlow) * streakMultiplier;
        const gradient = ctx.createRadialGradient(
          goal.canvasX, goal.canvasY, 1,
          goal.canvasX, goal.canvasY, glowRadius
        );
        
        // Orange glow colors
        const opacityBase = isHovered ? 0.8 : 0.45;
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // Hot star center
        gradient.addColorStop(0.15, "rgba(253, 186, 116, 0.95)"); // Soft orange core
        gradient.addColorStop(0.5, `rgba(249, 115, 22, ${opacityBase * 0.6})`); // Glowing outer
        gradient.addColorStop(1, "rgba(249, 115, 22, 0)"); // Fading edge

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(goal.canvasX, goal.canvasY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(goal.canvasX, goal.canvasY, goal.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Label above star
        ctx.fillStyle = isHovered ? "rgba(249, 115, 22, 0.95)" : "rgba(168, 162, 158, 0.75)";
        ctx.font = isHovered ? "bold 11px Inter" : "10px Courier New";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        
        // Add streak icon indicator next to label if streak exists
        let labelText = goal.title.toUpperCase();
        if (goal.streak > 0) {
          labelText += ` 🔥${goal.streak}`;
        }
        ctx.fillText(labelText, goal.canvasX, goal.canvasY - goal.size - 4);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [goals, pan, hoveredGoal]);

  // Utility to generate a unique seed index from goal ID hash
  const idxToNum = (id: string): number => {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return sum;
  };

  // Handle Panning and Click Events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffsetStart.current = { ...pan };
    totalDragDist.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      totalDragDist.current += Math.sqrt(dx * dx + dy * dy);
      
      setPan({
        x: dragOffsetStart.current.x + dx,
        y: dragOffsetStart.current.y + dy
      });
      // Clear hover while dragging
      setHoveredGoal(null);
    } else {
      // Coordinate conversions to screen position
      const centerX = canvas.width / 2 + pan.x;
      const centerY = canvas.height / 2 + pan.y;

      let found: Goal | null = null;
      
      // We must recalculate positions with drift here too, but simple bounding checks work well
      for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        
        // Calculate rough current coordinates
        const idx = i;
        const driftX = Math.sin(Date.now() * 0.005 * 0.1 + idx * 1.5) * 12;
        const driftY = Math.cos(Date.now() * 0.005 * 0.1 + idx * 2.3) * 12;

        const gx = goal.x + centerX + driftX;
        const gy = goal.y + centerY + driftY;

        const size = 5 + (goal.progress / 100) * 8;
        const clickRange = Math.max(size * 3.5, 28); // Generous click buffer

        const dx = mouseX - gx;
        const dy = mouseY - gy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < clickRange) {
          found = goal;
          // Position tooltip relative to star position on screen
          setTooltipPos({ x: gx, y: gy - size - 22 });
          break;
        }
      }
      setHoveredGoal(found);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // If client dragged less than 6px, it counts as a click
    if (totalDragDist.current < 6 && hoveredGoal) {
      onSelectGoal(hoveredGoal);
    }
  };

  // Mobile Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    dragOffsetStart.current = { ...pan };
    totalDragDist.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    if (isDragging) {
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      totalDragDist.current += Math.sqrt(dx * dx + dy * dy);
      
      setPan({
        x: dragOffsetStart.current.x + dx,
        y: dragOffsetStart.current.y + dy
      });
      setHoveredGoal(null);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (totalDragDist.current < 8 && hoveredGoal) {
      onSelectGoal(hoveredGoal);
    }
  };

  const totalTasks = hoveredGoal ? hoveredGoal.subtasks.length : 0;
  const completedTasks = hoveredGoal ? hoveredGoal.subtasks.filter(t => t.completed).length : 0;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-black select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Floating Interactive Tooltip */}
      {hoveredGoal && !isDragging && (
        <div
          style={{
            position: "absolute",
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none w-56 p-4 bg-stone-950/90 border border-orange-500/30 rounded-xl shadow-2xl flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 z-30"
        >
          {/* Accent glow line */}
          <div className="absolute top-0 left-4 right-4 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="flex justify-between items-start gap-1">
            <span className="font-inter font-extrabold text-stone-200 text-xs truncate">
              {hoveredGoal.title}
            </span>
            {hoveredGoal.streak > 0 && (
              <div className="flex items-center gap-0.5 shrink-0 text-[10px] font-bold text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-900/30">
                <Trophy className="w-2.5 h-2.5" />
                <span>{hoveredGoal.streak}</span>
              </div>
            )}
          </div>

          <p className="font-courier text-[9px] text-stone-500 line-clamp-2 leading-relaxed leading-tight">
            {hoveredGoal.description || "No description provided."}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono">
              <span className="text-stone-400">PROGRESS</span>
              <span className="text-orange-400 font-bold">{hoveredGoal.progress}%</span>
            </div>
            <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden border border-stone-800/40">
              <div
                style={{ width: `${hoveredGoal.progress}%` }}
                className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Subtasks summary */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-1 mt-0.5 text-[8.5px] font-mono text-stone-400">
              <Sparkles className="w-3 h-3 text-orange-400 shrink-0" />
              <span>TASKS: {completedTasks}/{totalTasks} COMPLETED</span>
            </div>
          )}
          
          {!readOnly && (
            <div className="text-[8px] font-mono text-stone-500 text-center mt-1 uppercase tracking-wider">
              Click star to edit goal
            </div>
          )}
        </div>
      )}

      {/* Grid Coordinates watermark */}
      <div className="absolute bottom-4 left-4 pointer-events-none font-courier text-[8.5px] text-stone-700 tracking-wider">
        SYS GALAXY.COORDS: X={Math.round(-pan.x)} / Y={Math.round(-pan.y)}
      </div>
    </div>
  );
}
