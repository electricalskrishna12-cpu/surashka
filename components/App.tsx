
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Label } from "./components/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/Card";
import { RadioGroup, RadioGroupItem } from "./components/RadioGroup";
import { Switch } from "./components/Switch";
import { Spinner } from "./components/Spinner";
import { Toast } from "./components/Toast";

type Role = 'tenant' | 'landlord' | 'police' | 'admin';
type ActiveView = 'dashboard' | 'complaint' | 'help' | 'lookup' | 'management';
// FIX: Defined a type for user data to be used in SavedProgress type.
type UserData = {
    name: string;
    phone: string;
    email: string;
    kycType: 'aadhaar' | 'passport' | 'driving';
    kycNumber: string;
    consentLandlord: boolean;
    consentPolice: boolean;
    consentEmployer: boolean;
    emergencyContacts: string[];
};
type SavedProgress = {
    userData: UserData;
    onboardingStep: number;
} | null;


const App = () => {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loggedInRole, setLoggedInRole] = useState<Role | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const [loginData, setLoginData] = useState({
    name: '',
    age: '',
    gender: 'male',
    email: '',
    password: '',
    role: 'tenant' as Role,
  });
  const [userData, setUserData] = useState<UserData>({
    name: '',
    phone: '',
    email: '',
    kycType: 'aadhaar',
    kycNumber: '',
    consentLandlord: false,
    consentPolice: false,
    consentEmployer: false,
    emergencyContacts: ['', '']
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewingPage, setViewingPage] = useState<'onboarding' | 'about' | 'security' | 'kyc' | 'backgroundScreening' | 'complaint' | 'help'>('onboarding');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [savedProgress, setSavedProgress] = useState<SavedProgress>(null);


  // Refs for focusing on the first invalid input
  const inputRefs = {
    loginName: useRef<HTMLInputElement>(null),
    loginAge: useRef<HTMLInputElement>(null),
    loginEmail: useRef<HTMLInputElement>(null),
    loginPassword: useRef<HTMLInputElement>(null),
    resetEmail: useRef<HTMLInputElement>(null),
    kycName: useRef<HTMLInputElement>(null),
    kycEmail: useRef<HTMLInputElement>(null),
    kycPhone: useRef<HTMLInputElement>(null),
    kycNumber: useRef<HTMLInputElement>(null),
    contact1: useRef<HTMLInputElement>(null),
    contact2: useRef<HTMLInputElement>(null),
    complaintDetails: useRef<HTMLTextAreaElement>(null),
  };

  // Load progress on initial mount
  useEffect(() => {
    try {
        const savedData = localStorage.getItem('surakshaConnectProgress');
        if (savedData) {
            setSavedProgress(JSON.parse(savedData));
        }
    } catch (error) {
        console.error("Failed to load saved progress:", error);
        localStorage.removeItem('surakshaConnectProgress');
    }
  }, []);

  // Effect to focus on the first field with an error
  useEffect(() => {
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      let firstErrorKey: string | undefined;
      let fieldMap: Record<string, React.RefObject<HTMLElement>> = {};
      let fieldOrder: string[] = [];

      if (onboardingStep === 0) {
          if(isForgotPassword) {
            fieldOrder = ['resetEmail'];
            fieldMap = { resetEmail: inputRefs.resetEmail };
          } else {
            fieldOrder = ['name', 'age', 'email', 'password'];
            fieldMap = { name: inputRefs.loginName, age: inputRefs.loginAge, email: inputRefs.loginEmail, password: inputRefs.loginPassword };
          }
      } else if (viewingPage === 'kyc') {
        fieldOrder = ['name', 'email', 'phone', 'kycNumber'];
        fieldMap = { name: inputRefs.kycName, email: inputRefs.kycEmail, phone: inputRefs.kycPhone, kycNumber: inputRefs.kycNumber };
      } else if (onboardingStep === 3) {
        fieldOrder = ['contact1', 'contact2'];
        fieldMap = { contact1: inputRefs.contact1, contact2: inputRefs.contact2 };
      } else if (viewingPage === 'complaint') {
        fieldOrder = ['details'];
        fieldMap = { details: inputRefs.complaintDetails };
      }

      firstErrorKey = fieldOrder.find(key => validationErrors[key]);

      if (firstErrorKey) {
        const elementRef = fieldMap[firstErrorKey];
        if (elementRef && elementRef.current) {
          elementRef.current.focus();
          elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [validationErrors, onboardingStep, viewingPage, isForgotPassword]);

  const handleSaveProgress = () => {
    try {
        const progress = { userData, onboardingStep };
        localStorage.setItem('surakshaConnectProgress', JSON.stringify(progress));
        setToast({ message: 'Your progress has been saved!', type: 'success' });
    } catch (error) {
        console.error("Failed to save progress:", error);
        setToast({ message: 'Could not save your progress.', type: 'error' });
    }
  };

  const handleRestoreProgress = () => {
    if (savedProgress) {
        setUserData(savedProgress.userData);
        // Special handling for KYC page vs other steps
        if (savedProgress.onboardingStep === 2) {
             setViewingPage('kyc');
             setOnboardingStep(1); // Return to features page contextually
        } else {
            setOnboardingStep(savedProgress.onboardingStep);
        }
        setSavedProgress(null);
        setToast({ message: 'Progress restored successfully.', type: 'success' });
    }
  };

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleLoginChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
  };

  const validateLoginData = () => {
    const errors: Record<string, string> = {};
    if (loginData.role === 'tenant') {
        if (!loginData.name.trim() || loginData.name.trim().length < 2) {
          errors.name = 'Full name must be at least 2 characters.';
        } else if (!/^[a-zA-Z\s]+$/.test(loginData.name)) {
            errors.name = 'Full name can only contain letters and spaces.';
        }
        if (!loginData.age) {
            errors.age = 'Age is required.';
        } else if (parseInt(loginData.age) < 18 || parseInt(loginData.age) > 100) {
          errors.age = 'Age must be between 18 and 100.';
        }
    }
    if (!loginData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!loginData.password) {
        errors.password = 'Password is required.';
    } else if (loginData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(loginData.password)) {
      errors.password = 'Password must include uppercase, lowercase, and a number.';
    }
    return errors;
  };

  const handleLogin = () => {
    const errors = validateLoginData();
    setValidationErrors(errors);
    if (Object.keys(errors).length === 0) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setActiveView('dashboard');
        if (loginData.role === 'tenant') {
            setUserData(prev => ({...prev, name: loginData.name, email: loginData.email}));
            setOnboardingStep(1);
        } else {
            setLoggedInRole(loginData.role);
            setOnboardingStep(5); // Skip to dashboard for other roles
        }
      }, 2000);
    } else {
        console.error("Login validation failed:", errors);
    }
  };

  const handleForgotPasswordSubmit = () => {
      const errors: Record<string, string> = {};
      if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
        errors.resetEmail = 'Please enter a valid email address.';
      }
      setValidationErrors(errors);
      if (Object.keys(errors).length === 0) {
        setIsVerifying(true);
        setTimeout(() => {
          setIsVerifying(false);
          setToast({ message: 'If an account exists for this email, a reset link has been sent.', type: 'success' });
          setIsForgotPassword(false);
          setResetEmail('');
          setValidationErrors({});
        }, 2000);
      }
  };
  
  const handleLogout = () => {
      localStorage.removeItem('surakshaConnectProgress');
      setOnboardingStep(0);
