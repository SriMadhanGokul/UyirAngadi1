import api from './api';
import type {
  AdminStats,
  Category,
  ContactMethod,
  Enquiry,
  Favourite,
  Listing,
  Paginated,
  Report,
  ReportReason,
  ReportStatus,
  UserWithStats,
} from '../types';

export const categoryService = {
  async list() {
    const { data } = await api.get<{ status: string; data: Category[] }>('/categories');
    return data.data;
  },
};

export const favouriteService = {
  async list() {
    const { data } = await api.get<{ status: string; data: Favourite[] }>('/favourites');
    return data.data;
  },
  async add(listingId: string) {
    const { data } = await api.post<{ status: string; data: Favourite }>('/favourites', {
      listingId,
    });
    return data.data;
  },
  async remove(listingId: string) {
    await api.delete(`/favourites/${listingId}`);
  },
};

export const reportService = {
  async create(payload: { listingId: string; reason: ReportReason; description?: string }) {
    const { data } = await api.post<{ status: string; message: string }>('/reports', payload);
    return data;
  },
  async my() {
    const { data } = await api.get<{ status: string; data: Report[] }>('/reports/my');
    return data.data;
  },
};

export const enquiryService = {
  async create(listingId: string, contactMethod: ContactMethod) {
    const { data } = await api.post<{ status: string; data: Enquiry }>('/enquiries', {
      listingId,
      contactMethod,
    });
    return data.data;
  },
  async my() {
    const { data } = await api.get<{ status: string; data: Enquiry[] }>('/enquiries/my');
    return data.data;
  },
};

export const adminService = {
  async stats() {
    const { data } = await api.get<{ status: string; data: AdminStats }>('/admin/stats');
    return data.data;
  },
  async listings(params: { status?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get<Paginated<Listing>>('/admin/listings', { params });
    return data;
  },
  async approve(id: string) {
    await api.patch(`/admin/listings/${id}/approve`);
  },
  async reject(id: string, rejectionReason: string) {
    await api.patch(`/admin/listings/${id}/reject`, { rejectionReason });
  },
  async feature(id: string, days = 7) {
    await api.patch(`/admin/listings/${id}/feature`, { days });
  },
  async removeListing(id: string) {
    await api.delete(`/admin/listings/${id}`);
  },
  async reports() {
    const { data } = await api.get<{ status: string; data: Report[] }>('/admin/reports');
    return data.data;
  },
  async updateReport(id: string, status: ReportStatus) {
    await api.patch(`/admin/reports/${id}`, { status });
  },
  async users() {
    const { data } = await api.get<{ status: string; data: UserWithStats[] }>('/admin/users');
    return data.data;
  },
  async suspendUser(id: string, isSuspended: boolean) {
    await api.patch(`/admin/users/${id}/suspend`, { isSuspended });
  },
  async createCategory(payload: Partial<Category>) {
    const { data } = await api.post<{ status: string; data: Category }>(
      '/admin/categories',
      payload
    );
    return data.data;
  },
  async updateCategory(id: string, payload: Partial<Category>) {
    const { data } = await api.put<{ status: string; data: Category }>(
      `/admin/categories/${id}`,
      payload
    );
    return data.data;
  },
  async deleteCategory(id: string) {
    await api.delete(`/admin/categories/${id}`);
  },
};

export { favouriteService as favourites };
