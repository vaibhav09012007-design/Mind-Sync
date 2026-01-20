'use client';

import { motion, type Variants } from 'framer-motion';
import { Calendar, CheckSquare, Target, FileText, Brain, Zap } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'AI-powered scheduling that learns your preferences and optimizes your time.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Kanban boards and list views to organize your work the way you want.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Focus Timer',
    description: 'Pomodoro technique with ambient sounds to maximize deep work sessions.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: FileText,
    title: 'Rich Notes',
    description: 'Markdown-powered notes with templates and smart organization.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Natural language processing to help you plan, organize, and execute.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Quick Actions',
    description: 'Command palette for lightning-fast navigation and task creation.',
    gradient: 'from-yellow-500 to-orange-500',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function Features() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{' '}
            <span className="gradient-text">stay productive</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete suite of tools designed to help you focus, organize, and accomplish more.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated"
            >
              {/* Icon with solid gold style */}
              <div
                className="inline-flex p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-glow mb-4"
              >
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
