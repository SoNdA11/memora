import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewQuestion from './pages/NewQuestion'
import QuestionList from './pages/QuestionList'
import QuestionDetail from './pages/QuestionDetail'
import EditQuestion from './pages/EditQuestion'
import BulkImport from './pages/BulkImport'
import Review from './pages/Review'
import ReviewHistory from './pages/ReviewHistory'
import ReviewBySubject from './pages/ReviewBySubject'
import ReviewWrong from './pages/ReviewWrong'
import Stats from './pages/Stats'
import Subjects from './pages/Subjects'
import Notebooks from './pages/Notebooks'
import NotebookDetail from './pages/NotebookDetail'
import Theory from './pages/Theory'
import TheoryDetail from './pages/TheoryDetail'
import TheoryNew from './pages/TheoryNew'
import TheoryEdit from './pages/TheoryEdit'
import CalendarPage from './pages/Calendar'
import ExamsPage from './pages/Exams'
import KnowledgeMap from './pages/KnowledgeMap'
import ExamAnalysisList from './pages/ExamAnalysisList'
import ExamAnalysisNew from './pages/ExamAnalysisNew'
import ExamAnalysisDetail from './pages/ExamAnalysisDetail'
import ExamAnalysisEdit from './pages/ExamAnalysisEdit'
import PhrasalVerbs from './pages/PhrasalVerbs'
import PhrasalStudy from './pages/PhrasalStudy'
import PhrasalQuiz from './pages/PhrasalQuiz'
import Accentuation from './pages/Accentuation'

const queryClient = new QueryClient()

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
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
