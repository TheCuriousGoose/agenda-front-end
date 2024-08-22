<script setup>
import { ref, onMounted, computed } from 'vue';
import { Modal } from 'bootstrap';
import apiService from '@/services/ApiService';

const currentMonth = ref(new Date().getMonth() + 1);
const currentYear = ref(new Date().getFullYear());
const events = ref([]);
const daysInMonth = ref([]);
const dayNames = ref(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
const maxFutureMonths = 2;
const modalEvent = ref({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    users: []
});
const users = ref([]);
const firstDayOffset = ref(0);

const userRole = JSON.parse(localStorage.getItem('auth')).user.role;

async function fetchEvents(month, year) {
    let response = await apiService.events(formatMonth(month), year);
    events.value = response.events;
}

async function fetchUsers() {
    let response = await apiService.users();
    users.value = response.users;
}

function formatMonth(month) {
    return month < 10 ? `0${month}` : month;
}

function formatMonthText(monthNumber) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'long' });
}

function getDaysInMonth(year, month) {
    const date = new Date(year, month - 1, 1);
    firstDayOffset.value = date.getDay(); // Get the day of the week the month starts on
    date.setMonth(month);
    date.setDate(0);
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

const isBackDisabled = computed(() => {
    return currentMonth.value === new Date().getMonth() + 1;
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
    return event.users.some(user => { return user.role === 'management' });
}

function isWeekend(dayNumber) {
    const date = new Date(currentYear.value, currentMonth.value - 1, dayNumber);
    return date.getDay() === 0 || date.getDay() === 6;
}

async function openEventModal(event) {
    let eventResponse = await apiService.event(event.id);
    modalEvent.value = eventResponse.event;
    const modal = new Modal(document.getElementById('eventModal'));
    modal.show();
}

onMounted(async () => {
    daysInMonth.value = getDaysInMonth(currentYear.value, currentMonth.value);
    await fetchEvents(currentMonth.value, currentYear.value);
    await fetchUsers();

    setInterval(async () => {
        await fetchEvents(currentMonth.value, currentYear.value);
    }, 60000);
});

const selectedUserIds = computed({
    get() {
        return modalEvent.value.users.map(user => user.id);
    },
    set(newIds) {
        modalEvent.value.users = users.value.filter(user => newIds.includes(user.id));
    }
});
</script>

<template>
    <main class="mx-2">
        <div class="calendar-header">
            <button @click="goBack" :disabled="isBackDisabled" class="btn btn-secondary">Previous Month</button>
            <h2>{{ currentYear }} - {{ formatMonthText(currentMonth) }}</h2>
            <button @click="goForward" :disabled="isForwardDisabled" class="btn btn-secondary">Next Month</button>
        </div>

        <div class="calendar-grid">
            <div class="calendar-day-header" v-for="day in dayNames" :key="day">
                {{ day }}
            </div>
            <!-- Empty cells for the days before the first day of the month -->
            <div v-for="n in firstDayOffset" :key="'empty-' + n" class="empty-cell"></div>
            <div v-for="day in daysInMonth" :key="day" class="card card-body p-2" :class="{
                'bg-light': isWeekend(day)
            }">
                <div class="d-flex">
                    <div style="width: 1rem" v-if="userRole == 'office' || userRole == 'management'">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                            <path
                                d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                        </svg>
                    </div>
                    <h4 class="ms-auto text-muted">{{ day }}</h4>
                </div>
                <div v-for="event in events.filter(event => isEventOnDay(event, day))" :key="event.id"
                    @click="openEventModal(event)" class="rounded-pill d-flex align-items-center px-2 mb-1" :class="{
                        'bg-primary': !eventHasManagment(event),
                        'bg-warning': eventHasManagment(event)
                    }">
                    <span class="text-white mb-0">{{ strLimit(event.title, 15) }} {{ formatDate(event.start_date)
                        }}-{{ formatDate(event.end_date) }}</span>
                </div>
            </div>
        </div>
    </main>
    <div class="modal modal-lg" id="eventModal">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Event Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div v-if="userRole == 'user'">
                        <h5>{{ modalEvent?.title }}</h5>
                        <hr>
                        <p>{{ modalEvent?.description }}</p>
                        <p>{{ formatDate(modalEvent?.start_date) }} - {{ formatDate(modalEvent?.end_date) }}</p>
                        <p>Users:</p>
                        <ul>
                            <li v-for="user in modalEvent?.users" :key="user.id">
                                <span>{{ user.name }}</span>
                            </li>
                        </ul>
                    </div>
                    <div v-else>
                        <div class="row">
                            <div class="col-8">
                                <label for="title" class="form-label fw-bold">Title</label>
                                <input type="text" id="title" class="form-control" v-model="modalEvent.title">
                                <hr>
                                <label for="description" class="form-label fw-bold">Description</label>
                                <textarea id="description" class="form-control"
                                    v-model="modalEvent.description"></textarea>
                                <div class="row">
                                    <div class="col-6">
                                        <label for="start_date" class="form-label fw-bold">Start Date</label>
                                        <input type="datetime-local" lang="nl-NL" id="start_date" class="form-control"
                                            v-model="modalEvent.start_date">
                                    </div>
                                    <div class="col-6">
                                        <label for="end_date" class="form-label fw-bold">End Date</label>
                                        <input type="datetime-local" lang="nl-NL" id="end_date" class="form-control"
                                            v-model="modalEvent.end_date">
                                    </div>
                                </div>
                            </div>
                            <div class="col-4">
                                <label for="users" class="form-label fw-bold">Attendees</label>
                                <select id="users" class="form-select h-100" multiple v-model="selectedUserIds">
                                    <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <hr class="mt-5">
                        <button class="btn btn-primary">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
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
