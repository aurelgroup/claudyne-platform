/**
 * Page de quiz interactif pour une leçon
 * Interface d'évaluation avec questions à choix multiples et vrais/faux
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../../hooks/useAuth';

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

export default function QuizPage() {
  const router = useRouter();
  const { lessonId } = router.query;
  const { user, isLoading } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [isLoadingData, setIsLoadingData] = useState(true);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lessons/${lessonId}/quiz`);
      const data = await response.json();
      
      if (data.success) {
        setQuiz(data.data.quiz);
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
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    // Vérifier que toutes les questions ont une réponse
    const unansweredQuestions = quiz.questions.filter(q => !(q.id in answers));
    if (unansweredQuestions.length > 0) {
      toast.error(`Veuillez répondre à toutes les questions (${unansweredQuestions.length} restantes)`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setShowResults(true);
        toast.success(data.data.passed ? 'Félicitations ! Quiz réussi ! 🎉' : 'Quiz terminé ! Continuez vos efforts ! 💪');
      } else {
        toast.error('Erreur lors de la soumission du quiz');
      }
    } catch (error) {
      console.error('Erreur soumission quiz:', error);
      toast.error('Erreur lors de la soumission du quiz');
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
        <div className="max-w-4xl mx-auto">
          {!showResults ? (
            /* Interface du quiz */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* En-tête du quiz */}
              <div className="bg-gradient-to-r from-primary-green to-accent-purple text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
                    <p className="opacity-90">
                      Question {currentQuestionIndex + 1} sur {quiz.questions.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm opacity-90">
                      Temps restant
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                      className="bg-white h-2 rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Question actuelle */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Question */}
                    <div className="mb-8">
                      <div className="flex items-start mb-4">
                        <span className="bg-primary-green text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">
                          {currentQuestionIndex + 1}
                        </span>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                            {currentQuestion.question}
                          </h2>
                          <div className="text-sm text-neutral-500">
                            {currentQuestion.points} points • {currentQuestion.type === 'multiple_choice' ? 'Choix multiple' : 'Vrai/Faux'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Options de réponse */}
                    <div className="space-y-3 mb-8">
                      {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            answers[currentQuestion.id] === index
                              ? 'border-primary-green bg-green-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                              answers[currentQuestion.id] === index
                                ? 'border-primary-green bg-primary-green text-white'
                                : 'border-neutral-300'
                            }`}>
                              {answers[currentQuestion.id] === index && (
                                <span className="text-sm">✓</span>
                              )}
                            </div>
                            <span className={`font-medium ${
                              answers[currentQuestion.id] === index
                                ? 'text-primary-green'
                                : 'text-neutral-700'
                            }`}>
                              {option}
                            </span>
                          </div>
                        </motion.div>
                      ))}

                      {currentQuestion.type === 'true_false' && (
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'Vrai', value: true, color: 'green' },
                            { label: 'Faux', value: false, color: 'red' }
                          ].map((option) => (
                            <motion.div
                              key={option.label}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleAnswerSelect(currentQuestion.id, option.value)}
                              className={`p-6 rounded-lg border-2 cursor-pointer transition-all text-center ${
                                answers[currentQuestion.id] === option.value
                                  ? `border-${option.color}-500 bg-${option.color}-50`
                                  : 'border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <div className={`text-2xl mb-2 ${
                                answers[currentQuestion.id] === option.value
                                  ? `text-${option.color}-600`
                                  : 'text-neutral-400'
                              }`}>
                                {option.value ? '✓' : '✗'}
                              </div>
                              <span className={`font-medium ${
                                answers[currentQuestion.id] === option.value
                                  ? `text-${option.color}-600`
                                  : 'text-neutral-700'
                              }`}>
                                {option.label}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="px-8 py-6 bg-neutral-50 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 text-neutral-600 hover:text-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Précédent
                  </button>

                  <div className="flex gap-2">
                    {quiz.questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          index === currentQuestionIndex
                            ? 'bg-primary-green text-white'
                            : answers[quiz.questions[index].id] !== undefined
                            ? 'bg-green-100 text-green-600'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting}
                      className="bg-claudine-gold text-white px-6 py-2 rounded-lg hover:bg-yellow-500 disabled:opacity-50 transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Soumission...
                        </>
                      ) : (
                        'Terminer le quiz'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2 text-primary-green hover:text-green-600 transition-colors"
                    >
                      Suivant →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Résultats du quiz */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* En-tête des résultats */}
              <div className={`p-8 text-center ${
                result?.passed ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="text-6xl mb-4">
                  {result?.passed ? '🎉' : '💪'}
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  {result?.passed ? 'Félicitations !' : 'Bon effort !'}
                </h1>
                <p className="text-neutral-600 mb-4">
                  {result?.feedback}
                </p>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(result?.percentage || 0)}`}>
                  {result?.score}/{result?.totalScore}
                </div>
                <div className="text-neutral-500">
                  {result?.percentage}% • {result?.claudinePointsEarned} points Claudine gagnés
                </div>
              </div>

              {/* Corrections détaillées */}
              <div className="p-8">
                <h2 className="text-xl font-semibold text-neutral-800 mb-6">
                  📝 Corrections détaillées
                </h2>
                <div className="space-y-6">
                  {result?.corrections.map((correction, index) => {
                    const question = quiz.questions.find(q => q.id === correction.questionId);
                    if (!question) return null;

                    return (
                      <div key={correction.questionId} className="border border-neutral-200 rounded-lg p-6">
                        <div className="flex items-start mb-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 ${
                            correction.correct ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {correction.correct ? '✓' : '✗'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-800 mb-2">
                              Question {index + 1}: {question.question}
                            </h3>
                            <div className={`text-sm font-medium mb-2 ${
                              correction.correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {correction.correct ? 'Correct' : 'Incorrect'}
                            </div>
                            <p className="text-neutral-600 text-sm">
                              {correction.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions finales */}
                <div className="mt-8 pt-6 border-t border-neutral-200 text-center space-y-4">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => router.back()}
                      className="bg-neutral-500 text-white px-6 py-3 rounded-lg hover:bg-neutral-600 transition-colors"
                    >
                      Retour à la leçon
                    </button>
                    <button
                      onClick={() => {
                        setShowResults(false);
                        setCurrentQuestionIndex(0);
                        setAnswers({});
                        setResult(null);
                        setTimeRemaining(600);
                      }}
                      className="bg-primary-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Refaire le quiz
                    </button>
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