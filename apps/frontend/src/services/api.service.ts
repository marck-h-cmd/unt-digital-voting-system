// frontend/src/services/api.service.ts
import axios from 'axios';
import { GraphQLClient } from 'graphql-request';

class ApiService {
  private client: GraphQLClient;
  private axiosInstance: any;

  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql';
    this.client = new GraphQLClient(apiUrl);
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptors
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async graphqlRequest(query: string, variables?: any) {
    try {
      const response = await this.client.request(query, variables);
      return response;
    } catch (error) {
      console.error('GraphQL Error:', error);
      throw error;
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.axiosInstance.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.axiosInstance.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete(url);
    return response.data;
  }

  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    localStorage.removeItem('auth_token');
    delete this.axiosInstance.defaults.headers.common.Authorization;
  }
}

export const apiService = new ApiService();
export default ApiService;