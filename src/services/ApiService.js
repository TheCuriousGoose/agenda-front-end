import axios from 'axios';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: 'http://agenda-backend.test/api',
            timeout: 1000
        });

        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('api_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('api_token');
                    localStorage.removeItem('auth');
                }
                return Promise.reject(error);
            }
        );
    }

    async handleResponse(promise) {
        try {
            const response = await promise;
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new Error(error.response.data.message);
            } else {
                throw new Error(error.message);
            }
        }
    }

    async login(email, password) {
        const data = await this.handleResponse(this.api.post('/login', { email, password }));
        if (data.api_token) {
            localStorage.setItem('api_token', data.api_token);
            localStorage.setItem(
                'auth',
                JSON.stringify({ isAuthenticated: true, user: data.user })
            );
        }
        return data;
    }

    async logout() {
        await this.handleResponse(this.api.post('/logout'));
        localStorage.removeItem('api_token');
        localStorage.removeItem('auth');
    }

    async user() {
        return this.handleResponse(this.api.get('/user'));
    }

    async events(month, year) {
        return this.handleResponse(
            this.api.get(`/events`, { params: { month: `${year}-${month}` } })
        );
    }

    async request(method, url, data = null) {
        const options = {
            method,
            url,
            ...(data && { data })
        };
        return this.handleResponse(this.api(options));
    }
}

const apiService = new ApiService();
export default apiService;
