import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CircuitSVG from './CircuitSVG';
import './LandingPage.css';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onNavigate: (section: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!sceneRef.current || !svgRef.current) return;

    // Create timeline for scroll-driven animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sceneRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Smooth scrubbing: 1 second delay off scroll
        pin: true, // Pin this section while playing
        markers: false, // Set to true for debugging
        onUpdate: (self) => {
          // Progress from 0 to 1
          const progress = self.progress;
          
          // Update hotspot visibility based on scroll progress
          updateHotspotStates(progress);
        },
      },
    });

    // Define the scroll choreography
    // 0–15%: full circuit visible, minimal motion
    tl.add(() => {
      // Start state
      gsap.set(svgRef.current, {
        scale: 1,
        rotateZ: 0,
        x: 0,
        y: 0,
      });
    }, 0);

    // 15–35%: slow tilt or pivot, slight zoom-in
    tl.to(svgRef.current, {
      scale: 1.1,
      rotateZ: -5,
      duration: 1,
    }, 0.15);

    // 35–55%: camera drifts toward the CPU core
    tl.to(svgRef.current, {
      x: -80,
      y: -60,
      scale: 1.3,
      rotateZ: -8,
      duration: 1,
    }, 0.35);

    // 55–75%: specific subsystems come into focus
    tl.to(svgRef.current, {
      x: -150,
      y: -120,
      scale: 1.5,
      rotateZ: -5,
      duration: 1,
    }, 0.55);

    // 75–100%: hotspots become interactive entry points
    tl.to(svgRef.current, {
      x: -200,
      y: -150,
      scale: 1.6,
      rotateZ: -2,
      duration: 0.5,
    }, 0.75);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const updateHotspotStates = (progress: number) => {
    // Show hotspots gradually based on scroll progress
    const hotspots = document.querySelectorAll('[data-hotspot]');
    hotspots.forEach((hotspot) => {
      const threshold = parseFloat(hotspot.getAttribute('data-reveal') || '0.75');
      const opacity = progress >= threshold ? 1 : 0;
      (hotspot as HTMLElement).style.opacity = opacity.toString();
    });
  };

  const handleHotspotClick = (action: string) => {
    onNavigate(action);
  };

  return (
    <div ref={containerRef} className="landing-page">
      {/* Hero pinned scene */}
      <div ref={sceneRef} className="landing-scene">
        <div className="circuit-container">
          <CircuitSVG
            ref={svgRef}
            onHotspotClick={onNavigate}
          />
        </div>
      </div>

      {/* Below-the-fold content sections */}
      <div className="landing-content">
        <section id="upload" className="content-section">
          <h2>Upload Circuit</h2>
          <p>Get started by uploading a circuit image</p>
        </section>
        <section id="overview" className="content-section">
          <h2>Overview</h2>
          <p>Circuit analysis overview</p>
        </section>
        <section id="history" className="content-section">
          <h2>History</h2>
          <p>View previous analyses</p>
        </section>
        <section id="components" className="content-section">
          <h2>Components</h2>
          <p>Component registry</p>
        </section>
        <section id="schematic" className="content-section">
          <h2>Schematic</h2>
          <p>Circuit schematic view</p>
        </section>
        <section id="simulation" className="content-section">
          <h2>Simulation</h2>
          <p>Circuit simulation</p>
        </section>
      </div>
    </div>
  );
}
