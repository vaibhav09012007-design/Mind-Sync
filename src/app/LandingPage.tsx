'use client';

import dynamic from 'next/dynamic';
import {
  HeroSection,
  Features,
  Testimonials,
  AnimatedStats,
  CTASection,
  Footer,
  FloatingElements,
} from '@/components/landing';

// Dynamically import Hero3D to avoid SSR issues with Three.js
const Hero3D = dynamic(
  () => import('@/components/landing/Hero3D').then((mod) => mod.Hero3D),
  { ssr: false }
);

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background elements */}
      <FloatingElements />

      {/* Hero Section with 3D element */}
      <div className="relative">
        <Hero3D />
        <HeroSection />
      </div>

      {/* Stats Section */}
      <AnimatedStats />

      {/* Features Section */}
      <Features />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
