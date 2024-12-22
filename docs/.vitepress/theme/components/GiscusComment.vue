<template>
  <div style="margin-top: 24px">
    <Giscus
        id="comments"
        repo="BetterWilson/blogs-comment-store"
        repoid="R_kgDONWE5dg"
        category="General"
        categoryid="DIC_kwDONWE5ds4Ckr7H"
        mapping="pathname"
        term="Welcome to giscus!"
        reactionsenabled="1"
        emitmetadata="0"
        inputposition="top"
        loading="lazy"
        :theme="isDark ? 'dark' : 'light'"
        :key="route.path"
        crossorigin="anonymous"
    ></Giscus>
  </div>
</template>

<script setup>
import Giscus from '@giscus/vue';
import { useRoute, useData } from 'vitepress';

const route = useRoute();
const { isDark } = useData();
</script>