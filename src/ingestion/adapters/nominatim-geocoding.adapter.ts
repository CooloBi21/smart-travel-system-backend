export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  osmType: string | null;
  osmId: number | null;
  matchedQuery: string;
}

interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  osm_type?: string;
  osm_id?: number;
  category?: string;
  type?: string;
  addresstype?: string;
  address?: Record<string, string>;
}

export class NominatimGeocodingAdapter {
  private readonly endpoint =
    'https://nominatim.openstreetmap.org/search';

  private lastRequestAt = 0;

  private async waitForRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    const minimumInterval = 1100;

    if (elapsed < minimumInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minimumInterval - elapsed),
      );
    }

    this.lastRequestAt = Date.now();
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isNameMatch(
    name: string,
    displayName: string,
  ): boolean {
    const normalizedName = this.normalizeText(name);
    const normalizedDisplayName =
      this.normalizeText(displayName);

    const tokens = normalizedName
      .split(' ')
      .filter((token) => token.length >= 3);

    if (tokens.length === 0) {
      return false;
    }

    const matchedTokens = tokens.filter((token) =>
      normalizedDisplayName.includes(token),
    );

    /*
     * Require at least two meaningful name tokens.
     *
     * This prevents a generic street result such as
     * "Trần Phú, Hội An..." from being accepted for
     * "Bảo tàng văn hóa Sa Huỳnh".
     */
    if (tokens.length >= 2) {
      return matchedTokens.length >= 2;
    }

    return matchedTokens.length >= 1;
  }

  private isUsefulPlaceType(
    result: NominatimResult,
  ): boolean {
    const addresstype = this.normalizeText(
      result.addresstype ?? '',
    );
    const type = this.normalizeText(result.type ?? '');

    const rejectedTypes = new Set([
      'road',
      'residential',
      'path',
      'footway',
      'service',
      'track',
      'street',
    ]);

    if (rejectedTypes.has(addresstype)) {
      return false;
    }

    if (rejectedTypes.has(type)) {
      return false;
    }

    return true;
  }

  private isLocationCompatible(
    sourceAddress: string,
    result: NominatimResult,
  ): boolean {
    const normalizedSource = this.normalizeText(sourceAddress);
    const address = result.address ?? {};

    const resultLocation = this.normalizeText(
      [
        address.state,
        address.province,
        address.city,
        address.town,
        address.municipality,
        address.county,
        result.display_name,
      ]
        .filter(Boolean)
        .join(' '),
    );

    const locationKeywords = [
      'thanh hoa',
      'quang tri',
      'quang ngai',
      'hue',
      'da nang',
      'hoi an',
      'phu tho',
    ];

    const sourceLocation = locationKeywords.find((location) =>
      normalizedSource.includes(location),
    );

    if (!sourceLocation) {
      return true;
    }

    return resultLocation.includes(sourceLocation);
  }

  private async search(
    query: string,
  ): Promise<NominatimResult | null> {
    await this.waitForRateLimit();

    const url = new URL(this.endpoint);

    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'vn');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('namedetails', '1');
    url.searchParams.set('layer', 'poi,natural,manmade');
    url.searchParams.set('accept-language', 'vi');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'SmartTravelSystem/1.0 (graduation-project)',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Nominatim request failed: ${response.status} ${response.statusText}`,
      );
    }

    const results =
      (await response.json()) as NominatimResult[];

    return results[0] ?? null;
  }

  async geocode(
    name: string,
    address: string,
  ): Promise<GeocodedLocation | null> {
    const queries = [
      `${name}, ${address}`,
      `${name}, Hoi An, Vietnam`,
      `${name}, Vietnam`,
      `${address}, Vietnam`,
    ];

    for (const query of queries) {
      const result = await this.search(query);

      if (!result?.display_name) {
        continue;
      }

      if (!this.isUsefulPlaceType(result)) {
        continue;
      }

      if (!this.isNameMatch(name, result.display_name)) {
        continue;
      }

      if (!this.isLocationCompatible(address, result)) {
        continue;
      }

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error(
          `Invalid coordinates returned for "${query}".`,
        );
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error(
          `Latitude out of range for "${query}": ${latitude}`,
        );
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error(
          `Longitude out of range for "${query}": ${longitude}`,
        );
      }

      return {
        latitude,
        longitude,
        displayName: result.display_name,
        osmType: result.osm_type ?? null,
        osmId:
          typeof result.osm_id === 'number'
            ? result.osm_id
            : null,
        matchedQuery: query,
      };
    }

    return null;
  }
}
