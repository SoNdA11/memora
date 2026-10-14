import axios from 'axios'
import type {
  Question,
  QuestionListResponse,
  Subject,
  Review,
  ReviewStats,
  DetailedStats,
  Alternative,
  BulkImportItem,
  Notebook,
  TheoryEntry,
  Annotation,
  ReviewLogListResponse,
  CalendarDay,
  HeatmapDay,
  ExamDate,
  ExamAnalysis,
  KnowledgeGraph,
  EditalTopicGroup,
  PhrasalVerbListResponse,
  PhrasalVerb,
  PhrasalReview,
  PhrasalStats,
  AnkiRating,
} from '../types'

function resolveBaseURL(): string {
  const v = import.meta.env.VITE_API_URL
  if (typeof v === 'string' && v.trim() !== '') return v
  if (v === '') return ''
  return 'http://localhost:8080'
}

const api = axios.create({
  // '' (string vazia) = mesma origem, usa o proxy /api/ do nginx em prod.
  // undefined (dev sem VITE_API_URL) = fallback para a API local.
  baseURL: resolveBaseURL(),
  timeout: 15000,
})

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.code === 'ECONNABORTED') console.warn('API timeout')
    return Promise.reject(e)
  }
)

export async function fetchSubjects(): Promise<Subject[]> {
  const { data } = await api.get('/api/subjects')
  return data
}

export async function createSubject(name: string, color: string): Promise<Subject> {
  const { data } = await api.post('/api/subjects', { name, color })
  return data
}

export async function deleteSubject(id: number): Promise<void> {
  await api.delete(`/api/subjects/${id}`)
}

export async function fetchQuestions(params: {
  search?: string
  subject_id?: string
  topic?: string
  source?: string
  tag?: string
  favorite?: string
  wrong_review?: string
  notebook_id?: string
  page?: number
  limit?: number
}): Promise<QuestionListResponse> {
  const { data } = await api.get('/api/questions', { params })
  return data
}

export async function fetchQuestion(id: number): Promise<{ question: Question; review: Review }> {
  const { data } = await api.get(`/api/questions/${id}`)
  return data
}

export async function createQuestion(input: {
  subject_id: number
  topic: string
  text: string
  alternatives: Alternative[]
  correct_answer: string
  question_type?: string
  explanation: string
  source: string
  tags: string[]
  notebook_ids?: number[]
}): Promise<Question> {
  const { data } = await api.post('/api/questions', input)
  return data
}

export async function bulkImport(items: BulkImportItem[]): Promise<{ message: string; total_criadas: number }> {
  const { data } = await api.post('/api/questions/bulk', items)
  return data
}

export async function updateQuestion(id: number, input: Partial<{
  subject_id: number
  topic: string
  text: string
  alternatives: Alternative[]
  correct_answer: string
  question_type?: string
  explanation: string
  source: string
  tags: string[]
  notebook_ids?: number[]
}>): Promise<Question> {
  const { data } = await api.put(`/api/questions/${id}`, input)
  return data
}

export async function deleteQuestion(id: number): Promise<void> {
  await api.delete(`/api/questions/${id}`)
}

export async function toggleFavorite(id: number): Promise<{ favorite: boolean }> {
  const { data } = await api.post(`/api/questions/${id}/favorite`)
  return data
}

export async function fetchReviewLogs(params: {
  subject_id?: string
  correct?: string
  page?: number
  limit?: number
}): Promise<ReviewLogListResponse> {
  const { data } = await api.get('/api/reviews/logs', { params })
  return data
}

export async function fetchTodayReviews(kind?: 'question' | 'flashcard'): Promise<Review[]> {
  const { data } = await api.get('/api/reviews/today', { params: kind ? { kind } : undefined })
  return data
}

export async function submitReview(
  id: number,
  input: { correct: boolean; selected_answer: string; time_spent: number }
): Promise<void> {
  await api.post(`/api/reviews/${id}`, input)
}

export async function fetchStats(): Promise<ReviewStats> {
  const { data } = await api.get('/api/stats')
  return data
}

export async function fetchDetailedStats(): Promise<DetailedStats> {
  const { data } = await api.get('/api/stats/detailed')
  return data
}

export async function fetchTopics(): Promise<string[]> {
  const { data } = await api.get('/api/topics')
  return data
}

export async function fetchNotebooks(): Promise<Notebook[]> {
  const { data } = await api.get('/api/notebooks')
  return data
}

export async function createNotebook(name: string, description: string): Promise<Notebook> {
  const { data } = await api.post('/api/notebooks', { name, description })
  return data
}

export async function fetchNotebook(id: number): Promise<Notebook> {
  const { data } = await api.get(`/api/notebooks/${id}`)
  return data
}

export async function deleteNotebook(id: number): Promise<void> {
  await api.delete(`/api/notebooks/${id}`)
}

export async function addQuestionToNotebook(notebookId: number, questionId: number): Promise<void> {
  await api.post(`/api/notebooks/${notebookId}/questions`, { question_id: questionId })
}

export async function removeQuestionFromNotebook(notebookId: number, questionId: number): Promise<void> {
  await api.delete(`/api/notebooks/${notebookId}/questions/${questionId}`)
}

export async function fetchAllTheory(params?: {
  search?: string
  subject_id?: string
  page?: number
  limit?: number
}): Promise<{ data: TheoryEntry[]; page: number; total: number; totalPages: number }> {
  const { data } = await api.get('/api/theory', { params })
  return data
}

export async function fetchTheoryBySubject(subjectId: number): Promise<TheoryEntry[]> {
  const { data } = await api.get(`/api/subjects/${subjectId}/theory`)
  return data
}

export async function fetchTheory(id: number): Promise<TheoryEntry> {
  const { data } = await api.get(`/api/theory/${id}`)
  return data
}

export async function createTheory(
  subjectId: number,
  input: { topic: string; title: string; content: string; source?: string; tags?: string[]; notebooklm_url?: string }
): Promise<TheoryEntry> {
  const { data } = await api.post(`/api/subjects/${subjectId}/theory`, input)
  return data
}

export async function updateTheory(
  id: number,
  input: Partial<{ subject_id: number; topic: string; title: string; content: string; source: string; tags: string[]; notebooklm_url: string; completed: boolean }>
): Promise<TheoryEntry> {
  const { data } = await api.put(`/api/theory/${id}`, input)
  return data
}

export async function deleteTheory(id: number): Promise<void> {
  await api.delete(`/api/theory/${id}`)
}

export async function toggleTheoryComplete(id: number): Promise<{ completed: boolean }> {
  const { data } = await api.patch(`/api/theory/${id}/toggle`)
  return data
}

export async function toggleTheoryCurrent(id: number): Promise<{ current: boolean }> {
  const { data } = await api.patch(`/api/theory/${id}/current`)
  return data
}

export async function seedTheory(path?: string): Promise<{ message: string; created: number; skipped: number }> {
  const params = path ? { path } : {}
  const { data } = await api.post('/api/theory/seed', null, { params })
  return data
}

export function exportTheoryPDF(id: number): void {
  const base = resolveBaseURL() || window.location.origin
  window.open(`${base}/api/theory/${id}/pdf`, '_blank', 'noopener,noreferrer')
}

export async function fetchAnnotations(questionId: number): Promise<Annotation[]> {
  const { data } = await api.get(`/api/questions/${questionId}/annotations`)
  return data
}

export async function createAnnotation(questionId: number, content: string): Promise<Annotation> {
  const { data } = await api.post(`/api/questions/${questionId}/annotations`, { content })
  return data
}

export async function updateAnnotation(id: number, content: string): Promise<Annotation> {
  const { data } = await api.put(`/api/annotations/${id}`, { content })
  return data
}

export async function deleteAnnotation(id: number): Promise<void> {
  await api.delete(`/api/annotations/${id}`)
}

export async function updateSubject(id: number, input: { name?: string; color?: string }): Promise<void> {
  await api.put(`/api/subjects/${id}`, input)
}

export async function updateNotebook(id: number, input: { name?: string; description?: string }): Promise<void> {
  await api.put(`/api/notebooks/${id}`, input)
}

export async function fetchCalendarReviews(year?: number, month?: number): Promise<CalendarDay[]> {
  const params: Record<string, string> = {}
  if (year) params.year = String(year)
  if (month) params.month = String(month)
  const { data } = await api.get('/api/reviews/calendar', { params })
  return data
}

export async function fetchHeatmap(year?: number): Promise<HeatmapDay[]> {
  const params: Record<string, string> = {}
  if (year) params.year = String(year)
  const { data } = await api.get('/api/stats/heatmap', { params })
  return data
}

export async function fetchExams(): Promise<ExamDate[]> {
  const { data } = await api.get('/api/exams')
  return data
}

export async function createExam(input: { title: string; date: string; description?: string; url?: string }): Promise<ExamDate> {
  const { data } = await api.post('/api/exams', input)
  return data
}

export async function updateExam(id: number, input: Partial<{ title: string; date: string; description: string; url: string }>): Promise<ExamDate> {
  const { data } = await api.put(`/api/exams/${id}`, input)
  return data
}

export async function deleteExam(id: number): Promise<void> {
  await api.delete(`/api/exams/${id}`)
}

export async function fetchEditalGraph(): Promise<KnowledgeGraph> {
  const { data } = await api.get('/api/edital/graph')
  return data
}

export async function seedEdital(): Promise<{ message: string }> {
  const { data } = await api.post('/api/edital/seed')
  return data
}

export async function fetchEditalTopics(): Promise<EditalTopicGroup[]> {
  const { data } = await api.get('/api/edital/topics')
  return data
}

export async function linkEditalToTheory(editalId: number, theoryId: number): Promise<void> {
  await api.post('/api/edital/link', { edital_id: editalId, theory_id: theoryId })
}

export async function unlinkEditalFromTheory(editalId: number, theoryId: number): Promise<void> {
  await api.delete('/api/edital/link', { data: { edital_id: editalId, theory_id: theoryId } })
}

export async function fetchExamAnalyses(): Promise<ExamAnalysis[]> {
  const { data } = await api.get('/api/exam-analyses')
  return data
}

export async function fetchExamAnalysis(id: number): Promise<ExamAnalysis> {
  const { data } = await api.get(`/api/exam-analyses/${id}`)
  return data
}

export async function createExamAnalysis(input: { title: string; exam_org?: string; year?: number; role?: string; content: string }): Promise<ExamAnalysis> {
  const { data } = await api.post('/api/exam-analyses', input)
  return data
}

export async function updateExamAnalysis(id: number, input: Partial<{ title: string; exam_org: string; year: number; role: string; content: string }>): Promise<ExamAnalysis> {
  const { data } = await api.put(`/api/exam-analyses/${id}`, input)
  return data
}

export async function deleteExamAnalysis(id: number): Promise<void> {
  await api.delete(`/api/exam-analyses/${id}`)
}

export async function fetchPhrasalVerbs(params: {
  search?: string
  page?: number
  limit?: number
}): Promise<PhrasalVerbListResponse> {
  const { data } = await api.get('/api/phrasal-verbs', { params })
  return data
}

export async function seedPhrasalVerbs(): Promise<{ message: string; created: number; skipped: number; total: number }> {
  const { data } = await api.post('/api/phrasal-verbs/seed')
  return data
}

export async function fetchPhrasalDue(): Promise<PhrasalReview[]> {
  const { data } = await api.get('/api/phrasal-verbs/reviews/today')
  return data
}

export async function submitPhrasalReview(
  id: number,
  input: { rating: AnkiRating; correct: boolean; mode: 'flashcard' | 'quiz'; time_spent: number }
): Promise<void> {
  await api.post(`/api/phrasal-verbs/reviews/${id}`, input)
}

export async function fetchPhrasalStats(): Promise<PhrasalStats> {
  const { data } = await api.get('/api/phrasal-verbs/stats')
  return data
}
