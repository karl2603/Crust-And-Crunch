import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

const AnimatedText = ({ text, className }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="reveal-word inline-block mr-[0.25em] opacity-20">
          {word}
        </span>
      ))}
    </span>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formStatus, setFormStatus] = useState('idle'); 
  
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const galleryWrapperRef = useRef(null);
  const galleryTrackRef = useRef(null);
  const progressBarRef = useRef(null);
  const menuRef = useRef(null);
  const menuTl = useRef(null);
  const mainRef = useRef(null);
  const totalFrames = 120;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      const interactables = document.querySelectorAll('a, button, input, textarea, .hover-target');
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

  useEffect(() => {
    if (loading) return;

    gsap.to(progressBarRef.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        scrub: 0.1
      }
    });

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
    heroTimeline.to('.hero-text-main', { y: -150, scale: 1.1, opacity: 0, filter: "blur(10px)", ease: "power2.inOut" }, "<");
    heroTimeline.to('.hero-sub-element', { y: -50, opacity: 0, ease: "power2.inOut", stagger: 0.1 }, "<10%");

    gsap.utils.toArray('.parallax-img').forEach(img => {
      gsap.to(img, {
        yPercent: 20,
        scale: 1.05,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    gsap.fromTo('.bento-item',
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.5, stagger: 0.15, ease: 'expo.out', scrollTrigger: { trigger: '#process', start: 'top 75%' } }
    );

    document.querySelectorAll('.bento-item').forEach((item) => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        gsap.to(item, { rotateX, rotateY, transformPerspective: 1000, duration: 0.4, ease: 'power2.out' });
      });
      item.addEventListener('mouseleave', () => {
        gsap.to(item, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      });
    });

    gsap.to('.marquee-track', { xPercent: -50, ease: "none", duration: 20, repeat: -1 });

    const track = galleryTrackRef.current;
    
    let isMobile = window.innerWidth <= 768;
    
    if(!isMobile) {
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
    }

    gsap.utils.toArray('.reveal-text-container').forEach(container => {
      const words = container.querySelectorAll('.reveal-word');
      gsap.to(words, {
        opacity: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          end: "bottom 60%",
          scrub: true
        }
      });
    });

    gsap.utils.toArray('.menu-row').forEach((row) => {
      gsap.fromTo(row, 
        { opacity: 0, y: 40, rotateX: -15 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 90%" } }
      );
    });

    gsap.fromTo('.footer-huge-text', 
      { yPercent: 50, scale: 0.9, opacity: 0 }, 
      { yPercent: 0, scale: 1, opacity: 0.9, ease: "power3.out", scrollTrigger: { trigger: 'footer', start: "top bottom", end: "bottom bottom", scrub: 1 } }
    );

    gsap.utils.toArray('.fade-up-element').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } }
      );
    });

    return () => {
      window.removeEventListener('resize', resize);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [loading]);

  useEffect(() => {
    gsap.set(menuRef.current, { clipPath: 'inset(0% 0% 100% 0%)' }); 
    gsap.set('.menu-link-inner', { yPercent: 110, rotateZ: 2 }); 
    gsap.set('.menu-footer-item', { opacity: 0, y: 20 });
    gsap.set('.menu-bg-glow', { scale: 0.5, opacity: 0 });

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

  useEffect(() => {
    if (isMobileMenuOpen) {
      menuTl.current.play();
    } else {
      menuTl.current.reverse();
    }
  }, [isMobileMenuOpen]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const form = e.target;
    const data = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/meevooek", {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setFormStatus('success');
        form.reset();
        setTimeout(() => setFormStatus('idle'), 5000);
      } else {
        setFormStatus('error');
        setTimeout(() => setFormStatus('idle'), 5000);
      }
    } catch (error) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <div id="top" ref={mainRef} className="bg-[#0a0705] text-[#f5e6d3] min-h-screen overflow-hidden selection:bg-[#f5e6d3] selection:text-[#0a0705] md:cursor-none font-sans">
      
      <div className="noise-overlay fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-overlay"></div>

      <div ref={cursorRef} className="hidden md:block fixed top-0 left-0 w-3 h-3 bg-[#f5e6d3] rounded-full pointer-events-none z-[110] transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference box-border"></div>

      <div className="fixed top-0 left-0 w-full h-[2px] z-[60] bg-transparent pointer-events-none">
        <div ref={progressBarRef} className="h-full bg-[#f5e6d3]/80 origin-left scale-x-0 transition-transform duration-75 ease-out"></div>
      </div>

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

      <div className={`fixed top-0 w-full z-[100] flex justify-center pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isScrolled ? 'pt-4 md:pt-6 px-4 md:px-8' : 'pt-0 px-0'
      }`}>
        <nav className={`pointer-events-auto flex justify-between items-center w-full border transition-all duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isScrolled 
            ? 'max-w-[900px] bg-[#0a0705]/85 backdrop-blur-xl border-[#f5e6d3]/20 rounded-full px-6 md:px-10 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' 
            : 'max-w-[100%] bg-transparent border-transparent rounded-none px-6 md:px-16 py-6 md:py-8'
        }`}>
          
          <a 
            href="#top" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="font-serif text-xl md:text-2xl font-semibold text-[#fcfbf8] hover-target md:cursor-none"
          >
            C<span className="italic">&</span>C
          </a>
          
          <div className="hidden md:flex gap-10 text-[10px] font-bold tracking-[0.25em] uppercase text-[#fcfbf8]">
            {['Story', 'Process', 'Gallery', 'Menu', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="relative group overflow-hidden hover-target py-2 md:cursor-none">
                {item}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#fcfbf8] transform -translate-x-[105%] group-hover:translate-x-0 transition-transform duration-500 ease-out"></span>
              </a>
            ))}
          </div>

          <div 
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 hover-target cursor-pointer z-[100]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className={`w-6 h-[1.5px] bg-[#fcfbf8] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] absolute ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></div>
            <div className={`w-6 h-[1.5px] bg-[#fcfbf8] transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] absolute ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></div>
          </div>
        </nav>
      </div>

      <div 
        ref={menuRef} 
        className={`md:hidden fixed inset-0 bg-[#0a0705] z-[90] flex flex-col justify-between px-8 pb-12 pt-32 ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="absolute inset-0 noise-overlay pointer-events-none opacity-50 mix-blend-overlay z-0"></div>
        <div className="menu-bg-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f5e6d3] rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="flex flex-col gap-4 w-full z-10 mt-12">
          {['Story', 'Process', 'Gallery', 'Menu', 'Contact'].map((item, index) => (
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

      <div id="hero-pin" className="relative h-screen w-full">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/40 to-[#0a0705]/20 z-10" />

        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="hero-text text-center px-4 w-full flex flex-col items-center">
            <h1 className="hero-text-main font-serif text-[22vw] md:text-[14vw] leading-[0.8] tracking-tighter text-[#fcfbf8] mix-blend-overlay opacity-90 drop-shadow-2xl">
              CRUST <span className="italic font-light">&</span><br/>CRUNCH
            </h1>
            
            <div className="mt-8 md:mt-12 flex flex-col items-center gap-6 pointer-events-auto">
              <p className="hero-sub-element text-[9px] md:text-xs tracking-[0.4em] uppercase text-[#f5e6d3]/80 text-center">
                Ashok Nagar • Chennai
              </p>
              <a href="#menu" className="hero-sub-element hover-target md:cursor-none px-6 md:px-8 py-3 border border-[#f5e6d3]/40 rounded-full text-[10px] tracking-[0.2em] uppercase text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#0a0705] transition-all duration-500 ease-out">
                Explore Menu
              </a>
              </div>

          </div>
        </div>
      </div>

      <section id="story" className="py-24 md:py-48 px-6 md:px-16 relative z-30 bg-[#0a0705]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 items-center">
          <div className="w-full md:w-5/12 flex flex-col justify-center reveal-text-container fade-up-element">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40 mb-6 md:mb-8 border-l border-[#f5e6d3]/20 pl-4">The Origin</p>
            <h2 className="font-serif text-4xl md:text-6xl leading-tight text-[#fcfbf8] mb-8 md:mb-10">
              Time is <br/><span className="italic text-[#f5e6d3]/60">the master</span> ingredient.
            </h2>
            <div className="text-sm md:text-lg text-[#f5e6d3]/80 font-light leading-relaxed mb-8 md:mb-12">
              <AnimatedText text="We reject modern shortcuts. Every pastry that leaves our ovens is the result of a rigorous three-day ritual of resting, folding, and chilling. It is a violent dedication to the craft that you can taste in every single shattering layer." />
            </div>
          </div>
          <div className="w-full md:w-7/12 aspect-[4/5] md:aspect-[16/10] relative overflow-hidden rounded-sm group hover-target fade-up-element">
            <img 
              src="https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?q=80&w=2000&auto=format&fit=crop" 
              alt="Flour dusting" 
              className="parallax-img absolute inset-0 w-full h-[120%] object-cover -top-[10%] group-hover:scale-105 transition-transform duration-1000 ease-out opacity-80"
            />
            <div className="absolute inset-0 bg-[#0a0705]/20 group-hover:bg-transparent transition-colors duration-700"></div>
          </div>
        </div>
      </section>

      <section id="process" className="py-20 md:py-24 px-6 md:px-16 bg-[#0a0705] relative z-30">
        <div className="max-w-7xl mx-auto">
          <h2 className="fade-up-element font-serif text-3xl md:text-5xl text-[#fcfbf8] mb-16 md:mb-32 text-center italic opacity-90">The Anatomy of Perfect Pastry</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 md:auto-rows-[450px]">
            <div className="bento-item min-h-[350px] md:min-h-0 md:col-span-2 relative bg-[#120d09] rounded-sm overflow-hidden hover-target flex items-end p-6 md:p-12 group">
              <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop" className="parallax-img absolute inset-0 w-full h-[120%] -top-[10%] object-cover opacity-30 group-hover:opacity-60 transition-all duration-1000 ease-out" alt="Heritage Milling"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/50 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 w-full pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">01. Heritage Milling</span>
                <h3 className="font-serif text-2xl md:text-4xl text-[#fcfbf8]">Sourced from local farms.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[300px] md:min-h-0 relative bg-[#120d09] rounded-sm overflow-hidden hover-target flex items-end p-6 md:p-8 group">
              <img src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=1000&auto=format&fit=crop" className="parallax-img absolute inset-0 w-full h-[120%] -top-[10%] object-cover opacity-30 group-hover:opacity-60 transition-all duration-1000 ease-out" alt="Lamination"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/60 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">02. Lamination</span>
                <h3 className="font-serif text-xl md:text-2xl text-[#fcfbf8]">84% Butterfat.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[300px] md:min-h-0 relative bg-[#120d09] rounded-sm overflow-hidden hover-target flex items-end p-6 md:p-8 group">
              <img src="https://images.unsplash.com/photo-1556910110-a5a63dfd393c?q=80&w=1000&auto=format&fit=crop" className="parallax-img absolute inset-0 w-full h-[120%] -top-[10%] object-cover opacity-30 group-hover:opacity-60 transition-all duration-1000 ease-out" alt="Shaping"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/60 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">03. Shaping</span>
                <h3 className="font-serif text-xl md:text-2xl text-[#fcfbf8]">Rolled by hand.</h3>
              </div>
            </div>
            
            <div className="bento-item min-h-[350px] md:min-h-0 md:col-span-2 relative bg-[#120d09] rounded-sm overflow-hidden hover-target flex items-end p-6 md:p-12 group">
              <img src="https://images.unsplash.com/photo-1623334044303-241021148842?q=80&w=1000&auto=format&fit=crop" className="parallax-img absolute inset-0 w-full h-[120%] -top-[10%] object-cover opacity-40 group-hover:opacity-70 transition-all duration-1000 ease-out" alt="Baking"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0705] via-[#0a0705]/40 to-transparent z-10 pointer-events-none"></div>
              <div className="relative z-20 pointer-events-none transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">
                <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/60 block mb-3">04. The Bake</span>
                <h3 className="font-serif text-2xl md:text-4xl text-[#fcfbf8]">Shatteringly crisp.</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-24 md:py-32 px-6 md:px-16 bg-[#0a0705] relative z-30">
        <div className="max-w-6xl mx-auto border-t border-[#f5e6d3]/10 pt-20 md:pt-32 flex flex-col md:flex-row gap-12 md:gap-16 items-center">
          <div className="w-full md:w-1/2 aspect-[3/4] relative overflow-hidden rounded-t-[100px] rounded-b-sm group hover-target fade-up-element">
            <img src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=1000&auto=format&fit=crop" alt="Head Baker" className="parallax-img absolute inset-0 w-full h-[115%] -top-[10%] object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all duration-1000" />
          </div>
          <div className="w-full md:w-1/2 md:pl-10 text-center md:text-left reveal-text-container fade-up-element">
            <h2 className="font-serif text-3xl md:text-6xl text-[#fcfbf8] mb-6 md:mb-8">The Hands <br className="hidden md:block"/><span className="italic">Behind the Dough</span></h2>
            <div className="text-[#f5e6d3]/80 leading-relaxed font-light mb-8 md:mb-10 text-sm md:text-lg">
              <AnimatedText text='"Baking at this level is not about recipes. It is about feeling the humidity in the air, the warmth of the flour, and listening to the crackle of the crust as it cools. It is a living, breathing dialogue."' />
            </div>
            <p className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#f5e6d3]/40">— Lucifer, Head Chef</p>
          </div>
        </div>
      </section>

      <section className="h-[60vh] md:h-[90vh] w-full relative overflow-hidden z-30 flex items-center justify-center">
        <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop" alt="Pouring coffee" className="parallax-img absolute inset-0 w-full h-[140%] -top-[20%] object-cover opacity-30 z-0" />
        <div className="absolute inset-0 bg-[#0a0705]/50 z-10"></div>
        <h2 className="relative z-20 font-serif text-[10vw] md:text-[6vw] text-[#fcfbf8] italic text-center leading-tight fade-up-element">
          Coffee, elevated.<br/>
          <span className="not-italic text-[3vw] md:text-[2vw] tracking-[0.2em] font-sans font-bold uppercase block mt-4 md:mt-6 text-[#f5e6d3]/80">Single Origin Reserve</span>
        </h2>
      </section>

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

      <section id="gallery" ref={galleryWrapperRef} className="md:h-screen bg-[#0a0705] flex items-center overflow-hidden z-30 relative py-20 md:py-0">
        <div className="absolute top-8 md:top-32 left-6 md:left-16 z-10 hidden md:block">
          <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40">[ The Atmosphere ]</p>
        </div>
        <div ref={galleryTrackRef} className="flex flex-col md:flex-row gap-8 md:gap-12 px-6 md:px-32 md:h-[65vh] md:w-max items-center">
          
          <div className="w-full md:w-[45vw] h-[50vh] md:h-full relative group hover-target shrink-0 overflow-hidden rounded-sm fade-up-element">
            <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Interior"/>
          </div>
          <div className="w-full md:w-[35vw] h-[50vh] md:h-[80%] relative group hover-target shrink-0 overflow-hidden rounded-sm fade-up-element">
            <img src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Coffee Details"/>
          </div>
          <div className="w-full md:w-[45vw] h-[50vh] md:h-full relative group hover-target shrink-0 overflow-hidden rounded-sm fade-up-element">
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-out" alt="Interior Detail"/>
          </div>

          <div className="w-full md:w-[40vw] h-auto md:h-full flex flex-col justify-center py-10 md:py-0 md:px-16 shrink-0 reveal-text-container fade-up-element">
            <h2 className="font-serif text-3xl md:text-6xl text-[#fcfbf8] italic mb-6 md:mb-8">A space to pause.</h2>
            <div className="text-[#f5e6d3]/80 font-light text-sm md:text-lg leading-relaxed">
              <AnimatedText text="Designed for slow mornings, quiet conversations, and the simple, profound joy of exceptional pastry and pour-over coffee." />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-48 px-6 md:px-16 bg-[#120d09] relative z-30 flex items-center justify-center text-center">
        <div className="max-w-4xl fade-up-element reveal-text-container">
          <svg className="mx-auto mb-8 md:mb-12 text-[#f5e6d3]/20 w-8 h-8 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
          <h2 className="font-serif text-2xl md:text-5xl text-[#fcfbf8] leading-relaxed md:leading-tight mb-8 md:mb-12">
             <AnimatedText text='"Without a doubt, the most extraordinary cafe we have seen in Chennai."' />
          </h2>
          <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40">— The Times Of India</p>
        </div>
      </section>

      <section id="menu" className="py-24 md:py-32 px-6 md:px-16 bg-[#fcfbf8] text-[#0a0705] relative z-30 transition-colors duration-1000">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end border-b border-[#0a0705]/10 pb-8 md:pb-10 mb-12 md:mb-16 fade-up-element">
            <h2 className="font-serif text-4xl md:text-7xl text-[#0a0705]">Menu</h2>
            <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-[#0a0705]/50 hidden md:block font-bold">Served until sold out</span>
          </div>

          <div className="flex flex-col group/menu">
            {[
              { 
                name: 'Signature Butter Croissant', 
                price: '₹350', 
                desc: 'Isigny Ste Mère butter, 72h ferment, shattering crust.',
              },
              { 
                name: 'Pain au Chocolat', 
                price: '₹420', 
                desc: 'Laminated dough encasing twin Valrhona dark chocolate batons.',
              },
              { 
                name: 'Pistachio & Rose Twice-Baked', 
                price: '₹550', 
                desc: 'Iranian pistachio frangipane, subtle hint of local rose petal preserve.',
              },
              { 
                name: 'Cardamom Knot', 
                price: '₹320', 
                desc: 'Braided brioche, freshly ground local green cardamom, pearl sugar.',
              },
              { 
                name: 'Madras Filter Coffee Éclair', 
                price: '₹480', 
                desc: 'Choux pastry filled with a rich degree-coffee infused crème diplomate.',
              },
              { 
                name: 'Truffle Mushroom Cruffin', 
                price: '₹520', 
                desc: 'Savoury cruffin, wild mushroom duxelles, white truffle oil, thyme.',
              },
              { 
                name: 'Vanilla Bean Tart', 
                price: '₹650', 
                desc: 'Madagascar vanilla bean ganache, crisp butter sablé shell.',
              },
              { 
                name: 'Single Origin Pour Over', 
                price: '₹450', 
                desc: 'Rotating seasonal selection from Kodaikanal and Chikmagalur estates.',
              },
              { 
                name: 'Artisanal Cascara Kombucha', 
                price: '₹380', 
                desc: 'House-fermented with coffee cherry husks, sparkling and bright.',
              }
            ].map((item, i) => (
              <div key={i} className="menu-row hover-target flex flex-col md:flex-row justify-between md:items-center py-6 md:py-12 border-b border-[#0a0705]/10 transition-all duration-500 md:cursor-none hover:pl-8 hover:bg-[#0a0705]/5 hover:border-[#0a0705]/40 opacity-100 hover:!opacity-100 group-hover/menu:opacity-40">
                <div className="flex flex-col md:w-2/3">
                  <h3 className="font-serif text-xl md:text-4xl text-[#0a0705]/80 transition-all duration-500">{item.name}</h3>
                  <p className="text-xs md:text-sm text-[#0a0705]/60 mt-2 md:mt-4 tracking-wide font-medium">{item.desc}</p>
                </div>
                <span className="text-lg md:text-xl mt-3 md:mt-0 font-medium tracking-wider">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 md:py-40 px-6 md:px-16 bg-[#0a0705] relative z-30 border-t border-[#f5e6d3]/5 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24 relative z-10">
          <div className="w-full md:w-5/12 flex flex-col justify-center reveal-text-container fade-up-element">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#f5e6d3]/40 mb-6 md:mb-8 border-l border-[#f5e6d3]/20 pl-4">Inquiries</p>
            <h2 className="font-serif text-4xl md:text-6xl leading-tight text-[#fcfbf8] mb-8 md:mb-10">
              Let's start a <br/><span className="italic text-[#f5e6d3]/60">conversation.</span>
            </h2>
            <div className="text-sm md:text-lg text-[#f5e6d3]/80 font-light leading-relaxed mb-8 md:mb-12">
              <AnimatedText text="Whether it's a private event, wholesale inquiry, or simply to share your thoughts about our pastries, we are always listening." />
            </div>
          </div>
          
          <div className="w-full md:w-7/12 flex flex-col justify-center fade-up-element">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-8 md:gap-12 w-full">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full">
                <div className="flex flex-col w-full relative">
                  <input type="text" name="name" id="name" required className="peer bg-transparent border-b border-[#f5e6d3]/20 py-3 text-[#fcfbf8] font-light placeholder-transparent focus:outline-none focus:border-[#fcfbf8] transition-colors hover-target md:cursor-none w-full" placeholder="Name" />
                  <label htmlFor="name" className="absolute left-0 -top-3.5 text-[10px] tracking-[0.2em] uppercase text-[#f5e6d3]/40 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-[#fcfbf8] md:cursor-none">Your Name</label>
                </div>
                <div className="flex flex-col w-full relative">
                  <input type="email" name="email" id="email" required className="peer bg-transparent border-b border-[#f5e6d3]/20 py-3 text-[#fcfbf8] font-light placeholder-transparent focus:outline-none focus:border-[#fcfbf8] transition-colors hover-target md:cursor-none w-full" placeholder="Email" />
                  <label htmlFor="email" className="absolute left-0 -top-3.5 text-[10px] tracking-[0.2em] uppercase text-[#f5e6d3]/40 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-[#fcfbf8] md:cursor-none">Your Email</label>
                </div>
              </div>
              
              <div className="flex flex-col w-full relative mt-4 md:mt-0">
                <textarea name="message" id="message" rows="4" required className="peer bg-transparent border-b border-[#f5e6d3]/20 py-3 text-[#fcfbf8] font-light placeholder-transparent focus:outline-none focus:border-[#fcfbf8] transition-colors hover-target md:cursor-none resize-none w-full" placeholder="Message"></textarea>
                <label htmlFor="message" className="absolute left-0 -top-3.5 text-[10px] tracking-[0.2em] uppercase text-[#f5e6d3]/40 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-[10px] peer-focus:text-[#fcfbf8] md:cursor-none">Your Message</label>
              </div>
              
              <button 
                type="submit" 
                disabled={formStatus === 'submitting'}
                className="self-start mt-4 px-10 py-4 border border-[#f5e6d3]/40 rounded-full text-[10px] tracking-[0.3em] uppercase text-[#fcfbf8] hover:bg-[#fcfbf8] hover:text-[#0a0705] transition-all duration-500 ease-out hover-target md:cursor-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formStatus === 'idle' && 'Send Message'}
                {formStatus === 'submitting' && 'Sending...'}
                {formStatus === 'success' && 'Sent Successfully ✓'}
                {formStatus === 'error' && 'Error. Try Again.'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="bg-[#050302] text-[#f5e6d3] pt-20 md:pt-24 pb-8 px-6 md:px-12 flex flex-col relative z-30 overflow-hidden">
        
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-start gap-12 border-b border-[#f5e6d3]/15 pb-12 md:pb-16 fade-up-element">
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
              <a href="#" className="text-xs md:text-sm hover-target hover:text-[#fcfbf8] md:hover:-translate-y-1 transition-all md:cursor-none">LinkedIn</a>
              <a href="#" className="text-xs md:text-sm hover-target hover:text-[#fcfbf8] md:hover:-translate-y-1 transition-all md:cursor-none">Whatsapp</a>
            </div>
            <div className="flex flex-col gap-3 md:gap-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 mb-1 md:mb-2">Visit</span>
              <span className="text-xs md:text-sm">Ashok Nagar, 8th Avenue</span>
              <span className="text-xs md:text-sm">Chennai - 600083</span>
            </div>
          </div>
        </div>
        
        <div className="mt-16 md:mt-20 mb-8 md:mb-12 w-full flex justify-center items-center pointer-events-none select-none">
          <h1 className="footer-huge-text text-[14vw] md:text-[13vw] font-serif leading-[0.8] tracking-tighter text-[#fcfbf8] uppercase opacity-90 text-center">
            Crust <span className="italic font-light text-[12vw] md:text-[11vw]">&</span> Crunch
          </h1>
        </div>
        
        <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row justify-between items-center text-[9px] font-bold uppercase tracking-[0.3em] text-[#f5e6d3]/40 pt-6 md:pt-8 border-t border-[#f5e6d3]/10">
          <span className="mb-4 md:mb-0">© 2026 Crust & Crunch</span>
          <div className="flex gap-6 md:gap-8">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setIsPrivacyOpen(true);
              }}
              className="hover-target hover:text-[#fcfbf8] transition-colors md:cursor-none"
            >
              Privacy Policy
            </a>
            <a href="#top" className="hover-target hover:text-[#fcfbf8] transition-colors md:cursor-none">Back to Top ↑</a>
          </div>
        </div>
        
      </footer>
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0a0705]/80 backdrop-blur-sm">
          <div className="bg-[#120d09] border border-[#f5e6d3]/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-sm p-8 md:p-12 relative shadow-2xl">
            
            <button 
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute top-6 right-6 text-[#f5e6d3]/40 hover:text-[#fcfbf8] transition-colors text-3xl font-light hover-target md:cursor-none"
              aria-label="Close"
            >
              &times;
            </button>
            
            <h3 className="font-serif text-2xl md:text-3xl text-[#fcfbf8] mb-8 italic">Privacy Policy</h3>
            
            <div className="space-y-6 text-sm md:text-base text-[#f5e6d3]/60 font-light leading-relaxed">
              <p>
                At Crust & Crunch, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.
              </p>
              
              <div>
                <h4 className="text-[#fcfbf8] text-xs uppercase tracking-[0.2em] mb-2 font-bold">1. Information We Collect</h4>
                <p>
                  We may collect, use, store and transfer different kinds of personal data about you including Identity Data, Contact Data, and Usage Data. We do not collect any Special Categories of Personal Data about you.
                </p>
              </div>

              <div>
                <h4 className="text-[#fcfbf8] text-xs uppercase tracking-[0.2em] mb-2 font-bold">2. How We Use Your Data</h4>
                <p>
                  We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you, or where it is necessary for our legitimate interests.
                </p>
              </div>

              <div>
                <h4 className="text-[#fcfbf8] text-xs uppercase tracking-[0.2em] mb-2 font-bold">3. Data Security</h4>
                <p>
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}