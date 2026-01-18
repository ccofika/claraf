import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Send, Loader2, X, Check } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DatePicker } from './ui/date-picker';
import TicketRichTextEditor from './TicketRichTextEditor';
import { toast } from 'sonner';

// Premium Paper Plane SVG with path animation support
const AnimatedPaperPlane = ({ isFlying, onComplete }) => {
  const pathRef = useRef(null);

  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ rotate: 0 }}
      animate={isFlying ? { rotate: [0, -10, 25] } : { rotate: 0 }}
      transition={{ duration: 0.6, times: [0, 0.3, 1], ease: "easeOut" }}
    >
      <motion.path
        ref={pathRef}
        d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
};

// Success Checkmark with draw animation
const SuccessCheckmark = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]"
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"
          initial={{ boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" }}
          animate={{ boxShadow: "0 0 60px 20px rgba(16, 185, 129, 0.3)" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M20 6L9 17L4 12"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Particle trail component
const ParticleTrail = ({ isActive }) => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.03,
    x: -20 - (i * 15),
    y: Math.sin(i * 0.8) * 8,
    size: 4 - (i * 0.25),
    opacity: 1 - (i * 0.08)
  }));

  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-blue-400"
              style={{
                width: particle.size,
                height: particle.size,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                opacity: [0, particle.opacity, 0],
                scale: [0, 1, 0.5]
              }}
              transition={{
                duration: 0.5,
                delay: particle.delay,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Glow ring effect
const GlowRing = ({ isActive, delay = 0 }) => (
  <motion.div
    className="absolute inset-0 rounded-full"
    initial={{ scale: 1, opacity: 0 }}
    animate={isActive ? {
      scale: [1, 2.5, 3],
      opacity: [0.6, 0.3, 0]
    } : {}}
    transition={{
      duration: 0.8,
      delay,
      ease: "easeOut"
    }}
    style={{
      border: '2px solid rgba(59, 130, 246, 0.5)',
    }}
  />
);

// Button Component with Glass variant
const Button = ({ children, variant = 'default', size = 'default', className = '', onClick, disabled, type = 'button' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-300',
    secondary: 'bg-white dark:bg-neutral-800 text-black dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-neutral-600',
    ghost: 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300',
    destructive: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-2 focus:ring-offset-2 focus:ring-red-600 dark:focus:ring-red-500',
    glass: '',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Glass variant with animated gradient border
  if (variant === 'glass') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`relative ${baseStyles} ${sizes[size]} text-gray-900 dark:text-white ${className}`}
      >
        {/* Animated gradient border - Light theme */}
        <div
          className="absolute inset-0 rounded-xl dark:hidden"
          style={{
            padding: '1px',
            background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, rgba(0,0,0,0.12) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'rotateGradient 4s ease-in-out infinite',
          }}
        />
        {/* Animated gradient border - Dark theme */}
        <div
          className="absolute inset-0 rounded-xl hidden dark:block"
          style={{
            padding: '1px',
            background: 'linear-gradient(var(--gradient-angle, 135deg), rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 60%, rgba(255,255,255,0.2) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'rotateGradient 4s ease-in-out infinite',
          }}
        />
        {/* Inner glass background - Light theme */}
        <div
          className="absolute inset-[1px] rounded-[11px] dark:hidden transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.98) 50%, rgba(255,255,255,0.95) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        {/* Inner glass background - Dark theme */}
        <div
          className="absolute inset-[1px] rounded-[11px] hidden dark:block transition-all duration-200"
          style={{
            background: 'linear-gradient(145deg, rgba(30,30,30,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(25,25,25,0.9) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
        {/* Content */}
        <span className="relative z-10 inline-flex items-center">{children}</span>
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Main SendTicketModal Component
const SendTicketModal = ({ open, onOpenChange, agents, onSubmit }) => {
  // Form state
  const [formData, setFormData] = useState({
    agent: '',
    ticketId: '',
    notes: '',
    dateEntered: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  // Animation phases: 'idle' | 'sending' | 'morphing' | 'flying' | 'success' | 'done'
  const [animationPhase, setAnimationPhase] = useState('idle');

  // Motion values for smooth arc path
  const planeX = useMotionValue(0);
  const planeY = useMotionValue(0);
  const planeRotate = useMotionValue(0);
  const planeScale = useMotionValue(1);
  const planeOpacity = useMotionValue(1);

  // Refs
  const agentDropdownRef = useRef(null);
  const agentListRef = useRef(null);
  const buttonRef = useRef(null);

  // Filter agents based on search
  const filteredAgents = (agents || []).filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        agent: '',
        ticketId: '',
        notes: '',
        dateEntered: new Date().toISOString().split('T')[0]
      });
      setAgentSearch('');
      setAnimationPhase('idle');
      planeX.set(0);
      planeY.set(0);
      planeRotate.set(0);
      planeScale.set(1);
      planeOpacity.set(1);
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight on search change
  useEffect(() => {
    setHighlightIndex(0);
  }, [agentSearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (showAgentDropdown && agentListRef.current) {
      const highlighted = agentListRef.current.querySelector('[data-highlighted="true"]');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightIndex, showAgentDropdown]);

  // Premium arc flight animation
  const startFlightAnimation = () => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const duration = 0.7;

    // Animate X with easeIn for acceleration feel
    animate(planeX, screenWidth + 100, {
      duration,
      ease: [0.32, 0, 0.67, 0],
    });

    // Animate Y in an arc (up then down)
    animate(planeY, [0, -60, -40, 20], {
      duration,
      ease: "easeInOut",
      times: [0, 0.3, 0.6, 1]
    });

    // Rotate during flight
    animate(planeRotate, [0, -15, 5, 25], {
      duration,
      ease: "easeInOut",
      times: [0, 0.2, 0.5, 1]
    });

    // Scale pulse then shrink
    animate(planeScale, [1, 1.15, 1.1, 0.8], {
      duration,
      ease: "easeOut",
      times: [0, 0.15, 0.4, 1]
    });

    // Fade out at the end
    animate(planeOpacity, [1, 1, 1, 0], {
      duration,
      times: [0, 0.5, 0.8, 1]
    });
  };

  // Handle keyboard navigation
  const handleAgentKeyDown = (e) => {
    if (!showAgentDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowAgentDropdown(true);
      }
      return;
    }

    const totalItems = filteredAgents.length;
    if (totalItems === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAgents[highlightIndex]) {
          const selected = filteredAgents[highlightIndex];
          setFormData({ ...formData, agent: selected._id });
          setAgentSearch(selected.name);
          setShowAgentDropdown(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowAgentDropdown(false);
        break;
      default:
        break;
    }
  };

  // Handle form submission with premium animation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agent || !formData.ticketId) {
      toast.error('Agent and Ticket ID are required');
      return;
    }

    setIsSubmitting(true);
    setAnimationPhase('sending');

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result.success) {
      // Phase 1: Morph button to plane icon
      setAnimationPhase('morphing');

      await new Promise(r => setTimeout(r, 400));

      // Phase 2: Flying animation
      setAnimationPhase('flying');
      startFlightAnimation();

      await new Promise(r => setTimeout(r, 700));

      // Phase 3: Success checkmark
      setAnimationPhase('success');

      await new Promise(r => setTimeout(r, 800));

      // Phase 4: Close modal
      setAnimationPhase('done');
      onOpenChange(false);

      // Reset to idle after close to clean up
      setTimeout(() => {
        setAnimationPhase('idle');
      }, 100);
    } else {
      setAnimationPhase('idle');
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && animationPhase === 'idle') {
      onOpenChange(false);
    }
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Don't render if closed and animation is complete
  if (!open && (animationPhase === 'idle' || animationPhase === 'done')) return null;

  // Premium spring configs
  const springConfig = { type: "spring", damping: 25, stiffness: 300 };
  const smoothSpring = { type: "spring", damping: 30, stiffness: 400 };

  return (
    <AnimatePresence mode="wait">
      {(open || animationPhase !== 'idle') && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: animationPhase === 'done' ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Success Checkmark */}
          <SuccessCheckmark show={animationPhase === 'success'} />

          {/* Flying Paper Plane */}
          <AnimatePresence>
            {(animationPhase === 'flying') && (
              <motion.div
                className="fixed z-[55] pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  x: planeX,
                  y: planeY,
                  rotate: planeRotate,
                  scale: planeScale,
                  opacity: planeOpacity,
                  marginLeft: -32,
                  marginTop: -32,
                }}
              >
                <div className="relative">
                  {/* Glow rings */}
                  <GlowRing isActive={true} delay={0} />
                  <GlowRing isActive={true} delay={0.15} />

                  {/* Particle trail */}
                  <ParticleTrail isActive={true} />

                  {/* Main plane icon */}
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center relative overflow-hidden"
                    animate={{
                      boxShadow: [
                        '0 0 20px 5px rgba(59, 130, 246, 0.4)',
                        '0 0 40px 10px rgba(59, 130, 246, 0.6)',
                        '0 0 30px 8px rgba(59, 130, 246, 0.5)',
                      ]
                    }}
                    transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    <AnimatedPaperPlane isFlying={true} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal */}
          <AnimatePresence>
            {(animationPhase === 'idle' || animationPhase === 'sending') && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={handleBackdropClick}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    y: -20,
                    transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] }
                  }}
                  transition={smoothSpring}
                  className="w-full max-w-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-neutral-800 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-gradient-to-r from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-800">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={springConfig}
                        >
                          <Send className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Send Ticket
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">
                            Transfer to another agent for grading
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => onOpenChange(false)}
                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-5 h-5 text-gray-400 dark:text-neutral-500" />
                      </motion.button>
                    </div>

                    {/* Form */}
                    <motion.form
                      onSubmit={handleSubmit}
                      className="p-6 space-y-5"
                      animate={animationPhase === 'morphing' ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      {/* Agent Field */}
                      <div ref={agentDropdownRef} className="relative">
                        <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                          Agent <span className="text-red-500">*</span>
                        </Label>
                        <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
                          <input
                            type="text"
                            value={agentSearch}
                            onChange={(e) => {
                              setAgentSearch(e.target.value);
                              setShowAgentDropdown(true);
                              if (formData.agent) {
                                const currentAgent = agents.find(a => a._id === formData.agent);
                                if (currentAgent && !currentAgent.name.toLowerCase().includes(e.target.value.toLowerCase())) {
                                  setFormData({ ...formData, agent: '' });
                                }
                              }
                            }}
                            onFocus={() => setShowAgentDropdown(true)}
                            onKeyDown={handleAgentKeyDown}
                            placeholder="Search agents..."
                            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 transition-all duration-200"
                          />
                        </motion.div>

                        <AnimatePresence>
                          {showAgentDropdown && (
                            <motion.div
                              ref={agentListRef}
                              initial={{ opacity: 0, y: -8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-52 overflow-y-auto"
                            >
                              {filteredAgents.length > 0 ? (
                                filteredAgents.map((agent, index) => (
                                  <motion.button
                                    key={agent._id}
                                    type="button"
                                    data-highlighted={highlightIndex === index}
                                    onClick={() => {
                                      setFormData({ ...formData, agent: agent._id });
                                      setAgentSearch(agent.name);
                                      setShowAgentDropdown(false);
                                    }}
                                    onMouseEnter={() => setHighlightIndex(index)}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white transition-colors ${
                                      highlightIndex === index
                                        ? 'bg-blue-50 dark:bg-blue-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                                    }`}
                                  >
                                    {agent.name}
                                  </motion.button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-500">
                                  No agents found
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <p className="text-xs text-gray-500 dark:text-neutral-500 mt-2">
                          The ticket will be sent to the grader assigned to this agent.
                        </p>
                      </div>

                      {/* Ticket ID Field */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                          Ticket ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.ticketId}
                          onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                          placeholder="e.g., INC123456"
                          className="h-12 rounded-xl"
                          required
                        />
                      </div>

                      {/* Date Field */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                          Date Entered
                        </Label>
                        <DatePicker
                          value={formData.dateEntered}
                          onChange={(date) => setFormData({ ...formData, dateEntered: date })}
                          placeholder="Select date"
                        />
                      </div>

                      {/* Notes Field */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                          Notes
                        </Label>
                        <TicketRichTextEditor
                          value={formData.notes}
                          onChange={(html) => setFormData({ ...formData, notes: html })}
                          placeholder="Add any notes about this ticket..."
                          rows={3}
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100 dark:border-neutral-800">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="px-5 py-2.5"
                          >
                            Cancel
                          </Button>
                        </motion.div>

                        <motion.div
                          ref={buttonRef}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            variant="glass"
                            disabled={isSubmitting}
                            className="min-w-[140px] px-6 py-2.5 text-blue-600 dark:text-blue-400"
                          >
                            <AnimatePresence mode="wait">
                              {isSubmitting ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center"
                                >
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  >
                                    <Loader2 className="w-4 h-4 mr-2" />
                                  </motion.div>
                                  Sending...
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="send"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="flex items-center"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Send Ticket
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </div>

                      {/* CSS for glass animation */}
                      <style>{`
                        @keyframes rotateGradient {
                          0% { --gradient-angle: 135deg; }
                          25% { --gradient-angle: 225deg; }
                          50% { --gradient-angle: 315deg; }
                          75% { --gradient-angle: 45deg; }
                          100% { --gradient-angle: 135deg; }
                        }
                        @property --gradient-angle {
                          syntax: '<angle>';
                          initial-value: 135deg;
                          inherits: false;
                        }
                      `}</style>
                    </motion.form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Morphing state - shows plane in center before flight */}
          <AnimatePresence>
            {animationPhase === 'morphing' && (
              <motion.div
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[55]"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 30px 10px rgba(59, 130, 246, 0.4)',
                      '0 0 50px 15px rgba(59, 130, 246, 0.5)',
                    ]
                  }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
                >
                  <AnimatedPaperPlane isFlying={false} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default SendTicketModal;
