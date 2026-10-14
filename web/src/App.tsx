import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewQuestion = lazy(() => import('./pages/NewQuestion'))
const QuestionList = lazy(() => import('./pages/QuestionList'))
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'))
const EditQuestion = lazy(() => import('./pages/EditQuestion'))
const BulkImport = lazy(() => import('./pages/BulkImport'))
const Review = lazy(() => import('./pages/Review'))
const ReviewHistory = lazy(() => import('./pages/ReviewHistory'))
const ReviewBySubject = lazy(() => import('./pages/ReviewBySubject'))
const ReviewWrong = lazy(() => import('./pages/ReviewWrong'))
const Stats = lazy(() => import('./pages/Stats'))
const Subjects = lazy(() => import('./pages/Subjects'))
const Notebooks = lazy(() => import('./pages/Notebooks'))
const NotebookDetail = lazy(() => import('./pages/NotebookDetail'))
const Theory = lazy(() => import('./pages/Theory'))
const TheoryDetail = lazy(() => import('./pages/TheoryDetail'))
const TheoryNew = lazy(() => import('./pages/TheoryNew'))
const TheoryEdit = lazy(() => import('./pages/TheoryEdit'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const ExamsPage = lazy(() => import('./pages/Exams'))
const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap'))
const ExamAnalysisList = lazy(() => import('./pages/ExamAnalysisList'))
const ExamAnalysisNew = lazy(() => import('./pages/ExamAnalysisNew'))
const ExamAnalysisDetail = lazy(() => import('./pages/ExamAnalysisDetail'))
const ExamAnalysisEdit = lazy(() => import('./pages/ExamAnalysisEdit'))
const PhrasalVerbs = lazy(() => import('./pages/PhrasalVerbs'))
const PhrasalStudy = lazy(() => import('./pages/PhrasalStudy'))
const PhrasalQuiz = lazy(() => import('./pages/PhrasalQuiz'))
const Accentuation = lazy(() => import('./pages/Accentuation'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Suspense fallback={<div className="p-8">Carregando…</div>}>
          <Routes location={location}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/questions/new" element={<NewQuestion />} />
              <Route path="/questions" element={<QuestionList />} />
              <Route path="/questions/:id" element={<QuestionDetail />} />
              <Route path="/questions/:id/edit" element={<EditQuestion />} />
              <Route path="/questions/import" element={<BulkImport />} />
              <Route path="/review" element={<Review />} />
              <Route path="/review/history" element={<ReviewHistory />} />
              <Route path="/review/subject" element={<ReviewBySubject />} />
              <Route path="/review/wrong" element={<ReviewWrong />} />
              <Route path="/notebooks" element={<Notebooks />} />
              <Route path="/notebooks/:id" element={<NotebookDetail />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/theory" element={<Theory />} />
              <Route path="/theory/new" element={<TheoryNew />} />
              <Route path="/theory/:id" element={<TheoryDetail />} />
              <Route path="/theory/:id/edit" element={<TheoryEdit />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/map" element={<KnowledgeMap />} />
              <Route path="/exam-analyses" element={<ExamAnalysisList />} />
              <Route path="/exam-analyses/new" element={<ExamAnalysisNew />} />
              <Route path="/exam-analyses/:id" element={<ExamAnalysisDetail />} />
              <Route path="/exam-analyses/:id/edit" element={<ExamAnalysisEdit />} />
              <Route path="/phrasal-verbs" element={<PhrasalVerbs />} />
              <Route path="/phrasal-verbs/study" element={<PhrasalStudy />} />
              <Route path="/phrasal-verbs/quiz" element={<PhrasalQuiz />} />
              <Route path="/accentuation" element={<Accentuation />} />
              <Route path="*" element={<div className="p-8 text-center">Página não encontrada – <a href="/">voltar</a></div>} />
            </Route>
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
