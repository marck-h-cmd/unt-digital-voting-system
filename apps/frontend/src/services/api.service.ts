// frontend/src/services/api.service.ts
import axios from 'axios';
import { GraphQLClient } from 'graphql-request';

class ApiService {
  private voteClient: GraphQLClient;
  private identityAxios: any;
  private voteAxios: any;

  constructor() {
    const voteUrl = import.meta.env.VITE_VOTE_API_URL || 'http://localhost:4000/graphql';
    const identityUrl = import.meta.env.VITE_IDENTITY_API_URL || 'http://localhost:4000/api';
    const voteRestUrl = voteUrl.replace('/graphql', '/api');
    
    this.voteClient = new GraphQLClient(voteUrl);
    
    this.identityAxios = axios.create({
      baseURL: identityUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.voteAxios = axios.create({
      baseURL: voteRestUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptors for both
    [this.identityAxios, this.voteAxios].forEach((instance) => {
      instance.interceptors.request.use(
        (config: any) => {
          const token = localStorage.getItem('auth_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error: any) => Promise.reject(error)
      );

      instance.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    });
  }

  async graphqlRequest(query: string, variables?: any) {
    try {
      const response = await this.voteClient.request(query, variables);
      return response;
    } catch (error) {
      console.error('GraphQL Error:', error);
      throw error;
    }
  }

  // Identity API methods
  async identityPost<T>(url: string, data?: any): Promise<T> {
    const response = await this.identityAxios.post(url, data);
    return response.data;
  }

  // Vote API methods
  async voteGet<T>(url: string, params?: any): Promise<T> {
    const response = await this.voteAxios.get(url, { params });
    return response.data;
  }

  async votePost<T>(url: string, data?: any): Promise<T> {
    const response = await this.voteAxios.post(url, data);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    if (url.startsWith('/identity')) {
      return this.identityPost<T>(url, data);
    }
    return this.votePost<T>(url, data);
  }

  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
    this.identityAxios.defaults.headers.common.Authorization = `Bearer ${token}`;
    this.voteAxios.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    localStorage.removeItem('auth_token');
    delete this.identityAxios.defaults.headers.common.Authorization;
    delete this.voteAxios.defaults.headers.common.Authorization;
  }
}

export const apiService = new ApiService();
export default ApiService;
