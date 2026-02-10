import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ThrowbackPanel from './ThrowbackPanel';

/**
 * Portal-based floating Throwback drawer.
 * Used inside full-screen modals (TicketDialog, ViewTicketDialog) where the
 * NavBar's Throwback button is hidden behind the modal overlay.
 */
const ThrowbackDrawer = ({ open, onClose, agents }) => {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/20 z-[9998] pointer-events-auto"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed right-0 top-0 h-full w-[30%] min-w-[320px] max-w-[480px] z-[9999] shadow-2xl pointer-events-auto"
          >
            <ThrowbackPanel agents={agents} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ThrowbackDrawer;
