<template>
  <div class="subscription-flow">
    <!-- Product Selection and Registration -->
    <div v-if="!user && !showSignIn">
      <h2>Choose Your Plan</h2>

      <div v-if="activePromo" class="promo-banner">
        <span class="promo-tag">{{ activePromo.code }}</span>
        <span class="promo-text">{{ activePromo.discountPercent }}% off applied automatically at checkout</span>
      </div>

      <div v-if="error">
        {{ error }}
        <button type="button" class="btn-primary" @click="loadOfferings">Retry</button>
      </div>

      <div v-else-if="packages.length === 0 && !loading">
        No subscription packages available at this time.
      </div>

      <div v-if="loading" class="packages-list">
        <div v-for="n in 2" :key="n" class="package-item loading-skeleton">
          <div class="package-header">
            <div class="skeleton-title"></div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-price"></div>
          <div class="skeleton-description"></div>
        </div>
      </div>

      <div v-else class="packages-list">
        <div
          v-for="pkg in packages"
          :key="pkg.identifier"
          class="package-item"
          :class="{ 
            'selected': selectedPackageId === pkg.identifier,
            'yearly': isAnnualPackage(pkg),
            'monthly': isMonthlyPackage(pkg)
          }"
          @click="selectPackage(pkg)"
        >
          <div v-if="isAnnualPackage(pkg) && calculateSavingsPercentage()" class="package-badge">
            SAVE {{ calculateSavingsPercentage() }}%
          </div>
          <div class="package-content">
            <div class="package-left">
              <h3 class="package-title">{{ isAnnualPackage(pkg) ? 'Yearly' : 'Monthly' }}</h3>
              <div class="package-price-line">
                <template v-if="activePromo">
                  <span class="price-original">{{ formatPrice(pkg) }}</span>
                  <span class="price-discounted">{{ formatDiscountedPrice(pkg) }}</span>
                </template>
                <template v-else>
                  {{ formatPrice(pkg) }}
                </template>
                {{ isMonthlyPackage(pkg) ? '/ month' : '/ year' }}
              </div>
            </div>
            <div class="package-right">
              <div class="package-price">Free</div>
              <div class="package-price-period">for the first 7 days</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Registration Form -->
      <div v-if="!loading && packages.length > 0" style="margin-top: 2rem;">
        <h2>Create Your Account</h2>
        
        <div v-if="authError" class="error-message">
          {{ authError }}
        </div>

        <form @submit.prevent="handleSignUp">
          <div>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              placeholder="Name"
              class="form-input"
            />
          </div>
          <div>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="Email"
              class="form-input"
            />
          </div>
          <div>
            <input
              id="confirmEmail"
              v-model="confirmEmail"
              type="email"
              required
              placeholder="Confirm Email"
              class="form-input"
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="registering || !selectedPackage">
            {{ registering ? 'Creating Account...' : 'Create Account & Start' }}
          </button>
          
          <p class="terms-text">
            By creating an account, you agree to our <a href="https://daily-breathing.com/terms-conditions/" target="_blank" rel="noopener noreferrer">terms</a> and <a href="https://daily-breathing.com/privacypolicy/" target="_blank" rel="noopener noreferrer">privacy policy</a>.
          </p>
          <p class="auth-link-text">Already have an account? <button type="button" class="link-button" @click="showSignIn = true; authError = null">Sign in</button></p>
        </form>
      </div>
    </div>

    <!-- Sign In Form -->
    <div v-if="showSignIn && !user">
      <h2>Sign In</h2>
      
      <div v-if="authError" class="error-message">
        {{ authError }}
      </div>

      <div v-if="otpSent" class="success-message otp-code-prompt">
        Check your email for your 6-digit code.
      </div>

      <form v-if="otpSent" @submit.prevent="handleVerifyOtp" class="otp-form">
        <OtpInput v-model="otpCode" />
        <button type="submit" class="btn-primary" :disabled="verifying || otpCode.length !== 6">
          {{ verifying ? 'Verifying...' : 'Verify & manage subscription' }}
        </button>
        <button type="button" class="btn-secondary" @click="otpSent = false; otpCode = ''">Use a different email</button>
      </form>

      <form v-if="!otpSent" @submit.prevent="handleSignIn">
        <div>
          <input
            id="signin-email"
            v-model="email"
            type="email"
            required
            placeholder="Email"
            class="form-input"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="signingIn">
          {{ signingIn ? 'Sending...' : 'Send Sign-In Link' }}
        </button>

        <div>
          <p class="auth-link-text">Don't have an account? <button type="button" class="link-button" @click="showSignIn = false; otpSent = false">Sign up</button></p>
        </div>
      </form>
    </div>

    <!-- Processing or Success -->
    <div v-if="user">
      <div v-if="purchasing" class="processing-message">
        <h2>Processing your subscription...</h2>
        <div class="spinner" aria-hidden="true"></div>
      </div>
      <div v-else-if="purchaseComplete">
        <h2>Welcome to Premium!</h2>
        <p>Your subscription has been successfully set up. Download the app and login with your email address and your premium account will be ready to use.</p>
      </div>
      <div v-else-if="authError">
        <h2>Almost there</h2>
        <div class="error-message">{{ authError }}</div>
        <button type="button" class="btn-secondary" @click="user = null; authError = null">Back to sign up</button>
      </div>
      <div v-else-if="error">
        <h2>Error</h2>
        <div class="error-message">{{ error }}</div>
        <button type="button" class="btn-primary" @click="processPurchase">Try Again</button>
      </div>
      <div v-else class="select-plan-block">
        <h2>Select a Plan</h2>
        <div v-if="activePromo" class="promo-banner">
          <span class="promo-tag">{{ activePromo.code }}</span>
          <span class="promo-text">{{ activePromo.discountPercent }}% off applied automatically at checkout</span>
        </div>
        <p>Choose a subscription plan, then click the button below to go to checkout.</p>
        <div class="packages-list">
          <div
            v-for="pkg in packages"
            :key="pkg.identifier"
            class="package-item"
            :class="{
              'selected': selectedPackageId === pkg.identifier,
              'yearly': isAnnualPackage(pkg),
              'monthly': isMonthlyPackage(pkg)
            }"
            @click="selectPackage(pkg)"
          >
            <div v-if="isAnnualPackage(pkg) && calculateSavingsPercentage()" class="package-badge">
              SAVE {{ calculateSavingsPercentage() }}%
            </div>
            <div class="package-content">
              <div class="package-left">
                <h3 class="package-title">{{ isAnnualPackage(pkg) ? 'Yearly' : 'Monthly' }}</h3>
                <div class="package-price-line">
                  <template v-if="activePromo">
                    <span class="price-original">{{ formatPrice(pkg) }}</span>
                    <span class="price-discounted">{{ formatDiscountedPrice(pkg) }}</span>
                  </template>
                  <template v-else>
                    {{ formatPrice(pkg) }}
                  </template>
                  {{ isMonthlyPackage(pkg) ? '/ month' : '/ year' }}
                </div>
              </div>
              <div class="package-right">
                <div class="package-price">Free</div>
                <div class="package-price-period">for the first 7 days</div>
              </div>
            </div>
          </div>
        </div>
        <div class="checkout-actions">
          <button
            type="button"
            class="btn-primary"
            :disabled="!selectedPackage"
            @click="processPurchase"
          >
            Continue to checkout
          </button>
          <button type="button" class="btn-secondary" @click="handleLogout">
            Back to start (plan, name & email)
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="user"
      type="button"
      class="logout-btn"
      @click="handleLogout"
    >
      Log out
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import OtpInput from './OtpInput.vue'
import stripeService from '../services/stripe.js'
import supabase from '../services/supabase.js'

// Active promotion — set to null to disable
const activePromo = ref({
  code: 'BREATHE20',
  promotionCodeId: 'promo_1TBgbqBZoGV3errSU8HsruRV',
  discountPercent: 20
})

const loading = ref(true)
const error = ref(null)
const packages = ref([])
const selectedPackageId = ref(null)
const selectedPackage = ref(null)
const user = ref(null)
const name = ref('')
const email = ref('')
const confirmEmail = ref('')
const registering = ref(false)
const signingIn = ref(false)
const authError = ref(null)
const showSignIn = ref(false)
const purchasing = ref(false)
const purchaseComplete = ref(false)
const otpSent = ref(false)
const otpCode = ref('')
const verifying = ref(false)

const loadOfferings = async () => {
  try {
    loading.value = true
    error.value = null
    
    await stripeService.initialize()
    const pricesData = await stripeService.getPrices()
    
    if (pricesData?.prices && pricesData.prices.length > 0) {
      // Convert Stripe prices to package format
      packages.value = pricesData.prices.map(price => ({
        id: price.id,
        identifier: price.id,
        priceId: price.id,
        interval: price.interval,
        intervalCount: price.intervalCount,
        amount: price.unitAmount,
        currency: price.currency,
        formattedAmount: price.formattedAmount,
        planType: price.interval === 'month' ? 'monthly' : price.interval === 'year' ? 'annual' : 'other'
      }))
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

const selectPackage = (pkg) => {
  selectedPackageId.value = pkg.identifier || pkg.id
  selectedPackage.value = pkg
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  user.value = null
  showSignIn.value = false
}

const generateStrongPassword = () => {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

const handleSignUp = async () => {
  if (!selectedPackage.value) {
    authError.value = 'Please select a plan first'
    return
  }

  if (email.value !== confirmEmail.value) {
    authError.value = 'Email addresses do not match'
    return
  }

  try {
    registering.value = true
    authError.value = null

    // Generate a strong password automatically
    const autoPassword = generateStrongPassword()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: autoPassword,
      options: {
        data: {
          name: name.value
        }
      }
    })

    if (signUpError) {
      if (signUpError.message?.toLowerCase().includes('already registered') || signUpError.message?.toLowerCase().includes('already exists')) {
        showSignIn.value = true
        await sendOtpEmail()
        return
      }
      throw signUpError
    }

    if (data.user) {
      if (!data.user.identities || data.user.identities.length === 0) {
        showSignIn.value = true
        await sendOtpEmail()
        return
      }

      console.log('✅ User registered:', data.user.id, data.user.email)
      
      // Wait for session to be established (Supabase may require email confirmation)
      let session = null
      let attempts = 0
      const maxAttempts = 10  // 5 seconds total
      
      while (!session && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          session = currentSession
          break
        }
        attempts++
      }
      
      if (!session) {
        // No session = email confirmation required (or slow auth). Show message and stay on form.
        authError.value = 'Please check your email to confirm your account, then sign in to continue to checkout.'
        registering.value = false
        // Do NOT set user so the form stays visible with the message
        return
      }
      
      // Session is ready - set user and proceed to checkout
      user.value = data.user
      console.log('✅ Session established:', session.user.id)
      
      // Ensure selectedPackage is still set
      if (!selectedPackage.value && packages.value.length > 0) {
        selectedPackage.value = packages.value[0]
        selectedPackageId.value = packages.value[0].identifier || packages.value[0].id
      }
      
      await processPurchase()
    }
  } catch (err) {
    authError.value = err.message || 'Failed to create account. Please try again.'
    console.error('Sign up error:', err)
  } finally {
    registering.value = false
  }
}

async function sendOtpEmail() {
  try {
    signingIn.value = true
    authError.value = null
    otpSent.value = false
    otpCode.value = ''

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        shouldCreateUser: false
      }
    })

    if (signInError) throw signInError

    otpSent.value = true
    authError.value = null
  } catch (err) {
    authError.value = err.message || 'Failed to send code. Please try again.'
    console.error('Send OTP error:', err)
  } finally {
    signingIn.value = false
  }
}

const handleSignIn = () => sendOtpEmail()

const handleVerifyOtp = async () => {
  const code = otpCode.value.trim()
  if (code.length !== 6) {
    authError.value = 'Please enter the 6-digit code from your email.'
    return
  }
  try {
    verifying.value = true
    authError.value = null

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.value,
      token: code,
      type: 'email'
    })

    if (verifyError) throw verifyError

    const { data: { session } } = await supabase.auth.getSession()
    if (session) user.value = session.user

    // Always show pricing after login; no redirect to Stripe until user selects a plan and clicks checkout
    selectedPackageId.value = null
    selectedPackage.value = null
    authError.value = null
    otpSent.value = false
  } catch (err) {
    if (user.value) {
      selectedPackageId.value = null
      selectedPackage.value = null
      authError.value = null
      otpSent.value = false
    } else {
      authError.value = err.message || 'Invalid code or failed to sign in. Try again.'
    }
    console.error('Verify OTP error:', err)
  } finally {
    verifying.value = false
  }
}

const processPurchase = async () => {
  if (!selectedPackage.value) {
    error.value = 'Please select a subscription plan first'
    console.error('No package selected')
    return
  }

  try {
    purchasing.value = true
    error.value = null
    
    if (!user.value) {
      throw new Error('Please register or sign in first')
    }
    
    console.log('Creating checkout session for user:', user.value.id, 'plan:', selectedPackage.value.planType)
    console.log('Selected package:', selectedPackage.value)
    
    // Ensure we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      throw new Error('Session expired. Please sign in again.')
    }

    // Always go to Stripe Checkout (payment page) when they chose a plan and clicked the button
    // Create checkout session and redirect (back/cancel returns to register)
    await stripeService.purchaseSubscription(
      selectedPackage.value.priceId,
      selectedPackage.value.planType,
      user.value.id,
      'https://daily-breathing.com/welcome/',
      'https://daily-breathing.com/register',
      activePromo.value?.promotionCodeId || null
    )
    
    // Note: User will be redirected to Stripe Checkout, so we won't reach here
    // purchaseComplete will be set when they return from checkout success
  } catch (err) {
    console.error('Purchase error:', err)
    purchasing.value = false
    
    if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
      error.value = 'Purchase was cancelled'
    } else if (err.message?.includes('not authenticated') || err.message?.includes('sign in')) {
      error.value = 'Please sign in to continue. ' + err.message
      // Reset user state so they can sign in again
      user.value = null
    } else {
      error.value = err.message || 'Failed to start checkout. Please try again.'
    }
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

const formatDiscountedPrice = (pkg) => {
  if (!activePromo.value || !pkg.amount) return formatPrice(pkg)
  const discounted = pkg.amount * (1 - activePromo.value.discountPercent / 100)
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: pkg.currency || 'EUR',
    minimumFractionDigits: 2
  }).format(discounted / 100)
}

const formatTrialPrice = (pkg) => {
  // Show 0.01 for trial period (euro)
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(0.01)
}

const isMonthlyPackage = (pkg) => {
  return pkg.interval === 'month' || pkg.planType === 'monthly'
}

const isAnnualPackage = (pkg) => {
  return pkg.interval === 'year' || pkg.planType === 'annual'
}

const getNumericPrice = (pkg) => {
  if (pkg.amount) {
    return pkg.amount / 100 // Convert cents to currency units
  }
  return null
}

const calculateSavingsPercentage = () => {
  const monthlyPkg = packages.value.find(pkg => isMonthlyPackage(pkg))
  const annualPkg = packages.value.find(pkg => isAnnualPackage(pkg))
  
  if (!monthlyPkg || !annualPkg) return null
  
  const monthlyPrice = getNumericPrice(monthlyPkg)
  const annualPrice = getNumericPrice(annualPkg)
  
  if (!monthlyPrice || !annualPrice) return null
  
  const monthlyYearlyCost = monthlyPrice * 12
  const savings = ((monthlyYearlyCost - annualPrice) / monthlyYearlyCost) * 100
  
  return Math.round(savings)
}

onMounted(async () => {
  try {
    // Load offerings first so the UI can render even if auth is slow
    await loadOfferings()

    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
    }

    // Set first package as default selection after packages are loaded
    if (packages.value.length > 0) {
      selectedPackageId.value = packages.value[0].identifier || packages.value[0].id
      selectedPackage.value = packages.value[0]
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        user.value = session.user
      } else if (event === 'SIGNED_OUT') {
        user.value = null
      }
    })

    // Check for checkout success/cancel in URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('checkout') === 'success') {
      // User returned from successful checkout
      purchaseComplete.value = true
      purchasing.value = false

      // Verify subscription status
      try {
        const subscriptionData = await stripeService.getCustomerSubscriptions()
        if (subscriptionData?.hasStripeSubscription) {
          console.log('✅ Subscription verified:', subscriptionData.subscription)
        }
      } catch (err) {
        console.error('Error verifying subscription:', err)
      }
    } else if (urlParams.get('checkout') === 'cancel') {
      // User cancelled checkout – reset to plan selection so they can try again
      purchasing.value = false
      error.value = null
      selectedPackageId.value = null
      selectedPackage.value = null
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash)
      }
    }
  } catch (err) {
    console.error('SubscriptionFlow onMounted error:', err)
    error.value = err?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.subscription-flow {
  max-width: 600px;
  margin: 0 auto;
  font-family: "Poppins", sans-serif;
  letter-spacing: -0.03em;
}

.promo-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  padding: 0.7rem 1rem;
  margin-bottom: 1.25rem;
}

.promo-tag {
  background: #F24301;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.promo-text {
  color: white;
  font-size: 0.95rem;
  opacity: 0.95;
}

.price-original {
  text-decoration: line-through;
  opacity: 0.55;
  margin-right: 0.4rem;
}

.price-discounted {
  font-weight: 700;
}

.packages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.package-item {
  position: relative;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: scale(1);
  color: white;
  display: flex;
  align-items: center;
}

.package-item.monthly {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.package-item.yearly {
  background: rgba(242, 67, 1, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.package-item.selected.yearly,
.package-item.selected.monthly {
  background: #F24301;
  border-color: #F24301;
}

.package-item:hover {
  transform: scale(1.02);
}

.package-item.monthly:hover {
  background: rgba(0, 0, 0, 0.4);
}

.package-item.yearly:hover {
  background: rgba(242, 67, 1, 0.5);
}

.package-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: relative;
}

.package-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.package-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.package-title {
  font-size: 1.95rem;
  font-weight: 600;
  margin: 0 0 0.35rem 0;
  color: white;
}

.package-price-line {
  font-size: 1.125rem;
  color: white;
  opacity: 0.95;
}

.package-price {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: white;
}

.package-price-period {
  font-size: 1.1rem;
  color: white;
  opacity: 0.9;
  margin-top: 0.25rem;
}


.package-badge {
  position: absolute;
  top: 0;
  right: 2em;
  transform: translateY(-50%);
  font-size: 0.95rem;
  padding: 0.4rem 0.75rem;
  background: #F24301;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}


.form-input {
  width: 100%;
  padding: 0.85rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
}

.form-input::placeholder {
  font-size: 1.4rem;
}

.form-input:focus {
  outline: none;
  border-color: #F24301;
}


form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  letter-spacing: -0.03em;
}

/* Primary button: full width, capitals, orange */
.btn-primary,
form button[type="submit"].btn-primary,
button.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #F24301;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled),
form button[type="submit"].btn-primary:hover:not(:disabled) {
  background: #d63900;
}

/* Secondary button: full width, capitals, outline */
.btn-secondary {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.9);
}

.link-button {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.login-btn {
  display: none;
}

.terms-text {
  color: white;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 0.75rem;
  margin-bottom: 0;
}

.terms-text a {
  color: white;
  text-decoration: underline;
}

.terms-text a:hover {
  opacity: 0.8;
}

.btn-primary:disabled,
form button[type="submit"]:disabled,
button.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


h2 {
  color: white;
}

.processing-message {
  text-align: center;
}

.processing-message h2 {
  color: white;
}

.processing-message .spinner {
  width: 2.5rem;
  height: 2.5rem;
  margin: 1.5rem auto 0;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ready-checkout {
  text-align: center;
}

.ready-checkout h2,
.ready-checkout p {
  color: white;
}

.ready-checkout .checkout-actions {
  max-width: 100%;
}

.select-plan-block h2,
.select-plan-block p {
  color: white;
}

.auth-link-text {
  color: white;
  width: 100%;
  text-align: center;
}

.error-message {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.success-message {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.success-message.otp-code-prompt {
  color: white;
  background: transparent;
  font-size: 1.25rem;
}

.loading-skeleton {
  pointer-events: none;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-title {
  height: 1.25rem;
  width: 60%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.skeleton-badge {
  height: 1.25rem;
  width: 4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.skeleton-price {
  height: 1.75rem;
  width: 40%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-top: 0.5rem;
}

.skeleton-description {
  height: 0.875rem;
  width: 80%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-top: 0.5rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}


.checkout-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.logout-btn {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: none;
}

.logout-btn:hover {
  background: rgba(0, 0, 0, 0.4);
  color: white;
}
</style>
