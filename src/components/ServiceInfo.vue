<script setup>
import { BCard } from "bootstrap-vue-next"
import IconCheckCircleFill from "~icons/bi/check-circle-fill"
import IconLockFill from "~icons/bi/lock-fill"
import IconUnlockFill from "~icons/bi/unlock-fill"
import IconDashCircle from "~icons/bi/dash-circle"
import IconBoxArrowUpRight from "~icons/bi/box-arrow-up-right"

defineProps({
  info: Object,
  authorization: Object,
  isLoggedIn: Boolean,
})

const CAPABILITY_TYPES = [
  "schemes",
  "concepts",
  "mappings",
  "concordances",
  "annotations",
  "registries",
  "types",
  "occurrences",
]
const CAPABILITY_ACTIONS = ["read", "create", "update", "delete"]
</script>

<template>
  <BCard v-if="info" no-body>
    <div class="card-body">
      <dl class="row small mb-0">
        <dt class="col-sm-4 text-muted">Title</dt>
        <dd class="col-sm-8 mb-1">{{ info.prefLabel?.en ?? "—" }}</dd>

        <dt class="col-sm-4 text-muted">URL</dt>
        <dd class="col-sm-8 mb-1">
          <a :href="info.endpoint" target="_blank" rel="noopener">
            <code>{{ info.endpoint }}</code>
            <IconBoxArrowUpRight class="ms-1" />
          </a>
        </dd>

        <dt class="col-sm-4 text-muted">API</dt>
        <dd class="col-sm-8 mb-1">
          {{ info.api?.split("/")?.pop() }} {{ info.API_VERSION }}
        </dd>

        <dt class="col-sm-4 text-muted">Server Version</dt>
        <dd class="col-sm-8 mb-1">{{ info.version ?? "—" }}</dd>

        <dt class="col-sm-4 text-muted">Environment</dt>
        <dd class="col-sm-8 mb-1">{{ info.ENV ?? "—" }}</dd>

        <dt class="col-sm-4 text-muted">Authentication</dt>
        <dd class="col-sm-8 mb-0">
          {{ info.AUTH ? "Required" : "Not required" }}
        </dd>
      </dl>

      <hr class="my-3" />

      <table class="table table-sm table-borderless small mb-0">
        <thead>
          <tr>
            <th class="text-muted fw-normal ps-0">Type</th>
            <th
              v-for="action in CAPABILITY_ACTIONS"
              :key="action"
              class="text-muted fw-normal text-center text-capitalize"
            >
              {{ action }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="type in CAPABILITY_TYPES" :key="type">
            <td class="text-capitalize ps-0 align-middle">{{ type }}</td>
            <td
              v-for="action in CAPABILITY_ACTIONS"
              :key="action"
              class="text-center align-middle"
            >
              <template v-if="info.CAPABILITIES?.[type] === null">
                <IconDashCircle
                  v-if="action === 'read'"
                  class="text-secondary"
                />
              </template>
              <template
                v-else-if="info.CAPABILITIES?.[type]?.[action] === null"
              >
                <IconDashCircle class="text-secondary" />
              </template>
              <template
                v-else-if="info.CAPABILITIES?.[type]?.[action]?.requiresAuth"
              >
                <IconLockFill v-if="!isLoggedIn" class="text-warning" />
                <IconUnlockFill
                  v-else-if="authorization?.[type]?.[action]"
                  class="text-success"
                />
                <IconLockFill v-else class="text-danger" />
              </template>
              <IconCheckCircleFill v-else class="text-success" />
            </td>
          </tr>
        </tbody>
      </table>

      <div
        class="d-flex flex-wrap column-gap-3 row-gap-1 mt-2 small text-muted"
      >
        <span class="d-inline-flex align-items-center"
          ><IconCheckCircleFill class="text-success me-1" />Open</span
        >
        <span class="d-inline-flex align-items-center"
          ><IconLockFill class="text-warning me-1" />Auth required</span
        >
        <span v-if="isLoggedIn" class="d-inline-flex align-items-center"
          ><IconUnlockFill class="text-success me-1" />Authorized</span
        >
        <span v-if="isLoggedIn" class="d-inline-flex align-items-center"
          ><IconLockFill class="text-danger me-1" />Not authorized</span
        >
        <span class="d-inline-flex align-items-center"
          ><IconDashCircle class="text-secondary me-1" />Not supported</span
        >
      </div>
    </div>
  </BCard>
</template>

<style scoped>
td :deep(svg) {
  display: inline-block;
  vertical-align: middle;
}
</style>
