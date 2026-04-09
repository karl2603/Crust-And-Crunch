// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- REFS ---
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const galleryWrapperRef = useRef(null);
  const galleryTrackRef = useRef(null);
  const progressBarRef = useRef(null);
  const menuRef = useRef(null);
  const menuTl = useRef(null);
  const totalFrames = 120; // Ensure ezgif frames are in public/frames/

  // --- 0. NAVBAR SCROLL STATE ---
  useEffect(() => {
    const handleScroll = () => {
      // Trigger capsule state after 50px of scroll
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 1. PRELOADER & SMOOTH SCROLL ---
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0, 0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 2;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // The Curtain Reveal Animation
        const tl = gsap.timeline();
        tl.to('.loader-content', { opacity: 0, duration: 0.5, ease: 'power2.inOut', delay: 0.2 })
          .to('.loader-top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, "+=0.1")
          .to('.loader-bottom', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, "<")
          .call(() => setLoading(false));
      }
      setLoadingProgress(progress);
    }, 80);

    return () => {
      lenis.destroy();
      clearInterval(interval);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  // --- 2. REFINED GEOMETRIC CURSOR ---
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    
    const moveCursor = (e) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
    };

    const handleHover = () => {
      gsap.to(cursor, { 
        scale: 3.5, 
        backgroundColor: 'transparent', 
        border: '1.5px solid rgba(245, 230, 211, 0.9)', 
        mixBlendMode: 'difference', 
        duration: 0.4, 
        ease: "power3.out" 
      });
    };
    
    const handleLeave = () => {
      gsap.to(cursor, { 
        scale: 1, 
        backgroundColor: '#f5e6d3', 
        border: '0px solid transparent',
        mixBlendMode: 'difference', 
        duration: 0.3,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', moveCursor);
    
    const attachListeners = () => {
      const interactables = document.querySelectorAll('a, button, input, .hover-target');
      interactables.forEach(el => {
        el.addEventListener('mouseenter', handleHover);
        el.addEventListener('mouseleave', handleLeave);
      });
      return interactables;
    };

    let elements = attachListeners();

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      elements.forEach(el => {
        el.removeEventListener('mouseenter', handleHover);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  }, [loading]);

  // --- 3. SCROLL ANIMATIONS & CANVAS ---
  useEffect(() => {
    if (loading) return;

    // A. Global Scroll Progress Bar
    gsap.to(progressBarRef.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        scrub: 0.1
      }
    });

    // B. Canvas Scrub
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const images = [];
    let playhead = { frame: 0 };

    const render = () => {
      const frameIndex = Math.floor(playhead.frame);
      if (images[frameIndex] && images[frameIndex].complete) {
        const img = images[frameIndex];
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / 2) - (img.width / 2) * scale;
        const y = (canvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render(); 
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(3, '0');
      img.src = `/frames/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = () => { if (i === 1) render(); };
      images.push(img);
    }

    window.addEventListener('resize', resize);
    resize();

    let heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#hero-pin",
        start: "top top",
        end: "+=400%", 
        scrub: 1.5,
        pin: true,
      }
    });

    heroTimeline.to(playhead, { frame: totalFrames - 1, snap: "frame", ease: "none", onUpdate: render });
    heroTimeline.to('.hero-text', { opacity: 0, scale: 0.9, y: -100, ease: "power2.inOut" }, "<20%");

    // C. Global Image Parallax
    gsap.utils.toArray('.parallax-img').forEach(img => {
      gsap.to(img, {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    // D. Bento Grid Stagger Reveal
    gsap.fromTo('.bento-item',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.5, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '#process', start: 'top 75%' } }
    );

    // E. Marquee
    gsap.to('.marquee-track', { xPercent: -50, ease: "none", duration: 20, repeat: -1 });

    // F. Horizontal Scroll Gallery
    const track = galleryTrackRef.current;
    gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: galleryWrapperRef.current,
        start: "top top",
        end: () => "+=" + (track.scrollWidth - window.innerWidth),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    return () => {
      window.removeEventListener('resize', resize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [loading]);

  // --- 4. MOBILE MENU GSAP TIMELINE ---
  useEffect(() => {
    // Initial State Setup
    gsap.set(menuRef.current, { clipPath: 'inset(0% 0% 100% 0%)' }); 
    gsap.set('.menu-link-inner', { yPercent: 110, rotateZ: 2 }); 
    gsap.set('.menu-footer-item', { opacity: 0, y: 20 });
    gsap.set('.menu-bg-glow', { scale: 0.5, opacity: 0 });

    // Build the Timeline
    menuTl.current = gsap.timeline({ paused: true })
      .to(menuRef.current, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.2,
        ease: 'expo.inOut'
      })
      .to('.menu-bg-glow', {
        scale: 1,
        opacity: 0.07,
        duration: 1.5,
        ease: 'power3.out'
      }, "-=0.8")
      .to('.menu-link-inner', {
        yPercent: 0,
        rotateZ: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out'
      }, "-=0.8")
      .to('.menu-footer-item', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }, "-=0.6");

    return () => menuTl.current.kill();
  }, []);

  // 5. Play/Reverse based on mobile menu state
  useEffect(() => {
    if (isMobileMenuOpen) {
      menuTl.current.play();
    } else {
      menuTl.current.reverse();
    }
  }, [isMobileMenuOpen]);


  return (
    <div id="top" className="bg-[#0a0705] text-[#f5e6d3] min-h-screen overflow-hidden selection:bg-[#f5e6d3] selection:text-[#0a0705] md:cursor-none font-sans">
      
      {/* GLOBAL GRAIN OVERLAY */}
      <div className="noise-overlay fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay"></div>

      {/* CUSTOM MAGNETIC CURSOR */}
      <div ref={cursorRef} className="hidden md:block fixed top-0 left-0 w-3 h-3 bg-[#f5e6d3] rounded-full pointer-events-none z-[110] transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference box-border"></div>

      {/* SCROLL PROGRESS INDICATOR */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[60] bg-transparent pointer-events-none">
        <div ref={progressBarRef} className="h-full bg-[#f5e6d3]/80 origin-left scale-x-0 transition-transform duration-75 ease-out"></div>
      </div>

      {/* THEATRE CURTAIN PRELOADER */}
      <div className="fixed inset-0 z-[200] pointer-events-none flex flex-col">
        <div className="loader-top w-full h-1/2 bg-[#0a0705] border-b border-[#f5e6d3]/5 relative">
          <div className="loader-content absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-8">
            <div className="font-serif italic text-3xl md:text-5xl text-[#f5e6d3] tracking-wide mb-2 px-4 text-center">Cultivating the crust</div>
          </div>
        </div>
        <div className="loader-bottom w-full h-1/2 bg-[#0a0705] relative">
          <div className="loader-content absolute top-0 left-0 w-full flex flex-col items-center justify-start pt-8">
            <div className="text-[#f5e6d3]/50 font-sans tracking-[0.4em] text-xs">{loadingProgress}%</div>
          </div>
        </div>
      </div>

      {/* BUTTERY SMOOTH MORPHING NAVBAR */}
      <div className={`fixed top-0 w-full z-[100] flex justify-center pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isScrolled ? 'pt-4 md:pt-6 px-4 md:px-8' : 'pt-0 px-0'
      }`}>
        <nav className={`pointer-events-auto flex justify-between items-center w-full border transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isScrolled 
            ? 'max-w-[900px] bg-[#0a0705]/85 backdrop-blur-xl border-[#f5e6d3]/20 rounded-full px-6 md:px-10 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' 
            : 'max-w-[100%] bg-transparent border-transparent rounded-none px-6 md:px-16 py-6 md:py-8'
        }`}>
          
          {/* LOGO - Now an anchor tag targeting #top to scroll to hero */}
          <a 
            href="#top" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-serif text-xl md:text-2xl font-semibold text-[#fcfbf8] hover-target md:cursor-none"
          >
            C<span className="italic">&</span>C
          </a>
          
          <div className="hidden md:flex gap-10 text-[10px] font-bold tracking-[0.25em] uppercase text-[#fcfbf8]">
            {['Story', 'Process', 'Gallery', 'Menu'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="relative group overflow-hidden hover-target py-2 md:cursor-none">
                {item}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#fcfbf8] transform -translate-x-[105%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
              </a>
            ))}
          </div>

          {/* Mobile Menu Hamburger */}
          <div 
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 hover-target cursor-pointer z-[100]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className={`w-6 h-[1.5px] bg-[#fcfbf8] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] absolute ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></div>
            <div className={`w-6 h-[1.5px] bg-[#fcfbf8] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] absolute ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></div>
          </div>
        </nav>
      </div>

      {/* MOBILE MENU OVERLAY (GSAP POWERED) */}
      <div 
        ref={menuRef} 
        className={`md:hidden fixed inset-0 bg-[#0a0705] z-[90] flex flex-col justify-between px-8 pb-12 pt-32 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="absolute inset-0 noise-overlay pointer-events-none opacity-50 mix-blend-overlay z-0"></div>
        <div className="menu-bg-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f5e6d3] rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="flex flex-col gap-4 w-full z-10 mt-12">
          {['Story', 'Process', 'Gallery', 'Menu'].map((item, index) => (
            <div key={item} className="overflow-hidden p-1">
              <a 
                href={`#${item.toLowerCase()}`} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="menu-link-inner flex items-baseline w-max group origin-bottom-left"
              >
                <span className="text-[#f5e6d3]/40 text-[10px] font-sans tracking-[0.4em] mr-6 pb-2">
                  0{index + 1}
                </span>
                <span className="font-serif text-[12vw] leading-none text-[#fcfbf8] group-active:text-[#f5e6d3]/60 group-active:italic transition-colors duration-300">
                  {item}
                </span>
              </a>
            </div>
          ))}
        </div>

        <div className="w-full flex justify-between items-end border-t border-[#f5e6d3]/15 pt-8 z-10">
          <div className="flex flex-col gap-4">
            <span className="menu-footer-item text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40">Socials</span>
            <div className="flex gap-6">
              <a href="#" className="menu-footer-item text-xs text-[#fcfbf8] tracking-widest active:opacity-50">IG</a>
              <a href="#" className="menu-footer-item text-xs text-[#fcfbf8] tracking-widest active:opacity-50">TW</a>
            </div>
          </div>
          <div className="text-right flex flex-col gap-4">
            <span className="menu-footer-item text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 block">Inquiries</span>
            <a href="mailto:hello@crustandcrunch.com" className="menu-footer-item text-xs text-[#fcfbf8] tracking-wider active:opacity-50">Drop a line</a>
          </div>
        </div>
      </div>

      {/* 1. HERO (PINNED CANVAS) */}
      <div id="hero-pin" className="relative h-screen w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/40 to-[#0a0705]/20 z-10" />

        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="hero-text text-center px-4 w-full flex flex-col items-center">
            <h1 className="font-serif text-[22vw] md:text-[14vw] leading-[0.8] tracking-tighter text-[#fcfbf8] mix-blend-overlay opacity-90 drop-shadow-2xl">
              CRUST <span className="italic font-light">&</span><br/>CRUNCH
            </h1>
            
            <div className="mt-8 md:mt-12 flex flex-col items-center gap-6 pointer-events-auto">
              <p className="text-[9px] md:text-xs tracking-[0.4em] uppercase text-[#f5e6d3]/80 text-center">
                Boulangerie Artisanale • New York
              </p>
              <a href="#menu" className="hover-target md:cursor-none px-6 md:px-8 py-3 border border-[#f5e6d3]/40 rounded-full text-[10px] tracking-[0.2em] uppercase text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#0a0705] transition-all duration-500 ease-out">
                Explore Menu
              </a>
              <div className="w-[1px] h-8 md:h-12 bg-gradient-to-b from-[#f5e6d3]/50 to-transparent animate-pulse mt-2 pointer-events-none"></div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. THE STORY (ORIGIN) */}
      <section id="story" className="py-24 md:py-48 px-6 md:px-16 relative z-30 bg-[#0a0705]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-center">
          <div className="w-full md:w-5/12 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40 mb-6 md:mb-8 border-l border-[#f5e6d3]/20 pl-4">The Origin</p>
            <h2 className="font-serif text-4xl md:text-6xl leading-tight text-[#fcfbf8] mb-8 md:mb-10">
              Time is <br/><span className="italic text-[#f5e6d3]/60">the master</span> ingredient.
            </h2>
            <p className="text-sm md:text-lg text-[#f5e6d3]/60 font-light leading-relaxed mb-8 md:mb-12">
              We reject modern shortcuts. Every pastry that leaves our ovens is the result of a rigorous three-day ritual of resting, folding, and chilling. It is a violent dedication to the craft that you can taste in every single shattering layer.
            </p>
          </div>
          <div className="w-full md:w-7/12 aspect-[4/5] md:aspect-[16/10] relative overflow-hidden rounded-sm group hover-target">
            <img 
              src="https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?q=80&w=2000&auto=format&fit=crop" 
              alt="Flour dusting" 
              className="parallax-img absolute inset-0 w-full h-[120%] object-cover -top-[10%] group-hover:scale-105 transition-transform duration-1000 ease-out opacity-80"
            />
            <div className="absolute inset-0 bg-[#0a0705]/20 group-hover:bg-transparent transition-colors duration-700"></div>
          </div>
        </div>
      </section>

      {/* 3. CRAFTSMANSHIP BENTO GRID */}
      <section id="process" className="py-20 md:py-24 px-6 md:px-16 bg-[#0a0705] relative z-30">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-3xl md:text-5xl text-[#fcfbf8] mb-16 md:mb-32 text-center italic opacity-90">The Anatomy of Perfect Pastry</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:auto-rows-[450px]">
            <div className="bento-item min-h-[350px] md:min-h-0 md:col-span-2 relative bg-[#120d09] rounded-sm overflow-hidden group hover-target flex items-end p-6 md:p-12">
              <img src="https://images.unsplash.com/photo-1555507036-ab1e4006aaeb?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Heritage Milling"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/50 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 w-full pointer-events-none">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">01. Heritage Milling</span>
                <h3 className="font-serif text-2xl md:text-4xl text-[#fcfbf8]">Sourced from local farms.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[300px] md:min-h-0 relative bg-[#120d09] rounded-sm overflow-hidden group hover-target flex items-end p-6 md:p-8">
              <img src="https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Lamination"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/60 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">02. Lamination</span>
                <h3 className="font-serif text-xl md:text-2xl text-[#fcfbf8]">84% Butterfat.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[300px] md:min-h-0 relative bg-[#120d09] rounded-sm overflow-hidden group hover-target flex items-end p-6 md:p-8">
              <img src="https://images.unsplash.com/photo-1589304028243-7f722a45d0de?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Shaping"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/60 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">03. Shaping</span>
                <h3 className="font-serif text-xl md:text-2xl text-[#fcfbf8]">Rolled by hand.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[350px] md:min-h-0 md:col-span-2 relative bg-[#120d09] rounded-sm overflow-hidden group hover-target flex items-end p-6 md:p-12">
              <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Baking"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/40 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">04. The Bake</span>
                <h3 className="font-serif text-2xl md:text-4xl text-[#fcfbf8]">Shatteringly crisp.</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE ARTISAN (CHEF PROFILE) */}
      <section className="py-24 md:py-32 px-6 md:px-16 bg-[#0a0705] relative z-30">
        <div className="max-w-6xl mx-auto border-t border-[#f5e6d3]/10 pt-20 md:pt-32 flex flex-col md:flex-row gap-12 md:gap-16 items-center">
          <div className="w-full md:w-1/2 aspect-[3/4] relative overflow-hidden rounded-t-[100px] rounded-b-sm group hover-target">
            <img src="https://images.unsplash.com/photo-1583338917451-face2751d8d5?q=80&w=1000&auto=format&fit=crop" alt="Head Baker" className="parallax-img absolute inset-0 w-full h-[115%] -top-[10%] object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all duration-1000" />
          </div>
          <div className="w-full md:w-1/2 md:pl-10 text-center md:text-left">
            <h2 className="font-serif text-3xl md:text-6xl text-[#fcfbf8] mb-6 md:mb-8">The Hands <br className="hidden md:block"/><span className="italic">Behind the Dough</span></h2>
            <p className="text-[#f5e6d3]/60 leading-relaxed font-light mb-8 md:mb-10 text-sm md:text-lg">"Baking at this level is not about recipes. It's about feeling the humidity in the air, the warmth of the flour, and listening to the crackle of the crust as it cools. It is a living, breathing dialogue."</p>
            <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/40">— Julien Laurent, Head Boulanger</p>
          </div>
        </div>
      </section>

      {/* 5. IMMERSIVE PARALLAX BREAK */}
      <section className="h-[60vh] md:h-[90vh] w-full relative overflow-hidden z-30 flex items-center justify-center">
        <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop" alt="Pouring coffee" className="parallax-img absolute inset-0 w-full h-[140%] -top-[20%] object-cover opacity-30 z-0" />
        <div className="absolute inset-0 bg-[#0a0705]/50 z-10"></div>
        <h2 className="relative z-20 font-serif text-[10vw] md:text-[6vw] text-[#fcfbf8] italic text-center leading-tight">
          Coffee, elevated.<br/>
          <span className="not-italic text-[3vw] md:text-[2vw] tracking-[0.2em] font-sans font-bold uppercase block mt-4 md:mt-6 text-[#f5e6d3]/80">Single Origin Reserve</span>
        </h2>
      </section>

      {/* 6. MARQUEE */}
      <section className="py-12 md:py-20 bg-[#f5e6d3] text-[#0a0705] overflow-hidden flex whitespace-nowrap z-30 relative border-y border-[#0a0705]/10">
        <div className="marquee-track flex gap-8 md:gap-10 items-center font-serif text-4xl md:text-7xl italic pr-10">
          <span>Artisanal Excellence</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
          <span>Shatteringly Crisp</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
          <span>Baked Fresh Daily</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
          <span>Artisanal Excellence</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
          <span>Shatteringly Crisp</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
          <span>Baked Fresh Daily</span> <span className="text-xl md:text-2xl not-italic opacity-30">✦</span>
        </div>
      </section>

      {/* 7. HORIZONTAL SCROLL GALLERY */}
      <section id="gallery" ref={galleryWrapperRef} className="h-screen bg-[#0a0705] flex items-center overflow-hidden z-30 relative">
        <div className="absolute top-24 md:top-32 left-6 md:left-16 z-10">
          <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40">[ The Atmosphere ]</p>
        </div>
        <div ref={galleryTrackRef} className="flex gap-8 md:gap-12 px-6 md:px-32 h-[50vh] md:h-[65vh] w-max items-center">
          
          <div className="w-[85vw] md:w-[45vw] h-full relative group hover-target shrink-0 overflow-hidden rounded-sm">
            <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Interior"/>
          </div>
          <div className="w-[85vw] md:w-[35vw] h-[80%] relative group hover-target shrink-0 overflow-hidden rounded-sm">
            <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Coffee Details"/>
          </div>
          <div className="w-[85vw] md:w-[45vw] h-full relative group hover-target shrink-0 overflow-hidden rounded-sm">
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Interior Detail"/>
          </div>

          <div className="w-[85vw] md:w-[40vw] h-full flex flex-col justify-center px-4 md:px-16 shrink-0">
            <h2 className="font-serif text-3xl md:text-6xl text-[#fcfbf8] italic mb-6 md:mb-8">A space to pause.</h2>
            <p className="text-[#f5e6d3]/60 font-light text-sm md:text-lg leading-relaxed">Designed for slow mornings, quiet conversations, and the simple, profound joy of exceptional pastry and pour-over coffee.</p>
          </div>
        </div>
      </section>

      {/* 8. PRESS / QUOTES */}
      <section className="py-24 md:py-48 px-6 md:px-16 bg-[#120d09] relative z-30 flex items-center justify-center text-center">
        <div className="max-w-4xl">
          <svg className="mx-auto mb-8 md:mb-12 text-[#f5e6d3]/20 w-8 h-8 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
          <h2 className="font-serif text-2xl md:text-5xl text-[#fcfbf8] leading-relaxed md:leading-tight mb-8 md:mb-12">
            "Without a doubt, the most <span className="italic text-white">extraordinary lamination</span> we have seen stateside."
          </h2>
          <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40">— The Culinary Times</p>
        </div>
      </section>

      {/* 9. MENU (LIGHT THEME BREAK) */}
      <section id="menu" className="py-24 md:py-32 px-6 md:px-16 bg-[#fcfbf8] text-[#0a0705] relative z-30 transition-colors duration-1000">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end border-b border-[#0a0705]/10 pb-8 md:pb-10 mb-12 md:mb-16">
            <h2 className="font-serif text-4xl md:text-7xl text-[#0a0705]">Menu</h2>
            <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#0a0705]/50 hidden md:block font-bold">Served until sold out</span>
          </div>

          <div className="flex flex-col">
            {[
              { name: 'Signature Butter Croissant', price: '$6.00', desc: 'Isigny Ste Mère butter, 72h ferment' },
              { name: 'Pain au Chocolat', price: '$7.50', desc: 'Valrhona dark chocolate batons' },
              { name: 'Cardamom Knot', price: '$5.50', desc: 'Freshly ground green cardamom' },
              { name: 'Vanilla Bean Tart', price: '$12.00', desc: 'Madagascar vanilla, crisp sablé shell' },
              { name: 'Single Origin Pour Over', price: '$8.00', desc: 'Rotating seasonal selection' }
            ].map((item, i) => (
              <div key={i} className="hover-target group flex flex-col md:flex-row justify-between md:items-center py-6 md:py-12 border-b border-[#0a0705]/10 hover:border-[#0a0705]/40 transition-colors duration-500 md:cursor-none">
                <div className="flex flex-col md:w-2/3">
                  <h3 className="font-serif text-xl md:text-4xl text-[#0a0705]/80 group-hover:text-[#0a0705] md:group-hover:translate-x-4 transition-all duration-500">{item.name}</h3>
                  <p className="text-xs md:text-sm text-[#0a0705]/60 mt-2 md:mt-4 tracking-wide font-medium">{item.desc}</p>
                </div>
                <span className="text-lg md:text-xl mt-3 md:mt-0 font-medium tracking-wider">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. EDITORIAL FOOTER */}
      <footer className="bg-[#050302] text-[#f5e6d3] pt-20 md:pt-24 pb-8 px-6 md:px-12 flex flex-col relative z-30 overflow-hidden">
        
        {/* Top Grid Info Section */}
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-12 border-b border-[#f5e6d3]/15 pb-12 md:pb-16">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl md:text-3xl font-serif mb-4 md:mb-6 text-[#fcfbf8]">Let's bake something incredible.</h3>
            <a href="mailto:hello@crustandcrunch.com" className="text-sm md:text-base border-b border-[#f5e6d3]/40 pb-1 hover-target hover:text-[#fcfbf8] hover:border-[#fcfbf8] transition-colors md:cursor-none">
              hello@crustandcrunch.com
            </a>
          </div>
          
          <div className="w-full md:w-2/3 flex flex-row justify-between md:justify-end gap-8 md:gap-32">
            <div className="flex flex-col gap-3 md:gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 mb-1 md:mb-2">Socials</span>
              <a href="#" className="text-xs md:text-sm hover-target hover:text-[#fcfbf8] md:hover:-translate-y-1 transition-all md:cursor-none">Instagram</a>
              <a href="#" className="text-xs md:text-sm hover-target hover:text-[#fcfbf8] md:hover:-translate-y-1 transition-all md:cursor-none">Twitter</a>
              <a href="#" className="text-xs md:text-sm hover-target hover:text-[#fcfbf8] md:hover:-translate-y-1 transition-all md:cursor-none">Journal</a>
            </div>
            <div className="flex flex-col gap-3 md:gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 mb-1 md:mb-2">Visit</span>
              <span className="text-xs md:text-sm">124 Artisan Ave.</span>
              <span className="text-xs md:text-sm">New York, NY 10012</span>
            </div>
          </div>
        </div>
        
        {/* Massive Edge-to-Edge Typography Anchor */}
        <div className="mt-16 md:mt-20 mb-8 md:mb-12 w-full flex justify-center items-center pointer-events-none select-none">
          <h1 className="text-[14vw] md:text-[13vw] font-serif leading-[0.8] tracking-tighter text-[#fcfbf8] uppercase opacity-90 text-center">
            Crust <span className="italic font-light text-[12vw] md:text-[11vw]">&</span> Crunch
          </h1>
        </div>
        
        {/* Bottom Bar */}
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 pt-6 md:pt-8 border-t border-[#f5e6d3]/10">
          <span className="mb-4 md:mb-0">© 2026 Crust & Crunch</span>
          <div className="flex gap-6 md:gap-8">
            <a href="#" className="hover-target hover:text-[#fcfbf8] transition-colors md:cursor-none">Privacy Policy</a>
            <a href="#top" className="hover-target hover:text-[#fcfbf8] transition-colors md:cursor-none">Back to Top ↑</a>
          </div>
        </div>
        
      </footer>
    </div>
  );
}