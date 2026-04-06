import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CircuitSVG from './CircuitSVG';
import './LandingPage.css';
// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);
export default function LandingPage({ onNavigate }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const svgRef = useRef(null);
    useEffect(() => {
        if (!sceneRef.current || !svgRef.current)
            return;
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
    const updateHotspotStates = (progress) => {
        // Show hotspots gradually based on scroll progress
        const hotspots = document.querySelectorAll('[data-hotspot]');
        hotspots.forEach((hotspot) => {
            const threshold = parseFloat(hotspot.getAttribute('data-reveal') || '0.75');
            const opacity = progress >= threshold ? 1 : 0;
            hotspot.style.opacity = opacity.toString();
        });
    };
    const handleHotspotClick = (action) => {
        onNavigate(action);
    };
    return (_jsxs("div", { ref: containerRef, className: "landing-page", children: [_jsx("div", { ref: sceneRef, className: "landing-scene", children: _jsx("div", { className: "circuit-container", children: _jsx(CircuitSVG, { ref: svgRef, onHotspotClick: onNavigate }) }) }), _jsxs("div", { className: "landing-content", children: [_jsxs("section", { id: "upload", className: "content-section", children: [_jsx("h2", { children: "Upload Circuit" }), _jsx("p", { children: "Get started by uploading a circuit image" })] }), _jsxs("section", { id: "overview", className: "content-section", children: [_jsx("h2", { children: "Overview" }), _jsx("p", { children: "Circuit analysis overview" })] }), _jsxs("section", { id: "history", className: "content-section", children: [_jsx("h2", { children: "History" }), _jsx("p", { children: "View previous analyses" })] }), _jsxs("section", { id: "components", className: "content-section", children: [_jsx("h2", { children: "Components" }), _jsx("p", { children: "Component registry" })] }), _jsxs("section", { id: "schematic", className: "content-section", children: [_jsx("h2", { children: "Schematic" }), _jsx("p", { children: "Circuit schematic view" })] }), _jsxs("section", { id: "simulation", className: "content-section", children: [_jsx("h2", { children: "Simulation" }), _jsx("p", { children: "Circuit simulation" })] })] })] }));
}
