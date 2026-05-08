type ApiResponseType<T> = {
  success: boolean;
  message: string;
  data?: T;
};

class ApiResponse<T> implements ApiResponseType<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(success = true, message: string, data?: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export { ApiResponse };
