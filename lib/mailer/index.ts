/**
 * Email Mailer Module
 * 
 * Re-exports all mailer functionality with provider support
 */

// Export provider utilities
export { createTransporter, verifyTransports, verifyTransport } from './providers'
export type { SmtpProvider } from './providers'

// Export newsletter mailer functions
export {
  sendNewsletterEmail,
  sendBatchNewsletters,
  verifyNewsletterEmailConfig,
} from './newsletter-mailer'

export type {
  NewsletterEmailOptions,
  BatchSendOptions,
  BatchSendResult,
} from './newsletter-mailer'

export {
  signUnsubToken,
  verifyUnsubToken,
} from './unsub'


