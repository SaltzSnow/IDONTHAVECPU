// src/lib/types.ts

export interface User {
    pk?: number;
    id?: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  }
  
  export interface ComponentDetail {
    name: string;
    price_thb?: number;
  }
  
  export interface RecommendationBuild {
    build_name?: string;
    total_price_estimate_thb?: number;
    cpu?: ComponentDetail | string; // Gemini อาจจะคืนเป็น string หรือ object
    gpu?: ComponentDetail | string;
    ram?: ComponentDetail | string;
    storage?: ComponentDetail | string;
    motherboard?: ComponentDetail | string;
    psu?: ComponentDetail | string;
    case?: ComponentDetail | string;
    cooler?: ComponentDetail | string;
    notes?: string;
    [key: string]: any; // For other dynamic fields if Gemini adds them
  }
  
  export interface SourcePrompt {
    budget?: number;
    currency?: string;
    desired_parts?: Record<string, string | undefined>;
    preferred_games?: string[];
    [key: string]: any;
  }
  
  export interface RecommendationApiResponse {
    recommendations?: RecommendationBuild[]; // คาดหวังว่าจะเป็น flat list ของ build objects
    analysis_notes?: string;
    source_prompt_for_saving?: SourcePrompt; // input เดิมของผู้ใช้
    error?: string;
    raw_ai_output_on_error?: any; // สำหรับ debug
  }
  
  export interface SavedSpec {
    id: number;
    name?: string | null;
    build_details: RecommendationBuild;
    source_prompt_details?: SourcePrompt | null;
    user_notes?: string | null;
    saved_at: string;
    user?: number; // User ID
  }
  
  export interface AuthTokens {
    access: string;
    refresh: string;
    user: User;
  }