import axios from 'axios';
import {
  ClassifyRequest,
  ClassifyResponse,
  AccessibilityResponse,
  NearestFacilityResponse,
  GeoHealthResult
} from '../types/api';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

const proxyPost = async (endpoint: string, data: ClassifyRequest) => {
  const response = await fetch(`/api/geohealth?endpoint=${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const classifyLocation = async (data: ClassifyRequest): Promise<ClassifyResponse> => {
  return proxyPost('classify', data);
};

export const classifyAccessibility = async (data: ClassifyRequest): Promise<AccessibilityResponse> => {
  return proxyPost('classify-accessibility', data);
};

export const getNearestFacility = async (data: ClassifyRequest): Promise<NearestFacilityResponse> => {
  return proxyPost('nearest-facility', data);
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

    const finalResult = {
      lat,
      lon,
      classify: classify.status === 'fulfilled' ? classify.value : null,
      accessibility: accessibility.status === 'fulfilled' ? accessibility.value : null,
      nearestFacility: nearestFacility.status === 'fulfilled' ? nearestFacility.value : null,
      address,
    };
    console.log("FETCH_ALL_RESULT:", finalResult);
    return finalResult;
  } catch (error) {
    console.error("Error fetching GeoHealth data:", error);
    throw error;
  }
};
