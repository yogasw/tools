<script lang="ts">
  import JsonParser from "../../tools/JsonParser.svelte";
  
  let {
    importJsonInput = $bindable(""),
    onconfigure
  }: {
    importJsonInput?: string;
    onconfigure?: () => void;
  } = $props();

  function openMappingModal() {
    onconfigure?.();
  }
</script>

<div class="w-1/3 min-w-[300px] max-w-[500px] border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
   <!-- JsonParser with Input Only (hideOutput=true) -->
   <div class="flex-1 overflow-hidden">
     <JsonParser bind:inputText={importJsonInput} hideHeader={true} hideOutput={true} />
   </div>

   <!-- Configure Mapping Button - Fixed at bottom -->
   <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
      <button 
        onclick={openMappingModal}
        class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        Configure Field Mapping
      </button>
   </div>
</div>
