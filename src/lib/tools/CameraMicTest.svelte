<script>
  import { onDestroy } from 'svelte';
  import Card from '../components/Card.svelte';
  import Button from '../components/Button.svelte';

  let videoElement;
  let audioContext;
  let analyser;
  let microphone;
  let stream;

  let cameraStatus = 'idle'; // idle, requesting, granted, denied, error
  let micStatus = 'idle';
  let cameraError = '';
  let micError = '';
  let audioLevel = 0;
  let animationFrame;

  async function testCamera() {
    cameraStatus = 'requesting';
    cameraError = '';

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      stream = mediaStream;
      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }
      cameraStatus = 'granted';
    } catch (err) {
      cameraStatus = 'denied';
      cameraError = err.message;
      console.error('Camera error:', err);
    }
  }

  async function testMicrophone() {
    micStatus = 'requesting';
    micError = '';

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });

      // Setup audio context for visualization
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(mediaStream);
      microphone.connect(analyser);
      analyser.fftSize = 256;

      micStatus = 'granted';
      visualizeAudio();

      if (!stream) {
        stream = mediaStream;
      } else {
        mediaStream.getTracks().forEach(track => stream.addTrack(track));
      }
    } catch (err) {
      micStatus = 'denied';
      micError = err.message;
      console.error('Microphone error:', err);
    }
  }

  function visualizeAudio() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      if (micStatus !== 'granted') return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      audioLevel = Math.min(100, (average / 255) * 100 * 3); // Scale up for visibility

      animationFrame = requestAnimationFrame(draw);
    }

    draw();
  }

  async function testBoth() {
    await Promise.all([testCamera(), testMicrophone()]);
  }

  function stopAll() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    cameraStatus = 'idle';
    micStatus = 'idle';
    audioLevel = 0;
    cameraError = '';
    micError = '';
  }

  function getStatusColor(status) {
    switch(status) {
      case 'granted': return 'text-green-600 dark:text-green-400';
      case 'denied': return 'text-red-600 dark:text-red-400';
      case 'requesting': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }

  function getStatusText(status) {
    switch(status) {
      case 'granted': return '✓ Granted';
      case 'denied': return '✗ Denied';
      case 'requesting': return '⌛ Requesting...';
      default: return '○ Not tested';
    }
  }

  onDestroy(() => {
    stopAll();
  });
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      Camera & Microphone Test
    </h2>
    <p class="text-gray-600 dark:text-gray-400">
      Test your camera and microphone permissions and functionality
    </p>
  </div>

  <Card>
    <div class="space-y-6">
      <!-- Status Display -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Camera</span>
            <span class={getStatusColor(cameraStatus)}>
              {getStatusText(cameraStatus)}
            </span>
          </div>
          {#if cameraError}
            <p class="text-xs text-red-600 dark:text-red-400">{cameraError}</p>
          {/if}
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-900 dark:text-gray-100">Microphone</span>
            <span class={getStatusColor(micStatus)}>
              {getStatusText(micStatus)}
            </span>
          </div>
          {#if micError}
            <p class="text-xs text-red-600 dark:text-red-400">{micError}</p>
          {/if}
        </div>
      </div>

      <!-- Test Buttons -->
      <div class="flex flex-wrap gap-2">
        <Button on:click={testCamera} variant="primary">
          Test Camera
        </Button>
        <Button on:click={testMicrophone} variant="primary">
          Test Microphone
        </Button>
        <Button on:click={testBoth} variant="secondary">
          Test Both
        </Button>
        <Button on:click={stopAll} variant="ghost">
          Stop All
        </Button>
      </div>

      <!-- Camera Preview -->
      {#if cameraStatus === 'granted'}
        <div class="space-y-2">
          <h3 class="font-medium text-gray-900 dark:text-gray-100">Camera Preview</h3>
          <div class="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              bind:this={videoElement}
              autoplay
              playsinline
              muted
              class="w-full h-full object-contain"
            ></video>
          </div>
        </div>
      {/if}

      <!-- Microphone Level -->
      {#if micStatus === 'granted'}
        <div class="space-y-2">
          <h3 class="font-medium text-gray-900 dark:text-gray-100">Microphone Level</h3>
          <div class="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
              style="width: {audioLevel}%"
            ></div>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Speak into your microphone to see the audio level
          </p>
        </div>
      {/if}
    </div>
  </Card>
</div>
