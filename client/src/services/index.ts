import api from './api';
import type {
  AdminStats,
  AdminListingFilters,
  AdminUserFilters,
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
  async categories() {
    const { data } = await api.get<{ status: string; data: Category[] }>('/admin/categories');
    return data.data;
  },
  async stats() {
    const { data } = await api.get<{ status: string; data: AdminStats }>('/admin/stats');
    return data.data;
  },
  async listings(params: AdminListingFilters = {}) {
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
  async setFeatured(id: string, isFeatured: boolean) {
    const { data } = await api.patch<{ status: string; data: Listing }>(`/admin/listings/${id}/feature`, { isFeatured });
    return data.data;
  },
  async updateListing(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put<{ status: string; data: Listing }>(`/admin/listings/${id}`, payload);
    return data.data;
  },
  async setListingStatus(
    id: string,
    payload: { status: string; rejectionReason?: string; soldPrice?: number }
  ) {
    const { data } = await api.patch<{ status: string; data: Listing }>(
      `/admin/listings/${id}/status`,
      payload
    );
    return data.data;
  },
  async removeListing(id: string) {
    await api.delete(`/admin/listings/${id}`);
  },
  async reports(params: { status?: ReportStatus; page?: number; limit?: number } = {}) {
    const { data } = await api.get<Paginated<Report>>('/admin/reports', { params });
    return data;
  },
  async updateReport(id: string, status: ReportStatus) {
    const { data } = await api.patch<{ status: string; data: Report }>(`/admin/reports/${id}`, { status });
    return data.data;
  },
  async users(params: AdminUserFilters = {}) {
    const { data } = await api.get<Paginated<UserWithStats>>('/admin/users', { params });
    return data;
  },
  async suspendUser(id: string, isSuspended: boolean) {
    await api.patch(`/admin/users/${id}/suspend`, { isSuspended });
  },
  async deleteUser(id: string) {
    await api.delete(`/admin/users/${id}`);
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
