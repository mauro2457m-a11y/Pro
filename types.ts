export interface Chapter {
  id: number;
  title: string;
  description: string;
  content: string; // Markdown content
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export interface EbookData {
  title: string;
  description: string;
  targetAudience: string;
  coverImageBase64: string | null;
  chapters: Chapter[];
  isGeneratingCover: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING', // Generating outline
  CREATING = 'CREATING', // Generating content/cover
  FINISHED = 'FINISHED'
}
