import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: "csrf_token",
    xsrfHeaderName: "X-CSRF-TOKEN",
});

let refreshPromise = null;

api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        // No request information.
        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Only handle 401 responses.
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Never refresh these endpoints.
        if (
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/register") ||
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/logout")
        ) {
            return Promise.reject(error);
        }

        // Prevent infinite retry loops.
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // If another request is already refreshing,
            // wait for that same refresh request.
            if (!refreshPromise) {
                refreshPromise = api
                    .post("/auth/refresh")
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            await refreshPromise;

            // Retry the original request.
            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);

export default api;