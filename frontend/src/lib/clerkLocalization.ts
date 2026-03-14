import type { LocalizationResource } from '@clerk/types';

export const clerkEnglish = {
  locale: 'en-US',
  signIn: {
    start: {
      title: 'Sign in to SehatBeat',
      subtitle: 'Welcome back! Please sign in to continue',
      actionText: "Don't have an account?",
      actionLink: 'Sign up',
    },
    emailCode: {
      title: 'Check your email',
      subtitle: 'to continue to SehatBeat',
      formTitle: 'Verification code',
      formSubtitle: 'Enter the verification code sent to your email address',
      resendButton: 'Resend code',
    },
    password: {
      title: 'Enter your password',
      subtitle: 'to continue to SehatBeat',
      actionLink: 'Forgot password?',
    },
    forgotPassword: {
      title: 'Forgot password?',
      subtitle: 'We will send a password reset link to your email',
      formTitle: 'Reset password',
      resendButton: 'Resend link',
    },
    resetPassword: {
      title: 'Set new password',
      subtitle: 'to continue to SehatBeat',
      formButtonPrimary: 'Reset password',
      successMessage: 'Your password has been successfully changed',
    },
  },
  signUp: {
    start: {
      title: 'Create your account',
      subtitle: 'to continue to SehatBeat',
      actionText: 'Already have an account?',
      actionLink: 'Sign in',
    },
    emailCode: {
      title: 'Verify your email',
      subtitle: 'to continue to SehatBeat',
      formTitle: 'Verification code',
      formSubtitle: 'Enter the verification code sent to your email address',
      resendButton: 'Resend code',
    },
    continue: {
      title: 'Fill in missing fields',
      subtitle: 'to continue to SehatBeat',
      actionText: 'Already have an account?',
      actionLink: 'Sign in',
    },
  },
  userButton: {
    action__manageAccount: 'Manage account',
    action__signOut: 'Sign out',
  },
  formFieldLabel__emailAddress: 'Email address',
  formFieldLabel__emailAddress_username: 'Email address or username',
  formFieldLabel__username: 'Username',
  formFieldLabel__password: 'Password',
  formFieldLabel__newPassword: 'New password',
  formFieldLabel__confirmPassword: 'Confirm password',
  formFieldLabel__firstName: 'First name',
  formFieldLabel__lastName: 'Last name',
  formFieldInputPlaceholder__emailAddress: 'Enter your email',
  formFieldInputPlaceholder__emailAddress_username:
    'Enter email or username',
  formFieldInputPlaceholder__password: 'Enter your password',
  formButtonPrimary: 'Continue',
  dividerText: 'or',
  socialButtonsBlockButton: 'Continue with {{provider}}',
  backButton: 'Back',
  footerActionLink__useAnotherMethod: 'Use another method',
} as unknown as LocalizationResource;

export const clerkHindi = {
  locale: 'hi-IN',
  signIn: {
    start: {
      title: 'SehatBeat में साइन इन करें',
      subtitle: 'वापस आने पर स्वागत है! जारी रखने के लिए कृपया साइन इन करें',
      actionText: 'खाता नहीं है?',
      actionLink: 'साइन अप करें',
    },
    emailCode: {
      title: 'अपना ईमेल जांचें',
      subtitle: 'SehatBeat जारी रखने के लिए',
      formTitle: 'सत्यापन कोड',
      formSubtitle: 'अपने ईमेल पते पर भेजा गया सत्यापन कोड दर्ज करें',
      resendButton: 'कोड पुनः भेजें',
    },
    password: {
      title: 'अपना पासवर्ड दर्ज करें',
      subtitle: 'SehatBeat जारी रखने के लिए',
      actionLink: 'पासवर्ड भूल गए?',
    },
    forgotPassword: {
      title: 'पासवर्ड भूल गए?',
      subtitle: 'हम आपके ईमेल पर पासवर्ड रीसेट लिंक भेजेंगे',
      formTitle: 'पासवर्ड रीसेट करें',
      resendButton: 'लिंक पुनः भेजें',
    },
    resetPassword: {
      title: 'नया पासवर्ड सेट करें',
      subtitle: 'SehatBeat जारी रखने के लिए',
      formButtonPrimary: 'पासवर्ड रीसेट करें',
      successMessage: 'आपका पासवर्ड सफलतापूर्वक बदल गया',
    },
  },
  signUp: {
    start: {
      title: 'अपना खाता बनाएं',
      subtitle: 'SehatBeat जारी रखने के लिए',
      actionText: 'पहले से खाता है?',
      actionLink: 'साइन इन करें',
    },
    emailCode: {
      title: 'अपना ईमेल सत्यापित करें',
      subtitle: 'SehatBeat जारी रखने के लिए',
      formTitle: 'सत्यापन कोड',
      formSubtitle: 'अपने ईमेल पते पर भेजा गया सत्यापन कोड दर्ज करें',
      resendButton: 'कोड पुनः भेजें',
    },
    continue: {
      title: 'छूटे हुए फ़ील्ड भरें',
      subtitle: 'SehatBeat जारी रखने के लिए',
      actionText: 'पहले से खाता है?',
      actionLink: 'साइन इन करें',
    },
  },
  userButton: {
    action__manageAccount: 'खाता प्रबंधित करें',
    action__signOut: 'साइन आउट करें',
  },
  formFieldLabel__emailAddress: 'ईमेल पता',
  formFieldLabel__emailAddress_username: 'ईमेल पता या उपयोगकर्ता नाम',
  formFieldLabel__username: 'उपयोगकर्ता नाम',
  formFieldLabel__password: 'पासवर्ड',
  formFieldLabel__newPassword: 'नया पासवर्ड',
  formFieldLabel__confirmPassword: 'पासवर्ड की पुष्टि करें',
  formFieldLabel__firstName: 'पहला नाम',
  formFieldLabel__lastName: 'अंतिम नाम',
  formFieldInputPlaceholder__emailAddress: 'अपना ईमेल दर्ज करें',
  formFieldInputPlaceholder__emailAddress_username:
    'ईमेल या उपयोगकर्ता नाम दर्ज करें',
  formFieldInputPlaceholder__password: 'अपना पासवर्ड दर्ज करें',
  formButtonPrimary: 'जारी रखें',
  dividerText: 'या',
  socialButtonsBlockButton: '{{provider}} से जारी रखें',
  backButton: 'वापस',
  footerActionLink__useAnotherMethod: 'दूसरा तरीका उपयोग करें',
} as unknown as LocalizationResource;

export const getClerkLocalization = (lang: 'en' | 'hi') => {
  return lang === 'hi' ? clerkHindi : clerkEnglish;
};
