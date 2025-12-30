/**
 * Page Quiz - ULTRA MODERNE v2.0 🚀
 * Design glassmorphism, animations fluides, timer circulaire, célébrations
 * Interface d'évaluation optimisée pour l'engagement
 */

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../../hooks/useAuth';

// Services
import { apiService } from '../../services/api';

// Types
interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correct: number | boolean;
  points: number;
  explanation: string;
}

interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
}

interface QuizResult {
  score: number;
  totalScore: number;
  percentage: number;
  passed: boolean;
  claudinePointsEarned: number;
  feedback: string;
  corrections: Array<{
    questionId: number;
    correct: boolean;
    explanation: string;
  }>;
}

// Animation variants
const questionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

export default function QuizPage() {
  const router = useRouter();
  const { lessonId } = router.query;
  const { user, isLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [startTime] = useState(Date.now());

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger le quiz
  useEffect(() => {
    if (lessonId && user) {
      fetchQuiz();
    }
  }, [lessonId, user]);

  // Timer
  useEffect(() => {
    if (!showResults && quiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults, quiz]);

  const fetchQuiz = async () => {
    try {
      const response = await apiService.getQuizById(lessonId as string);

      if (response.success && response.data) {
        const quizData = response.data;

        if (quizData.subject?.id) {
          setSubjectId(quizData.subject.id);
        }

        setQuiz({
          id: quizData.id,
          lessonId: quizData.id,
          title: quizData.title,
          questions: quizData.quiz?.questions || [],
          totalPoints: quizData.quiz?.totalPoints || 100,
          passingScore: quizData.quiz?.passingScore || 60
        });
      } else {
        toast.error('Quiz non trouvé');
        router.back();
      }
      setIsLoadingData(false);
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      toast.error('Erreur lors du chargement du quiz');
      setIsLoadingData(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setDirection(1);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !subjectId) {
      toast.error('Données du quiz incomplètes');
      return;
    }

    const unansweredQuestions = quiz.questions.filter(q => !(q.id in answers));
    if (unansweredQuestions.length > 0) {
      toast.error(`Veuillez répondre à toutes les questions (${unansweredQuestions.length} restantes)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await apiService.submitQuiz(
        subjectId,
        lessonId as string,
        answers,
        timeSpent
      );

      if (response.success && response.data) {
        setResult(response.data);
        setShowResults(true);
        toast.success(response.data.passed ? 'Félicitations ! Quiz réussi ! 🎉' : 'Quiz terminé ! Continuez vos efforts ! 💪');
      } else {
        toast.error(response.message || 'Erreur lors de la soumission du quiz');
      }
    } catch (error: any) {
      console.error('Erreur soumission quiz:', error);
      toast.error(error.message || 'Erreur lors de la soumission du quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimerColor = () => {
    if (timeRemaining > 300) return 'from-green-400 to-green-600';
    if (timeRemaining > 120) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const progressPercentage = useMemo(() => {
    if (!quiz) return 0;
    return ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  }, [currentQuestionIndex, quiz]);

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  // Loading initial
  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Quiz non trouvé
  if (!quiz) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">
            Quiz non trouvé
          </h1>
          <p className="text-neutral-600 mb-6">
            Le quiz demandé n'existe pas ou n'est plus disponible.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-primary-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </Layout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <>
      <Head>
        <title>{quiz.title} | Claudyne</title>
        <meta name="description" content={`Quiz interactif - ${quiz.title}`} />
      </Head>

      <Layout>
        <div className="max-w-5xl mx-auto">
          {!showResults ? (
            /* 🎯 INTERFACE DU QUIZ */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 🎨 HEADER GLASSMORPHISM avec Timer Circulaire */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1">
                <div className="relative bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-pink-500/95 backdrop-blur-xl rounded-3xl p-8">
                  {/* Animated background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Title & Progress */}
                      <div className="flex-1 text-center md:text-left">
                        <motion.h1
                          className="text-3xl md:text-4xl font-bold text-white mb-3"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          🧠 {quiz.title}
                        </motion.h1>
                        <motion.p
                          className="text-lg text-white/90 mb-4"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          Question {currentQuestionIndex + 1} sur {quiz.questions.length} • {answeredCount}/{quiz.questions.length} répondues
                        </motion.p>

                        {/* Progress bar */}
                        <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-white to-yellow-300 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                          </motion.div>
                        </div>
                      </div>

                      {/* Circular Timer */}
                      <motion.div
                        className="relative"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      >
                        <div className="relative w-32 h-32">
                          {/* Background circle */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="white"
                              strokeWidth="8"
                              fill="none"
                              opacity="0.2"
                            />
                            <motion.circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="url(#timer-gradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 56}`}
                              strokeDashoffset={`${2 * Math.PI * 56 * (1 - timeRemaining / 600)}`}
                              style={{ transition: 'stroke-dashoffset 1s linear' }}
                            />
                            <defs>
                              <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="white" />
                                <stop offset="100%" stopColor="#fef08a" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Time text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-3xl font-bold text-white">
                              {formatTime(timeRemaining)}
                            </div>
                            <div className="text-xs text-white/80">
                              {timeRemaining < 60 ? 'Dépêchez-vous!' : 'Temps restant'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📝 QUESTION CARD */}
              <div className="glassmorphism rounded-2xl overflow-hidden border border-white/30">
                <div className="p-8">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentQuestionIndex}
                      custom={direction}
                      variants={questionVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-4 mb-8">
                        <motion.div
                          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-green to-accent-purple flex items-center justify-center text-white text-lg font-bold shadow-lg"
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          {currentQuestionIndex + 1}
                        </motion.div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-neutral-800 mb-3">
                            {currentQuestion.question}
                          </h2>
                          <div className="flex gap-3 text-sm">
                            <span className="px-3 py-1 bg-primary-green/10 text-primary-green rounded-full font-medium">
                              {currentQuestion.points} points
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                              {currentQuestion.type === 'multiple_choice' ? '📋 Choix multiple' : '✓✗ Vrai/Faux'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Options de réponse */}
                      <div className="space-y-4">
                        {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => {
                          const isSelected = answers[currentQuestion.id] === index;
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                              className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all border-2 ${
                                isSelected
                                  ? 'border-primary-green bg-gradient-to-r from-green-50 to-green-100 shadow-lg'
                                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                              }`}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="selected-bg"
                                  className="absolute inset-0 bg-gradient-to-r from-primary-green/5 to-accent-purple/5"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                />
                              )}

                              <div className="relative flex items-center gap-4">
                                <motion.div
                                  className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${
                                    isSelected
                                      ? 'border-primary-green bg-primary-green text-white shadow-lg'
                                      : 'border-neutral-300 text-neutral-400'
                                  }`}
                                  whileHover={{ rotate: 180 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {isSelected ? '✓' : String.fromCharCode(65 + index)}
                                </motion.div>
                                <span className={`font-medium text-lg ${
                                  isSelected ? 'text-primary-green' : 'text-neutral-700'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}

                        {currentQuestion.type === 'true_false' && (
                          <div className="grid md:grid-cols-2 gap-6">
                            {[
                              { label: 'Vrai', value: true, icon: '✓', gradient: 'from-green-400 to-green-600' },
                              { label: 'Faux', value: false, icon: '✗', gradient: 'from-red-400 to-red-600' }
                            ].map((option) => {
                              const isSelected = answers[currentQuestion.id] === option.value;
                              return (
                                <motion.div
                                  key={option.label}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.05, y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                                  className={`relative overflow-hidden rounded-2xl p-8 cursor-pointer text-center border-2 transition-all ${
                                    isSelected
                                      ? 'border-transparent shadow-2xl'
                                      : 'border-neutral-200 bg-white hover:shadow-lg'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.div
                                      layoutId="true-false-bg"
                                      className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-90`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 0.9 }}
                                    />
                                  )}

                                  <div className="relative">
                                    <motion.div
                                      className={`text-6xl mb-3 ${
                                        isSelected ? 'text-white' : 'text-neutral-300'
                                      }`}
                                      animate={isSelected ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                                      transition={{ duration: 0.5 }}
                                    >
                                      {option.icon}
                                    </motion.div>
                                    <span className={`text-2xl font-bold ${
                                      isSelected ? 'text-white' : 'text-neutral-700'
                                    }`}>
                                      {option.label}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 🎮 NAVIGATION */}
                <div className="px-8 py-6 bg-white/50 backdrop-blur-sm border-t border-neutral-200/50">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Previous button */}
                    <motion.button
                      whileHover={{ scale: 1.05, x: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 rounded-xl font-medium text-neutral-700 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ← Précédent
                    </motion.button>

                    {/* Question dots */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      {quiz.questions.map((_, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setDirection(index > currentQuestionIndex ? 1 : -1);
                            setCurrentQuestionIndex(index);
                          }}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                            index === currentQuestionIndex
                              ? 'bg-gradient-to-br from-primary-green to-accent-purple text-white shadow-lg scale-110'
                              : answers[quiz.questions[index].id] !== undefined
                              ? 'bg-green-100 text-green-700 border-2 border-green-300'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {index + 1}
                        </motion.button>
                      ))}
                    </div>

                    {/* Next/Submit button */}
                    {currentQuestionIndex === quiz.questions.length - 1 ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-claudine-gold to-yellow-500 text-white font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Soumission...
                          </>
                        ) : (
                          <>
                            <span>Terminer le quiz</span>
                            <span className="text-xl">🎯</span>
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNextQuestion}
                        className="px-6 py-3 rounded-xl font-medium text-primary-green hover:bg-green-50 transition-all"
                      >
                        Suivant →
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 🎉 RÉSULTATS DU QUIZ */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="space-y-6"
            >
              {/* 🏆 HEADER RÉSULTATS avec Célébration */}
              <div className={`relative overflow-hidden rounded-3xl p-1 ${
                result?.passed
                  ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-600'
              }`}>
                <div className={`relative rounded-3xl p-12 text-center ${
                  result?.passed
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'bg-gradient-to-br from-yellow-50 to-orange-50'
                }`}>
                  {/* Confetti animation */}
                  {result?.passed && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: '-10%',
                            backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i % 4]
                          }}
                          animate={{
                            y: ['0vh', '110vh'],
                            x: [0, (Math.random() - 0.5) * 200],
                            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            delay: i * 0.1,
                            repeat: Infinity
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="text-8xl mb-6"
                  >
                    {result?.passed ? '🎉' : '💪'}
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-5xl font-bold mb-4 text-neutral-800"
                  >
                    {result?.passed ? 'Félicitations !' : 'Bon effort !'}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-neutral-600 mb-6 max-w-2xl mx-auto"
                  >
                    {result?.feedback}
                  </motion.p>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 150, delay: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-center gap-8"
                  >
                    {/* Score */}
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor(result?.percentage || 0)}`}>
                        {result?.score}/{result?.totalScore}
                      </div>
                      <div className="text-neutral-600 font-medium">
                        Score obtenu
                      </div>
                    </div>

                    {/* Percentage */}
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getScoreColor(result?.percentage || 0)}`}>
                        {result?.percentage}%
                      </div>
                      <div className="text-neutral-600 font-medium">
                        Pourcentage
                      </div>
                    </div>

                    {/* Points Claudine */}
                    <div className="text-center">
                      <div className="text-6xl font-bold mb-2 text-claudine-gold">
                        +{result?.claudinePointsEarned}
                      </div>
                      <div className="text-neutral-600 font-medium">
                        Points Claudine 🏆
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* 📝 CORRECTIONS DÉTAILLÉES */}
              <div className="glassmorphism rounded-2xl p-8 border border-white/30">
                <h2 className="text-3xl font-bold text-neutral-800 mb-8 flex items-center gap-3">
                  <span className="text-4xl">📝</span>
                  Corrections détaillées
                </h2>

                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-green via-accent-purple to-transparent hidden md:block" />

                  <div className="space-y-6">
                    {result?.corrections.map((correction, index) => {
                      const question = quiz.questions.find(q => q.id === correction.questionId);
                      if (!question) return null;

                      return (
                        <motion.div
                          key={correction.questionId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative md:pl-16"
                        >
                          {/* Timeline dot */}
                          <motion.div
                            className={`absolute left-3 top-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hidden md:flex ${
                              correction.correct ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                            }`}
                            whileHover={{ scale: 1.3, rotate: 360 }}
                            transition={{ duration: 0.3 }}
                          >
                            {correction.correct ? '✓' : '✗'}
                          </motion.div>

                          <motion.div
                            className={`glassmorphism rounded-2xl p-6 border-2 transition-all ${
                              correction.correct
                                ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                                : 'border-red-200 bg-gradient-to-br from-red-50/50 to-rose-50/50'
                            }`}
                            whileHover={{ scale: 1.02, y: -2 }}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg md:hidden ${
                                correction.correct ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                              }`}>
                                {correction.correct ? '✓' : '✗'}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-neutral-800 text-lg mb-2">
                                  Question {index + 1}: {question.question}
                                </h3>
                                <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold mb-3 ${
                                  correction.correct
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {correction.correct ? '✓ Correct' : '✗ Incorrect'}
                                </div>
                                <div className="bg-white/60 rounded-xl p-4 border border-neutral-200">
                                  <p className="text-neutral-700 leading-relaxed">
                                    💡 <strong>Explication:</strong> {correction.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 🎮 ACTIONS FINALES */}
                <div className="mt-10 pt-8 border-t border-neutral-200/50">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.back()}
                      className="px-8 py-4 rounded-xl bg-neutral-500 text-white font-bold shadow-lg hover:shadow-xl hover:bg-neutral-600 transition-all"
                    >
                      ← Retour à la leçon
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowResults(false);
                        setCurrentQuestionIndex(0);
                        setAnswers({});
                        setResult(null);
                        setTimeRemaining(600);
                      }}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-green to-accent-purple text-white font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      🔄 Refaire le quiz
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Layout>
    </>
  );
}
