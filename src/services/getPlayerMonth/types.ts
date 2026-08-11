export interface Player {
  id: string;
  player_name: string;
  storage_filename: string;
  file_name: string;
  file_path: string;
  image_url: string;
  mime_type: string;
  file_size: number;
  caption?: string;
  created_at: string;
  updated_at: string;
}
