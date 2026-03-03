import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollProgress } from './ScrollProgress';

export function Layout() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col font-sans selection:bg-orange-500/30 grid-container relative overflow-x-hidden"
    >
      <div className="grid-bg" />
      <div className="magical-orb" style={{ top: '10%', left: '10%' }} />
      <div className="magical-orb" style={{ top: '60%', left: '80%', animationDelay: '-5s' }} />
      <div className="magical-orb" style={{ top: '80%', left: '20%', animationDelay: '-10s' }} />
      
      <ScrollProgress />
      <Header />
      <main className="flex-grow w-full relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
