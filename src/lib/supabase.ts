import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://netvvdpfyyhspfwlajht.supabase.co";
const supabaseKey = "sb_publishable_e8qgwOwx6VkqlqHaXk-SoQ_91xlw3OL";

export const supabase = createClient(supabaseUrl, supabaseKey);