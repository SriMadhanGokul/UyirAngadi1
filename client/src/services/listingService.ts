import api from './api';
import type {
  Listing,
  ListingFilters,
  ListingFormValues,
  Paginated,
  SellerStats,
} from '../types';

/** Strips empty values so the backend receives a clean query string. */
function toParams(filters: ListingFilters = {}) {
  return Object.entries(filters).reduce<Record<string, string | number>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value as string | number;
    }
    return acc;
  }, {});
}

/** Builds the multipart body expected by POST /listings. */
function buildFormData(values: ListingFormValues) {
  const form = new FormData();

  form.append('category', values.category);
  form.append('breed', values.breed.trim());
  form.append('title', values.title.trim());
  form.append('description', values.description.trim());
  if (values.gender) form.append('gender', values.gender);
  form.append('price', values.price);
  form.append('isNegotiable', String(values.isNegotiable));

  form.append('phone', values.phone);
  if (values.whatsapp) form.append('whatsapp', values.whatsapp);
  if (values.healthInfo) form.append('healthInfo', values.healthInfo);
  if (values.vaccinationInfo) form.append('vaccinationInfo', values.vaccinationInfo);

  form.append(
    'age',
    JSON.stringify({
      years: Number(values.ageYears) || 0,
      months: Number(values.ageMonths) || 0,
    })
  );

  form.append(
    'location',
    JSON.stringify({
      district: values.district,
      taluk: values.taluk,
      village: values.village,
      pincode: values.pincode,
    })
  );

  form.append('categorySpecificDetails', JSON.stringify(values.details || {}));

  values.photos.forEach((file) => form.append('photos', file));
  if (values.video) form.append('video', values.video);

  return form;
}

export const listingService = {
  async list(filters: ListingFilters = {}) {
    const { data } = await api.get<Paginated<Listing>>('/listings', { params: toParams(filters) });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<{ status: string; data: Listing; isSold: boolean }>(
      `/listings/${id}`
    );
    return data;
  },

  async soldHistory(filters: { page?: number; limit?: number } = {}) {
    const { data } = await api.get<Paginated<Listing>>('/listings/sold-history', {
      params: toParams(filters as ListingFilters),
    });
    return data;
  },

  async create(values: ListingFormValues) {
    const { data } = await api.post<{ status: string; message: string; data: Listing }>(
      '/listings',
      buildFormData(values),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put<{ status: string; data: Listing }>(`/listings/${id}`, payload);
    return data.data;
  },

  async updateMedia(id: string, photos: File[], video: File | null, removeVideo: boolean) {
    const form = new FormData();
    photos.forEach((file) => form.append('photos', file));
    if (video) form.append('video', video);
    if (removeVideo) form.append('removeVideo', 'true');
    const { data } = await api.put<{ status: string; data: Listing }>(
      `/listings/${id}/media`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/listings/${id}`);
  },

  async markSold(id: string, soldPrice?: number) {
    const { data } = await api.patch<{ status: string; data: Listing }>(`/listings/${id}/sold`, {
      soldPrice,
    });
    return data.data;
  },
};

export const sellerService = {
  async stats() {
    const { data } = await api.get<{ status: string; data: SellerStats }>('/seller/stats');
    return data.data;
  },

  async listings(params: { status?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get<Paginated<Listing>>('/seller/listings', {
      params: toParams(params as ListingFilters),
    });
    return data;
  },

  async enquiries() {
    const { data } = await api.get<{ status: string; data: import('../types').Enquiry[] }>(
      '/seller/enquiries'
    );
    return data.data;
  },

  async markSold(id: string, soldPrice?: number) {
    const { data } = await api.patch<{ status: string; data: Listing }>(
      `/seller/listings/${id}/sold`,
      { soldPrice }
    );
    return data.data;
  },
};

export default listingService;
