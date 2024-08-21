<script setup>
import { useRouter } from 'vue-router';
import apiService from '@/services/ApiService';

const router = useRouter();

apiService.logout();

router.push({ name: 'login' });
</script>

<template>
    <div></div>
</template>