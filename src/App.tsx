import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  Play, 
  X, 
  Sparkles, 
  Trophy, 
  Plus, 
  LogOut, 
  Share2, 
  ExternalLink, 
  Lock,
  ChevronLeft
} from "lucide-react";
import { gsap } from "gsap";

// Database & Components
import { 
  getCurrentUser, 
  getUserGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  logoutUser, 
  seedDemoData,
  Goal, 
  User as DbUser, 
  Subtask 
} from "./db";
import GalaxyCanvas from "./components/GalaxyCanvas";
import GoalModal from "./components/GoalModal";
import AIAssistant from "./components/AIAssistant";

export default function App() {
  // Navigation & Modal Views
  const [view, setView] = useState<"landing" | "dashboard" | "public">("landing");
  const [showreelOpen, setShowreelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  // Core Data State
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [shareUsername, setShareUsername] = useState("");

  // Mobile Drawer Toggle
  const [mobileActivePanel, setMobileActivePanel] = useState<"none" | "goals" | "ai">("none");

  // Share copy confirmation
  const [copied, setCopied] = useState(false);

  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  // Background videos
  const videoUrlBackground = "https://player.cloudinary.com/embed/?cloud_name=dgqd54pbl&public_id=Black_hole_rotating_in_place_202606051222_y4pdi9&autoplay=true&loop=true&muted=true&controls=false";
  const videoUrlCinematic = "https://player.cloudinary.com/embed/?cloud_name=dgqd54pbl&public_id=Black_hole_rotating_in_place_202606051222_y4pdi9&autoplay=true&loop=true&controls=true&theme=dark";

  // Check URL parameters for share keys and session checks
  useEffect(() => {
    const checkSessionAndShare = async () => {
      const params = new URLSearchParams(window.location.search);
      const shareUser = params.get("share");
      
      seedDemoData("cosmic_traveler");

      if (shareUser) {
        setShareUsername(shareUser);
        const publicGoals = getUserGoals(shareUser);
        setGoals(publicGoals);
        setView("public");
      } else {
        setCurrentUser({ username: "cosmic_traveler", displayName: "Cosmic Traveler" });
        setGoals(getUserGoals("cosmic_traveler"));
      }
    };
    checkSessionAndShare();
  }, []);

  // Initialize SVG stroke dasharray and dashoffset
  useEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;

    if (p1 && p2) {
      const len1 = p1.getTotalLength();
      const len2 = p2.getTotalLength();
      p1.style.strokeDasharray = `${len1}`;
      p1.style.strokeDashoffset = `${len1}`;
      p2.style.strokeDasharray = `${len2}`;
      p2.style.strokeDashoffset = `${len2}`;
    }
  }, []);

  // ESC key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowreelOpen(false);
        setMenuOpen(false);
        setAuthOpen(false);
        setGoalModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const leave = () => {
    return new Promise<void>((resolve) => {
      const p1 = path1Ref.current;
      const p2 = path2Ref.current;
      if (!p1 || !p2) {
        resolve();
        return;
      }
      const isMobile = window.innerWidth < 768;
      const targetStrokeWidth = isMobile ? 1200 : 700;
      const tl = gsap.timeline({ onComplete: resolve });

      tl.to(p1, {
        strokeDashoffset: 0,
        attr: { "stroke-width": targetStrokeWidth },
        duration: 0.85,
        ease: "power2.inOut",
      }, 0);

      tl.to(p2, {
        strokeDashoffset: 0,
        attr: { "stroke-width": targetStrokeWidth },
        duration: 0.85,
        ease: "power2.inOut",
      }, 0.08);
    });
  };

  const enter = () => {
    return new Promise<void>((resolve) => {
      const p1 = path1Ref.current;
      const p2 = path2Ref.current;
      if (!p1 || !p2) {
        resolve();
        return;
      }
      const len1 = p1.getTotalLength();
      const len2 = p2.getTotalLength();
      const isMobile = window.innerWidth < 768;
      const baseStrokeWidth = isMobile ? 300 : 200;
      const tl = gsap.timeline({ onComplete: resolve });

      tl.to(p1, {
        strokeDashoffset: -len1,
        attr: { "stroke-width": baseStrokeWidth },
        duration: 0.85,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(p1, { strokeDashoffset: len1 });
        }
      }, 0);

      tl.to(p2, {
        strokeDashoffset: -len2,
        attr: { "stroke-width": baseStrokeWidth },
        duration: 0.85,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(p2, { strokeDashoffset: len2 });
        }
      }, 0.08);
    });
  };

  const handleMenuNavigation = async (openState: boolean) => {
    if (isTransitioning || openState === menuOpen) return;
    setIsTransitioning(true);
    await leave();
    setMenuOpen(openState);
    await enter();
    setIsTransitioning(false);
  };

  // Immersive transition routing
  const handleViewChange = async (newView: "landing" | "dashboard" | "public", usernameToLoad?: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    await leave();

    if (newView === "public" && usernameToLoad) {
      setShareUsername(usernameToLoad);
      setGoals(getUserGoals(usernameToLoad));
    } else if (newView === "dashboard" && currentUser) {
      setGoals(getUserGoals(currentUser.username));
    } else if (newView === "landing") {
      // Refresh user session if back to landing
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setGoals(getUserGoals(user.username));
      }
    }

    setView(newView);
    setMenuOpen(false);
    setMobileActivePanel("none");
    await enter();
    setIsTransitioning(false);
  };

  // Direct access routing
  const handleGalaxyAccess = () => {
    handleViewChange("dashboard");
  };

  const handleReturnToLanding = () => {
    // Clear URL parameters securely
    window.history.pushState({}, document.title, window.location.pathname);
    handleViewChange("landing");
  };

  // Goal Saving Operations
  const handleSaveGoal = (goalData: {
    title: string;
    description: string;
    progress: number;
    streak: number;
    connections: string[];
    subtasks: Subtask[];
  }) => {
    if (!currentUser) return;
    if (selectedGoal) {
      updateGoal(selectedGoal.id, goalData);
    } else {
      createGoal(
        currentUser.username,
        goalData.title,
        goalData.description,
        goalData.progress,
        goalData.streak,
        goalData.connections,
        goalData.subtasks
      );
    }
    setGoals(getUserGoals(currentUser.username));
    setGoalModalOpen(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    if (currentUser) {
      setGoals(getUserGoals(currentUser.username));
    }
    setGoalModalOpen(false);
    setSelectedGoal(null);
  };

  // AI Injection Operations
  const handleInjectSubtasks = (goalId: string, subtasks: Subtask[]) => {
    updateGoal(goalId, { subtasks });
    if (currentUser) {
      setGoals(getUserGoals(currentUser.username));
    }
  };

  const handleInjectNewGoal = (title: string, description: string, subtasks: Subtask[]) => {
    if (!currentUser) return;
    createGoal(currentUser.username, title, description, 0, 0, [], subtasks);
    setGoals(getUserGoals(currentUser.username));
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?share=${currentUser?.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((acc, curr) => acc + curr.progress, 0) / goals.length) 
    : 0;

  const totalStreaks = goals.reduce((acc, curr) => acc + curr.streak, 0);

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-white text-stone-900 overflow-x-hidden selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      
      {/* ---------------- BACKGROUND LAYER ---------------- */}
      {view === "landing" ? (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="w-full h-full relative flex items-center justify-center">
            <iframe
              src={videoUrlBackground}
              title="Black Hole Accretion Disk"
              className="w-[178vh] h-[100vh] md:w-[100vw] md:h-[100vh] shrink-0 max-w-none border-0 mix-blend-darken scale-[1.3] sm:scale-[1.2] md:scale-y-[1.15] md:scale-x-[1.4] opacity-95 transition-transform duration-700"
              allow="autoplay; fullscreen"
            />
          </div>
        </div>
      ) : (
        // Immersive black canvas mode for galaxy mapping
        <div className="fixed inset-0 z-0 bg-black" />
      )}

      {/* ---------------- 1. NAVIGATION HEADER ---------------- */}
      <header className={`relative w-full z-20 px-4 py-4 sm:px-6 sm:py-6 md:px-12 flex justify-between items-center transition-all ${
        view === "landing" ? "liquid-glass-strong" : "bg-black/40 border-b border-stone-900/60 backdrop-blur-lg"
      }`}>
        {/* Left Logo */}
        <button 
          onClick={handleReturnToLanding}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group text-left"
        >
          <div className={`relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center transition-colors ${
            view === "landing" ? "border-stone-900" : "border-orange-500/60 group-hover:border-orange-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${view === "landing" ? "bg-stone-900" : "bg-orange-500"}`} />
          </div>
          <span className={`font-inter font-extrabold tracking-[0.25em] sm:tracking-[0.35em] text-xs sm:text-sm uppercase pt-1 transition-colors ${
            view === "landing" ? "text-stone-900" : "text-stone-100 group-hover:text-orange-400"
          }`}>
            OBLIVION
          </span>
        </button>

        {/* Center / Navigation Links */}
        {view === "landing" ? (
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {["GALAXY", "ABOUT", "SERVICES", "JOURNAL", "CONTACT"].map((link) => (
              <button
                key={link}
                onClick={link === "GALAXY" ? handleGalaxyAccess : () => handleMenuNavigation(true)}
                className="font-inter font-medium tracking-[0.25em] text-xs uppercase cursor-pointer hover:text-stone-500 active:scale-95 transition-all relative py-1 text-stone-900"
              >
                {link === "GALAXY" ? "MY GALAXY" : link}
              </button>
            ))}
          </nav>
        ) : (
          <div className="font-courier text-[10px] sm:text-xs text-orange-400 uppercase tracking-widest pointer-events-none hidden sm:block">
            {view === "dashboard" ? `SYSTEM MAPPING MODE // USER: ${currentUser?.displayName}` : `VIEWING GALAXY OF: ${shareUsername}`}
          </div>
        )}

        {/* Right Menu / Auth actions */}
        <div className="flex items-center gap-6">
          {view === "landing" ? (
            <button 
              onClick={() => handleMenuNavigation(!menuOpen)}
              className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-all text-stone-950"
              aria-label="Toggle navigation menu"
            >
              <span className="font-inter font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase group-hover:text-stone-500 transition-colors pt-1">
                {menuOpen ? "CLOSE" : "MENU"}
              </span>
              <div className="flex flex-col gap-1 w-4 sm:w-5">
                <span className="h-[1.5px] w-full bg-stone-900" />
                <span className="h-[1.5px] w-3 sm:w-4 ml-auto bg-stone-900 group-hover:w-full transition-all" />
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {view === "dashboard" ? (
                <button
                  onClick={copyShareLink}
                  className="font-mono text-[9px] uppercase tracking-wider text-stone-400 hover:text-orange-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? "COPIED URL" : "SHARE"}</span>
                </button>
              ) : (
                <button
                  onClick={handleReturnToLanding}
                  className="font-mono text-[9px] uppercase tracking-wider text-stone-400 hover:text-orange-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>MY GALAXY</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ---------------- 2. MAIN SWITCH AREA ---------------- */}
      <AnimatePresence mode="wait">
        {!menuOpen ? (
          view === "landing" ? (
            /* ---- Existing Landing Page view ---- */
            <motion.main 
              key="hero-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex-1 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 md:px-12"
            >
              <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8 items-end">
                
                {/* Main Typography Column */}
                <div className="lg:col-span-8 relative">
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-6 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
                    <p className="font-courier text-[9px] sm:text-xs uppercase tracking-[0.3em] text-stone-500">
                      COSMIC GOAL TRACKING SYSTEM
                    </p>
                  </div>

                  <div className="relative inline-block w-full">
                    <h1 className="font-inter font-black text-stone-950 text-[10.5vw] sm:text-[8.5vw] lg:text-[7.6rem] leading-[0.88] sm:leading-[0.82] tracking-tighter uppercase select-none break-words">
                      BEYOND
                      <br />
                      THE EVENT
                      <br />
                      HORIZON
                    </h1>

                    <div className="absolute top-[40%] sm:top-[32%] right-4 sm:right-[15%] md:right-[18%] pointer-events-none">
                      <span className="font-condiment text-red-500 text-[11vw] sm:text-[9vw] lg:text-9xl tracking-normal lowercase block select-none whitespace-nowrap">
                        the singularity
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slogan and CTAs Column */}
                <div className="lg:col-span-4 lg:pl-4 space-y-5 sm:space-y-6">
                  <p className="font-courier text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md">
                    Ignite goals as glowing stars. Connect them to form constellations visualizing your cosmic journey.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
                    {/* Explore Galaxy button */}
                    <button 
                      id="btn-explore-work"
                      onClick={handleGalaxyAccess}
                      className="px-6 py-3.5 sm:px-8 sm:py-4 bg-stone-950 hover:bg-stone-800 text-white font-inter font-semibold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-between min-w-full sm:min-w-[180px] cursor-pointer active:scale-[0.98] sm:active:scale-95"
                    >
                      <span>EXPLORE GALAXY</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 shrink-0" />
                    </button>

                    {/* Watch showreel Button */}
                    <button 
                      id="btn-watch-showreel"
                      onClick={() => setShowreelOpen(true)}
                      className="px-6 py-3.5 sm:px-8 sm:py-4 bg-transparent border border-stone-200 hover:border-stone-900 text-stone-900 font-inter font-semibold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-between min-w-full sm:min-w-[180px] cursor-pointer active:scale-[0.98] sm:active:scale-95"
                    >
                      <span>WATCH SHOWREEL</span>
                      <Play className="w-3.5 h-3.5 fill-current ml-1 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.main>
          ) : (
            /* ---- Cosmic Galaxy Workspace View (Dashboard / Public View) ---- */
            <motion.main
              key="galaxy-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden bg-black text-stone-300"
            >
              {/* LEFT SIDEBAR (Desktop): Stats & Goal Selector */}
              <div className="hidden lg:flex flex-col w-80 shrink-0 border-r border-stone-900/80 bg-black/60 backdrop-blur-md p-6 gap-6 z-10">
                {/* Profile header */}
                <div>
                  <h3 className="font-inter font-black text-sm text-stone-100 tracking-wider">
                    {view === "dashboard" ? `COMMAND: ${currentUser?.displayName}` : `COSMIC MAP: ${shareUsername}`}
                  </h3>
                  <p className="font-courier text-[9px] text-stone-500 uppercase mt-1">STAR MAP PROFILE METRICS</p>
                </div>

                {/* Statistics Card */}
                <div className="bg-stone-900/40 border border-stone-850 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-courier text-[10px] text-stone-400">STAR COUNT</span>
                    <span className="font-mono text-sm font-bold text-stone-100">{goals.length}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-stone-400">AVERAGE ORBITS</span>
                      <span className="text-orange-400 font-bold">{averageProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden border border-stone-800/40">
                      <div 
                        style={{ width: `${averageProgress}%` }}
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500" 
                      />
                    </div>
                  </div>

                  {totalStreaks > 0 && (
                    <div className="flex items-center justify-between border-t border-stone-850/60 pt-3">
                      <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>IGNITION STREAK</span>
                      </div>
                      <span className="font-mono text-xs text-stone-100 font-bold">{totalStreaks} DAYS</span>
                    </div>
                  )}
                </div>

                {/* Goal List */}
                <div className="flex-1 flex flex-col min-h-0 gap-3">
                  <div className="flex justify-between items-center shrink-0">
                    <span className="font-courier text-[10px] text-stone-400">STAR SECTOR REGISTER</span>
                    {view === "dashboard" && (
                      <button
                        onClick={() => { setSelectedGoal(null); setGoalModalOpen(true); }}
                        className="p-1 rounded bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white transition-colors cursor-pointer border border-orange-500/30"
                        title="Create Goal"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
                    {goals.length === 0 ? (
                      <div className="text-center font-courier text-[10px] text-stone-600 py-8">
                        NO ACTIVE VECTORS FOUND. IGNITE A NEW STAR TO BEGIN.
                      </div>
                    ) : (
                      goals.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            if (view === "dashboard") {
                              setSelectedGoal(g);
                              setGoalModalOpen(true);
                            }
                          }}
                          className={`w-full p-3 bg-stone-950/80 hover:bg-stone-900 border text-left rounded-lg transition-all flex justify-between items-center cursor-pointer ${
                            view === "dashboard" ? "border-stone-850 hover:border-orange-500/30" : "border-stone-900 pointer-events-none"
                          }`}
                        >
                          <div className="truncate pr-2 space-y-0.5">
                            <div className="font-inter font-bold text-stone-250 text-xs truncate uppercase tracking-tight">
                              {g.title}
                            </div>
                            <div className="font-mono text-[9px] text-stone-500">
                              PROGRESS: {g.progress}%
                            </div>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" 
                               style={{ 
                                 backgroundColor: g.progress === 100 
                                   ? "#10b981" 
                                   : `rgba(249, 115, 22, ${0.3 + (g.progress / 100) * 0.7})`,
                                 boxShadow: `0 0 8px ${g.progress === 100 ? "#10b981" : "#f97316"}`
                               }} 
                          />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* CENTER AREA: Full-screen interactive Canvas */}
              <div className="flex-1 relative flex flex-col overflow-hidden z-0">
                <GalaxyCanvas 
                  goals={goals} 
                  onSelectGoal={(g) => {
                    if (view === "dashboard") {
                      setSelectedGoal(g);
                      setGoalModalOpen(true);
                    }
                  }} 
                  readOnly={view !== "dashboard"}
                />

                {/* Floating Mobile Drawer Buttons */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 lg:hidden z-20">
                  <button
                    onClick={() => setMobileActivePanel(mobileActivePanel === "goals" ? "none" : "goals")}
                    className={`px-4 py-2.5 font-inter font-bold text-[10px] tracking-wider uppercase rounded-full border transition-all cursor-pointer shadow-lg ${
                      mobileActivePanel === "goals"
                        ? "bg-orange-500 border-orange-400 text-white"
                        : "bg-stone-950/80 border-stone-800 text-stone-300"
                    }`}
                  >
                    GOALS & METRICS
                  </button>
                  {view === "dashboard" && (
                    <button
                      onClick={() => setMobileActivePanel(mobileActivePanel === "ai" ? "none" : "ai")}
                      className={`px-4 py-2.5 font-inter font-bold text-[10px] tracking-wider uppercase rounded-full border transition-all cursor-pointer shadow-lg ${
                        mobileActivePanel === "ai"
                          ? "bg-orange-500 border-orange-400 text-white"
                          : "bg-stone-950/80 border-stone-800 text-stone-300"
                      }`}
                    >
                      AI ADVISOR
                    </button>
                  )}
                </div>

                {/* Mobile Drawer Overlay */}
                <AnimatePresence>
                  {mobileActivePanel !== "none" && (
                    <>
                      {/* Background dim */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileActivePanel("none")}
                        className="absolute inset-0 bg-black z-10 lg:hidden"
                      />

                      {/* Content panel */}
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                        className="absolute bottom-0 left-0 right-0 max-h-[60vh] bg-stone-950 border-t border-stone-800 rounded-t-2xl z-20 overflow-y-auto p-5 flex flex-col gap-5 lg:hidden"
                      >
                        {/* Drawer pull handle */}
                        <div className="w-10 h-1 bg-stone-800 rounded-full mx-auto shrink-0 mb-1" />

                        {mobileActivePanel === "goals" ? (
                          /* Mobile stats and list */
                          <div className="flex flex-col gap-4">
                            <div>
                              <h3 className="font-inter font-black text-sm text-stone-100 uppercase tracking-wider">
                                {view === "dashboard" ? `COMMAND METRICS` : `COSMIC MAP: ${shareUsername}`}
                              </h3>
                              <p className="font-courier text-[9px] text-stone-500 uppercase mt-0.5">STAR MAP PROFILE METRICS</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-stone-900/40 border border-stone-850 p-3 rounded-xl flex justify-between items-center">
                                <span className="font-courier text-[9px] text-stone-400">STARS</span>
                                <span className="font-mono text-xs font-bold text-stone-100">{goals.length}</span>
                              </div>
                              <div className="bg-stone-900/40 border border-stone-850 p-3 rounded-xl flex justify-between items-center">
                                <span className="font-courier text-[9px] text-stone-400">ORBITS</span>
                                <span className="font-mono text-xs font-bold text-orange-400">{averageProgress}%</span>
                              </div>
                            </div>

                            {/* Goal selection list */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-courier text-[9px] text-stone-400 uppercase">STAR REGISTER</span>
                                {view === "dashboard" && (
                                  <button
                                    onClick={() => { setMobileActivePanel("none"); setSelectedGoal(null); setGoalModalOpen(true); }}
                                    className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-inter font-bold text-[9px] tracking-wider uppercase transition-all cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>IGNITE</span>
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-1.5 overflow-y-auto max-h-[20vh] pr-1">
                                {goals.length === 0 ? (
                                  <div className="text-center font-courier text-[9px] text-stone-600 py-6">
                                    NO VECTORS FOUND.
                                  </div>
                                ) : (
                                  goals.map((g) => (
                                    <button
                                      key={g.id}
                                      onClick={() => {
                                        if (view === "dashboard") {
                                          setMobileActivePanel("none");
                                          setSelectedGoal(g);
                                          setGoalModalOpen(true);
                                        }
                                      }}
                                      className="w-full p-2.5 bg-stone-900/40 border border-stone-850 hover:border-orange-500/30 rounded-lg flex justify-between items-center cursor-pointer text-left"
                                    >
                                      <span className="font-inter font-bold text-stone-200 text-xs uppercase truncate">{g.title}</span>
                                      <span className="font-mono text-[9px] text-stone-500">{g.progress}%</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Mobile AI advisor */
                          <div className="h-[45vh]">
                            <AIAssistant 
                              goals={goals} 
                              onInjectSubtasks={handleInjectSubtasks} 
                              onInjectNewGoal={handleInjectNewGoal}
                            />
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* RIGHT SIDEBAR (Desktop): AI Assistant */}
              {view === "dashboard" && (
                <div className="hidden lg:flex flex-col w-80 shrink-0 border-l border-stone-900/80 bg-black/60 backdrop-blur-md p-6 z-10">
                  <AIAssistant 
                    goals={goals} 
                    onInjectSubtasks={handleInjectSubtasks} 
                    onInjectNewGoal={handleInjectNewGoal}
                  />
                </div>
              )}
            </motion.main>
          )
        ) : (
          /* ---- Existing Menu Navigation view ---- */
          <motion.div 
            key="menu-view"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 md:px-12 bg-white/70 backdrop-blur-2xl"
          >
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start lg:items-center">
              
              {/* Category Options List (Left Side) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <p className="font-courier text-[10px] sm:text-xs text-stone-400 uppercase tracking-widest">CATEGORIES</p>
                <nav className="flex flex-col gap-2.5 sm:gap-4">
                  {[
                    "GOAL GALAXY DIRECTORY", 
                    "ABOUT THE SINGULARITY", 
                    "SERVICES & LOGIC", 
                    "JOURNAL DECAY", 
                    "CONTACT ECLIPSE"
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={item.includes("GALAXY") ? handleGalaxyAccess : () => handleMenuNavigation(false)}
                      className="font-inter font-black text-[6vw] min-[380px]:text-[5.5vw] sm:text-4xl md:text-5xl lg:text-6xl text-left uppercase text-stone-400 hover:text-stone-950 transition-colors cursor-pointer block active:scale-[0.98] origin-left"
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Project Philosophy Card (Right Side) */}
              <div className="lg:col-span-5 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-stone-200/50 lg:pl-10 space-y-5 sm:space-y-6">
                <p className="font-courier text-[10px] sm:text-xs text-stone-400 uppercase tracking-widest">PHILOSOPHY</p>
                <p className="font-courier text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Oblivion digital experience studio operates at the cosmic boundaries where absolute physical equations melt into premium experiential storytelling.
                </p>
                <p className="font-courier text-xs sm:text-sm text-stone-600 leading-relaxed">
                  We render relativistic distortions directly onto contemporary user interfaces, treating code as standard gravity vectors.
                </p>
                
                <div className="pt-5 sm:pt-6 border-t border-stone-200/50 flex items-center gap-6 sm:gap-8">
                  <div className="text-left">
                    <div className="font-courier text-[9px] text-stone-400">OPERATING SINCE</div>
                    <div className="font-inter font-bold text-stone-950 text-xs sm:text-sm">2026 // AD</div>
                  </div>
                  <div className="text-left">
                    <div className="font-courier text-[9px] text-stone-400">IP POSITION</div>
                    <div className="font-inter font-bold text-stone-950 text-xs sm:text-sm">G-FORCE 1.0</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => handleMenuNavigation(false)}
                    className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-all text-left"
                  >
                    <span className="font-inter font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase group-hover:text-stone-500 transition-colors">
                      RETURN TO HORIZON
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-stone-950 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform shrink-0" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- 3. FOOTER FRAME INDICATORS ---------------- */}
      <footer className={`relative w-full z-20 px-4 py-6 sm:px-6 sm:py-8 md:px-12 flex justify-between items-end transition-all ${
        view === "landing" ? "liquid-glass" : "bg-black/40 border-t border-stone-900/60 backdrop-blur-lg"
      }`}>
        {/* Left indicator */}
        <div className="flex flex-col items-start gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-stone-400 shrink-0" />
            <span className={`font-courier font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.3em] whitespace-nowrap ${
              view === "landing" ? "text-stone-400" : "text-stone-500"
            }`}>
              {view === "landing" ? "SCROLL TO EXPLORE" : "GALAXY ACTIVE"}
            </span>
          </div>
          <div className="h-6 sm:h-10 w-[1px] bg-stone-300 ml-0.5" />
        </div>

        {/* Center Scroll pointer */}
        <div className="hidden sm:flex flex-col items-center gap-1.5 sm:gap-2">
          <span className={`font-courier font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.3em] ${
            view === "landing" ? "text-stone-400" : "text-stone-500"
          }`}>
            {view === "landing" ? "SCROLL" : "GRAVITY"}
          </span>
          <div className="h-6 sm:h-10 w-[1px] bg-stone-300 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1/2 animate-bounce ${
              view === "landing" ? "bg-stone-950" : "bg-orange-500"
            }`} />
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${view === "landing" ? "bg-stone-950" : "bg-orange-500"}`} />
        </div>

        {/* Right slide count indicator */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-6 sm:h-10 w-[1px] bg-stone-300 mr-1 sm:mr-2" />
          <div className="flex flex-col text-right">
            <span className={`font-courier text-xs font-bold ${view === "landing" ? "text-stone-900" : "text-stone-200"}`}>
              {menuOpen ? "02" : view === "landing" ? "01" : "03"}
            </span>
            <span className="font-courier text-[9px] sm:text-[10px] text-stone-400">05</span>
          </div>
        </div>
      </footer>

      {/* SVG Transition Layer (GSAP Vector Wipe Canvas) */}
      <div className="fixed -inset-[30%] pointer-events-none z-50 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 2453 2535"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            ref={path1Ref}
            d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
            stroke="#d6d3d1"
            strokeWidth="200"
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
          <path
            ref={path2Ref}
            d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
            stroke="#1c1917"
            strokeWidth="200"
            strokeLinecap="round"
            shapeRendering="geometricPrecision"
          />
        </svg>
      </div>

      {/* ---------------- Modals & Lightbox Overlays ---------------- */}
      
      {/* 1. Cinematic Lightbox showreel */}
      <AnimatePresence>
        {showreelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/98 z-50 flex flex-col justify-between p-4 sm:p-6 md:p-12 text-stone-55 overflow-y-auto"
          >
            <div className="flex justify-between items-center w-full gap-4">
              <span className="font-mono text-[8px] sm:text-[9px] tracking-widest text-stone-400 uppercase truncate">
                OBLIVION CINEMATIC INSTABILITY RECORDING
              </span>
              <button 
                onClick={() => setShowreelOpen(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 flex shrink-0 items-center justify-center rounded-full border border-stone-800 hover:border-stone-100 text-stone-400 hover:text-stone-100 cursor-pointer transition-all active:scale-90 group"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="w-full max-w-5xl aspect-[16/9] my-auto mx-auto rounded-xl overflow-hidden border border-stone-900 bg-black shadow-2xl relative flex items-center justify-center">
              <iframe
                src={videoUrlCinematic}
                title="Oblivion Cinematic Film Feed"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="w-full flex justify-between items-center border-t border-stone-900 pt-4 sm:pt-6 text-[8px] sm:text-[10px] text-stone-500 font-courier gap-4">
              <span className="truncate">HD OBLIVION DECK ACTIVE</span>
              <button 
                onClick={() => setShowreelOpen(false)}
                className="text-stone-300 hover:text-stone-50 transition-colors uppercase tracking-widest font-inter font-semibold text-[10px] sm:text-[11px]"
              >
                CLOSE [ESC]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Authentication Modal (Removed) */}

      {/* 3. Goal Editor Modal */}
      <AnimatePresence>
        {goalModalOpen && (
          <GoalModal
            goal={selectedGoal}
            allGoals={goals}
            onClose={() => { setGoalModalOpen(false); setSelectedGoal(null); }}
            onSave={handleSaveGoal}
            onDelete={handleDeleteGoal}
          />
        )}
      </AnimatePresence>
      
    </div>
  );
}
