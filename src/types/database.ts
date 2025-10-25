// src/types/database.ts
// Tipos TypeScript para las tablas de Supabase

export interface User {
  id: string;
  clerk_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  username: string | null;
  role: 'admin' | 'empleado';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

export interface Document {
  id: string;
  owner_id: string | null;
  title: string;
  filename: string;
  storage_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: 'uploaded' | 'processing' | 'processed' | 'ocr_failed';
  page_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface OcrResult {
  id: string;
  document_id: string;
  page_number: number;
  text_content: string | null;
  confidence: number | null;
  language: string | null;
  raw_data: Record<string, unknown> | null;
  processed_at: string;
}

export interface DocumentTag {
  id: string;
  document_id: string;
  tag: string;
  color: string;
  created_at: string;
}

export interface SharedDocument {
  id: string;
  document_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string | null;
  permission: 'view' | 'comment' | 'edit';
  expires_at: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface DocumentExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  field_value: string | null;
  field_type: 'text' | 'number' | 'date' | 'currency';
  confidence: number | null;
  bounding_box: Record<string, unknown> | null;
  page_number: number;
  created_at: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
}

export interface DocumentCategoryRelation {
  document_id: string;
  category_id: string;
}

// Tipos de vistas y consultas complejas
export interface DocumentWithDetails extends Document {
  owner_name: string | null;
  owner_email: string | null;
  ocr_pages_count: number;
  tags_count: number;
  shares_count: number;
  tags: string[] | null;
  categories: string[] | null;
}

export interface DocumentSearchResult {
  document_id: string;
  title: string;
  filename: string;
  owner_name: string | null;
  relevance: number;
}

export interface DashboardStats {
  total_documents: number;
  total_users: number;
  total_ocr_pages: number;
  total_activities: number;
  documents_by_status: Record<string, number>;
  recent_activities: Array<{
    action: string;
    created_at: string;
    user_name: string | null;
  }>;
}

// Tipos para operaciones de inserción (sin campos generados automáticamente)
export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at'>;
export type ActivityInsert = Omit<Activity, 'id' | 'created_at'>;
export type DocumentTagInsert = Omit<DocumentTag, 'id' | 'created_at'>;

// Tipos para operaciones de actualización (campos opcionales)
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'clerk_user_id'>>;
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>;

// Enums para mejor tipado
export enum UserRole {
  ADMIN = 'admin',
  EMPLEADO = 'empleado'
}

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  OCR_FAILED = 'ocr_failed'
}

export enum SharePermission {
  VIEW = 'view',
  COMMENT = 'comment',
  EDIT = 'edit'
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  CURRENCY = 'currency'
}

// Tipo para el cliente de Supabase con nuestras tablas
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      documents: {
        Row: Document;
        Insert: DocumentInsert;
        Update: DocumentUpdate;
      };
      ocr_results: {
        Row: OcrResult;
        Insert: Omit<OcrResult, 'id' | 'processed_at'>;
        Update: Partial<Omit<OcrResult, 'id' | 'processed_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: ActivityInsert;
        Update: never; // Activities no se actualizan
      };
      document_tags: {
        Row: DocumentTag;
        Insert: DocumentTagInsert;
        Update: Partial<Omit<DocumentTag, 'id' | 'created_at'>>;
      };
      shared_documents: {
        Row: SharedDocument;
        Insert: Omit<SharedDocument, 'id' | 'created_at'>;
        Update: Partial<Omit<SharedDocument, 'id' | 'created_at'>>;
      };
      settings: {
        Row: Setting;
        Insert: Omit<Setting, 'updated_at'>;
        Update: Partial<Omit<Setting, 'key' | 'updated_at'>>;
      };
      document_extracted_fields: {
        Row: DocumentExtractedField;
        Insert: Omit<DocumentExtractedField, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentExtractedField, 'id' | 'created_at'>>;
      };
      document_categories: {
        Row: DocumentCategory;
        Insert: Omit<DocumentCategory, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentCategory, 'id' | 'created_at'>>;
      };
      document_category_relations: {
        Row: DocumentCategoryRelation;
        Insert: DocumentCategoryRelation;
        Update: never; // Es una tabla de relación
      };
    };
    Views: {
      documents_with_details: {
        Row: DocumentWithDetails;
      };
    };
    Functions: {
      search_documents: {
        Args: { search_term: string };
        Returns: DocumentSearchResult[];
      };
      get_dashboard_stats: {
        Args: { user_clerk_id?: string };
        Returns: DashboardStats;
      };
    };
  };
}