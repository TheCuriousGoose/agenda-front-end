<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiService from '@/services/ApiService';

const router = useRouter();

const email = ref('');
const password = ref('');

const login = async () => {
    const success = await apiService.login(email.value, password.value);
    if (success) {
        router.push({ name: 'home' });
    } else {
        alert('Invalid credentials');
    }
};
</script>

<template>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">Login</div>
                    <div class="card-body">
                        <form @submit.prevent="login">
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" class="form-control" id="email" v-model="email" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" class="form-control" id="password" v-model="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    margin-top: 50px;
}
</style>
