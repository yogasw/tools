<script>
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';
  import Textarea from '../components/Textarea.svelte';

  let input = '';
  let output = '';
  let error = '';
  let mode = 'encode'; // encode or decode

  function encodeBase64() {
    error = '';
    try {
      output = btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
      error = 'Failed to encode: ' + e.message;
      output = '';
    }
  }

  function decodeBase64() {
    error = '';
    try {
      output = decodeURIComponent(escape(atob(input)));
    } catch (e) {
      error = 'Failed to decode: Invalid Base64 string';
      output = '';
    }
  }

  function process() {
    if (!input.trim()) {
      error = 'Please enter some text';
      output = '';
      return;
    }

    if (mode === 'encode') {
      encodeBase64();
    } else {
      decodeBase64();
    }
  }

  function copyToClipboard() {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  }

  function clear() {
    input = '';
    output = '';
    error = '';
  }

  function switchMode() {
    // Swap input and output when switching modes
    const temp = input;
    input = output;
    output = temp;
    mode = mode === 'encode' ? 'decode' : 'encode';
    error = '';
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      Base64 Encoder/Decoder
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Encode text to Base64 or decode Base64 strings
    </p>
  </div>

  <Card>
    <div class="space-y-4">
      <!-- Mode selector -->
      <div class="flex gap-2">
        <Button
          variant={mode === 'encode' ? 'primary' : 'outline'}
          on:click={() => { mode = 'encode'; error = ''; }}
        >
          Encode
        </Button>
        <Button
          variant={mode === 'decode' ? 'primary' : 'outline'}
          on:click={() => { mode = 'decode'; error = ''; }}
        >
          Decode
        </Button>
      </div>

      <!-- Input -->
      <Textarea
        bind:value={input}
        label={mode === 'encode' ? 'Text to encode' : 'Base64 string to decode'}
        placeholder={mode === 'encode' ? 'Enter text here...' : 'Enter Base64 string here...'}
        rows={6}
      />

      <!-- Action buttons -->
      <div class="flex gap-2">
        <Button on:click={process} variant="primary">
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </Button>
        <Button on:click={switchMode} variant="secondary">
          Switch & Swap
        </Button>
        <Button on:click={clear} variant="ghost">
          Clear
        </Button>
      </div>

      <!-- Error message -->
      {#if error}
        <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      <!-- Output -->
      {#if output}
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Result
            </span>
            <Button on:click={copyToClipboard} size="sm" variant="secondary">
              Copy
            </Button>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <pre class="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all font-mono">{output}</pre>
          </div>
        </div>
      {/if}
    </div>
  </Card>
</div>
