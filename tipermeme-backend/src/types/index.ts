// ══════════════════════════════════════════════════════
//                   TYPE DEFINITIONS
// ══════════════════════════════════════════════════════

export interface Creator {
  wallet_address: string;
  username?: string;
  created_at: Date;
  total_memes: number;
  total_tips: number;
  total_earned: number;
}

export interface Meme {
  id: string;
  creator_wallet: string;
  image_url: string;
  caption?: string;
  category: string;
  created_at: Date;
  tip_count: number;
  total_earned: number;
  view_count: number;
}

export interface Tip {
  id: string;
  meme_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  tx_hash: string;
  created_at: Date;
}

// X402 Types
export interface PaymentRequiredResponse {
  maxAmountRequired: string;
  resource: string;
  description: string;
  payTo: string;
  asset: string;
  network: string;
  nonce: string;
  expiresAt: string;
}

export interface X402Payment {
  scheme: string;
  network: string;
  asset: string;
  payment: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    signature: string;
  };
}

export interface VerificationResponse {
  valid: boolean;
  transactionHash?: string;
  blockNumber?: number;
  confirmed?: boolean;
  error?: string;
}