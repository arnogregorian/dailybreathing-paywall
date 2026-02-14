import { Purchases } from '@revenuecat/purchases-js'

class RevenueCatService {
  constructor() {
    this.isInitialized = false
  }

  async initialize(userId = null) {
    if (this.isInitialized) {
      return Purchases.getSharedInstance()
    }

    const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY
    
    if (!apiKey) {
      throw new Error('RevenueCat API key is not configured. Please add VITE_REVENUECAT_PUBLIC_API_KEY to your .env file')
    }

    try {
      // RevenueCat requires appUserId to be a string
      // If no userId provided, generate an anonymous ID
      const appUserId = userId && typeof userId === 'string' && userId.trim().length > 0
        ? userId.trim()
        : Purchases.generateRevenueCatAnonymousAppUserId()
      
      Purchases.configure({
        apiKey: apiKey,
        appUserId: appUserId
      })
      
      this.isInitialized = true
      return Purchases.getSharedInstance()
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error)
      throw error
    }
  }

  async getOfferings() {
    if (!this.isInitialized) {
      await this.initialize()
    }
    
    try {
      const purchases = Purchases.getSharedInstance()
      const offerings = await purchases.getOfferings()
      return offerings
    } catch (error) {
      console.error('Failed to fetch offerings:', error)
      throw error
    }
  }

  async purchasePackage(packageToPurchase) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const purchases = Purchases.getSharedInstance()
      const { customerInfo } = await purchases.purchase({ rcPackage: packageToPurchase })
      return customerInfo
    } catch (error) {
      console.error('Purchase failed:', error)
      throw error
    }
  }

  async restorePurchases() {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const purchases = Purchases.getSharedInstance()
      const customerInfo = await purchases.restorePurchases()
      return customerInfo
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  async getCustomerInfo() {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const purchases = Purchases.getSharedInstance()
      const customerInfo = await purchases.getCustomerInfo()
      return customerInfo
    } catch (error) {
      console.error('Failed to get customer info:', error)
      throw error
    }
  }

  async identify(userId) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const purchases = Purchases.getSharedInstance()
      const { customerInfo } = await purchases.identify(userId)
      return customerInfo
    } catch (error) {
      console.error('Failed to identify user:', error)
      throw error
    }
  }
}

export default new RevenueCatService()
