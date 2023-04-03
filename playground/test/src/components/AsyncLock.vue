<script setup lang="ts">
import { createAsyncLock } from '@yunlefun/utils'
import { sleep } from '@yunyoujun/utils'
import consola from 'consola'

async function doAsyncTask() {
  consola.info('Sleep Start')
  await sleep(3000)
  consola.success('Sleep Done')
}

const doAsyncLockTask = createAsyncLock(doAsyncTask)
</script>

<template>
  <div class="card">
    <button type="button" @click="doAsyncLockTask">
      createAsyncLock
    </button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
