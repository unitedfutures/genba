export type UserRole = 'admin' | 'worker'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'high' | 'medium' | 'low'
export type WorkLogStatus = 'draft' | 'submitted'
export type PhotoType = 'before' | 'after'
export type SiteStatus = 'active' | 'completed' | 'paused'
export type Plan = 'free' | 'paid'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: Plan
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
  organization?: Organization
}

export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: UserRole
  token: string
  invited_by: string
  accepted_at: string | null
  expires_at: string
  created_at: string
  organization?: Organization
  inviter?: Profile
}

export interface Site {
  id: string
  organization_id: string
  name: string
  address: string | null
  status: SiteStatus
  created_by: string
  created_at: string
}

export interface Task {
  id: string
  organization_id: string
  site_id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  site?: Site
  assignee?: Profile
  creator?: Profile
}

export interface WorkLog {
  id: string
  organization_id: string
  worker_id: string
  site_id: string
  task_id: string | null
  work_date: string
  clock_in_at: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_in_address: string | null
  clock_out_at: string | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  clock_out_address: string | null
  work_description: string | null
  worker_comment: string | null
  status: WorkLogStatus
  created_at: string
  worker?: Profile
  site?: Site
  task?: Task
  photos?: Photo[]
  comments?: Comment[]
}

export interface Photo {
  id: string
  work_log_id: string
  organization_id: string
  uploaded_by: string
  storage_path: string
  photo_type: PhotoType
  caption: string | null
  created_at: string
  url?: string
}

export interface Comment {
  id: string
  work_log_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}
