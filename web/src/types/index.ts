export interface Subject {
  id: number
  name: string
  color: string
  created_at: string
}

export interface Alternative {
  letter: string
  text: string
}

export interface Question {
  id: number
  subject_id: number
  subject: Subject
  topic: string
  text: string
  alternatives: string
  correct_answer: string
  question_type: string
  kind: string
  explanation: string
  source: string
  tags: string
  favorite: boolean
  created_at: string
  updated_at: string
  notebooks?: Notebook[]
}

export interface Review {
  id: number
  question_id: number
  question: Question
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  created_at: string
  updated_at: string
}

export interface QuestionListResponse {
  data: Question[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ReviewStats {
  total_questions: number
  total_reviews: number
  today_reviews: number
  accuracy: number
  today_accuracy: number
  pending_reviews: number
  pending_questions: number
  pending_flashcards: number
}

export interface SubjectStat {
  subject_id: number
  subject_name: string
  color: string
  total: number
  correct: number
  total_reviews: number
  accuracy: number
}

export interface DailyStat {
  date: string
  total: number
  correct: number
}

export interface TopicStat {
  topic: string
  total: number
  correct: number
  total_reviews: number
  accuracy: number
}

export interface StreakInfo {
  current: number
  longest: number
  reviewed_today: boolean
}

export interface DetailedStats {
  by_subject: SubjectStat[]
  daily: DailyStat[]
  by_topic: TopicStat[]
  streak: StreakInfo
}

export interface Notebook {
  id: number
  name: string
  description: string
  created_at: string
  question_count?: number
  questions?: Question[]
}

export interface BulkImportItem {
  subject_id: number
  topic: string
  text: string
  alternatives: Alternative[]
  correct_answer: string
  explanation: string
  source: string
  tags: string[]
}

export interface TheoryEntry {
  id: number
  subject_id: number
  subject: Subject
  topic: string
  title: string
  content: string
  source: string
  tags: string
  notebooklm_url: string
  completed: boolean
  current: boolean
  created_at: string
  updated_at: string
}

export interface Annotation {
  id: number
  question_id: number
  content: string
  created_at: string
  updated_at: string
}

export interface ReviewLog {
  id: number
  question_id: number
  question?: Question
  correct: boolean
  selected_answer: string
  time_spent: number
  reviewed_at: string
}

export interface CalendarDay {
  date: string
  count: number
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface ExamDate {
  id: number
  title: string
  date: string
  description: string
  url: string
  days_remaining: number
  created_at: string
  updated_at: string
}

export interface ReviewLogListResponse {
  data: ReviewLog[]
  page: number
  total: number
  totalPages: number
}

export interface GraphNode {
  id: string
  label: string
  type: 'module' | 'subject' | 'topic' | 'theory'
  module: string
  subject: string
  code: string
  theory_id?: number
}

export interface EditalTopic {
  code: string
  title: string
  value: string
}

export interface EditalTopicGroup {
  subject: string
  topics: EditalTopic[]
}

export interface GraphEdge {
  source: string
  target: string
}

export interface ExamAnalysis {
  id: number
  title: string
  exam_org: string
  year: number
  role: string
  content: string
  created_at: string
  updated_at: string
}

export interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface PhrasalVerb {
  id: number
  verb: string
  meaning: string
  example: string
  example_pt: string
  created_at: string
}

export interface PhrasalReview {
  id: number
  phrasal_id: number
  phrasal: PhrasalVerb
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  created_at: string
  updated_at: string
}

export interface PhrasalVerbListResponse {
  data: PhrasalVerb[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PhrasalStats {
  total: number
  due: number
  mastered: number
  total_reviews: number
  today_reviews: number
  accuracy: number
}

export type AnkiRating = 'again' | 'hard' | 'good' | 'easy'
