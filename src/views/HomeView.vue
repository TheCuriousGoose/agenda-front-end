<script setup>
import { ref, onMounted, computed } from 'vue';
import apiService from '@/services/ApiService';

const currentMonth = ref(new Date().getMonth() + 1);
const currentYear = ref(new Date().getFullYear());
const events = ref([]);
const daysInMonth = ref([]);
const dayNames = ref(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
const maxFutureMonths = 2;

async function fetchEvents(month, year) {
  let response = await apiService.events(formatMonth(month), year);
  events.value = response.events;
}

function formatMonth(month) {
  return month < 10 ? `0${month}` : month;
}

function getDaysInMonth(year, month) {
  const date = new Date(year, month, 0);
  return Array.from({ length: date.getDate() }, (_, i) => i + 1);
}

function goBack() {
  let newMonth = currentMonth.value - 1;
  let newYear = currentYear.value;

  if (newMonth < 1) {
    newMonth = 12;
    newYear -= 1;
  }

  currentMonth.value = newMonth;
  currentYear.value = newYear;

  daysInMonth.value = getDaysInMonth(newYear, newMonth);
  fetchEvents(newMonth, newYear);
}

function goForward() {
  let newMonth = currentMonth.value + 1;
  let newYear = currentYear.value;

  if (newMonth > 12) {
    newMonth -= 12;
    newYear += 1;
  }

  if (newYear > currentYear.value || (newYear === currentYear.value && newMonth > currentMonth.value + maxFutureMonths)) {
    return;
  }

  currentMonth.value = newMonth;
  currentYear.value = newYear;

  daysInMonth.value = getDaysInMonth(newYear, newMonth);
  fetchEvents(newMonth, newYear);
}

function isEventOnDay(event, day) {
  const eventDate = new Date(event.start_date);
  return eventDate.getDate() === day;
}

onMounted(async () => {
  daysInMonth.value = getDaysInMonth(currentYear.value, currentMonth.value);
  await fetchEvents(currentMonth.value, currentYear.value);
});

const isBackDisabled = computed(() => {
  return currentMonth.value === 1 && currentYear.value === new Date().getFullYear();
});

const isForwardDisabled = computed(() => {
  const maxMonth = new Date().getMonth() + 1 + maxFutureMonths;
  return (currentYear.value > new Date().getFullYear()) || (currentYear.value === new Date().getFullYear() && currentMonth.value >= maxMonth);
});

const strLimit = (str, limit = 20) => {
  return str.length > limit ? str.substring(0, limit) + '...' : str;
};

const formatDate = (date) => {
  return new Date(date).toLocaleTimeString('nl-NL', { hour: 'numeric', minute: 'numeric' }).toString().replace(':', '');
}

const eventHasManagment = (event) => {
  return event.users.some(user => user.role === 'manager');
}
</script>

<template>
  <main class="mx-2">
    <div class="calendar-header">
      <button @click="goBack" :disabled="isBackDisabled" class="btn btn-secondary">Previous Month</button>
      <h2>{{ currentYear }} - {{ formatMonth(currentMonth) }}</h2>
      <button @click="goForward" :disabled="isForwardDisabled" class="btn btn-secondary">Next Month</button>
    </div>

    <div class="calendar-grid">
      <div class="calendar-day-header" v-for="day in dayNames" :key="day">
        {{ day }}
      </div>
      <div v-for="day in daysInMonth" :key="day" class="card card-body p-2">
        <h4 class="ms-auto text-muted">{{ day }}</h4>
        <div v-for="event in events.filter(event => isEventOnDay(event, day))" :key="event.id"
          class="rounded-pill d-flex align-items-center px-2 mb-1" :class="{
            'bg-primary': !eventHasManagment(event),
            'bg-danger': eventHasManagment(event)
          }">
          <span class="text-white mb-0">{{ strLimit(event.title, 15) }} {{ formatDate(event.start_date)
            }}-{{ formatDate(event.end_date) }}</span>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}
</style>
