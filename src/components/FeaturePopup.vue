<script setup lang="ts">
defineProps<{
    title?: string;
    description?: string;
}>();
</script>

<template>
    <div class="tge-popup" v-if="title || description">
        <h3 v-if="title" class="tge-popup__title">{{ title }}</h3>
        <p v-if="description" class="tge-popup__description">{{ description }}</p>
    </div>
</template>
