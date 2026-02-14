import { loadStripe } from '@stripe/stripe-js'
import supabase from './supabase.js'

class StripeService {
  constructor() {
    this.stripe = null
    this.publishableKey = null
    this.productId = 'prod_T4r20NLm3nFtof'
  }

  async initialize() {
    if (this.stripe) {
      return this.stripe
    }

    // Get publishable key from environment
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    
    if (!this.publishableKey) {
      throw new Error('Stripe publishable key is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file')
    }

    this.stripe = await loadStripe(this.publishableKey)
    return this.stripe
  }

  async getPrices() {
    try {
      // Fetch prices for the product via backend edge function
      // We'll create a simple function to get prices, or fetch directly from Stripe
      // For now, let's use a direct approach - we'll need prices from the product
      const { data, error } = await supabase.functions.invoke('get-stripe-prices', {
        body: { productId: this.productId }
      })

      if (error) {
        // If function doesn't exist, we'll need to create it or fetch prices differently
        console.warn('get-stripe-prices function not found, will need to fetch prices differently')
        throw error
      }
      return data
    } catch (error) {
      console.error('Failed to fetch prices:', error)
      throw error
    }
  }

  async createCheckoutSession(priceId, planType, userId, successUrl, cancelUrl) {
    try {
      // Ensure we have a valid session before calling the edge function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Authentication error. Please sign in again.')
      }
      
      if (!session) {
        console.error('No active session found')
        throw new Error('Please sign in to create a checkout session')
      }

      console.log('Calling edge function with session for user:', session.user.id)

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout-session', {
        body: {
          stripePriceId: priceId,
          planType: planType,
          userId: userId,
          successUrl: successUrl || 'https://daily-breathing.com/welcome/',
          cancelUrl: cancelUrl || `${window.location.origin}/?checkout=cancel`
        }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw error
    }
  }

  async redirectToCheckout(checkoutUrl) {
    try {
      // The edge function returns checkoutUrl directly, so we can redirect
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL provided')
      }
    } catch (error) {
      console.error('Failed to redirect to checkout:', error)
      throw error
    }
  }

  async purchaseSubscription(priceId, planType, userId, successUrl, cancelUrl) {
    try {
      const session = await this.createCheckoutSession(priceId, planType, userId, successUrl, cancelUrl)
      await this.redirectToCheckout(session.checkoutUrl)
    } catch (error) {
      console.error('Purchase failed:', error)
      throw error
    }
  }

  async getCustomerSubscriptions() {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-subscription')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get subscriptions:', error)
      throw error
    }
  }

  async restorePurchases() {
    try {
      const subscriptionData = await this.getCustomerSubscriptions()
      return {
        hasActiveSubscription: subscriptionData?.hasStripeSubscription === true && 
          (subscriptionData?.subscription?.status === 'active' || 
           subscriptionData?.subscription?.status === 'trialing'),
        subscription: subscriptionData?.subscription || null
      }
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  async getManageSubscriptionUrl() {
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-portal-session', {
        body: {}
      })
      if (error) throw error
      return data?.url
    } catch (error) {
      console.error('Failed to get portal URL:', error)
      throw error
    }
  }
}

export default new StripeService()
