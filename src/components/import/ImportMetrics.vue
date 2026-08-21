<script setup>
defineProps({
  metrics: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <dl class="import-metrics mb-0">
    <div v-for="metric in metrics" :key="metric.label" class="import-metric">
      <dt class="import-metric-label section-label">{{ metric.label }}</dt>
      <dd class="import-metric-value">{{ metric.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.import-metrics {
  display: flex;
}

.import-metric {
  display: flex;
  flex: 1 1 0;
  flex-direction: column-reverse;
  align-items: center;
  padding-inline: 0.75rem;
  text-align: center;
}

.import-metric + .import-metric {
  border-left: 1px solid var(--bs-border-color);
}

.import-metric-label {
  font-size: 0.75rem;
}

.import-metric-value {
  margin-bottom: 0;
  font-size: var(--import-metric-value-size, 1.25rem);
  font-weight: 600;
  line-height: 1.2;
}
</style>
