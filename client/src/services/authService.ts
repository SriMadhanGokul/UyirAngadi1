import api, { TOKEN_KEY } from './api';
import type { LocationInput, User } from '../types';

interface OtpRequestResponse {
  status: string;
  message: string;
}

interface VerifyOtpPayload {
  phone: string;
  otp: string;
  name?: string;
  location?: LocationInput;
}

export interface VerifyOtpResponse {
  status: string;
  token: string;
  user: User;
  isNewUser: boolean;
}

export const authService = {
  async requestOtp(phone: string) {
    const { data } = await api.post<OtpRequestResponse>('/auth/otp/request', { phone });
    return data;
  },

  async verifyOtp(payload: VerifyOtpPayload) {
    const { data } = await api.post<VerifyOtpResponse>('/auth/otp/verify', payload);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    return data;
  },

  async me() {
    const { data } = await api.get<{ status: string; user: User }>('/users/me');
    return data.user;
  },

  async updateProfile(payload: { name?: string; location?: LocationInput }) {
    const { data } = await api.patch<{ status: string; user: User }>('/users/me', payload);
    return data.user;
  },

  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post<{ status: string; user: User }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.user;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;
