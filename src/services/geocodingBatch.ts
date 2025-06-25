import { supabase } from '../lib/supabase';
import { GeocodingService } from './geocoding';

export interface GeocodingProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isRunning: boolean;
}

export class BatchGeocodingService {
  private static isRunning = false;
  private static progressCallback: ((progress: GeocodingProgress) => void) | null = null;

  static setProgressCallback(callback: (progress: GeocodingProgress) => void) {
    this.progressCallback = callback;
  }

  static async startBatchGeocoding(limit: number = 100): Promise<void> {
    if (this.isRunning) {
      throw new Error('Batch geocoding is already running');
    }

    this.isRunning = true;
    let processed = 0;
    let successful = 0;
    let failed = 0;

    try {
      // Get properties that need geocoding
      const { data: properties, error } = await supabase
        .from('unclaimed_properties')
        .select('*')
        .or('geocoding_status.is.null,geocoding_status.eq.pending,geocoding_status.eq.failed')
        .limit(limit);

      if (error) {
        throw error;
      }

      if (!properties || properties.length === 0) {
        this.updateProgress(0, 0, 0, 0);
        return;
      }

      const total = properties.length;
      this.updateProgress(total, 0, 0, 0);

      for (const property of properties) {
        if (!this.isRunning) {
          break; // Allow cancellation
        }

        try {
          const updates: any = {
            geocoded_at: new Date().toISOString(),
            geocoding_status: 'processing'
          };

          // Geocode owner address
          const ownerResult = await GeocodingService.geocodeOwnerAddress(property);
          if (ownerResult) {
            updates.owner_latitude = ownerResult.latitude;
            updates.owner_longitude = ownerResult.longitude;
          }

          // Geocode holder address
          const holderResult = await GeocodingService.geocodeHolderAddress(property);
          if (holderResult) {
            updates.holder_latitude = holderResult.latitude;
            updates.holder_longitude = holderResult.longitude;
          }

          // Determine final status
          if (ownerResult || holderResult) {
            updates.geocoding_status = 'completed';
            successful++;
          } else {
            updates.geocoding_status = 'failed';
            failed++;
          }

          // Update the database
          const { error: updateError } = await supabase
            .from('unclaimed_properties')
            .update(updates)
            .eq('id', property.id);

          if (updateError) {
            console.error('Failed to update property:', updateError);
            failed++;
          }

        } catch (error) {
          console.error('Error geocoding property:', error);
          
          // Mark as failed
          await supabase
            .from('unclaimed_properties')
            .update({
              geocoding_status: 'failed',
              geocoded_at: new Date().toISOString()
            })
            .eq('id', property.id);
          
          failed++;
        }

        processed++;
        this.updateProgress(total, processed, successful, failed);
      }

    } finally {
      this.isRunning = false;
      this.updateProgress(0, processed, successful, failed);
    }
  }

  static stopBatchGeocoding(): void {
    this.isRunning = false;
  }

  static isGeocodingRunning(): boolean {
    return this.isRunning;
  }

  private static updateProgress(total: number, processed: number, successful: number, failed: number): void {
    if (this.progressCallback) {
      this.progressCallback({
        total,
        processed,
        successful,
        failed,
        isRunning: this.isRunning
      });
    }
  }

  static async getGeocodingStats(): Promise<{
    total: number;
    geocoded: number;
    pending: number;
    failed: number;
    nullCoordinates: number;
  }> {
    // Get total count
    const { count: totalCount } = await supabase
      .from('unclaimed_properties')
      .select('*', { count: 'exact', head: true });

    // Get geocoding status counts
    const { data: statusData, error: statusError } = await supabase
      .from('unclaimed_properties')
      .select('geocoding_status')
      .not('geocoding_status', 'is', null);

    // Get count of properties with NULL coordinates (failed geocoding)
    const { count: nullCoordinatesCount, error: nullError } = await supabase
      .from('unclaimed_properties')
      .select('*', { count: 'exact', head: true })
      .or('owner_latitude.is.null,owner_longitude.is.null');

    if (statusError || nullError) {
      throw statusError || nullError;
    }

    const stats = {
      total: totalCount || 0,
      geocoded: 0,
      pending: 0,
      failed: 0,
      nullCoordinates: nullCoordinatesCount || 0
    };

    if (statusData) {
      statusData.forEach(item => {
        switch (item.geocoding_status) {
          case 'completed':
            stats.geocoded++;
            break;
          case 'pending':
          case 'processing':
            stats.pending++;
            break;
          case 'failed':
            stats.failed++;
            break;
        }
      });
    }

    return stats;
  }
}