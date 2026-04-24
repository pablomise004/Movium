const rawApiUrl = process.env.REACT_APP_API_URL || '/backend/api';

const normalizedApiUrl = rawApiUrl.endsWith('/') ? rawApiUrl : `${rawApiUrl}/`;

export const API_BASE_URL = normalizedApiUrl;
