import { Service, ServiceListResponse, CreateServiceRequest, UpdateServiceRequest, ServiceFilters } from '@/types/service';
import { specializationService } from './specializationService';
import { apiClient } from '@/lib/api';

export class ServiceService {
    private static readonly BASE_URL = '/booking/services';
    
    // Get paginated services with filters
    static async getServices(filters: ServiceFilters = {}): Promise<ServiceListResponse> {
        const params = new URLSearchParams();
        
        // Add pagination (required by backend)
        params.append('page', String(filters.page || 0));
        params.append('size', String(filters.size || 10));
        
        // Add sorting (required by backend)
        params.append('sortBy', filters.sortBy || 'serviceName');
        params.append('sortDirection', filters.sortDirection || 'ASC');
        
        // Add optional filters
        if (filters.isActive !== undefined && filters.isActive !== '') {
            params.append('isActive', filters.isActive);
        }
        if (filters.specializationId !== undefined && filters.specializationId !== '') {
            params.append('specializationId', String(filters.specializationId));
        }
        if (filters.keyword) {
            params.append('keyword', filters.keyword);
        }
        
        const url = `${this.BASE_URL}?${params.toString()}`;
        console.log('ServiceService.getServices - URL:', url);
        console.log('ServiceService.getServices - Params:', Object.fromEntries(params));

        const axios = apiClient.getAxiosInstance();
        const response = await axios.get<ServiceListResponse>(url);

        console.log('ServiceService.getServices - Response:', response.data);

        return response.data;
    }

    // Get service by ID
    // @deprecated Consider using getServiceByCode() instead - docs specify using serviceCode
    static async getServiceById(serviceId: number): Promise<Service> {
        const url = `${this.BASE_URL}/${serviceId}`;
        console.log('ServiceService.getServiceById - URL:', url);

        const axios = apiClient.getAxiosInstance();
        const response = await axios.get<Service>(url);
        console.log('ServiceService.getServiceById - Response:', response.data);

        return response.data;
    }

    // Get service by code
    // P2.3 - GET /api/v1/services/{serviceCode}
    // Note: Backend might use /services/{serviceCode} or /services/code/{serviceCode}
    // This method tries the standard path first, if fails try /code/ path
    static async getServiceByCode(serviceCode: string): Promise<Service> {
        const axios = apiClient.getAxiosInstance();
        
        // Try standard path first (as per docs)
        try {
            const url = `${this.BASE_URL}/${serviceCode}`;
            console.log('ServiceService.getServiceByCode - URL:', url);
            const response = await axios.get<Service>(url);
            console.log('ServiceService.getServiceByCode - Response:', response.data);
            return response.data;
        } catch (error: any) {
            // Fallback to /code/ path if standard path doesn't work
            if (error.response?.status === 404) {
                const url = `${this.BASE_URL}/code/${serviceCode}`;
                console.log('ServiceService.getServiceByCode - Fallback URL:', url);
                const response = await axios.get<Service>(url);
                console.log('ServiceService.getServiceByCode - Fallback Response:', response.data);
                return response.data;
            }
            throw error;
        }
    }

    // Create new service
    static async createService(data: CreateServiceRequest): Promise<Service> {
        console.log('ServiceService.createService - URL:', this.BASE_URL);
        console.log('ServiceService.createService - Data:', data);

        const axios = apiClient.getAxiosInstance();
        const response = await axios.post<Service>(this.BASE_URL, data);
        console.log('ServiceService.createService - Response:', response.data);

        return response.data;
    }

    // Update service
    // P2.4 - PUT /api/v1/services/{serviceCode}
    // Changed from serviceId to serviceCode to match docs
    static async updateService(serviceCode: string, data: UpdateServiceRequest): Promise<Service> {
        const url = `${this.BASE_URL}/${serviceCode}`;
        console.log('ServiceService.updateService - URL:', url);
        console.log('ServiceService.updateService - Data:', data);

        const axios = apiClient.getAxiosInstance();
        const response = await axios.put<Service>(url, data);
        console.log('ServiceService.updateService - Response:', response.data);

        return response.data;
    }

    // Soft delete service by ID (V2 - Recommended)
    // P2.5 - DELETE /api/v1/services/{serviceId}
    static async deleteServiceById(serviceId: number): Promise<void> {
        const url = `${this.BASE_URL}/${serviceId}`;
        console.log('ServiceService.deleteServiceById - URL:', url);

        const axios = apiClient.getAxiosInstance();
        await axios.delete(url);
        console.log('ServiceService.deleteServiceById - Success');
    }

    // Soft delete service by code (Legacy - V1)
    // P2.5 - DELETE /api/v1/services/code/{serviceCode}
    static async deleteService(serviceCode: string): Promise<void> {
        const url = `${this.BASE_URL}/code/${serviceCode}`;
        console.log('ServiceService.deleteService - URL:', url);

        const axios = apiClient.getAxiosInstance();
        await axios.delete(url);
        console.log('ServiceService.deleteService - Success');
    }

    // Toggle service status (V2 - Recommended)
    // P2.6 - PATCH /api/v1/services/{serviceId}/toggle
    static async toggleServiceStatus(serviceId: number): Promise<Service> {
        const url = `${this.BASE_URL}/${serviceId}/toggle`;
        console.log('ServiceService.toggleServiceStatus - URL:', url);

        const axios = apiClient.getAxiosInstance();
        const response = await axios.patch<Service>(url);
        console.log('ServiceService.toggleServiceStatus - Response:', response.data);

        return response.data;
    }

    // Activate service (Legacy - V1)
    // @deprecated Use toggleServiceStatus instead
    static async activateService(serviceId: number): Promise<Service> {
        const url = `${this.BASE_URL}/${serviceId}/activate`;
        console.log('ServiceService.activateService - URL:', url);

        const axios = apiClient.getAxiosInstance();
        const response = await axios.patch<Service>(url);
        console.log('ServiceService.activateService - Response:', response.data);

        return response.data;
    }
}

// Specialization Service - using existing specializationService
export class SpecializationService {
    static async getSpecializations() {
        return specializationService.getAll();
    }

    static async getActiveSpecializations() {
        return specializationService.getAll(); // Assuming getAll returns active specializations
    }
}
