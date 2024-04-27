

export type Sentry_SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'
export interface Sentry_Breadcrumb {
  type?: string;
  level?: Sentry_SeverityLevel;
  event_id?: string;
  category?: string;
  message?: string;
  data?: {
      [key: string]: any;
  };
  timestamp?: number;
} 
