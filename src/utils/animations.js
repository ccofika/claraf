// Framer Motion Animation Utilities for QA Manager
// Minimalist, consistent animations across the entire page

// ============================================
// EASING FUNCTIONS
// ============================================
export const easing = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  snappy: [0.22, 1, 0.36, 1],
};

// ============================================
// DURATION CONSTANTS
// ============================================
export const duration = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  stagger: 0.05,
};

// ============================================
// FADE ANIMATIONS
// ============================================
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

// ============================================
// SCALE ANIMATIONS
// ============================================
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: duration.normal, ease: easing.smooth },
};

export const scaleInBounce = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: duration.slow, ease: easing.bounce },
};

// ============================================
// CONTAINER VARIANTS (for staggered children)
// ============================================
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: duration.stagger,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: duration.stagger / 2,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// ============================================
// CHILD ITEM VARIANTS
// ============================================
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: 5,
    transition: { duration: duration.fast },
  },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: duration.fast },
  },
};

// ============================================
// CARD ANIMATIONS
// ============================================
export const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: duration.fast },
  },
  hover: {
    y: -2,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
};

export const metricCardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  hover: {
    scale: 1.02,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
};

// ============================================
// MODAL / DIALOG ANIMATIONS
// ============================================
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.fast },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: duration.fast },
  },
};

export const slideUp = {
  initial: { opacity: 0, y: '100%' },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: duration.normal },
  },
};

// ============================================
// TAB ANIMATIONS
// ============================================
export const tabContent = {
  initial: { opacity: 0, x: 10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: duration.fast },
  },
};

// ============================================
// TABLE ROW ANIMATIONS
// ============================================
export const tableRow = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: duration.fast },
  },
  hover: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    transition: { duration: duration.fast },
  },
};

// ============================================
// BUTTON ANIMATIONS
// ============================================
export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: { duration: duration.fast, ease: easing.smooth },
};

// ============================================
// DROPDOWN / PANEL ANIMATIONS
// ============================================
export const dropdownVariants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: duration.fast },
  },
};

export const expandPanel = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: duration.fast },
  },
};

// ============================================
// CHART / DATA ANIMATIONS
// ============================================
export const chartContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: duration.slow,
      delay: 0.2,
      ease: easing.smooth,
    },
  },
};

// ============================================
// LOADING ANIMATIONS
// ============================================
export const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

export const pulse = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spin = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// VIEWPORT / SCROLL ANIMATIONS
// ============================================
export const scrollFadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: easing.smooth },
  },
  viewport: { once: true, amount: 0.3 },
};

export const scrollScaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.slow, ease: easing.smooth },
  },
  viewport: { once: true, amount: 0.3 },
};

// ============================================
// NOTIFICATION / TOAST ANIMATIONS
// ============================================
export const notificationSlide = {
  initial: { opacity: 0, x: 100 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: easing.bounce },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: duration.fast },
  },
};

// ============================================
// GRID ITEM ANIMATIONS (for statistics)
// ============================================
export const gridItem = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: duration.fast },
  },
};

// ============================================
// CALENDAR ANIMATIONS
// ============================================
export const calendarDay = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: easing.smooth },
  },
  hover: {
    scale: 1.1,
    transition: { duration: duration.fast },
  },
  tap: { scale: 0.95 },
};

// ============================================
// BADGE / CHIP ANIMATIONS
// ============================================
export const badgeVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.fast, ease: easing.bounce },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: duration.fast },
  },
};

// ============================================
// HELPER FUNCTION - Get stagger delay
// ============================================
export const getStaggerDelay = (index, baseDelay = 0.05) => ({
  transition: { delay: index * baseDelay },
});

// ============================================
// DESIGN CONSTANTS (for normalization)
// ============================================
export const designTokens = {
  // Border radius
  radius: {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },
  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },
  // Card styles
  card: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl',
  cardHover: 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700',
  // Button styles
  buttonPrimary: 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100',
  buttonSecondary: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700',
  buttonGhost: 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
  // Input styles
  input: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent',
  // Text colors
  textPrimary: 'text-neutral-900 dark:text-white',
  textSecondary: 'text-neutral-600 dark:text-neutral-400',
  textMuted: 'text-neutral-500 dark:text-neutral-500',
};
