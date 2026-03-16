<template>
  <div ref="containerRef" class="otp-slots">
    <input
      v-for="(_, i) in 6"
      :key="i"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="1"
      :value="digitAt(i)"
      class="otp-slot"
      :class="{ filled: digitAt(i) !== '' }"
      autocomplete="one-time-code"
      aria-label="Digit {{ i + 1 }}"
      @input="onInput(i, $event)"
      @paste="onPaste($event)"
      @keydown="onKeydown(i, $event)"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)

const digits = computed(() => {
  const s = (props.modelValue || '').replace(/\D/g, '').slice(0, 6)
  return s.split('')
})

function digitAt(i) {
  return digits.value[i] ?? ''
}

function setValue(str) {
  const cleaned = (str || '').replace(/\D/g, '').slice(0, 6)
  emit('update:modelValue', cleaned)
}

function onInput(index, e) {
  const raw = e.target.value
  if (raw.length > 1) {
    setValue(raw)
    focusSlot(5)
    return
  }
  const d = raw.replace(/\D/g, '')
  const current = (props.modelValue || '').replace(/\D/g, '').slice(0, 6)
  const arr = current.split('')
  arr[index] = d
  const next = arr.join('').slice(0, 6)
  emit('update:modelValue', next)
  if (d && index < 5) {
    focusSlot(index + 1)
  }
}

function onPaste(e) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (text) {
    setValue(text)
    focusSlot(Math.min(text.length, 6) - 1)
  }
}

function onKeydown(index, e) {
  if (e.key === 'Backspace' && !digitAt(index) && index > 0) {
    e.preventDefault()
    focusSlot(index - 1)
  }
}

function focusSlot(index) {
  nextTick(() => {
    setTimeout(() => {
      const slots = containerRef.value?.querySelectorAll('.otp-slot')
      const el = slots?.[index]
      if (el) el.focus()
    }, 0)
  })
}
</script>

<style scoped>
.otp-slots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.otp-slot {
  width: 2.75rem;
  height: 3.25rem;
  text-align: center;
  font-size: 1.75rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  background: transparent;
  color: white;
  padding: 0;
  line-height: 1;
}

.otp-slot::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.otp-slot.filled {
  border-color: rgba(255, 255, 255, 0.8);
}

.otp-slot:focus {
  border-color: rgba(255, 255, 255, 0.95);
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

@media (min-width: 400px) {
  .otp-slot {
    width: 3rem;
    height: 3.5rem;
    font-size: 2rem;
  }
}
</style>
