import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

function toQueryString(params?: object): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined) usp.append(key, String(value));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

// ── Shared enums ──────────────────────────────────────────────────────────
export type SubscriptionTier = "free" | "creator" | "brand" | "agency" | "enterprise";
export type Platform = "instagram" | "tiktok" | "x" | "youtube" | "facebook" | "threads";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";
export type CaptionTone = "pidgin" | "yoruba" | "igbo" | "hausa" | "formal";

// ── Resource types ───────────────────────────────────────────────────────
export interface UserProfile {
  id: number;
  clerkId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  tier: SubscriptionTier;
  bio?: string | null;
  country?: string | null;
  createdAt: string;
}

export interface TierInfo {
  tier: SubscriptionTier;
  tierName: string;
  monthlyPrice: number | null;
  features: string[];
  moduleAccess: {
    scheduling: boolean;
    monetization: boolean;
    analytics: boolean;
    ambassadorCrm: boolean;
    bookPromo: boolean;
    liveVideo: boolean;
    clipEngine: boolean;
    autoPost: boolean;
    trafficTools: boolean;
    fanHub: boolean;
    campaignIntelligence: boolean;
  };
}

export interface DashboardSummary {
  postsScheduled: number;
  revenueThisMonth: number;
  activeBrandDeals: number;
  ambassadorCount: number;
  fanHubMembers: number;
  totalReach: number;
  platformsConnected?: number;
  aiCaptionsGenerated?: number;
}

export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Post {
  id: number;
  userId: number;
  campaignId?: number | null;
  caption: string;
  mediaUrls: string[];
  platforms: Platform[];
  status: PostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  tone?: string | null;
  hashtags: string[];
  platformVariants?: Record<string, unknown> | null;
  engagementScore: number;
  isRecycled: boolean;
  createdAt?: string;
}

export interface Campaign {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  color: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAccount {
  id: number;
  platform: Platform;
  handle: string;
  displayName?: string | null;
  connected: boolean;
  followerCount: number;
}

export interface HashtagItem {
  hashtag: string;
  platform: string;
  region: string;
  trendScore: number;
  category?: string | null;
}

export interface GenerateCaptionsResponse {
  captions: { tone: CaptionTone; variants: Record<string, string> }[];
}

export interface BulkUploadResult {
  imported: number;
  failed: number;
  posts: Post[];
}

// ── Request bodies / params ─────────────────────────────────────────────
export interface CreatePostBody {
  caption: string;
  platforms: Platform[];
  campaignId?: number;
  scheduledAt?: string;
  tone?: CaptionTone;
  hashtags?: string[];
  mediaUrls?: string[];
  platformVariants?: Record<string, unknown>;
}

export interface UpdatePostBody {
  caption?: string;
  platforms?: Platform[];
  campaignId?: number;
  scheduledAt?: string;
  status?: PostStatus;
  tone?: CaptionTone;
  hashtags?: string[];
  mediaUrls?: string[];
  platformVariants?: Record<string, unknown>;
  changeNote?: string;
}

export interface RecyclePostBody {
  platforms: Platform[];
  scheduledAt: string;
  tone?: CaptionTone;
  refreshCaption?: boolean;
}

export interface BulkUploadBody {
  posts: {
    caption: string;
    platforms: Platform[];
    scheduledAt?: string;
    hashtags?: string[];
    campaignId?: number;
  }[];
}

export interface GenerateCaptionsBody {
  topic: string;
  tones: CaptionTone[];
  platforms: Platform[];
  context?: string;
  hashtags?: string[];
}

export interface CreateCampaignBody {
  name: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListPostsParams {
  status?: PostStatus;
  campaignId?: number;
  platform?: string;
  from?: string;
  to?: string;
}

export interface GetTrendingHashtagsParams {
  platform?: string;
  region?: string;
}

// ── Queries ──────────────────────────────────────────────────────────────
export function useGetMe(): UseQueryResult<UserProfile, Error> {
  return useQuery({ queryKey: ["/api/users/me"], queryFn: () => apiFetch<UserProfile>("/api/users/me") });
}

export function useGetMyTier(): UseQueryResult<TierInfo, Error> {
  return useQuery({ queryKey: ["/api/users/me/tier"], queryFn: () => apiFetch<TierInfo>("/api/users/me/tier") });
}

export function useGetDashboardSummary(): UseQueryResult<DashboardSummary, Error> {
  return useQuery({ queryKey: ["/api/dashboard/summary"], queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary") });
}

export function useGetDashboardActivity(): UseQueryResult<ActivityItem[], Error> {
  return useQuery({ queryKey: ["/api/dashboard/activity"], queryFn: () => apiFetch<ActivityItem[]>("/api/dashboard/activity") });
}

export function useListPosts(params?: ListPostsParams): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: params ? ["/api/posts", params] : ["/api/posts"],
    queryFn: () => apiFetch<Post[]>(`/api/posts${toQueryString(params)}`),
  });
}

export function useListCampaigns(): UseQueryResult<Campaign[], Error> {
  return useQuery({ queryKey: ["/api/campaigns"], queryFn: () => apiFetch<Campaign[]>("/api/campaigns") });
}

export function useListPlatformAccounts(): UseQueryResult<PlatformAccount[], Error> {
  return useQuery({ queryKey: ["/api/platform-accounts"], queryFn: () => apiFetch<PlatformAccount[]>("/api/platform-accounts") });
}

export function useGetTrendingHashtags(params?: GetTrendingHashtagsParams): UseQueryResult<HashtagItem[], Error> {
  return useQuery({
    queryKey: params ? ["/api/posts/hashtags", params] : ["/api/posts/hashtags"],
    queryFn: () => apiFetch<HashtagItem[]>(`/api/posts/hashtags${toQueryString(params)}`),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────
export function useCreatePost(): UseMutationResult<Post, Error, { data: CreatePostBody }> {
  return useMutation({
    mutationFn: ({ data }) => apiFetch<Post>("/api/posts", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdatePost(): UseMutationResult<Post, Error, { id: number; data: UpdatePostBody }> {
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch<Post>(`/api/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  });
}

export function useDeletePost(): UseMutationResult<void, Error, { id: number }> {
  return useMutation({
    mutationFn: ({ id }) => apiFetch<void>(`/api/posts/${id}`, { method: "DELETE" }),
  });
}

export function useBulkUploadPosts(): UseMutationResult<BulkUploadResult, Error, { data: BulkUploadBody }> {
  return useMutation({
    mutationFn: ({ data }) => apiFetch<BulkUploadResult>("/api/posts/bulk-upload", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useRecyclePost(): UseMutationResult<Post, Error, { id: number; data: RecyclePostBody }> {
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch<Post>(`/api/posts/${id}/recycle`, { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useGenerateCaptions(): UseMutationResult<GenerateCaptionsResponse, Error, { data: GenerateCaptionsBody }> {
  return useMutation({
    mutationFn: ({ data }) => apiFetch<GenerateCaptionsResponse>("/api/posts/captions", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCreateCampaign(): UseMutationResult<Campaign, Error, { data: CreateCampaignBody }> {
  return useMutation({
    mutationFn: ({ data }) => apiFetch<Campaign>("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  });
}
