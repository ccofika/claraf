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
      description: `Clara is your all-in-one workspace for customer support operations. Organize work with Workspaces, use Canvas for notes, Quick Links for resources, Hash Explorer for transactions, Affiliate Bonus Finder, and KYC & Slack integration.`,
      videoPlaceholder: "Dashboard Overview",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489424/clara-tutorial/slide-1.mp4"
    },
    {
      title: "Dashboard & Workspaces",
      icon: LayoutDashboard,
      description: `Dashboard displays Public Workspace for announcements (read-only) and My Workspaces for private collections. Create unlimited workspaces to organize work by project, topic, or client type.`,
      videoPlaceholder: "Creating Workspaces Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489440/clara-tutorial/slide-2.mp4"
    },
    {
      title: "Canvas - Your Digital Workspace",
      icon: Palette,
      description: `Every workspace has an infinite canvas for notes and documentation. Choose from EDIT mode for organizing, VIEW for navigation, or POST-VIEW for presentations.`,
      videoPlaceholder: "Canvas Modes Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489470/clara-tutorial/slide-3.mp4"
    },
    {
      title: "Quick Links - Fast Access to Resources",
      icon: Link2,
      description: `Organize important links in categorized collections that sync across sessions. Links can copy to clipboard or open in new tab for quick access.`,
      videoPlaceholder: "Quick Links Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489475/clara-tutorial/slide-4.mp4"
    },
    {
      title: "Hash Explorer - Blockchain Transaction Lookup",
      icon: Search,
      description: `Search transactions across 50+ blockchain networks without switching explorers. Supported: Bitcoin, Ethereum & ERC-20 tokens, BSC, Polygon, Solana, Tron, XRP, and many more.`,
      videoPlaceholder: "Hash Explorer Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489478/clara-tutorial/slide-5.mp4"
    },
    {
      title: "Affiliate Bonus Finder",
      icon: Gift,
      description: `Search affiliate bonuses directly from Google Sheets with real-time sync. Results show DB (Deposit Bonus) in yellow and WB (Wager Bonus) in blue cards.`,
      videoPlaceholder: "Affiliate Bonus Finder Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489488/clara-tutorial/slide-6.mp4"
    },
    {
      title: "KYC & Slack Integration",
      icon: MessageSquare,
      description: `Send KYC inquiries directly through Slack with real-time status tracking. Track messages with status: Pending, Completed, or Failed.`,
      videoPlaceholder: "KYC Slack Integration Demo",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761489501/clara-tutorial/slide-7.mp4"
    },
    {
      title: "You're All Set!",
      icon: CheckCircle,
      description: `You now know how to use Workspaces, Canvas, Quick Links, Hash Explorer, Affiliate Bonus Finder, and KYC integration. Check Public Workspace for guides or reach out to your team lead for help.`,
      videoPlaceholder: "Quick Recap Montage",
      videoSrc: "https://res.cloudinary.com/dvohh9tan/video/upload/v1761490197/clara-tutorial/slide-8.mp4"
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
          videoSrc={slides[currentSlide].videoSrc}
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
