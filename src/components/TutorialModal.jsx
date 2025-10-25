import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  Palette,
  Link2,
  Search,
  Gift,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import TutorialSlide from './TutorialSlide';
import axios from 'axios';

const TutorialModal = ({ isOpen, onClose, onDontShowAgain }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Tutorial content for all 7 slides
  const slides = [
    {
      title: "Welcome to Clara!",
      icon: Sparkles,
      description: `Clara is your all-in-one workspace designed to streamline customer support operations and boost team productivity.

In this quick tutorial, you'll learn:
• How to organize your work with Workspaces and Canvas
• Using the infinite Canvas for notes and documentation
• Quick Links for instant access to important resources
• Hash Explorer for blockchain transaction lookup across 50+ networks
• Affiliate Bonus Finder for searching bonuses from Google Sheets
• KYC & Slack Integration for managing customer inquiries

Let's get started! This tutorial takes just 3-4 minutes and will help you master all the essential features.`,
      videoPlaceholder: "Dashboard Overview"
    },
    {
      title: "Dashboard & Workspaces",
      icon: LayoutDashboard,
      description: `Your dashboard displays two workspace types: Public Workspace for company-wide announcements (read-only), and My Workspaces for your private collections.

Create unlimited personal workspaces to organize work by project, topic, or client type. Each workspace has its own infinite canvas where you can add notes, documents, and collaborate with team members.

Click "Create Workspace" anytime to start a new workspace and keep your work organized efficiently.`,
      videoPlaceholder: "Creating Workspaces Demo"
    },
    {
      title: "Canvas - Your Digital Workspace",
      icon: Palette,
      description: `Every workspace includes an infinite canvas where you can create and organize notes, documentation, and collaborative content with your team.

Choose from three viewing modes: EDIT for adding and organizing elements • VIEW for read-only navigation with zoom and pan • POST-VIEW for clean, distraction-free presentations.

Switch between modes using the toolbar in the top-right corner. Create titles, text boxes, and organize content freely on your canvas.`,
      videoPlaceholder: "Canvas Modes Demo"
    },
    {
      title: "Quick Links - Fast Access to Resources",
      icon: Link2,
      description: `Keep all your important links organized in one convenient location with categorized collections that sync across all your sessions.

Create custom categories like "Support Articles" or "VIP Resources", then add links with your preferred behavior: Copy to clipboard for quick sharing, or Open in new tab for immediate access.

Perfect for frequently used support documentation, internal resources, customer-facing articles, and bonus calculators you use daily.`,
      videoPlaceholder: "Quick Links Demo"
    },
    {
      title: "Hash Explorer - Blockchain Transaction Lookup",
      icon: Search,
      description: `Quickly lookup transaction details across more than 50 blockchain networks without switching between multiple block explorers.

Supported networks include Bitcoin (BTC), Ethereum and all ERC-20 tokens (ETH, USDT, USDC, DAI), Binance Smart Chain, Polygon, Solana, Tron, XRP, Litecoin, Dogecoin, and many more.

Simply paste the customer's transaction hash, click search, and view complete transaction details including status, amount, timestamp, and block explorer links instantly.`,
      videoPlaceholder: "Hash Explorer Demo"
    },
    {
      title: "Affiliate Bonus Finder",
      icon: Gift,
      description: `Access affiliate bonus information directly from your integrated Google Sheets database with real-time synchronization.

Search by Affiliate Name (required) or add Campaign ID for more specific results. Results display DB (Deposit Bonus) in yellow cards and WB (Wager Bonus) in blue cards for easy identification.

Use filter buttons to narrow results, select bonuses to compare side-by-side, and expand individual cards to view complete details including terms, conditions, and campaign specifics.`,
      videoPlaceholder: "Affiliate Bonus Finder Demo"
    },
    {
      title: "KYC & Slack Integration",
      icon: MessageSquare,
      description: `Manage customer KYC (Know Your Customer) inquiries directly through Slack integration with real-time status tracking and notifications via Socket.io.

Enter the customer's username, compose your KYC inquiry message, and send it instantly. Track all messages with status indicators: Pending (awaiting response), Completed (response received), or Failed (connection issue).

View complete thread history in the left panel, use filters to find specific statuses, search conversations by username, and click any thread to see the full conversation history. All communication is automatically logged and permanently searchable.`,
      videoPlaceholder: "KYC Slack Integration Demo"
    },
    {
      title: "You're All Set!",
      icon: CheckCircle,
      description: `Congratulations! You now know how to organize your work with Workspaces and Canvas, use Quick Links for fast resource access, lookup blockchain transactions with Hash Explorer, search affiliate bonuses efficiently, and manage KYC inquiries through Slack integration.

Best practices: Keep your workspaces organized with clear titles and structure, bookmark important canvas elements for quick access later, use Quick Links for frequently accessed resources, and switch between VIEW and EDIT modes as needed for different tasks.

Need help or have questions? Check the Public Workspace for company announcements and helpful guides, or reach out to your team lead anytime. Happy working!`,
      videoPlaceholder: "Quick Recap Montage"
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setCurrentSlide(0); // Reset to first slide
      onClose();
    }, 500); // Match animation duration
  };

  const handleContinue = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setCurrentSlide(0); // Reset to first slide
      onClose();
    }, 500);
  };

  const handleDontShowAgain = async () => {
    setIsClosing(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/tutorial-completed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimeout(() => {
        setIsClosing(false);
        onDontShowAgain();
      }, 500);
    } catch (error) {
      console.error('Error marking tutorial as completed:', error);
      // Still close the modal even if the API call fails
      setTimeout(() => {
        setIsClosing(false);
        onDontShowAgain();
      }, 500);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isClosing ? 'animate-out fade-out zoom-out-95 duration-500' : 'animate-in fade-in zoom-in-100 duration-500'}`}>
      {/* Blurred Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-xl transition-all duration-500 ${isClosing ? 'opacity-0 backdrop-blur-none' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Slide Number - Top Left */}
      <div className={`absolute top-8 left-8 z-10 text-xs font-medium text-white/60 tracking-wider transition-all duration-500 ${isClosing ? 'opacity-0 translate-y-4' : 'animate-in fade-in duration-500'}`}>
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Close Button - Top Right */}
      <button
        onClick={handleClose}
        className={`absolute top-8 right-8 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-110 hover:rotate-90 transition-all duration-300 ${isClosing ? 'opacity-0 scale-75 rotate-180' : 'animate-in fade-in zoom-in-50 delay-100'}`}
      >
        <X className="w-5 h-5 text-white" strokeWidth={2} />
      </button>

      {/* Slide Content - Centered */}
      <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <TutorialSlide
          key={currentSlide}
          title={slides[currentSlide].title}
          description={slides[currentSlide].description}
          videoPlaceholder={slides[currentSlide].videoPlaceholder}
          Icon={slides[currentSlide].icon}
        />
      </div>

      {/* Navigation Footer - Bottom */}
      <div className={`absolute bottom-6 left-0 right-0 grid grid-cols-3 items-center px-12 z-10 transition-all duration-500 ${isClosing ? 'opacity-0 translate-y-8' : 'animate-in fade-in slide-in-from-bottom duration-700 delay-200'}`}>
        {/* Previous Button - Left Column */}
        <div className="flex justify-start">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
              currentSlide === 0
                ? 'text-white/30 cursor-not-allowed'
                : 'text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-105 hover:-translate-x-1'
            }`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
            <span className="text-sm">Previous</span>
          </button>
        </div>

        {/* Dot Indicators - Center Column (Always centered) */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-in zoom-in-50 duration-500 delay-300">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-300 hover:scale-125 ${
                  index === currentSlide
                    ? 'w-8 h-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Next / Action Buttons - Right Column */}
        <div className="flex justify-end">
          {!isLastSlide ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-medium hover:bg-white/90 hover:scale-105 hover:translate-x-1 transition-all duration-300 shadow-lg shadow-white/20 group"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />
            </button>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
              <button
                onClick={handleDontShowAgain}
                className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 hover:scale-105 transition-all duration-300"
              >
                Don't show again
              </button>
              <button
                onClick={handleContinue}
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/20"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
