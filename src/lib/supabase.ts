import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgppxwoqulyousepqyno.supabase.co'
const supabaseKey = 'sb_publishable_6v0zOwPYHNNh4HIuEqDaHA__wIH0Pir'

export const supabase = createClient(supabaseUrl, supabaseKey)