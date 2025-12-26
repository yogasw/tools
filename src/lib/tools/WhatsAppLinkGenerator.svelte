<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Input from '../components/Input.svelte';
  import Textarea from '../components/Textarea.svelte';

  let phoneNumber = '';
  let message = '';
  let generatedLink = '';
  let error = '';

  function cleanPhoneNumber(phone) {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  function generateLink() {
    error = '';
    generatedLink = '';

    if (!phoneNumber.trim()) {
      error = 'Please enter a phone number';
      return;
    }

    let cleanedNumber = cleanPhoneNumber(phoneNumber);

    // if start with 08, replace with country code 62 (Indonesia) as default
    if (cleanedNumber.startsWith('08')) {
      cleanedNumber = '62' + cleanedNumber.slice(1);
    }

    if (cleanedNumber.length < 6) {
      error = 'Phone number seems too short';
      return;
    }

    // Build WhatsApp link
    const baseUrl = 'https://wa.me/';
    const encodedMessage = message.trim() ? `?text=${encodeURIComponent(message)}` : '';
    generatedLink = `${baseUrl}${cleanedNumber}${encodedMessage}`;
  }

  function copyLink() {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
    }
  }

  function openLink() {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  }

  function clear() {
    phoneNumber = '';
    message = '';
    generatedLink = '';
    error = '';
  }

  // Auto generate when inputs change
  $: if (phoneNumber || message) {
    if (phoneNumber.trim()) {
      generateLink();
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      WhatsApp Link Generator (wa.me)
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Generate wa.me WhatsApp click-to-chat links with pre-filled messages
    </p>
  </div>

  <Card>
    <div class="space-y-4">
      <!-- Phone Number Input -->
      <Input
        bind:value={phoneNumber}
        label="Phone Number"
        placeholder="e.g., +628123456789 or 628123456789"
        type="tel"
        error={error}
      />

      <div class="text-xs text-gray-500 dark:text-gray-400 -mt-2">
        Include country code (e.g., 62 for Indonesia, 1 for USA)
      </div>

      <!-- Message Input -->
      <Textarea
        bind:value={message}
        label="Pre-filled Message (Optional)"
        placeholder="Enter your message here..."
        rows={4}
      />

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <Button on:click={generateLink} variant="primary">
          Generate Link
        </Button>
        <Button on:click={clear} variant="ghost">
          Clear
        </Button>
      </div>

      <!-- Generated Link Display -->
      {#if generatedLink}
        <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated Link
          </span>

          <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <pre class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">{generatedLink}</pre>
          </div>

          <div class="flex gap-2">
            <Button on:click={copyLink} variant="secondary">
              Copy Link
            </Button>
            <Button on:click={openLink} variant="primary">
              Open in WhatsApp
            </Button>
          </div>
        </div>
      {/if}

      <!-- Info Card -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">How to use:</h4>
        <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>1. Enter the phone number with country code</li>
          <li>2. Optionally add a pre-filled message</li>
          <li>3. The link will be generated automatically</li>
          <li>4. Copy the link or open it directly</li>
        </ul>
      </div>
    </div>
  </Card>
</div>
