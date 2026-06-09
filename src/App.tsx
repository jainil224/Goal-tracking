import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Play, X, Compass, Activity, Sparkles, ChevronRight, Maximize2 } from "lucide-react";
import { gsap } from "gsap";
import GoalUniverse from "./components/GoalUniverse";

export default function App() {
  const [showreelOpen, setShowreelOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentView, setCurrentView] = useState<"horizon" | "universe">("horizon");

  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  // Background video (mix-blend-darken enables the dark accretion disk to render beautifully on the white parent container)
  const videoUrlBackground = "https://player.cloudinary.com/embed/?cloud_name=dgqd54pbl&public_id=Black_hole_rotating_in_place_202606051222_y4pdi9&autoplay=true&loop=true&muted=true&controls=false";
  
  // High-def cinematic video for the lightbox overlay
  const videoUrlCinematic = "https://player.cloudinary.com/embed/?cloud_name=dgqd54pbl&public_id=Black_hole_rotating_in_place_202606051222_y4pdi9&autoplay=true&loop=true&controls=true&theme=dark";

  // Initialize SVG stroke dasharray and dashoffset
  useEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;

    if (p1 && p2) {
      const len1 = p1.getTotalLength();
      const len2 = p2.getTotalLength();

      // Setup initial styles
      p1.style.strokeDasharray = `${len1}`;
      p1.style.strokeDashoffset = `${len1}`;

      p2.style.strokeDasharray = `${len2}`;
      p2.style.strokeDashoffset = `${len2}`;
    }
  }, []);

  // Handle ESC key to close lightbox and menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowreelOpen(false);
        setMenuOpen(false);
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

      // Animating paths drawing in
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
      }, 0.08); // Slight stagger for depth
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

      // Animating paths drawing out
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

    // Draw transition overlay
    await leave();

    // Toggle menu view
    setMenuOpen(openState);

    // Wipe transition overlay away
    await enter();

    setIsTransitioning(false);
  };

  const handleUniverseNavigation = async (toUniverse: boolean) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Draw the gorgeous transition wipe overlay
    await leave();

    // Change the view state
    setCurrentView(toUniverse ? "universe" : "horizon");
    setMenuOpen(false); // Close menu if open

    // Wipe the transition overlay away
    await enter();

    setIsTransitioning(false);
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-white text-stone-900 overflow-x-hidden selection:bg-stone-900 selection:text-white flex flex-col">
      
      {currentView === "horizon" ? (
        <>
          {/* BACKGROUND VIDEO LAYER
              Extends completely behind all elements, including headers, content, and footers */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
            <div className="w-full h-full relative flex items-center justify-center">
              <iframe
                src={videoUrlBackground}
                title="Black Hole Accretion Disk"
                className="w-[178vh] h-[100vh] md:w-[100vw] md:h-[100vh] max-w-none border-0 mix-blend-darken scale-[1.3] sm:scale-[1.2] md:scale-y-[1.15] md:scale-x-[1.4] opacity-95 transition-transform duration-700"
                allow="autoplay; fullscreen"
              />
            </div>
          </div>

          {/* SECTION 1: HERO HORIZON */}
          <div className="relative w-full h-screen h-[100dvh] flex flex-col justify-between z-10 shrink-0">
            {/* 1. NAVIGATION HEADER */}
            <header className="relative w-full z-20 px-4 py-4 sm:px-6 sm:py-6 md:px-12 flex justify-between items-center liquid-glass-strong">
              {/* Left Logo */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-stone-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-stone-900 rounded-full" />
                </div>
                <span className="font-inter font-extrabold tracking-[0.25em] sm:tracking-[0.35em] text-xs sm:text-sm uppercase pt-1">
                  OBLIVION
                </span>
              </div>

              {/* Center Nav Links (Inter Font Style) */}
              <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                {["WORK", "ABOUT", "SERVICES", "JOURNAL", "CONTACT"].map((link) => (
                  <button
                    key={link}
                    onClick={() => handleMenuNavigation(link === "WORK" ? false : true)}
                    className="font-inter font-medium tracking-[0.25em] text-xs uppercase cursor-pointer hover:text-stone-500 active:scale-95 transition-all relative py-1"
                  >
                    {link}
                  </button>
                ))}
              </nav>

              {/* Right Menu Toggle */}
              <div className="flex items-center">
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
              </div>
            </header>

            {/* Main Switch Area */}
            <AnimatePresence mode="wait">
              {!menuOpen ? (
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
                      
                      {/* Label Badge */}
                      <div className="flex items-center gap-2.5 mb-4 sm:mb-6 pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
                        <p className="font-courier text-[9px] sm:text-xs uppercase tracking-[0.3em] text-stone-500">
                          DIGITAL EXPERIENCE STUDIO
                        </p>
                      </div>

                      {/* Giant Bold Headers & Script Overlay */}
                      <div className="relative inline-block w-full">
                        <h1 className="font-inter font-black text-stone-950 text-[10.5vw] sm:text-[8.5vw] lg:text-[7.6rem] leading-[0.88] sm:leading-[0.82] tracking-tighter uppercase select-none break-words">
                          BEYOND
                          <br />
                          THE EVENT
                          <br />
                          HORIZON
                        </h1>

                        {/* Accent Cursive Script Text (Condiment style) overlapping heading */}
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
                        We craft immersive digital experiences that merge design, technology and storytelling.
                      </p>

                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full">
                        {/* Explore work Button */}
                        <button 
                          id="btn-explore-work"
                          onClick={() => handleMenuNavigation(true)}
                          className="px-6 py-3.5 sm:px-8 sm:py-4 bg-stone-950 hover:bg-stone-800 text-white font-inter font-semibold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-between min-w-full sm:min-w-[180px] cursor-pointer active:scale-[0.98] sm:active:scale-95"
                        >
                          <span>EXPLORE WORK</span>
                          <ArrowUpRight className="w-4 h-4 ml-1 shrink-0" />
                        </button>

                        {/* Goal Universe Button - Dedicated Redirection Trigger */}
                        <button 
                          id="btn-go-universe"
                          onClick={() => handleUniverseNavigation(true)}
                          className="px-6 py-3.5 sm:px-8 sm:py-4 bg-stone-950 hover:bg-stone-800 text-white font-inter font-bold text-xs tracking-[0.2em] uppercase transition-all flex items-center justify-between min-w-full sm:min-w-[180px] cursor-pointer active:scale-[0.98] sm:active:scale-95 border-b border-amber-500/25 relative overflow-hidden group/btn"
                        >
                          <span className="relative z-10 flex items-center gap-1.5">
                            <span>YOUR UNIVERSE</span>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          </span>
                          <ArrowUpRight className="w-4 h-4 ml-1 shrink-0 relative z-10 text-stone-450 group-hover/btn:text-white transition-colors" />
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
                          "YOUR UNIVERSE",
                          "WORK DIRECTORY", 
                          "ABOUT THE SINGULARITY", 
                          "SERVICES & LOGIC", 
                          "JOURNAL DECAY", 
                          "CONTACT ECLIPSE"
                        ].map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              if (item === "YOUR UNIVERSE") {
                                handleUniverseNavigation(true);
                              } else {
                                handleMenuNavigation(false);
                              }
                            }}
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

            {/* 3. FOOTER FRAME INDICATORS (The screen boundaries) */}
            <footer className="relative w-full z-20 px-4 py-6 sm:px-6 sm:py-8 md:px-12 flex justify-between items-end liquid-glass">
              
              {/* Left indicator */}
              <div className="flex flex-col items-start gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-stone-400 shrink-0" />
                  <span className="font-courier font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-stone-400 whitespace-nowrap">
                    SCROLL TO EXPLORE
                  </span>
                </div>
                <div className="h-6 sm:h-10 w-[1px] bg-stone-300 ml-0.5" />
              </div>

              {/* Center Scroll pointer */}
              <div className="hidden sm:flex flex-col items-center gap-1.5 sm:gap-2">
                <span className="font-courier font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-stone-400">SCROLL</span>
                <div className="h-6 sm:h-10 w-[1px] bg-stone-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-stone-950 animate-bounce" />
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-stone-950" />
              </div>

              {/* Right slide count indicator */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-6 sm:h-10 w-[1px] bg-stone-300 mr-1 sm:mr-2" />
                <div className="flex flex-col text-right">
                  <span className="font-courier text-xs font-bold text-stone-900">{menuOpen ? "02" : "01"}</span>
                  <span className="font-courier text-[9px] sm:text-[10px] text-stone-400">05</span>
                </div>
              </div>
            </footer>
          </div>
        </>
      ) : (
        /* SECTION 2: GOAL CONSTELLATION UNIVERSE */
        <div id="universe-section" className="w-full shrink-0">
          <GoalUniverse onScrollToTop={() => handleUniverseNavigation(false)} />
        </div>
      )}

      {/* SVG Transition Layer (GSAP Vector Wipe Canvas) */}
      <div 
        className="fixed -inset-[30%] pointer-events-none z-50 flex items-center justify-center overflow-hidden"
      >
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

      {/* 4. LIGHTBOX PRESENTATION PLAYER OVERLAY */}
      <AnimatePresence>
        {showreelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/98 z-50 flex flex-col justify-between p-4 sm:p-6 md:p-12 text-stone-50 overflow-y-auto"
          >
            {/* Top Close Bar */}
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

            {/* Video Player */}
            <div className="w-full max-w-5xl aspect-[16/9] my-auto mx-auto rounded-xl overflow-hidden border border-stone-900 bg-black shadow-2xl relative flex items-center justify-center">
              <iframe
                src={videoUrlCinematic}
                title="Oblivion Cinematic Film Feed"
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Controls */}
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
    </div>
  );
}
