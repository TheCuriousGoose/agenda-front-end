import { ref, watch } from 'vue';

const useLocalStorage = (key, initialValue) => {
    const value = ref(initialValue);

    watch(
        value,
        () => {
            localStorage.setItem(key, JSON.stringify(value.value));
        },
        { deep: true }
    );

    const storedValue = localStorage.getItem(key);
    if (storedValue) {
        value.value = JSON.parse(storedValue);
    }

    return value;
};

export default useLocalStorage;
