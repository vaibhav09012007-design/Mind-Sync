'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GradientButton } from './GradientButton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to <span className="gradient-text-animated">transform</span> your productivity?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Join thousands of users who have already discovered a better way to work. Start your journey today.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <GradientButton size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </GradientButton>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="hover-lift">
              Sign In
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. Free forever for personal use.
        </p>
      </motion.div>
    </section>
  );
}
