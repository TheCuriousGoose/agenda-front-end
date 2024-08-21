import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import LoginView from '@/views/auth/LoginView.vue';
import LogoutView from '@/views/auth/LogoutView.vue';
const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: { requiresAuth: true }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/logout',
        name: 'logout',
        component: LogoutView
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('api_token');
    if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated) {
        console.log('redirect ehhe');
        next('/login');
    } else {
        next();
    }
});

export default router;
