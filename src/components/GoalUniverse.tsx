import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, X, Star, Calendar, Trash2, 
  Activity, Trophy, Sparkles, Pin, 
  ArrowUpLeft, RotateCcw, Compass, ArrowUp
} from "lucide-react";
import { gsap } from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- GOAL INTERFACES ---
export interface Goal {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
  progress: number; // 0 to 100
  targetDate: string; // YYYY-MM-DD
  createdDate: string; // YYYY-MM-DD
  isPinned: boolean;
  startCoords: [number, number, number];
  endCoords: [number, number, number];
}

interface GoalUniverseProps {
  onScrollToTop: () => void;
}

export default function GoalUniverse({ onScrollToTop }: GoalUniverseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Form states for Create Goal
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("Personal");
  const [formPriority, setFormPriority] = useState<"low" | "medium" | "high">("medium");
  const [formProgress, setFormProgress] = useState(0);
  const [formTargetDate, setFormTargetDate] = useState("");

  // Refs for Three.js state tracking to bridge React state to the animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const constellationGroupRef = useRef<THREE.Group | null>(null);
  const raycasterObjectsRef = useRef<THREE.Object3D[]>([]);

  // Static scene element refs to control visibility without context re-creation
  const northStarRef = useRef<THREE.Sprite | null>(null);
  const northDiamondRef = useRef<THREE.Mesh | null>(null);

  // Cached textures to avoid WebGL context resource leaks
  const startGlowTexRef = useRef<THREE.CanvasTexture | null>(null);
  const goalNormalGlowTexRef = useRef<THREE.CanvasTexture | null>(null);
  const goalCompletedGlowTexRef = useRef<THREE.CanvasTexture | null>(null);
  const northStarTexRef = useRef<THREE.CanvasTexture | null>(null);

  // Keep a ref of current goals to access inside animation loops/event listeners without stale closure issues
  const goalsRef = useRef<Goal[]>([]);
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  // Load goals
  useEffect(() => {
    const stored = localStorage.getItem("oblivion_constellation_goals");
    if (stored) {
      try {
        setGoals(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored goals", e);
        setGoals([]);
      }
    } else {
      setGoals([]);
    }
  }, []);

  // Save goals
  const saveGoalsToStorage = (updated: Goal[]) => {
    setGoals(updated);
    localStorage.setItem("oblivion_constellation_goals", JSON.stringify(updated));
  };

  // --- POSITION GENERATION (Poisson-like) ---
  const generateNewConstellationCoords = (existing: Goal[]): { start: [number, number, number]; end: [number, number, number] } => {
    let center: [number, number, number] = [0, 0, 0];
    let attempts = 0;
    const minSpacing = 80;

    // Boundary limits
    const minX = -160, maxX = 160;
    const minY = -60, maxY = 60;
    const minZ = -80, maxZ = 80;

    while (attempts < 100) {
      const rx = minX + Math.random() * (maxX - minX);
      const ry = minY + Math.random() * (maxY - minY);
      const rz = minZ + Math.random() * (maxZ - minZ);
      
      // Avoid placing right in the center top where the North Star is (0, 150, 0)
      const distToNorthStar = Math.sqrt(rx * rx + (ry - 150) * (ry - 150) + rz * rz);
      if (distToNorthStar < 60) {
        attempts++;
        continue;
      }

      // Check distance to existing constellation centers
      let ok = true;
      for (const g of existing) {
        const cx = (g.startCoords[0] + g.endCoords[0]) / 2;
        const cy = (g.startCoords[1] + g.endCoords[1]) / 2;
        const cz = (g.startCoords[2] + g.endCoords[2]) / 2;

        const dist = Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2 + (rz - cz) ** 2);
        if (dist < minSpacing) {
          ok = false;
          break;
        }
      }

      if (ok) {
        center = [rx, ry, rz];
        break;
      }
      attempts++;
    }

    if (attempts >= 100) {
      // Fallback: spawn slightly scattered
      center = [
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 100
      ];
    }

    // A rising trajectory from bottom-left to top-right (growth vector)
    const dx = 25 + Math.random() * 10;
    const dy = 10 + Math.random() * 8;
    const dz = (Math.random() - 0.5) * 15;

    return {
      start: [center[0] - dx, center[1] - dy, center[2] - dz],
      end: [center[0] + dx, center[1] + dy, center[2] + dz]
    };
  };

  // --- ACTIONS ---
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTargetDate) return;

    const coords = generateNewConstellationCoords(goals);

    const newGoal: Goal = {
      id: "goal-" + Date.now(),
      name: formName,
      description: formDesc,
      category: formCategory,
      priority: formPriority,
      progress: Number(formProgress),
      createdDate: new Date().toISOString().split("T")[0],
      targetDate: formTargetDate,
      isPinned: false,
      startCoords: coords.start,
      endCoords: coords.end
    };

    const updated = [...goals, newGoal];
    saveGoalsToStorage(updated);
    setIsCreateOpen(false);

    // Reset inputs
    setFormName("");
    setFormDesc("");
    setFormCategory("Personal");
    setFormPriority("medium");
    setFormProgress(0);
    setFormTargetDate("");

    // Auto select the new goal and zoom in
    setTimeout(() => {
      setSelectedGoalId(newGoal.id);
    }, 100);
  };

  const handleUpdateProgress = (goalId: string, progressVal: number) => {
    const updated = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, progress: Math.min(100, Math.max(0, progressVal)) };
      }
      return g;
    });
    saveGoalsToStorage(updated);
  };

  const handleTogglePin = (goalId: string) => {
    const updated = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, isPinned: !g.isPinned };
      }
      // Only one goal can be pinned to the North Star at a time
      if (g.isPinned) {
        return { ...g, isPinned: false };
      }
      return g;
    });
    saveGoalsToStorage(updated);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter(g => g.id !== goalId);
    saveGoalsToStorage(updated);
    setSelectedGoalId(null);
  };

  // Find selected goal object
  const selectedGoal = goals.find(g => g.id === selectedGoalId) || null;

  // Statistics calculations
  const stats = (() => {
    const total = goals.length;
    const completed = goals.filter(g => g.progress === 100).length;
    const active = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, rate };
  })();

  // --- THREE.JS SCENE SETUP (Runs exactly ONCE on mount) ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x030303, 0.0018);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    camera.position.set(0, 40, 260);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    controls.minDistance = 30;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 500);
    pointLight1.position.set(0, 150, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.4, 600);
    pointLight2.position.set(-200, -50, -100);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xf59e0b, 0.3, 600);
    pointLight3.position.set(200, 100, 100);
    scene.add(pointLight3);

    // Lens flare helper for stars
    const createCircleGlowTexture = (type: "start" | "completed" | "normal" | "north") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);

      const cx = 128;
      const cy = 128;

      let primaryColor = "rgba(102, 234, 255, 1)";
      let glowColor = "rgba(0, 153, 255, 0.35)";
      
      if (type === "completed") {
        primaryColor = "rgba(251, 191, 36, 1)";
        glowColor = "rgba(245, 158, 11, 0.35)";
      } else if (type === "start") {
        primaryColor = "rgba(147, 197, 253, 1)";
        glowColor = "rgba(59, 130, 246, 0.25)";
      } else if (type === "north") {
        primaryColor = "rgba(255, 236, 179, 1)";
        glowColor = "rgba(245, 158, 11, 0.3)";
      } else if (type === "normal") {
        primaryColor = "rgba(244, 244, 245, 1)";
        glowColor = "rgba(102, 234, 255, 0.25)";
      }

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      bgGrad.addColorStop(0, primaryColor.replace(", 1)", ", 0.55").replace(",1)", ",0.55)"));
      bgGrad.addColorStop(0.35, glowColor);
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(9.5, 0.26);
      const horizGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
      horizGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
      horizGrad.addColorStop(0.15, primaryColor);
      horizGrad.addColorStop(0.4, glowColor);
      horizGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = horizGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(0.26, 9.5);
      ctx.fillStyle = horizGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(4.0, 0.16);
        const diagGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        diagGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        diagGrad.addColorStop(0.2, primaryColor.replace(", 1)", ", 0.7").replace(",1)", ",0.7)"));
        diagGrad.addColorStop(0.6, glowColor);
        diagGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = diagGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
      coreGrad.addColorStop(0.4, "rgba(255, 255, 255, 1)");
      coreGrad.addColorStop(0.8, primaryColor);
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    };

    // Instantiate and cache all textures
    const northStarTex = createCircleGlowTexture("north");
    const startGlowTex = createCircleGlowTexture("start");
    const goalNormalGlowTex = createCircleGlowTexture("normal");
    const goalCompletedGlowTex = createCircleGlowTexture("completed");

    northStarTexRef.current = northStarTex;
    startGlowTexRef.current = startGlowTex;
    goalNormalGlowTexRef.current = goalNormalGlowTex;
    goalCompletedGlowTexRef.current = goalCompletedGlowTex;

    const northStarMat = new THREE.SpriteMaterial({
      map: northStarTex,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const northStar = new THREE.Sprite(northStarMat);
    northStar.position.set(0, 150, 0);
    northStar.scale.set(12, 12, 1);
    northStar.visible = false; // Initially hidden
    scene.add(northStar);
    northStarRef.current = northStar;

    const northDiamondGeo = new THREE.OctahedronGeometry(1.5, 0);
    const northDiamondMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const northDiamond = new THREE.Mesh(northDiamondGeo, northDiamondMat);
    northDiamond.position.set(0, 150, 0);
    northDiamond.visible = false; // Initially hidden
    scene.add(northDiamond);
    northDiamondRef.current = northDiamond;

    const constellationGroup = new THREE.Group();
    scene.add(constellationGroup);
    constellationGroupRef.current = constellationGroup;

    // Helper references for animated travel particles
    const particleRenderStates: { [goalId: string]: number } = {};

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Read visibility dynamically
      const hasGoals = goalsRef.current.length > 0;
      const hasPinnedGoal = goalsRef.current.some(g => g.isPinned);
      northStar.visible = hasPinnedGoal;
      northDiamond.visible = hasPinnedGoal;

      if (hasPinnedGoal) {
        northDiamond.rotation.y = time * 0.5;
        northDiamond.rotation.x = time * 0.25;
        const northPulse = 12 + Math.sin(time * 2.5) * 1.5;
        northStar.scale.set(northPulse, northPulse, 1);
      }

      // Animate constellations
      constellationGroup.children.forEach(child => {
        if (child instanceof THREE.Sprite && child.userData.goalId && child.userData.type === "end") {
          const gid = child.userData.goalId;
          const matchingGoal = goalsRef.current.find(g => g.id === gid);
          if (matchingGoal) {
            const isFinished = matchingGoal.progress === 100;
            if (isFinished) {
              const pulse = 10.0 + Math.sin(time * 3.5) * 1.5;
              child.scale.set(pulse, pulse, 1);
            } else {
              const pulse = 7.0 + Math.sin(time * 1.5) * 0.45;
              child.scale.set(pulse, pulse, 1);
            }

            const travelSprite = child.userData.particleRef as THREE.Sprite;
            if (travelSprite && child.userData.startVec && child.userData.endVec) {
              const start = child.userData.startVec as THREE.Vector3;
              const end = child.userData.endVec as THREE.Vector3;
              
              const targetProg = matchingGoal.progress;
              let currentRenderVal = particleRenderStates[gid] !== undefined ? particleRenderStates[gid] : 0;
              currentRenderVal = THREE.MathUtils.lerp(currentRenderVal, targetProg, 0.045);
              particleRenderStates[gid] = currentRenderVal;

              const t = currentRenderVal / 100;
              travelSprite.position.lerpVectors(start, end, t);

              const particlePulse = 3.2 + Math.sin(time * 5 + start.x) * 0.5;
              travelSprite.scale.set(particlePulse, particlePulse, 1);
            }
          }
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Event listeners
    let mouseDownCoords = { x: 0, y: 0 };
    const handleMouseDown = (e: MouseEvent) => {
      mouseDownCoords = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const moveDistance = Math.sqrt((e.clientX - mouseDownCoords.x) ** 2 + (e.clientY - mouseDownCoords.y) ** 2);
      if (moveDistance > 6) return;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycasterObjectsRef.current);

      if (intersects.length > 0) {
        const clickedObj = intersects[0].object;
        const goalId = clickedObj.userData.goalId;
        if (goalId) {
          setSelectedGoalId(goalId);
          setShowHint(false);
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);

    const handleMouseMove = (e: MouseEvent) => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycasterObjectsRef.current);

      if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    };
    renderer.domElement.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      const w = containerRef.current?.clientWidth || width;
      const h = containerRef.current?.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      
      // Dispose cached textures to prevent memory leaks
      northStarTex.dispose();
      startGlowTex.dispose();
      goalNormalGlowTex.dispose();
      goalCompletedGlowTex.dispose();

      document.body.style.cursor = "default";
    };
  }, []);

  // --- REBUILD DYNAMIC CONSTELLATIONS (Runs only when goals state changes) ---
  useEffect(() => {
    if (!constellationGroupRef.current || !rendererRef.current) return;

    const group = constellationGroupRef.current;
    
    // Retrieve cached textures
    const startGlowTex = startGlowTexRef.current;
    const goalNormalGlowTex = goalNormalGlowTexRef.current;
    const goalCompletedGlowTex = goalCompletedGlowTexRef.current;

    // Guard to ensure textures are instantiated by setup useEffect
    if (!startGlowTex || !goalNormalGlowTex || !goalCompletedGlowTex) return;

    // Clear old meshes and explicitly dispose of their materials/geometries to prevent memory leaks
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);

      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Sprite) {
        child.material.dispose(); // Do not dispose the texture map since it is shared and cached!
      } else if (child instanceof THREE.Line) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    raycasterObjectsRef.current = [];

    const hasGoals = goals.length > 0;
    const hasPinnedGoal = goals.some(g => g.isPinned);
    if (northStarRef.current) northStarRef.current.visible = hasPinnedGoal;
    if (northDiamondRef.current) northDiamondRef.current.visible = hasPinnedGoal;

    goals.forEach(g => {
      const startPt = new THREE.Vector3(...g.startCoords);
      const endPt = new THREE.Vector3(...g.endCoords);

      // A. Start Star Sprite
      const startMat = new THREE.SpriteMaterial({
        map: startGlowTex,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const startSprite = new THREE.Sprite(startMat);
      startSprite.position.copy(startPt);
      startSprite.scale.set(5.5, 5.5, 1);
      startSprite.userData = { goalId: g.id, type: "start" };
      group.add(startSprite);
      raycasterObjectsRef.current.push(startSprite);

      // Core dot for Start Star
      const startCoreGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const startCoreMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
      const startCore = new THREE.Mesh(startCoreGeo, startCoreMat);
      startCore.position.copy(startPt);
      group.add(startCore);

      // B. Destination Star Sprite
      const isFinished = g.progress === 100;
      const destTex = isFinished ? goalCompletedGlowTex : goalNormalGlowTex;
      const destMat = new THREE.SpriteMaterial({
        map: destTex,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const destSprite = new THREE.Sprite(destMat);
      destSprite.position.copy(endPt);
      
      const scaleVal = isFinished ? 10.0 : 7.0;
      destSprite.scale.set(scaleVal, scaleVal, 1);
      destSprite.userData = { goalId: g.id, type: "end", isCompleted: isFinished };
      group.add(destSprite);
      raycasterObjectsRef.current.push(destSprite);

      // Core dot for Destination Star
      const destCoreGeo = new THREE.SphereGeometry(isFinished ? 0.6 : 0.45, 8, 8);
      const destCoreMat = new THREE.MeshBasicMaterial({ color: isFinished ? 0xf59e0b : 0xffffff });
      const destCore = new THREE.Mesh(destCoreGeo, destCoreMat);
      destCore.position.copy(endPt);
      group.add(destCore);

      // C. Glowing Connecting Path Line
      const linePoints = [startPt, endPt];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: isFinished ? 0xd97706 : 0x78716c,
        transparent: true,
        opacity: isFinished ? 0.55 : 0.25,
        blending: THREE.AdditiveBlending
      });
      const constellationLine = new THREE.Line(lineGeo, lineMat);
      group.add(constellationLine);

      // D. Travel Particle along the path (reuses cached completed yellow/gold texture)
      const travelMat = new THREE.SpriteMaterial({
        map: goalCompletedGlowTex,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const travelSprite = new THREE.Sprite(travelMat);
      travelSprite.scale.set(3.5, 3.5, 1);
      group.add(travelSprite);

      destSprite.userData.particleRef = travelSprite;
      destSprite.userData.startVec = startPt;
      destSprite.userData.endVec = endPt;
      destSprite.userData.goalId = g.id;

      // E. Pinned Goal link to the North Star
      if (g.isPinned) {
        const northVec = new THREE.Vector3(0, 150, 0);
        const midVec = new THREE.Vector3().addVectors(endPt, northVec).multiplyScalar(0.5);
        midVec.x += 20; // curve control point
        
        const curve = new THREE.QuadraticBezierCurve3(endPt, midVec, northVec);
        const curvePts = curve.getPoints(30);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
        const dashMat = new THREE.LineDashedMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.4,
          dashSize: 2.5,
          gapSize: 2.5,
          blending: THREE.AdditiveBlending
        });
        
        const pinLine = new THREE.Line(curveGeo, dashMat);
        pinLine.computeLineDistances();
        group.add(pinLine);
      }
    });
  }, [goals]);

  // --- CAMERA ZOOM ANIMATION ---
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    if (selectedGoalId) {
      const targetGoalObj = goals.find(g => g.id === selectedGoalId);
      if (!targetGoalObj) return;

      // Calculate midpoint of selected constellation
      const cx = (targetGoalObj.startCoords[0] + targetGoalObj.endCoords[0]) / 2;
      const cy = (targetGoalObj.startCoords[1] + targetGoalObj.endCoords[1]) / 2;
      const cz = (targetGoalObj.startCoords[2] + targetGoalObj.endCoords[2]) / 2;

      // Smoothly animate OrbitControls target to center on selected constellation
      gsap.to(controlsRef.current.target, {
        x: cx,
        y: cy,
        z: cz,
        duration: 1.2,
        ease: "power2.out"
      });

      // Smoothly animate camera position to zoom in (offset on Z axis slightly)
      gsap.to(cameraRef.current.position, {
        x: cx,
        y: cy + 15,
        z: cz + 75,
        duration: 1.2,
        ease: "power2.out"
      });
    } else {
      // Zoom out to default overview coordinates when deselected
      gsap.to(controlsRef.current.target, {
        x: 0,
        y: 40,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut"
      });

      gsap.to(cameraRef.current.position, {
        x: 0,
        y: 40,
        z: 260,
        duration: 1.2,
        ease: "power2.inOut"
      });
    }
  }, [selectedGoalId, goals]);

  // Reset Camera View Action
  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    setSelectedGoalId(null);

    gsap.to(controlsRef.current.target, {
      x: 0,
      y: 40,
      z: 0,
      duration: 1.2,
      ease: "power2.inOut"
    });

    gsap.to(cameraRef.current.position, {
      x: 0,
      y: 40,
      z: 260,
      duration: 1.2,
      ease: "power2.inOut"
    });
  };

  // Helper: Get days remaining
  const getDaysRemaining = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const today = new Date();
    // Set hours to midnight to compare date only
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen h-[100dvh] bg-[#030303] text-stone-100 flex flex-col justify-between overflow-hidden z-10 select-none border-t border-stone-900"
    >
      {/* 1. BACKGROUND CANVAS */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 block w-full h-full cursor-grab active:cursor-grabbing" 
      />

      {/* 2. DUST/ATMOSPHERIC AMBIENT GLOW VIGNETTE */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_0%,rgba(0,0,0,0.85)_100%)]" />

      {/* 3. HEADER OVERLAY PANEL (Pointer Events: None on parent, Auto on content) */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        
        {/* Title Info */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-courier text-[10px] tracking-[0.3em] uppercase text-stone-400">
              ORBITAL SYSTEM
            </span>
          </div>
          <h2 className="font-inter font-black text-xl md:text-2xl tracking-[0.15em] uppercase text-stone-50">
            YOUR UNIVERSE
          </h2>
          <p className="font-courier text-[10px] text-stone-500 mt-1 max-w-sm">
            Interactive constellation map of goals. Pinned objectives align relative to the North Star.
          </p>
        </div>

        {/* Global Statistics Cards */}
        <div className="flex items-center gap-3 md:gap-5 pointer-events-auto">
          {/* Active Goals card */}
          <div className="px-4 py-2.5 rounded bg-stone-950/65 border border-stone-800/40 backdrop-blur-md flex items-center gap-3">
            <Activity className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-courier text-[8px] text-stone-400 tracking-wider">ACTIVE</div>
              <div className="font-inter font-bold text-sm text-stone-100">{stats.active}</div>
            </div>
          </div>

          {/* Completed Goals card */}
          <div className="px-4 py-2.5 rounded bg-stone-950/65 border border-stone-800/40 backdrop-blur-md flex items-center gap-3">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="font-courier text-[8px] text-stone-400 tracking-wider">COMPLETED</div>
              <div className="font-inter font-bold text-sm text-stone-100">{stats.completed}</div>
            </div>
          </div>

          {/* Completion Rate card */}
          <div className="px-4 py-2.5 rounded bg-stone-950/65 border border-stone-800/40 backdrop-blur-md flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0 animate-pulse" />
            <div>
              <div className="font-courier text-[8px] text-stone-400 tracking-wider">SUCCESS RATE</div>
              <div className="font-inter font-bold text-sm text-stone-100">{stats.rate}%</div>
            </div>
          </div>
        </div>
      </header>

      {/* 4. MAIN CENTRAL INTERACTIVE INSTRUCTIONS */}
      <AnimatePresence>
        {showHint && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.65, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute top-[28%] left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center hidden md:block"
          >
            <Compass className="w-6 h-6 mx-auto mb-2 text-stone-400 animate-spin" style={{ animationDuration: "12s" }} />
            <p className="font-courier text-[10px] tracking-[0.25em] uppercase text-stone-300">
              DRAG TO ROTATE &bull; SCROLL TO ZOOM &bull; CLICK STAR TO INSPECT
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIDE DOCK - ACHIEVEMENT ARCHIVE & RESET VIEW (Pointer Events: Auto) */}
      <div className="absolute right-6 top-[35%] md:top-[40%] z-10 flex flex-col gap-3 pointer-events-auto">
        {/* Reset Camera Button */}
        <button
          onClick={handleResetView}
          className="w-10 h-10 rounded-full bg-stone-950/70 border border-stone-800 hover:border-stone-400 text-stone-300 hover:text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg"
          title="Reset Universe Camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Toggle Archive View */}
        <button
          onClick={() => setShowArchive(!showArchive)}
          className={`w-10 h-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg ${
            showArchive 
              ? "bg-amber-500/20 border-amber-400 text-amber-300" 
              : "bg-stone-950/70 border-stone-800 hover:border-stone-400 text-stone-300 hover:text-white"
          }`}
          title="Toggle Completed Archive View"
        >
          <Trophy className="w-4 h-4" />
        </button>
      </div>

      {/* 6. BOTTOM HUD CONTROLS */}
      <footer className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pointer-events-none">
        
        {/* Left Actions: Create Goal & Show Archive list */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Create Goal Trigger */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-3.5 bg-stone-100 hover:bg-white text-stone-950 font-inter font-bold text-xs tracking-[0.15em] uppercase flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-black cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>CREATE GOAL</span>
          </button>
          
          <button
            onClick={onScrollToTop}
            className="px-4 py-3.5 bg-transparent border border-stone-800 hover:border-stone-300 text-stone-300 hover:text-white font-inter font-semibold text-xs tracking-[0.15em] uppercase flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>RETURN TO SINGULARITY</span>
          </button>
        </div>

        {/* Right status block */}
        <div className="font-courier text-right pointer-events-auto hidden sm:block">
          <div className="text-[9px] text-stone-500 uppercase tracking-widest">
            ACTIVE SYSTEM COORDINATES
          </div>
          <div className="text-xs text-stone-300 font-bold mt-0.5">
            OBLIVION // COSTELLATION-V4
          </div>
        </div>
      </footer>

      {/* 7. ARCHIVE LIST DRAWER OVERLAY */}
      <AnimatePresence>
        {showArchive && (
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute left-6 top-1/4 bottom-20 w-80 max-w-full z-20 bg-stone-950/85 border border-stone-850 backdrop-blur-xl rounded p-5 flex flex-col justify-between shadow-2xl"
          >
            <div>
              <div className="flex justify-between items-center border-b border-stone-800 pb-3 mb-4">
                <h3 className="font-inter font-bold text-xs tracking-[0.2em] uppercase text-stone-200 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>COMPLETED ARCHIVE</span>
                </h3>
                <button 
                  onClick={() => setShowArchive(false)}
                  className="text-stone-500 hover:text-stone-250 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1 scrollbar-thin">
                {goals.filter(g => g.progress === 100).length === 0 ? (
                  <div className="text-center py-8 text-stone-600 font-courier text-xs">
                    No completed achievements recorded. Reach 100% on a goal to archive it.
                  </div>
                ) : (
                  goals.filter(g => g.progress === 100).map(g => (
                    <div 
                      key={g.id}
                      onClick={() => {
                        setSelectedGoalId(g.id);
                        setShowArchive(false);
                      }}
                      className="p-3 bg-stone-900/40 border border-stone-800 hover:border-amber-500/50 rounded cursor-pointer transition-all hover:bg-stone-900/80 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-inter font-semibold text-xs text-stone-250 truncate group-hover:text-amber-400">
                          {g.name}
                        </span>
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0 animate-pulse" />
                      </div>
                      <div className="font-courier text-[9px] text-stone-500 mt-1 uppercase">
                        {g.category} &bull; COMPLETED
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="border-t border-stone-800 pt-3 text-center">
              <span className="font-courier text-[9px] text-stone-500">
                TOTAL ACHIEVED: {goals.filter(g => g.progress === 100).length} STAR(S)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. CREATE GOAL MODAL */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-stone-950 border border-stone-800 rounded p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-stone-800 pb-4 mb-5">
                <div>
                  <h3 className="font-inter font-extrabold text-sm tracking-[0.2em] uppercase text-stone-100">
                    CREATE NEW CONSTELLATION
                  </h3>
                  <p className="font-courier text-[9px] text-stone-500 mt-0.5 uppercase">
                    Map a new trajectory in your universe
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-8 h-8 rounded-full border border-stone-900 hover:border-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateGoal} className="space-y-4 font-inter text-xs">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block">
                    GOAL NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter short inspiring title..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    maxLength={36}
                    className="w-full bg-stone-900 border border-stone-800 focus:border-stone-500 rounded px-3 py-2 text-stone-100 outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block">
                    DESCRIPTION
                  </label>
                  <textarea
                    placeholder="Summarize the trajectory path..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                    maxLength={140}
                    className="w-full bg-stone-900 border border-stone-800 focus:border-stone-500 rounded px-3 py-2 text-stone-100 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Grid for parameters */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block">
                      CATEGORY
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 focus:border-stone-500 rounded px-3 py-2 text-stone-100 outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {["Personal", "Career", "Finance", "Fitness", "Learning", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block">
                      PRIORITY
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as "low" | "medium" | "high")}
                      className="w-full bg-stone-900 border border-stone-800 focus:border-stone-500 rounded px-3 py-2 text-stone-100 outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Target Date */}
                  <div className="space-y-1.5">
                    <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block">
                      TARGET DATE
                    </label>
                    <input
                      type="date"
                      required
                      value={formTargetDate}
                      onChange={(e) => setFormTargetDate(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-800 focus:border-stone-500 rounded px-3 py-2 text-stone-100 outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  {/* Initial Progress */}
                  <div className="space-y-1.5">
                    <label className="font-courier text-[10px] uppercase tracking-wider text-stone-400 block flex justify-between">
                      <span>PROGRESS</span>
                      <span className="text-amber-400 font-bold">{formProgress}%</span>
                    </label>
                    <div className="flex items-center gap-3 h-[38px]">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formProgress}
                        onChange={(e) => setFormProgress(Number(e.target.value))}
                        className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-stone-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded bg-transparent border border-stone-850 hover:border-stone-600 text-stone-450 hover:text-stone-300 tracking-wider uppercase font-inter font-bold text-[10px] cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-stone-100 hover:bg-white text-stone-950 font-inter font-bold text-[10px] tracking-wider uppercase transition-colors shadow shadow-black cursor-pointer"
                  >
                    GENERATE STARS
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. INTERACTIVE STAR DETAIL MODAL */}
      <AnimatePresence>
        {selectedGoal && (
          <div className="fixed inset-0 z-40 pointer-events-none flex items-end md:items-center justify-start p-4 md:p-12">
            <motion.div
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -30, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-stone-950/90 border border-stone-800/80 backdrop-blur-xl rounded p-5 md:p-6 shadow-2xl pointer-events-auto flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-courier font-bold uppercase ${
                      selectedGoal.priority === "high" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : selectedGoal.priority === "medium"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-stone-500/10 text-stone-400 border border-stone-500/20"
                    }`}>
                      {selectedGoal.priority} priority
                    </span>
                    <span className="font-courier text-[9px] text-stone-500 uppercase">
                      {selectedGoal.category}
                    </span>
                  </div>
                  <h3 className="font-inter font-black text-sm sm:text-base text-stone-50 mt-2 tracking-wide uppercase break-words">
                    {selectedGoal.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedGoalId(null)}
                  className="w-7 h-7 flex shrink-0 items-center justify-center rounded-full border border-stone-900 hover:border-stone-850 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Description */}
              <p className="font-courier text-xs text-stone-400 leading-relaxed break-words">
                {selectedGoal.description || "No vector logs recorded for this objective."}
              </p>

              {/* Timeline Info */}
              <div className="bg-stone-900/35 border border-stone-900/60 p-3 rounded space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-courier text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>TIMELINE STATUS</span>
                  </span>
                  <span className="text-stone-300 font-bold">
                    {getDaysRemaining(selectedGoal.targetDate) > 0 
                      ? `${getDaysRemaining(selectedGoal.targetDate)} DAYS REMAINING`
                      : getDaysRemaining(selectedGoal.targetDate) === 0 
                      ? "TARGET REACHED TODAY"
                      : `${Math.abs(getDaysRemaining(selectedGoal.targetDate))} DAYS OVERDUE`
                    }
                  </span>
                </div>
                
                {/* Horizontal timeline bar */}
                <div className="flex items-center gap-2 text-[8px] font-courier text-stone-500">
                  <span className="truncate max-w-[80px]">{selectedGoal.createdDate}</span>
                  <div className="flex-1 h-[2px] bg-stone-800 relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-amber-400"
                      style={{ left: `${selectedGoal.progress}%` }}
                    />
                  </div>
                  <span className="truncate max-w-[80px]">{selectedGoal.targetDate}</span>
                </div>
              </div>

              {/* Progress System Controls */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-courier">
                  <span className="text-stone-400">INTERPOLATE PROGRESS</span>
                  <span className={`font-bold ${selectedGoal.progress === 100 ? "text-amber-400" : "text-stone-250"}`}>
                    {selectedGoal.progress}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedGoal.progress}
                    onChange={(e) => handleUpdateProgress(selectedGoal.id, Number(e.target.value))}
                    className="w-full h-1 bg-stone-850 rounded-lg appearance-none cursor-pointer accent-stone-350"
                  />
                  {selectedGoal.progress < 100 && (
                    <button
                      onClick={() => handleUpdateProgress(selectedGoal.id, 100)}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded text-[8px] font-courier font-bold uppercase transition-colors shrink-0"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Actions: Pinned and Delete */}
              <div className="flex justify-between items-center pt-3 border-t border-stone-900/80 gap-3">
                {/* Pin to North Star */}
                <button
                  onClick={() => handleTogglePin(selectedGoal.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-[9px] font-courier font-bold uppercase transition-all ${
                    selectedGoal.isPinned
                      ? "bg-amber-400/10 border border-amber-400/20 text-amber-300"
                      : "bg-transparent border border-stone-850 text-stone-500 hover:text-stone-300 hover:border-stone-700"
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${selectedGoal.isPinned ? "fill-amber-400" : ""}`} />
                  <span>{selectedGoal.isPinned ? "PINNED TO NORTH STAR" : "PIN AS MAIN GOAL"}</span>
                </button>

                {/* Delete Goal */}
                <button
                  onClick={() => handleDeleteGoal(selectedGoal.id)}
                  className="p-2 border border-stone-900/80 hover:border-red-950/40 text-stone-600 hover:text-red-400 rounded hover:bg-red-950/10 transition-all cursor-pointer"
                  title="Erase Constellation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
