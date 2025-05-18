export interface RecaptchaResponse {
  success: boolean;
}

export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}
