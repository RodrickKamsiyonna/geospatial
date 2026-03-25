import axios from 'axios';
import {
  ClassifyRequest,
  ClassifyResponse,
  AccessibilityResponse,
  NearestFacilityResponse,
  GeoHealthResult
} from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const classifyLocation = async (data: ClassifyRequest): Promise<ClassifyResponse> => {
  const response = await api.post<ClassifyResponse>('/v1/classify', data);
  return response.data;
};

export const classifyAccessibility = async (data: ClassifyRequest): Promise<AccessibilityResponse> => {
  const response = await api.post<AccessibilityResponse>('/v1/classify-accessibility', data);
  return response.data;
};

export const getNearestFacility = async (data: ClassifyRequest): Promise<NearestFacilityResponse> => {
  const response = await api.post<NearestFacilityResponse>('/v1/nearest-facility', data);
  return response.data;
};

export const fetchAllGeoHealthData = async (lat: number, lon: number): Promise<GeoHealthResult> => {
  const requestData: ClassifyRequest = { lat, lon };

  try {
    const [classify, accessibility, nearestFacility, addressRes] = await Promise.allSettled([
      classifyLocation(requestData),
      classifyAccessibility(requestData),
      getNearestFacility(requestData),
      axios.get(`https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&access_token=${MAPBOX_TOKEN}`)
    ]);

    let address = 'Unknown Location';
    if (addressRes.status === 'fulfilled' && addressRes.value.data.features?.length > 0) {
        const feature = addressRes.value.data.features[0];
        address = feature.properties.full_address || feature.properties.name || feature.properties.place_formatted || 'Unknown Location';
    }

    return {
      lat,
      lon,
      classify: classify.status === 'fulfilled' ? classify.value : null,
      accessibility: accessibility.status === 'fulfilled' ? accessibility.value : null,
      nearestFacility: nearestFacility.status === 'fulfilled' ? nearestFacility.value : null,
      address,
    };
  } catch (error) {
    console.error("Error fetching GeoHealth data:", error);
    throw error;
  }
};
