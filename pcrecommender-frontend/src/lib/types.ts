// src/lib/types.ts

export interface User {
  pk?: number;
  id?: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean; 
  is_superuser?: boolean; 
}

export interface ComponentDetail {
  name: string;
  price_thb?: number;
}

export interface RecommendationBuild {
  build_name?: string;
  total_price_estimate_thb?: number;
  cpu?: ComponentDetail | string; 
  gpu?: ComponentDetail | string;
  ram?: ComponentDetail | string;
  storage?: ComponentDetail | string;
  motherboard?: ComponentDetail | string;
  psu?: ComponentDetail | string;
  case?: ComponentDetail | string;
  cooler?: ComponentDetail | string;
  notes?: string;
  [key: string]: any; 
}

export interface SourcePrompt {
  budget?: number;
  currency?: string;
  desired_parts?: Record<string, string | undefined>;
  preferred_games?: string[];
  [key: string]: any;
}

export interface RecommendationApiResponse {
  recommendations?: RecommendationBuild[]; 
  analysis_notes?: string;
  source_prompt_for_saving?: SourcePrompt; 
  error?: string;
  raw_ai_output_on_error?: any; 
}

export interface SavedSpec {
  id: number;
  name?: string | null;
  build_details: RecommendationBuild;
  source_prompt_details?: SourcePrompt | null;
  user_notes?: string | null;
  saved_at: string;
  user?: User | number | string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}
