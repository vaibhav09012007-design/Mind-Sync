'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Product Manager',
    avatar: 'SK',
    quote: 'Mind-Sync transformed how I organize my day. The AI suggestions are incredibly accurate.',
    rating: 5,
  },
  {
    name: 'Alex T.',
    role: 'Software Developer',
    avatar: 'AT',
    quote: 'The focus timer with ambient sounds is a game-changer for deep work sessions.',
    rating: 5,
  },
  {
    name: 'Jordan M.',
    role: 'UX Designer',
    avatar: 'JM',
    quote: 'Beautiful interface that actually helps me stay productive. Love the dark mode!',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Freelance Writer',
    avatar: 'ER',
    quote: 'The notes feature with markdown support is exactly what I needed. Highly recommend!',
    rating: 5,
  },
  {
    name: 'Michael C.',
    role: 'Startup Founder',
    avatar: 'MC',
    quote: 'Finally, a productivity app that doesn\'t feel overwhelming. Simple yet powerful.',
    rating: 5,
  },
  {
    name: 'Lisa W.',
    role: 'Marketing Director',
    avatar: 'LW',
    quote: 'The calendar integration is seamless. I can\'t imagine going back to my old workflow.',
    rating: 5,
  },
];

export function Testimonials() {
  // Duplicate for infinite scroll effect
  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by <span className="gradient-text">thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users have to say about Mind-Sync
          </p>
        </motion.div>
      </div>

      {/* Scrolling testimonials */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          animate={{ x: [0, -50 * testimonials.length * 20] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex gap-6"
        >
          {allTestimonials.map((testimonial, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm leading-relaxed mb-4">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black text-sm font-medium">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
