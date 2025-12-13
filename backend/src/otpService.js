// OTP Service using Fast2SMS API
import fetch from "node-fetch";

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || "QFpd6EtG5V0Daz7gcPr3LJnikoMNWAw9fbRl8qTHYvx1IehZuOrKM7CReEid5kJ1AvuVOL0D3NZa6UIp";
const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map(); // key: mobileNumber, value: { otp, expiresAt, attempts }

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean expired OTPs
function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [mobile, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(mobile);
    }
  }
}

// Send OTP via Fast2SMS
export async function sendOTP(mobileNumber) {
  try {
    // Remove +91 if present
    const cleanMobile = mobileNumber.replace(/^\+91/, "");
    
    // Validate mobile number (should be 10 digits)
    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error("Invalid mobile number. Must be 10 digits.");
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP
    otpStore.set(cleanMobile, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    // Prepare message
    const message = `Your OTP for Astro Playlist is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;

    // Send SMS via Fast2SMS
    // Fast2SMS API format: https://www.fast2sms.com/dev/bulkV2
    // Using form-urlencoded format as per Fast2SMS documentation
    const params = new URLSearchParams({
      message: message,
      language: 'english',
      route: 'q', // 'q' for Quick SMS
      numbers: cleanMobile
    });

    const response = await fetch(FAST2SMS_URL, {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const result = await response.json();

    // Clean expired OTPs periodically
    cleanExpiredOTPs();

    if (result.return === true) {
      console.log(`OTP sent to ${cleanMobile}: ${otp}`);
      return { success: true, message: "OTP sent successfully" };
    } else {
      // If Fast2SMS fails, log but still return success in dev (for testing)
      console.error("Fast2SMS error:", result);
      if (process.env.NODE_ENV === "production") {
        throw new Error(result.message || "Failed to send OTP");
      } else {
        // In development, allow testing without actual SMS
        console.warn("Fast2SMS failed, but allowing in dev mode. OTP:", otp);
        return { success: true, message: "OTP sent successfully (dev mode)", otp: otp };
      }
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    throw new Error(error.message || "Failed to send OTP");
  }
}

// Verify OTP
export function verifyOTP(mobileNumber, otp) {
  try {
    // Remove +91 if present
    const cleanMobile = mobileNumber.replace(/^\+91/, "");
    
    // Validate mobile number
    if (!/^\d{10}$/.test(cleanMobile)) {
      throw new Error("Invalid mobile number");
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    const stored = otpStore.get(cleanMobile);

    if (!stored) {
      throw new Error("OTP not found or expired. Please request a new OTP.");
    }

    // Check expiry
    if (stored.expiresAt < Date.now()) {
      otpStore.delete(cleanMobile);
      throw new Error("OTP has expired. Please request a new OTP.");
    }

    // Check attempts (max 5 attempts)
    if (stored.attempts >= 5) {
      otpStore.delete(cleanMobile);
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      throw new Error(`Invalid OTP. ${5 - stored.attempts} attempts remaining.`);
    }

    // OTP verified successfully - remove from store
    otpStore.delete(cleanMobile);

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${cleanMobile}:${Date.now()}`).toString("base64");

    return {
      success: true,
      message: "OTP verified successfully",
      token
    };
  } catch (error) {
    console.error("Verify OTP error:", error);
    throw error;
  }
}

