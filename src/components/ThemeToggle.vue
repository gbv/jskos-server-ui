<script setup>
import { useId } from "vue"

const model = defineModel({ type: Boolean, required: true })
const props = defineProps({
  label: { type: String, default: null },
})
const switchId = useId()
</script>

<template>
  <div class="theme-switcher-wrapper" :class="{ 'has-label': props.label }">
    <p v-if="props.label" class="theme-switcher-label">{{ props.label }}</p>
    <div class="form-check form-switch theme-switcher mb-0">
      <input
        :id="switchId"
        class="form-check-input"
        type="checkbox"
        role="switch"
        :checked="model"
        :aria-label="model ? 'Switch to light mode' : 'Switch to dark mode'"
        @change="model = $event.target.checked"
      />
      <label class="form-check-label" :for="switchId">
        <span class="theme-switch-icon" :class="{ 'is-dark': model }">
          <svg
            class="sun"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line
              x1="12"
              y1="1"
              x2="12"
              y2="3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="12"
              y1="21"
              x2="12"
              y2="23"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="4.22"
              y1="4.22"
              x2="5.64"
              y2="5.64"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="18.36"
              y1="18.36"
              x2="19.78"
              y2="19.78"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="1"
              y1="12"
              x2="3"
              y2="12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="21"
              y1="12"
              x2="23"
              y2="12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="4.22"
              y1="19.78"
              x2="5.64"
              y2="18.36"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="18.36"
              y1="5.64"
              x2="19.78"
              y2="4.22"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <svg
            class="moon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
      </label>
    </div>
  </div>
</template>
