import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gpdelhczmjnfurtmahyx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZGVsaGN6bWpuZnVydG1haHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzY5NzksImV4cCI6MjA4ODIxMjk3OX0.5i0fPibFro7Vj6st3Zq1R40Sd1y4aj6KQcRLAyGb-_0'

export const supabase = createClient(supabaseUrl, supabaseKey)
export const BUCKET = 'clips'

export function getPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
