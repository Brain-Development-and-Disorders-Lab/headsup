import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Utility type to standardize server response objects
export type ServerResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const request = async <T>(target: string, options?: AxiosRequestConfig): Promise<ServerResponse<T>> => {
  // Merge in options if specified
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  // Execute request and store response if successful
  let response: AxiosResponse;
  try {
    response = await axios.get(target, requestOptions);
  } catch {
    return {
      success: false,
      message: "Error while making request, check headset connectivity",
      data: {} as T,
    };
  }
  if (!response) {
    return {
      success: false,
      message: "No response received from headset",
      data: {} as T,
    };
  }

  // Return an object containing the response data and status
  return {
    success: true,
    message: "Recieved response from headset",
    data: response.data,
  };
};
