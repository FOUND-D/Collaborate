import { PRODUCTION_URLS } from './productionUrls';

const LOCAL_URLS = Object.freeze({
  api: 'http://localhost:3002',
  socket: 'http://localhost:3002',
  mcpGateway: 'http://localhost:3002',
});

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
};

export const BACKEND_URL =
  normalizeUrl(import.meta.env.VITE_API_URL) || PRODUCTION_URLS.api;

export const SOCKET_URL =
  normalizeUrl(import.meta.env.VITE_SOCKET_URL) || PRODUCTION_URLS.socket;

export const MCP_GATEWAY_URL =
  normalizeUrl(import.meta.env.VITE_MCP_GATEWAY_URL) || PRODUCTION_URLS.mcpGateway;

export const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000;

export const INTEGRATION_TARGETS = Object.freeze({
  coreApi: BACKEND_URL,
  realtime: SOCKET_URL,
  mcpGateway: MCP_GATEWAY_URL,
});

export const DEFAULT_LOCAL_URLS = LOCAL_URLS;
export const DEFAULT_PRODUCTION_URLS = PRODUCTION_URLS;
