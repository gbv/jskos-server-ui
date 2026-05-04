<script setup>
import { BButton, BBadge, BSpinner, BCard, BAlert } from "bootstrap-vue-next"
import {
  BIconCheckCircleFill,
  BIconLockFill,
  BIconDashCircle,
} from "bootstrap-icons-vue"

defineProps({ info: Object })

const CAPABILITY_TYPES = [
  "schemes",
  "concepts",
  "mappings",
  "concordances",
  "annotations",
  "registries",
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
          <code>{{ info.endpoint }}</code>
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
            <td class="text-capitalize ps-0">{{ type }}</td>
            <td
              v-for="action in CAPABILITY_ACTIONS"
              :key="action"
              class="text-center"
            >
              <template v-if="info.CAPABILITIES?.[type] === null">
                <BIconDashCircle
                  v-if="action === 'read'"
                  class="text-secondary"
                />
              </template>
              <template
                v-else-if="info.CAPABILITIES?.[type]?.[action] === null"
              >
                <BIconDashCircle class="text-secondary" />
              </template>
              <BIconLockFill
                v-else-if="info.CAPABILITIES?.[type]?.[action]?.requiresAuth"
                class="text-warning"
              />
              <BIconCheckCircleFill v-else class="text-success" />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="d-flex gap-3 mt-2 small text-muted">
        <span class="d-inline-flex align-items-center"
          ><BIconCheckCircleFill class="text-success me-1" />Open</span
        >
        <span class="d-inline-flex align-items-center"
          ><BIconLockFill class="text-warning me-1" />Auth required</span
        >
        <span class="d-inline-flex align-items-center"
          ><BIconDashCircle class="text-secondary me-1" />Not supported</span
        >
      </div>
    </div>
  </BCard>
</template>
