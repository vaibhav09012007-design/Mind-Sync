"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FloatingElements } from "@/components/landing/FloatingElements";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <FloatingElements />

      <div className="z-10 flex flex-col items-center gap-8 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h1 className="text-[10rem] font-bold leading-none tracking-tighter gradient-text-animated opacity-20 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold">Lost in Space</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-md space-y-4"
        >
          <p className="text-lg text-muted-foreground">
            The page you are looking for has drifted away into the void.
            Let's get you back to productivity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/dashboard">
              <Button size="lg" variant="gradient" className="w-full sm:w-auto hover-lift">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Back Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
