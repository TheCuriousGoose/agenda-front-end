import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';

import './assets/scss/app.scss';
import 'bootstrap';

const pinia = createPinia();

pinia.use(createPersistedState());

const app = createApp(App);

app.use(router);
app.use(pinia);

app.mount('#app');
