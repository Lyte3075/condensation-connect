import { getAccessToken } from '@base44/sdk';

const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
	!isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
	window.localStorage.removeItem('base44_access_token');
	window.localStorage.removeItem('token');
}

const getAppParams = () => {
	if (isClearAccessTokenRequested()) {
		clearStoredAccessToken();
	}
	return {
		appId: import.meta.env.VITE_BASE44_APP_ID || '6a9e45dcc387fc45673cb880',
		token: getAccessToken(),
		functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || 'v1',
		appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://app.base44.com',
		serverUrl: import.meta.env.VITE_BASE44_SERVER_URL || 'https://app.base44.com',
	}
}

export const appParams = {
	...getAppParams()
}
