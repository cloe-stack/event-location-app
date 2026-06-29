import { API_URL } from './supabase';

export interface Contact {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
}

export interface LocationImage {
  url: string;
  filePath: string;
}

export interface Location {
  id: string;
  nombre: string;
  calle: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  contactos: Contact[];
  metros2: number;
  aforo: number;
  accesoParkingSi: boolean;
  jardin: boolean;
  terraza: boolean;
  piscina: boolean;
  numeroBanos: number;
  cocina: boolean;
  franjaHoraria: 'diurna' | 'nocturna' | 'ambas';
  horarioMaximo: string;
  posibilidadMusica: boolean;
  potenciaLuz: string;
  comentarios: string;
  images: LocationImage[];
  createdAt: string;
  updatedAt: string;
}

export type LocationFormData = Omit<Location, 'id' | 'createdAt' | 'updatedAt'>;

const getAuthHeaders = async () => {
  const { data } = await (await import("./supabase")).supabase.auth.getSession();
  const accessToken = data?.session?.access_token;
  
  console.log('Getting auth headers - Session exists:', !!data?.session);
  console.log('Getting auth headers - Access token exists:', !!accessToken);
  console.log('Getting auth headers - Token (first 30 chars):', accessToken ? accessToken.substring(0, 30) + '...' : 'NO TOKEN');
  
  if (!accessToken) {
    console.error('No access token found in session');
    throw new Error('No authentication token available');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
};

export const getLocations = async (): Promise<Location[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/locations`, {
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error response from server:', errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.locations || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export const getLocation = async (id: string): Promise<Location | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/locations/${id}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Error fetching location');
    }

    const result = await response.json();
    return result.location;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
};

export const createLocation = async (data: LocationFormData): Promise<Location> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Error creating location');
    }

    const result = await response.json();
    return result.location;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

export const updateLocation = async (id: string, data: LocationFormData): Promise<Location> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Error updating location');
    }

    const result = await response.json();
    return result.location;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/locations/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Error deleting location');
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

export const uploadImage = async (file: File): Promise<LocationImage> => {
  try {
    const { supabase: supabaseClient } = await import('./supabase');
    const { data } = await supabaseClient.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Error uploading image');
    }

    const result = await response.json();
    return {
      url: result.url,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    const { supabase: supabaseClient } = await import('./supabase');
    const { data } = await supabaseClient.auth.getSession();
    const accessToken = data?.session?.access_token;
    
    if (!accessToken) {
      throw new Error('No authentication token available');
    }

    const encodedPath = encodeURIComponent(filePath);
    const response = await fetch(`${API_URL}/images/${encodedPath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error deleting image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};