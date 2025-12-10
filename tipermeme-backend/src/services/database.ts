import { createClient } from '@supabase/supabase-js';
import { Meme, Creator, Tip } from '../types';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Supabase ENV variables missing!");
  console.error("SUPABASE_URL:", url);
  console.error("SUPABASE_ANON_KEY:", key);
  throw new Error("Supabase environment variables are not loaded.");
}

export const supabase = createClient(url, key);


// ══════════════════════════════════════════════════════
//                  CREATOR OPERATIONS
// ══════════════════════════════════════════════════════

export async function getOrCreateCreator(walletAddress: string): Promise<Creator> {
  // Check if creator exists
  const { data: existing } = await supabase
    .from('creators')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (existing) return existing;
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY);


  // Create new creator
  const { data: newCreator, error } = await supabase
    .from('creators')
    .insert({
      wallet_address: walletAddress,
      username: `user_${walletAddress.slice(2, 8)}`
    })
    .select()
    .single();

  if (error) throw error;
  return newCreator;
}

export async function updateCreatorStats(
  walletAddress: string,
  incrementMemes: number = 0,
  incrementTips: number = 0,
  incrementEarnings: number = 0
) {
  const { error } = await supabase.rpc('update_creator_stats', {
    p_wallet: walletAddress,
    p_memes: incrementMemes,
    p_tips: incrementTips,
    p_earnings: incrementEarnings
  });

  if (error) {
    // If function doesn't exist, do it manually
    const { data: creator } = await supabase
      .from('creators')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (creator) {
      await supabase
        .from('creators')
        .update({
          total_memes: creator.total_memes + incrementMemes,
          total_tips: creator.total_tips + incrementTips,
          total_earned: creator.total_earned + incrementEarnings
        })
        .eq('wallet_address', walletAddress);
    }
  }
}

// ══════════════════════════════════════════════════════
//                  MEME OPERATIONS
// ══════════════════════════════════════════════════════

export async function createMeme(memeData: {
  creator_wallet: string;
  image_url: string;
  caption?: string;
  category?: string;
}): Promise<Meme> {
  const { data, error } = await supabase
    .from('memes')
    .insert(memeData)
    .select()
    .single();

  if (error) throw error;

  // Update creator stats
  await updateCreatorStats(memeData.creator_wallet, 1, 0, 0);

  return data;
}

export async function getMemes(limit: number = 20, offset: number = 0): Promise<Meme[]> {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getMemeById(id: string): Promise<Meme | null> {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function updateMemeStats(
  memeId: string,
  incrementTips: number = 0,
  incrementEarnings: number = 0,
  incrementViews: number = 0
) {
  const { data: meme } = await supabase
    .from('memes')
    .select('*')
    .eq('id', memeId)
    .single();

  if (meme) {
    await supabase
      .from('memes')
      .update({
        tip_count: meme.tip_count + incrementTips,
        total_earned: meme.total_earned + incrementEarnings,
        view_count: meme.view_count + incrementViews
      })
      .eq('id', memeId);
  }
}

// ══════════════════════════════════════════════════════
//                  TIP OPERATIONS
// ══════════════════════════════════════════════════════

export async function createTip(tipData: {
  meme_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  tx_hash: string;
}): Promise<Tip> {
  const { data, error } = await supabase
    .from('tips')
    .insert(tipData)
    .select()
    .single();

  if (error) throw error;

  // Update meme stats
  await updateMemeStats(tipData.meme_id, 1, tipData.amount, 0);

  // Update creator stats
  await updateCreatorStats(tipData.to_wallet, 0, 1, tipData.amount);

  return data;
}

export async function getTipsByMeme(memeId: string): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .eq('meme_id', memeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function checkTxHashExists(txHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('tips')
    .select('id')
    .eq('tx_hash', txHash)
    .single();

  return !!data;
}