interface GeocodeResult {
  latitude: number;
  longitude: number;
  display_name: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private static lastRequestTime = 0;

  private static async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    
    return fetch(url, {
      headers: {
        'User-Agent': 'California-Unclaimed-Property-App/1.0'
      }
    });
  }

  static async geocodeAddress(
    street: string,
    city: string,
    state: string,
    zip: string,
    country: string = 'US'
  ): Promise<GeocodeResult | null> {
    try {
      // Build address string
      const addressParts = [
        street?.trim(),
        city?.trim(),
        state?.trim(),
        zip?.trim(),
        country?.trim()
      ].filter(Boolean);

      if (addressParts.length < 2) {
        return null; // Not enough address information
      }

      const address = addressParts.join(', ');
      
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
        countrycodes: country.toLowerCase(),
        addressdetails: '1'
      });

      const response = await this.rateLimitedFetch(`${this.BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data: NominatimResponse[] = await response.json();
      
      if (data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  static async geocodeOwnerAddress(property: {
    owner_street_1?: string;
    owner_city?: string;
    owner_state?: string;
    owner_zip?: string;
    owner_country_code?: string;
  }): Promise<GeocodeResult | null> {
    const street = [
      property.owner_street_1,
    ].filter(Boolean).join(' ');

    return this.geocodeAddress(
      street,
      property.owner_city || '',
      property.owner_state || '',
      property.owner_zip || '',
      property.owner_country_code || 'US'
    );
  }

  static async geocodeHolderAddress(property: {
    holder_street_1?: string;
    holder_city?: string;
    holder_state?: string;
    holder_zip?: string;
  }): Promise<GeocodeResult | null> {
    const street = [
      property.holder_street_1,
    ].filter(Boolean).join(' ');

    return this.geocodeAddress(
      street,
      property.holder_city || '',
      property.holder_state || '',
      property.holder_zip || '',
      'US'
    );
  }
}