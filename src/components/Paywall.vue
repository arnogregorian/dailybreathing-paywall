<template>
  <div class="paywall">
    <div class="paywall-container">
      <div class="paywall-header">
        <h1>Unlock Premium Features</h1>
        <p>Choose the plan that's right for you</p>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading subscription options...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadOfferings" class="btn-retry">Retry</button>
      </div>

      <div v-else-if="packages.length === 0" class="no-packages">
        <p>No subscription packages available at this time.</p>
      </div>

      <div v-else class="packages-grid">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="package-card"
          :class="{ 'featured': isAnnualPackage(pkg) }"
        >
          <div v-if="isAnnualPackage(pkg)" class="badge">Best Value</div>
          <h3>{{ getPackageTitle(pkg) }}</h3>
          <div class="price">
            <span class="amount">{{ formatTrialPrice(pkg) }}</span>
            <span class="period">for 7 days</span>
          </div>
          <div class="regular-price">
            Then {{ formatPrice(pkg) }}<span v-if="isMonthlyPackage(pkg)">/month</span><span v-else-if="isAnnualPackage(pkg)">/year</span>
          </div>
          <p class="description">{{ getPackageDescription(pkg) }}</p>
          <button
            @click="purchasePackage(pkg)"
            :disabled="purchasing"
            class="btn-purchase"
          >
            {{ purchasing ? 'Processing...' : 'Subscribe' }}
          </button>
        </div>
      </div>

      <div class="paywall-footer">
        <button @click="restorePurchases" class="btn-restore" :disabled="restoring">
          {{ restoring ? 'Restoring...' : 'Restore Purchases' }}
        </button>
        <div class="terms">
          <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
          <p>Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import stripeService from '../services/stripe.js'
import supabase from '../services/supabase.js'

const loading = ref(true)
const error = ref(null)
const packages = ref([])
const purchasing = ref(false)
const restoring = ref(false)
const user = ref(null)

const loadOfferings = async () => {
  try {
    loading.value = true
    error.value = null
    
    await stripeService.initialize()
    const pricesData = await stripeService.getPrices()
    
    console.log('Prices received:', pricesData)
    
    if (pricesData?.prices && pricesData.prices.length > 0) {
      // Convert Stripe prices to package format
      packages.value = pricesData.prices.map(price => ({
        id: price.id,
        priceId: price.id,
        interval: price.interval,
        intervalCount: price.intervalCount,
        amount: price.unitAmount,
        currency: price.currency,
        formattedAmount: price.formattedAmount,
        planType: price.interval === 'month' ? 'monthly' : price.interval === 'year' ? 'annual' : 'other'
      }))
      console.log('Packages loaded:', packages.value)
    } else {
      packages.value = []
    }
  } catch (err) {
    error.value = err.message || 'Failed to load subscription options'
    console.error('Error loading prices:', err)
  } finally {
    loading.value = false
  }
}

const purchasePackage = async (pkg) => {
  try {
    purchasing.value = true
    error.value = null
    
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Please sign in to purchase a subscription')
    }
    
    await stripeService.purchaseSubscription(
      pkg.priceId,
      pkg.planType,
      currentUser.id,
      'https://daily-breathing.com/welcome/',
      `${window.location.origin}/?checkout=cancel`
    )
    
    // Note: User will be redirected to Stripe Checkout, so we won't reach here
  } catch (err) {
    if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
      error.value = 'Purchase was cancelled'
    } else {
      error.value = err.message || 'Purchase failed. Please try again.'
    }
    console.error('Purchase error:', err)
    purchasing.value = false
  }
}

const restorePurchases = async () => {
  try {
    restoring.value = true
    error.value = null
    
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      throw new Error('Please sign in to restore purchases')
    }
    
    const result = await stripeService.restorePurchases()
    
    if (result.hasActiveSubscription) {
      alert('Purchases restored successfully!')
    } else {
      alert('No active subscriptions found.')
    }
  } catch (err) {
    error.value = err.message || 'Failed to restore purchases'
    console.error('Restore error:', err)
  } finally {
    restoring.value = false
  }
}

const getPackageTitle = (pkg) => {
  if (pkg.planType === 'monthly') return 'Monthly'
  if (pkg.planType === 'annual') return 'Annual'
  return 'Subscription'
}

const getPackageDescription = (pkg) => {
  if (pkg.planType === 'monthly') return 'Billed monthly'
  if (pkg.planType === 'annual') return 'Billed annually'
  return ''
}

const formatPrice = (pkg) => {
  return pkg.formattedAmount || 'N/A'
}

const formatTrialPrice = (pkg) => {
  // Show 0.01 for trial period
  const currency = pkg.currency || 'EUR'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(0.01)
}

const isMonthlyPackage = (pkg) => {
  return pkg.interval === 'month' || pkg.planType === 'monthly'
}

const isAnnualPackage = (pkg) => {
  return pkg.interval === 'year' || pkg.planType === 'annual'
}

onMounted(() => {
  loadOfferings()
})
</script>

<style scoped>
.paywall {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.paywall-container {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1000px;
  width: 100%;
}

.paywall-header {
  text-align: center;
  margin-bottom: 3rem;
}

.paywall-header h1 {
  font-size: 2.5rem;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.paywall-header p {
  font-size: 1.1rem;
  color: #666;
}

.loading, .error, .no-packages {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #5568d3;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.package-card {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s;
  background: white;
}

.package-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.package-card.featured {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
}

.badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.package-card h3 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 1rem;
  margin-top: 0.5rem;
}

.price {
  margin-bottom: 1rem;
}

.amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.period {
  font-size: 1rem;
  color: #666;
  margin-left: 0.25rem;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
  min-height: 3rem;
  font-size: 0.95rem;
}

.regular-price {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.btn-purchase {
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-purchase:hover:not(:disabled) {
  background: #5568d3;
}

.btn-purchase:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.package-card.featured .btn-purchase {
  background: #764ba2;
}

.package-card.featured .btn-purchase:hover:not(:disabled) {
  background: #63408a;
}

.paywall-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.btn-restore {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.95rem;
  text-decoration: underline;
  margin-bottom: 1rem;
  padding: 0.5rem;
}

.btn-restore:hover:not(:disabled) {
  color: #5568d3;
}

.btn-restore:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.terms {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #999;
  line-height: 1.6;
}

.terms p {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .paywall-container {
    padding: 2rem 1.5rem;
  }

  .paywall-header h1 {
    font-size: 2rem;
  }

  .packages-grid {
    grid-template-columns: 1fr;
  }
}
</style>
