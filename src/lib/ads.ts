import { api } from "./api";
import type { AdCampaign, AdCampaignDetail, CompletionToken, UserWallet } from "@/types";

export function listAds(includeNsfw = false): Promise<{ campaigns: AdCampaign[] }> {
  const qs = includeNsfw ? "?nsfw=1" : "";
  return api.get<{ campaigns: AdCampaign[] }>(`/ads${qs}`);
}

export function getAd(id: string): Promise<{ campaign: AdCampaignDetail }> {
  return api.get<{ campaign: AdCampaignDetail }>(`/ads/${encodeURIComponent(id)}`);
}

export function completeAd(
  id: string,
  nonce?: string,
): Promise<{
  ok: true;
  token: CompletionToken;
  campaign: { id: string; title: string; rewardPerAction: number; rewardCurrency: string };
}> {
  return api.post(`/ads/${encodeURIComponent(id)}/complete`, nonce !== undefined ? { nonce } : {});
}

export function getPublicKey(): Promise<{ publicKey: string }> {
  return api.get<{ publicKey: string }>("/public-key");
}

export function listWallets(): Promise<{ wallets: UserWallet[] }> {
  return api.get<{ wallets: UserWallet[] }>("/profile/wallet");
}

export function upsertWallet(chain: "solana" | "evm", address: string): Promise<{ wallet: UserWallet }> {
  return api.put<{ wallet: UserWallet }>("/profile/wallet", { chain, address });
}
