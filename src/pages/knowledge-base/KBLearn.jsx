import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import CategorySelector from '../../components/KnowledgeBase/learn/CategorySelector';
import QuizView from '../../components/KnowledgeBase/learn/QuizView';
import CompletedView from '../../components/KnowledgeBase/learn/CompletedView';
import LearnHistory from '../../components/KnowledgeBase/learn/LearnHistory';

const API_URL = process.env.REACT_APP_API_URL;
const STORAGE_KEY = 'kb_learn_session';

const KBLearn = () => {
  const [phase, setPhase] = useState('selecting'); // selecting | generating | quizzing | completed
  const [session, setSession] = useState(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // On mount: check localStorage for existing session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.questions && parsed.questions.length > 0) {
          // Check if session is already completed (currentIndex past all questions + wrongQueue)
          const totalQueue = parsed.questions.length + (parsed.wrongQueue?.length || 0);
          if (parsed.currentIndex >= totalQueue && totalQueue > 0) {
            // Already completed - show completed view
            setSession(parsed);
            setPhase('completed');
          } else {
            setSession(parsed);
            setPhase('quizzing');
          }
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Persist session changes to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const saveToHistory = useCallback(async (sessionData, status) => {
    try {
      const token = localStorage.getItem('token');
      const wrongQuestionIds = sessionData.questions
        .filter(q => {
          const answer = sessionData.answers[q.id];
          return answer && !answer.correct;
        })
        .map(q => q.id);

      const scorePercent = sessionData.totalOriginalQuestions > 0
        ? Math.round((sessionData.firstTryCorrect / sessionData.totalOriginalQuestions) * 100)
        : 0;

      await axios.post(
        `${API_URL}/api/knowledge-base/learn/history`,
        {
          quizId: sessionData.quizId,
          status,
          totalQuestions: sessionData.totalOriginalQuestions,
          firstTryCorrect: sessionData.firstTryCorrect,
          scorePercent,
          sourcePages: sessionData.sourcePages,
          userNote: sessionData.userNote || '',
          questions: sessionData.questions,
          wrongQuestionIds,
          startedAt: sessionData.startedAt
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoryRefresh(prev => prev + 1);
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, []);

  const handleStart = useCallback(async ({ pageIds, userNote }) => {
    setPhase('generating');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/knowledge-base/learn/generate-quiz`,
        { pageIds, userNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { quiz } = response.data;

      const newSession = {
        quizId: quiz.id,
        questions: quiz.questions,
        currentIndex: 0,
        answers: {},
        wrongQueue: [],
        selectedPageIds: pageIds,
        userNote,
        startedAt: new Date().toISOString(),
        sourcePages: quiz.sourcePages,
        firstTryCorrect: 0,
        totalOriginalQuestions: quiz.questions.length
      };

      setSession(newSession);
      setPhase('quizzing');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to generate quiz. Please try again.');
      setPhase('selecting');
    }
  }, []);

  const handleUpdateSession = useCallback((updater) => {
    setSession(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  const handleComplete = useCallback(() => {
    setPhase('completed');
    // Save completed quiz to history
    setSession(prev => {
      if (prev) saveToHistory(prev, 'completed');
      return prev;
    });
    localStorage.removeItem(STORAGE_KEY);
  }, [saveToHistory]);

  const handleQuit = useCallback(() => {
    if (session) {
      saveToHistory(session, 'abandoned');
    }
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setPhase('selecting');
  }, [session, saveToHistory]);

  const handleRestart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setPhase('selecting');
  }, []);

  return (
    <div className="w-full h-full">
      {phase === 'selecting' && (
        <>
          <CategorySelector onStart={handleStart} />
          <LearnHistory refreshKey={historyRefresh} />
        </>
      )}

      {phase === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 gap-4"
        >
          <Loader2 size={32} className="animate-spin text-gray-400 dark:text-neutral-500" />
          <div className="text-center">
            <p className="text-[15px] font-medium text-gray-900 dark:text-white mb-1">
              Generating your quiz...
            </p>
            <p className="text-[13px] text-gray-400 dark:text-neutral-500">
              AI is reading the selected pages and creating questions
            </p>
          </div>
        </motion.div>
      )}

      {phase === 'quizzing' && session && (
        <QuizView
          session={session}
          onUpdate={handleUpdateSession}
          onComplete={handleComplete}
          onQuit={handleQuit}
        />
      )}

      {phase === 'completed' && session && (
        <CompletedView
          session={session}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default KBLearn;
