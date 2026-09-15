import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Since this is in a shared lib, we need to pass the environment config in the constructor
// or via a token. We'll use a simple initialization method for now.
@Injectable({
  providedIn: 'root'
})
export class SupabaseStorageService {
  private supabase!: SupabaseClient;
  private isInitialized = false;

  init(supabaseUrl: string, supabaseKey: string) {
    if (!this.isInitialized) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isInitialized = true;
    }
  }

  async uploadFile(bucketName: string, file: File, path?: string): Promise<string> {
    if (!this.isInitialized) throw new Error('Supabase not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  }
}
