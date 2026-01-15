// User roles
export type UserRole = 'ADMIN' | 'GURU' | 'SISWA' | 'WALI'

// Database types
export interface User {
    id: string
    username: string
    password_hash: string
    full_name: string | null
    role: UserRole
    created_at: string
}

export interface Session {
    id: string
    user_id: string
    token: string
    expires_at: string
    created_at: string
}

export interface Teacher {
    id: string
    user_id: string
    nip: string | null
    created_at: string
    user?: User
}

export interface Student {
    id: string
    user_id: string
    nis: string | null
    class_id: string | null
    created_at: string
    user?: User
    class?: Class
}

export interface AcademicYear {
    id: string
    name: string
    is_active: boolean
    created_at: string
}

export interface Class {
    id: string
    name: string
    academic_year_id: string
    created_at: string
    academic_year?: AcademicYear
}

export interface Subject {
    id: string
    name: string
    created_at: string
}

export interface TeachingAssignment {
    id: string
    teacher_id: string
    subject_id: string
    class_id: string
    academic_year_id: string
    created_at: string
    teacher?: Teacher
    subject?: Subject
    class?: Class
    academic_year?: AcademicYear
}

export interface Material {
    id: string
    teaching_assignment_id: string
    title: string
    description: string | null
    type: 'PDF' | 'VIDEO' | 'TEXT' | 'LINK'
    content_url: string | null
    content_text: string | null
    created_at: string
    teaching_assignment?: TeachingAssignment
}

export interface Assignment {
    id: string
    teaching_assignment_id: string
    title: string
    description: string | null
    type: 'TUGAS' | 'ULANGAN'
    due_date: string | null
    created_at: string
    teaching_assignment?: TeachingAssignment
}

export interface Question {
    id: string
    assignment_id: string
    type: 'PG' | 'ESSAY'
    question: string
    options: string[] | null
    correct_answer: string | null
    points: number
    created_at: string
}

export interface StudentSubmission {
    id: string
    assignment_id: string
    student_id: string
    answers: { question_id: string; answer: string }[] | null
    submitted_at: string
    assignment?: Assignment
    student?: Student
}

export interface Grade {
    id: string
    submission_id: string
    score: number
    feedback: string | null
    graded_at: string
    submission?: StudentSubmission
}

// Auth context type
export interface AuthUser {
    id: string
    username: string
    full_name: string | null
    role: UserRole
}

// Quiz types
export type QuestionType = 'ESSAY' | 'MULTIPLE_CHOICE'
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export interface Quiz {
    id: string
    teaching_assignment_id: string
    title: string
    description: string | null
    duration_minutes: number
    is_randomized: boolean
    is_active: boolean
    created_at: string
    updated_at: string
    teaching_assignment?: TeachingAssignment
    questions?: QuizQuestion[]
}

export interface QuizQuestion {
    id: string
    quiz_id: string
    question_text: string
    question_type: QuestionType
    options: string[] | null
    correct_answer: string | null
    points: number
    order_index: number
    created_at: string
}

export interface QuizSubmission {
    id: string
    quiz_id: string
    student_id: string
    started_at: string
    submitted_at: string | null
    answers: QuizAnswer[] | null
    total_score: number
    max_score: number
    is_graded: boolean
    quiz?: Quiz
    student?: Student
}

export interface QuizAnswer {
    question_id: string
    answer: string
    is_correct?: boolean
    score?: number
}

export interface QuestionBank {
    id: string
    teacher_id: string
    subject_id: string | null
    question_text: string
    question_type: QuestionType
    options: string[] | null
    correct_answer: string | null
    difficulty: Difficulty
    tags: string[] | null
    created_at: string
    subject?: Subject
}
