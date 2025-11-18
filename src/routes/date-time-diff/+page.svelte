<script>
  import { onMount } from 'svelte';
  import DateTimeDiff from '$lib/tools/DateTimeDiff.svelte';
  import { recentTools } from '$lib/stores/recent.js';

  onMount(() => {
    recentTools.addRecent('date-time-diff');
  });
</script>

<svelte:head>
  <title>Date Time Difference Calculator - Tools Collection</title>
  <meta name="description" content="Calculate the precise difference between two dates and times. Get results in years, months, days, hours, minutes, and seconds." />
  <meta name="keywords" content="date difference, time difference, date calculator, duration calculator, time calculator, date time diff" />
</svelte:head>

<div class="py-8">
  <DateTimeDiff />
</div>
