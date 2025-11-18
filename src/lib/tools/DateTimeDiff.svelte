<script>
  import moment from 'moment';
  import { onMount } from 'svelte';

  let startDateTime = '';
  let endDateTime = '';
  let startDateTimePicker = '';
  let endDateTimePicker = '';
  let dateFormat = 'YYYY/MM/DD, HH:mm:ss';
  let difference = null;
  let showCopied = false;
  let startPickerInput;
  let endPickerInput;

  onMount(() => {
    // Set default values to current time
    updateDateTimes();
  });

  function updateDateTimes() {
    const nowFormatted = moment().format(dateFormat);
    const nowDatetime = moment().format('YYYY-MM-DDTHH:mm');
    startDateTime = nowFormatted;
    endDateTime = nowFormatted;
    startDateTimePicker = nowDatetime;
    endDateTimePicker = nowDatetime;
    calculateDifference();
  }

  function handleFormatChange() {
    // Reformat existing dates with new format
    if (startDateTime) {
      const parsed = moment(startDateTime);
      if (parsed.isValid()) {
        startDateTime = parsed.format(dateFormat);
      }
    }
    if (endDateTime) {
      const parsed = moment(endDateTime);
      if (parsed.isValid()) {
        endDateTime = parsed.format(dateFormat);
      }
    }
    calculateDifference();
  }

  function calculateDifference() {
    if (!startDateTime || !endDateTime) {
      difference = null;
      return;
    }

    const start = moment(startDateTime);
    const end = moment(endDateTime);

    if (!start.isValid() || !end.isValid()) {
      difference = null;
      return;
    }

    const duration = moment.duration(end.diff(start));
    const absDuration = moment.duration(Math.abs(end.diff(start)));

    difference = {
      years: Math.floor(absDuration.asYears()),
      months: absDuration.months(),
      days: absDuration.days(),
      hours: absDuration.hours(),
      minutes: absDuration.minutes(),
      seconds: absDuration.seconds(),
      totalHours: Math.floor(absDuration.asHours()),
      totalMinutes: Math.floor(absDuration.asMinutes()),
      totalSeconds: Math.floor(absDuration.asSeconds()),
      totalDays: Math.floor(absDuration.asDays()),
      isNegative: end.isBefore(start),
      startFormatted: start.format('MMMM D, YYYY [at] h:mm:ss A'),
      endFormatted: end.format('MMMM D, YYYY [at] h:mm:ss A')
    };
  }

  function swapDates() {
    const temp = startDateTime;
    startDateTime = endDateTime;
    endDateTime = temp;
    calculateDifference();
  }

  function setToNow(target) {
    const nowFormatted = moment().format(dateFormat);
    const nowDatetime = moment().format('YYYY-MM-DDTHH:mm');
    if (target === 'start') {
      startDateTime = nowFormatted;
      startDateTimePicker = nowDatetime;
    } else {
      endDateTime = nowFormatted;
      endDateTimePicker = nowDatetime;
    }
    calculateDifference();
  }

  function openDatePicker(target) {
    if (target === 'start') {
      startPickerInput?.showPicker();
    } else {
      endPickerInput?.showPicker();
    }
  }

  function handlePickerChange(target) {
    if (target === 'start' && startDateTimePicker) {
      const parsed = moment(startDateTimePicker);
      if (parsed.isValid()) {
        startDateTime = parsed.format(dateFormat);
      }
    } else if (target === 'end' && endDateTimePicker) {
      const parsed = moment(endDateTimePicker);
      if (parsed.isValid()) {
        endDateTime = parsed.format(dateFormat);
      }
    }
    calculateDifference();
  }

  function getExactBreakdownText() {
    if (!difference) return '';
    return `${difference.years} Years, ${difference.months} Months, ${difference.days} Days, ${difference.hours} Hours, ${difference.minutes} Minutes, ${difference.seconds} Seconds`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showCopied = true;
    setTimeout(() => {
      showCopied = false;
    }, 2000);
  }

  function getDifferenceText() {
    if (!difference) return '';

    const parts = [];
    if (difference.years > 0) parts.push(`${difference.years} year${difference.years !== 1 ? 's' : ''}`);
    if (difference.months > 0) parts.push(`${difference.months} month${difference.months !== 1 ? 's' : ''}`);
    if (difference.days > 0) parts.push(`${difference.days} day${difference.days !== 1 ? 's' : ''}`);
    if (difference.hours > 0) parts.push(`${difference.hours} hour${difference.hours !== 1 ? 's' : ''}`);
    if (difference.minutes > 0) parts.push(`${difference.minutes} minute${difference.minutes !== 1 ? 's' : ''}`);
    if (difference.seconds > 0) parts.push(`${difference.seconds} second${difference.seconds !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 seconds';
  }

  $: calculateDifference(), startDateTime, endDateTime;
</script>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      ⏱️ Date Time Difference Calculator
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Calculate the precise difference between two dates and times
    </p>
  </div>

  <!-- Format Configuration -->
  <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
    <div class="space-y-2">
      <label for="date-format" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Date Format
      </label>
      <div class="flex gap-2">
        <input
          id="date-format"
          type="text"
          bind:value={dateFormat}
          on:blur={handleFormatChange}
          placeholder="YYYY/MM/DD, HH:mm:ss"
          class="flex-1 px-4 py-2 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono text-sm"
        />
        <button
          on:click={handleFormatChange}
          class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Apply
        </button>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Examples: YYYY/MM/DD, HH:mm:ss | DD-MM-YYYY HH:mm | YYYY-MM-DD HH:mm:ss
      </p>
    </div>
  </div>

  <!-- Input Section -->
  <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-6">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Start Date -->
      <div class="space-y-2">
        <label for="start-datetime" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Start Date & Time
        </label>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Format: {dateFormat}
        </p>
        <div class="flex gap-2 relative">
          <input
            id="start-datetime"
            type="text"
            bind:value={startDateTime}
            placeholder={moment().format(dateFormat)}
            class="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono"
          />
          <div class="relative">
            <button
              on:click={() => openDatePicker('start')}
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Select date"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              bind:this={startPickerInput}
              type="datetime-local"
              bind:value={startDateTimePicker}
              on:change={() => handlePickerChange('start')}
              class="absolute top-0 right-0 w-full h-full opacity-0 cursor-pointer"
              style="pointer-events: none;"
            />
          </div>
        </div>
        <button
          on:click={() => setToNow('start')}
          class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Set to now
        </button>
        {#if startDateTime}
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {difference?.startFormatted || ''}
          </p>
        {/if}
      </div>

      <!-- End Date -->
      <div class="space-y-2">
        <label for="end-datetime" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          End Date & Time
        </label>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Format: {dateFormat}
        </p>
        <div class="flex gap-2 relative">
          <input
            id="end-datetime"
            type="text"
            bind:value={endDateTime}
            placeholder={moment().format(dateFormat)}
            class="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono"
          />
          <div class="relative">
            <button
              on:click={() => openDatePicker('end')}
              class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Select date"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input
              bind:this={endPickerInput}
              type="datetime-local"
              bind:value={endDateTimePicker}
              on:change={() => handlePickerChange('end')}
              class="absolute top-0 right-0 w-full h-full opacity-0 cursor-pointer"
              style="pointer-events: none;"
            />
          </div>
        </div>
        <button
          on:click={() => setToNow('end')}
          class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Set to now
        </button>
        {#if endDateTime}
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {difference?.endFormatted || ''}
          </p>
        {/if}
      </div>
    </div>

    <!-- Swap Button -->
    <div class="flex justify-center mt-4">
      <button
        on:click={swapDates}
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        Swap Dates
      </button>
    </div>
  </div>

  <!-- Results Section -->
  {#if difference}
    <div class="space-y-4">
      <!-- Main Difference -->
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div class="flex items-start justify-between mb-2">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time Difference
          </h2>
          <button
            on:click={() => copyToClipboard(getDifferenceText())}
            class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p class="text-2xl font-bold">
          {#if difference.isNegative}
            <span class="text-red-200">-</span>
          {/if}
          {getDifferenceText()}
        </p>
        {#if difference.isNegative}
          <p class="text-sm text-blue-100 mt-2">
            (End date is before start date)
          </p>
        {/if}
      </div>

      <!-- Detailed Breakdown -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Days</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {difference.totalDays.toLocaleString()}
          </div>
        </div>

        <div class="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {difference.totalHours.toLocaleString()}
          </div>
        </div>

        <div class="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Minutes</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {difference.totalMinutes.toLocaleString()}
          </div>
        </div>

        <div class="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Seconds</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {difference.totalSeconds.toLocaleString()}
          </div>
        </div>
      </div>

      <!-- Exact Breakdown -->
      <div class="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Exact Breakdown
          </h3>
          <button
            on:click={() => copyToClipboard(getExactBreakdownText())}
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy to clipboard"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div class="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p class="text-gray-900 dark:text-white font-mono text-sm select-all">
            {getExactBreakdownText()}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Copied Notification -->
  {#if showCopied}
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Copied to clipboard!
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
</style>
