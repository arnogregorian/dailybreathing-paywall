import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// Widget initialization function
window.initDailyBreathingPaywall = function(containerId = 'daily-breathing-paywall') {
  // Check if already initialized
  if (window._dailyBreathingPaywallInitialized) {
    console.warn('Daily Breathing Paywall already initialized')
    return document.getElementById(containerId)
  }

  // Create container if it doesn't exist
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
  }

  // Create and mount Vue app
  const app = createApp(App)
  app.mount(container)
  
  window._dailyBreathingPaywallInitialized = true
  return container
}

// Auto-initialize if data attribute is present
function autoInit() {
  const autoInitElement = document.querySelector('[data-daily-breathing-paywall]')
  if (autoInitElement && !window._dailyBreathingPaywallInitialized) {
    const containerId = autoInitElement.getAttribute('data-daily-breathing-paywall') || 'daily-breathing-paywall'
    // Use the element itself as container if it has an ID, otherwise use the ID from attribute
    if (autoInitElement.id) {
      window.initDailyBreathingPaywall(autoInitElement.id)
    } else {
      autoInitElement.id = containerId
      window.initDailyBreathingPaywall(containerId)
    }
  }
}

// Wait for DOM to be ready and retry if needed
function waitForDOM() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Try immediately
      autoInit()
      // Also retry after a short delay in case elements are added dynamically
      setTimeout(autoInit, 100)
    })
  } else {
    // DOM already ready, try immediately
    autoInit()
    // Also retry after a short delay
    setTimeout(autoInit, 100)
  }
  
  // Also listen for mutations in case elements are added later
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!window._dailyBreathingPaywallInitialized) {
        autoInit()
      }
    })
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    })
  }
}

waitForDOM()
