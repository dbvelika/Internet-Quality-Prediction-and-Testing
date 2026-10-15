// SERVIÇOS — formato das respostas da API (resumo do openapi.json, versão 0.2.0).
// Só entram aqui os endpoints e campos que o app usa.
import type { Activity } from '../types';

export type ApiQuality = 'GOOD' | 'MODERATE' | 'UNSTABLE';

export interface ApiModelRef {
  id: string;
  name: string;
  version: string;
}

export interface ApiModelListItem extends ApiModelRef {
  description: string;
  groupName: string;
  algorithm: string;
}

/** GET /api/v1/models */
export interface ApiModelsResponse {
  items: ApiModelListItem[];
  total: number;
}

export interface ApiRecommendation {
  code: 'NORMAL_USE' | 'REDUCE_NETWORK_USAGE' | 'PREPARE_OFFLINE';
  message: string;
}

export interface ApiNotes {
  disclaimer: string;
  locationPrivacy: string;
}

/** GET /api/v1/forecasts/nearby */
export interface ApiNearbyResponse {
  model: ApiModelRef;
  requestedLocation: { latitude: number; longitude: number };
  matchedProbe: { probeId: number; distanceKm: number };
  prediction: { predictionFor: string; predictedAvgRttMs: number; predictedPacketLossPct: number };
  assessment: { quality: ApiQuality; qualityScore: number };
  recommendation: ApiRecommendation;
  metadata: ApiNotes;
}

export interface ApiTimelineItem {
  predictionFor: string;
  predictedAvgRttMs: number;
  predictedPacketLossPct: number;
  quality: ApiQuality;
  qualityScore: number;
}

/** GET /api/v1/forecasts/probes/{probe_id}/timeline */
export interface ApiTimelineResponse {
  model: ApiModelRef;
  probeId: number;
  items: ApiTimelineItem[];
}

/** POST /api/v1/activity/check (corpo) */
export interface ApiActivityCheckRequest {
  modelId: string;
  latitude: number;
  longitude: number;
  dateTime: string;
  activity: Activity;
}

/** POST /api/v1/activity/check (resposta) */
export interface ApiActivityCheckResponse {
  model: ApiModelRef;
  activity: Activity;
  suitable: boolean;
  forecast: { quality: ApiQuality; predictedAvgRttMs: number; predictedPacketLossPct: number };
  recommendation: ApiRecommendation;
  metadata: ApiNotes;
}
