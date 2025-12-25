/**
 * M-Pesa Daraja API Service
 * Handles STK Push (Lipa Na M-Pesa Online) integration
 * 
 * Flow:
 * 1. User enters phone number on frontend
 * 2. Backend calls initiateStkPush() -> Sends STK Push to user's phone
 * 3. User enters PIN on their phone
 * 4. Safaricom sends callback to our /api/mpesa/callback endpoint
 * 5. We verify and update Transaction + create Subscription
 */

import axios from 'axios';

// M-Pesa API endpoints
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';

const getBaseUrl = () => {
  return process.env.MPESA_ENVIRONMENT === 'production' 
    ? PRODUCTION_URL 
    : SANDBOX_URL;
};

/**
 * Get OAuth access token from M-Pesa
 * Required for all API calls
 */
export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

/**
 * Generate the password for STK Push
 * Format: Base64(Shortcode + Passkey + Timestamp)
 */
function generatePassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

/**
 * Format phone number to M-Pesa required format (254XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces or special characters
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export interface StkPushRequest {
  phone: string;
  amount: number;
  accountReference: string; // e.g., "SureOdds-WEEKLY"
  transactionDesc: string;  // e.g., "VIP Subscription"
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 * This triggers the payment prompt on the user's phone
 */
export async function initiateStkPush(
  request: StkPushRequest
): Promise<StkPushResponse> {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);
  const formattedPhone = formatPhoneNumber(request.phone);
  
  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: request.amount,
    PartyA: formattedPhone, // Customer phone
    PartyB: process.env.MPESA_SHORTCODE, // Your shortcode
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: request.accountReference,
    TransactionDesc: request.transactionDesc,
  };
  
  try {
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('STK Push failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate payment');
  }
}

/**
 * Query the status of an STK Push transaction
 * Useful for checking if user has completed payment
 */
export async function queryStkPushStatus(checkoutRequestId: string) {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword(timestamp);
  
  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };
  
  try {
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('STK Query failed:', error.response?.data || error.message);
    throw new Error('Failed to query transaction status');
  }
}

/**
 * Parse the M-Pesa callback body
 * This extracts relevant information from Safaricom's callback
 */
export interface MpesaCallbackData {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
}

export function parseCallback(body: any): MpesaCallbackData {
  const callback = body.Body?.stkCallback;
  
  if (!callback) {
    throw new Error('Invalid callback body');
  }
  
  const result: MpesaCallbackData = {
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc,
  };
  
  // If payment was successful, extract additional metadata
  if (callback.ResultCode === 0 && callback.CallbackMetadata?.Item) {
    const metadata = callback.CallbackMetadata.Item;
    
    for (const item of metadata) {
      switch (item.Name) {
        case 'Amount':
          result.amount = item.Value;
          break;
        case 'MpesaReceiptNumber':
          result.mpesaReceiptNumber = item.Value;
          break;
        case 'TransactionDate':
          result.transactionDate = String(item.Value);
          break;
        case 'PhoneNumber':
          result.phoneNumber = String(item.Value);
          break;
      }
    }
  }
  
  return result;
}

/**
 * Calculate subscription end date based on plan type
 */
export function calculateEndDate(planType: string): Date {
  const now = new Date();
  
  switch (planType.toUpperCase()) {
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'MONTHLY':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
}

/**
 * Get price based on plan type
 */
export function getPlanPrice(planType: string): number {
  switch (planType.toUpperCase()) {
    case 'DAILY':
      return parseInt(process.env.PRICE_DAILY || '50');
    case 'WEEKLY':
      return parseInt(process.env.PRICE_WEEKLY || '250');
    case 'MONTHLY':
      return parseInt(process.env.PRICE_MONTHLY || '800');
    default:
      return 50;
  }
}
