import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

class FirebasePhoneAuth {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: any = null;

  async initRecaptcha(buttonId: string) {
    try {
      if (this.recaptchaVerifier) {
        await this.resetRecaptcha();
      }
      
      this.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
          // Callback is optional since we're using invisible mode
        },
      });

      // Pre-render the reCAPTCHA widget
      await this.recaptchaVerifier.render();
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      throw error;
    }
  }

  async sendVerificationCode(phoneNumber: string, buttonId: string) {
    try {
      // Initialize recaptcha if not already done
      if (!this.recaptchaVerifier) {
        await this.initRecaptcha(buttonId);
      }

      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      // Send verification code
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      // Reset recaptcha if there was an error
      await this.resetRecaptcha();
      throw error;
    }
  }

  async verifyCode(code: string) {
    if (!this.confirmationResult) {
      throw new Error('No verification code was sent');
    }

    try {
      const result = await this.confirmationResult.confirm(code);
      // Reset confirmation result after successful verification
      this.confirmationResult = null;
      return result.user;
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  }

  async resetRecaptcha() {
    if (this.recaptchaVerifier) {
      try {
        await this.recaptchaVerifier.render();
        this.recaptchaVerifier = null;
      } catch (error) {
        console.error('Error resetting reCAPTCHA:', error);
      }
    }
  }
}

export const firebasePhoneAuth = new FirebasePhoneAuth();