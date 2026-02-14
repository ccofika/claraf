import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, ArrowRight, BookOpen, RotateCcw,
  ChevronRight, AlertCircle, X
} from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

const DifficultyBadge = ({ difficulty }) => {
  const styles = {
    easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  };

  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${styles[difficulty] || styles.medium}`}>
      {difficulty}
    </span>
  );
};

const QuizView = ({ session, onUpdate, onComplete, onQuit }) => {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Build the full question queue: original questions + wrongQueue
  const questionQueue = useMemo(() => {
    return [...session.questions, ...session.wrongQueue];
  }, [session.questions, session.wrongQueue]);

  const currentQuestion = questionQueue[session.currentIndex] || null;
  const isRetry = session.currentIndex >= session.questions.length;

  // Total to answer = original questions + current wrong queue length
  const totalToAnswer = questionQueue.length;
  const progressPercent = totalToAnswer > 0
    ? Math.round((session.currentIndex / totalToAnswer) * 100)
    : 0;

  // How many original questions have been answered
  const answeredCount = Object.keys(session.answers).length;

  const handleSelectAnswer = useCallback((choiceId) => {
    if (answered) return;

    setSelectedAnswer(choiceId);
    setAnswered(true);

    const isCorrect = choiceId === currentQuestion.correctAnswer;

    onUpdate(prev => {
      const newAnswers = {
        ...prev.answers,
        [currentQuestion.id]: { selectedId: choiceId, correct: isCorrect }
      };

      let newWrongQueue = [...prev.wrongQueue];
      let newFirstTryCorrect = prev.firstTryCorrect;

      if (!isCorrect) {
        // Add to wrong queue if not already there (for retry)
        const alreadyInQueue = newWrongQueue.some(q => q.id === currentQuestion.id);
        if (!alreadyInQueue) {
          newWrongQueue.push(currentQuestion);
        }
      } else {
        // If correct on first try (not in retry phase), count it
        if (prev.currentIndex < prev.questions.length) {
          newFirstTryCorrect += 1;
        }
        // If correct on retry, remove from wrong queue
        if (prev.currentIndex >= prev.questions.length) {
          newWrongQueue = newWrongQueue.filter(q => q.id !== currentQuestion.id);
        }
      }

      return {
        ...prev,
        answers: newAnswers,
        wrongQueue: newWrongQueue,
        firstTryCorrect: newFirstTryCorrect
      };
    });
  }, [answered, currentQuestion, onUpdate]);

  const handleNext = useCallback(() => {
    const nextIndex = session.currentIndex + 1;

    // Check if quiz is complete
    onUpdate(prev => {
      const updatedQueue = [...prev.questions, ...prev.wrongQueue];
      if (nextIndex >= updatedQueue.length) {
        setTimeout(() => onComplete(), 0);
        return prev;
      }
      return { ...prev, currentIndex: nextIndex };
    });

    setSelectedAnswer(null);
    setAnswered(false);
  }, [session.currentIndex, onUpdate, onComplete]);

  const handleLearnMore = useCallback((sectionRef) => {
    localStorage.setItem('kb_learn_return', 'true');
    const hash = sectionRef.headingId ? `#${sectionRef.headingId}` : '';
    navigate(`/knowledge-base/${sectionRef.pageSlug}${hash}`);
  }, [navigate]);

  if (!currentQuestion) {
    // Edge case: session loaded but index is out of bounds — trigger complete
    if (session.questions.length > 0) {
      setTimeout(() => onComplete(), 0);
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 dark:border-white border-t-transparent dark:border-t-transparent" />
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto px-8 pt-12 pb-12">
      {/* Top bar with quit */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-[13px] text-gray-500 dark:text-neutral-400">
          {session.sourcePages?.map(p => p.title).join(', ')}
        </div>
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium
            text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400
            hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <X size={14} />
          Quit Quiz
        </button>
      </div>

      {/* Quit Confirmation Modal */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowQuitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700
                rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            >
              <h3 className="text-[16px] font-semibold text-gray-900 dark:text-white mb-2">
                Quit this quiz?
              </h3>
              <p className="text-[14px] text-gray-500 dark:text-neutral-400 mb-1">
                You've answered {answeredCount} of {session.totalOriginalQuestions} questions.
              </p>
              <p className="text-[13px] text-gray-400 dark:text-neutral-500 mb-6">
                Your progress will be saved to history.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-[14px] font-medium
                    bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700
                    text-gray-700 dark:text-neutral-200 rounded-lg transition-colors"
                >
                  Continue Quiz
                </button>
                <button
                  onClick={() => { setShowQuitConfirm(false); onQuit(); }}
                  className="flex-1 px-4 py-2.5 text-[14px] font-medium
                    bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Quit & Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-gray-500 dark:text-neutral-400">
            Question {session.currentIndex + 1} of {totalToAnswer}
            {isRetry && (
              <span className="ml-2 text-orange-500 dark:text-orange-400">
                <RotateCcw size={12} className="inline mr-1" />
                Retry
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <span className="text-[12px] text-gray-400 dark:text-neutral-500">
              {progressPercent}%
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id + '-' + session.currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Question Text */}
          <h2 className="text-[20px] font-semibold text-gray-900 dark:text-white leading-relaxed mb-6">
            {currentQuestion.question}
          </h2>

          {/* Answer Choices */}
          <div className="space-y-3 mb-6">
            {currentQuestion.choices.map((choice, idx) => {
              const isSelected = selectedAnswer === choice.id;
              const isCorrectChoice = choice.id === currentQuestion.correctAnswer;

              let cardStyle = 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50/50 dark:hover:bg-neutral-800/30';

              if (answered) {
                if (isCorrectChoice) {
                  cardStyle = 'border-green-500 dark:border-green-500 bg-green-50/80 dark:bg-green-900/20';
                } else if (isSelected && !isCorrect) {
                  cardStyle = 'border-red-500 dark:border-red-500 bg-red-50/80 dark:bg-red-900/20';
                } else {
                  cardStyle = 'border-gray-100 dark:border-neutral-800 opacity-50';
                }
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelectAnswer(choice.id)}
                  disabled={answered}
                  className={`w-full text-left flex items-start gap-3.5 p-4 rounded-xl border-2 transition-all ${cardStyle}
                    ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Letter Circle */}
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold
                    ${answered && isCorrectChoice
                      ? 'bg-green-500 text-white'
                      : answered && isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300'
                    }`}
                  >
                    {answered && isCorrectChoice ? (
                      <CheckCircle2 size={16} />
                    ) : answered && isSelected && !isCorrect ? (
                      <XCircle size={16} />
                    ) : (
                      LETTERS[idx]
                    )}
                  </span>

                  {/* Choice Text */}
                  <span className={`text-[14px] leading-relaxed pt-1 ${
                    answered && isCorrectChoice
                      ? 'text-green-800 dark:text-green-200 font-medium'
                      : answered && isSelected && !isCorrect
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-gray-700 dark:text-neutral-200'
                  }`}>
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback Area */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {/* Explanation */}
                <div className={`p-4 rounded-xl mb-4 ${
                  isCorrect
                    ? 'bg-green-50/80 dark:bg-green-900/15 border border-green-200 dark:border-green-800/30'
                    : 'bg-red-50/80 dark:bg-red-900/15 border border-red-200 dark:border-red-800/30'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-[14px] font-medium mb-1 ${
                        isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                        {!isCorrect && ' - This question will appear again later.'}
                      </p>
                      <p className={`text-[13px] ${
                        isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Learn More */}
                  {currentQuestion.sectionRef?.pageSlug && (
                    <button
                      onClick={() => handleLearnMore(currentQuestion.sectionRef)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium
                        text-gray-600 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-800
                        hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <BookOpen size={14} />
                      Read in KB
                      <ChevronRight size={12} />
                    </button>
                  )}

                  {/* Next */}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold
                      bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
                      text-white dark:text-gray-900 rounded-lg transition-colors ml-auto"
                  >
                    Next
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizView;
