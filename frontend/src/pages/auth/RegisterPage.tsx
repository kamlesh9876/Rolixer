import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useApiMutation } from '../../hooks/useApi';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UserTypeSelector, { UserType } from '../../components/auth/UserTypeSelector';

const personalInfoSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .required('Phone number is required'),
});

const passwordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      'Password must contain at least one uppercase letter and one special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const securityQuestions = [
  'What was your first pet\'s name?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was the name of your first school?',
  'What is your favorite book?'
];

const securitySchema = Yup.object({
  securityQuestion1: Yup.string()
    .required('Please select a security question'),
  securityAnswer1: Yup.string()
    .min(2, 'Answer must be at least 2 characters')
    .required('Answer is required'),
  securityQuestion2: Yup.string()
    .required('Please select a security question')
    .notOneOf(
      [Yup.ref('securityQuestion1')], 
      'Must select different questions'
    ),
  securityAnswer2: Yup.string()
    .min(2, 'Answer must be at least 2 characters')
    .required('Answer is required'),
  enable2FA: Yup.boolean(),
  phoneFor2FA: Yup.string().when('enable2FA', {
    is: true,
    then: (schema) => schema
      .matches(
        /^[0-9]{10}$/,
        'Please enter a valid 10-digit phone number'
      )
      .required('Phone number is required for 2FA'),
    otherwise: (schema) => schema.notRequired(),
  }),
  acceptTerms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required('You must accept the terms and conditions'),
});

const storeInfoSchema = Yup.object({
  storeName: Yup.string()
    .required('Store name is required'),
  address: Yup.string()
    .required('Address is required'),
});

// Define the form values interface
interface FormValues {
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  storeName: string;
  address: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  enable2FA: boolean;
  phoneFor2FA: string;
  acceptTerms: boolean;
  [key: string]: any; // Add index signature for dynamic access
}

// Define the RegisterData interface for the API request
interface RegisterData extends Omit<FormValues, 'securityQuestion1' | 'securityAnswer1' | 'securityQuestion2' | 'securityAnswer2'> {
  securityQuestions: Array<{
    question: string;
    answer: string;
  }>;
}

// Memoized form steps with validation
const useFormSteps = (schemas: any) => {
  return useMemo(() => [
    { 
      label: 'Account Type',
      validate: () => true
    },
    { 
      label: 'Personal Info',
      validate: (values: FormValues) => {
        try {
          schemas.personalInfo.validateSync(values, { abortEarly: false });
          return true;
        } catch (err) {
          return false;
        }
      }
    },
    { 
      label: 'Password',
      validate: (values: FormValues) => {
        try {
          schemas.password.validateSync(values, { abortEarly: false });
          return true;
        } catch (err) {
          return false;
        }
      }
    },
    { 
      label: 'Store Info', 
      validate: (values: FormValues) => {
        if (values.userType !== 'STORE_OWNER') return true;
        try {
          schemas.storeInfo.validateSync(values, { abortEarly: false });
          return true;
        } catch (err) {
          return false;
        }
      }
    },
    { 
      label: 'Security', 
      validate: (values: FormValues) => {
        try {
          schemas.securityInfo.validateSync(values, { abortEarly: false });
          return true;
        } catch (err) {
          return false;
        }
      }
    },
    { 
      label: 'Terms', 
      validate: (values: FormValues) => {
        try {
          schemas.terms.validateSync(values, { abortEarly: false });
          return true;
        } catch (err) {
          return false;
        }
      }
    },
  ], [schemas]);
};

const RegisterPage: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormValues>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Form steps with validation schemas
  const schemas = useMemo(() => ({
    personalInfo: personalInfoSchema,
    password: passwordSchema,
    storeInfo: storeInfoSchema,
    securityInfo: securitySchema,
    terms: Yup.object({
      acceptTerms: Yup.boolean()
        .oneOf([true], 'You must accept the terms and conditions')
        .required('Required')
    }),
  }), []);

  const formSteps = useFormSteps(schemas);

  const formik = useFormik<FormValues>({
    initialValues: {
      userType: 'CUSTOMER' as UserType,
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      address: '',
      securityQuestion1: '',
      securityAnswer1: '',
      securityQuestion2: '',
      securityAnswer2: '',
      enable2FA: false,
      phoneFor2FA: '',
      acceptTerms: false,
      ...formData
    },
    validationSchema: [
      Yup.object({
        userType: Yup.string().required('Please select a user type')
      }),
      personalInfoSchema,
      passwordSchema,
      storeInfoSchema,
      securitySchema,
      Yup.object({
        acceptTerms: Yup.boolean()
          .oneOf([true], 'You must accept the terms and conditions')
          .required('Required')
      })
    ][activeStep],
    onSubmit: async (values) => {
      try {
        if (activeStep === steps.length - 1) {
          await register(values);
          navigate('/dashboard');
        } else {
          setFormData({ ...formData, ...values });
          setActiveStep((prev) => prev + 1);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'An error occurred');
      }
    },
  });
  
  // Memoize form handlers to prevent unnecessary re-renders
  const handleNext = useCallback(async () => {
    try {
      await formik.validateForm();
      setFormData(prev => ({ ...prev, ...formik.values }));
      setActiveStep(prevStep => Math.min(formSteps.length - 1, prevStep + 1));
      setError(null);
    } catch (errors) {
      // Form validation will show errors automatically
    }
  }, [formik, formSteps.length]);
  
  const handleBack = useCallback(() => {
    setActiveStep(prevStep => Math.max(0, prevStep - 1));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      await formik.validateForm();
      const { securityQuestion1, securityAnswer1, securityQuestion2, securityAnswer2, ...rest } = formik.values;
      const registerData: RegisterData = {
        ...rest,
        securityQuestions: [
          { question: securityQuestion1, answer: securityAnswer1 },
          { question: securityQuestion2, answer: securityAnswer2 }
        ]
      };
      await register(registerData);
      navigate('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formik, register, navigate]);

  const securityQuestions = [
    'What was your first pet\'s name?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was the name of your first school?',
    'What is your favorite book?'
  ];

  const renderUserTypeStep = (formik: any) => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
        Choose Account Type
      </Typography>
      <UserTypeSelector 
        onSelect={(selectedType: UserType) => {
          setFormData({ userType: selectedType });
          setActiveStep(1);
        }} 
      />
    </Box>
  );

  const renderPersonalInfoStep = (formik: any) => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => handleBack({})} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Personal Information
        </Typography>
      </Box>
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label="Full Name"
        name="name"
        autoComplete="name"
        autoFocus
        value={formData.name || ''}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={formData.name === undefined}
        helperText={formData.name === undefined ? 'Name is required' : ''}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={formData.email === undefined}
        helperText={formData.email === undefined ? 'Email is required' : ''}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="phone"
        label="Phone Number"
        name="phone"
        autoComplete="tel"
        value={formData.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        error={formData.phone === undefined}
        helperText={formData.phone === undefined ? 'Phone number is required' : ''}
      />
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={() => handleNext(formData)}
      >
        Continue
      </Button>
    </Box>
  );

  const renderPasswordStep = (formik: any) => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => handleBack({})} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Create Password
        </Typography>
      </Box>
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password || ''}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={formData.password === undefined}
        helperText={formData.password === undefined ? 'Password is required' : ''}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={formData.confirmPassword || ''}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        error={formData.confirmPassword === undefined}
        helperText={formData.confirmPassword === undefined ? 'Confirm Password is required' : ''}
      />
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={() => handleNext(formData)}
      >
        Continue
      </Button>
    </Box>
  );

  const renderStoreInfoStep = (formik: any) => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => handleBack({})} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Store Information
        </Typography>
      </Box>
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="storeName"
        label="Store Name"
        name="storeName"
        value={formData.storeName || ''}
        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
        error={formData.storeName === undefined}
        helperText={formData.storeName === undefined ? 'Store name is required' : ''}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="address"
        label="Store Address"
        name="address"
        multiline
        rows={3}
        value={formData.address || ''}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        error={formData.address === undefined}
        helperText={formData.address === undefined ? 'Address is required' : ''}
      />
      <Button
        type="button"
        variant="contained"
        color="primary"
        onClick={() => handleNext(formData)}
      >
        Continue
      </Button>
    </Box>
  );

  const renderSecurityStep = (formik: any) => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => handleBack({})} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Account Security
        </Typography>
      </Box>

      <Typography variant="subtitle1" gutterBottom>
        Security Questions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These will help verify your identity if you forget your password.
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Security Question 1</InputLabel>
        <Select
          name="securityQuestion1"
          value={formData.securityQuestion1 || ''}
          onChange={(e) => setFormData({ ...formData, securityQuestion1: e.target.value })}
          label="Security Question 1"
        >
          {securityQuestions.map((question, index) => (
            <MenuItem key={`q1-${index}`} value={question}>
              {question}
            </MenuItem>
          ))}
        </Select>
        {formData.securityQuestion1 === undefined && (
          <FormHelperText error>Security question 1 is required</FormHelperText>
        )}
      </FormControl>

      <TextField
        fullWidth
        name="securityAnswer1"
        label="Your Answer"
        value={formData.securityAnswer1 || ''}
        onChange={(e) => setFormData({ ...formData, securityAnswer1: e.target.value })}
        error={formData.securityAnswer1 === undefined}
        helperText={formData.securityAnswer1 === undefined ? 'Answer is required' : ''}
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Security Question 2</InputLabel>
        <Select
          name="securityQuestion2"
          value={formData.securityQuestion2 || ''}
          onChange={(e) => setFormData({ ...formData, securityQuestion2: e.target.value })}
          label="Security Question 2"
        >
          {securityQuestions
            .filter(q => q !== formData.securityQuestion1)
            .map((question, index) => (
              <MenuItem key={`q2-${index}`} value={question}>
                {question}
              </MenuItem>
            ))}
        </Select>
        {formData.securityQuestion2 === undefined && (
          <FormHelperText error>Security question 2 is required</FormHelperText>
        )}
      </FormControl>

      <TextField
        fullWidth
        name="securityAnswer2"
        label="Your Answer"
        value={formData.securityAnswer2 || ''}
        onChange={(e) => setFormData({ ...formData, securityAnswer2: e.target.value })}
        error={formData.securityAnswer2 === undefined}
        helperText={formData.securityAnswer2 === undefined ? 'Answer is required' : ''}
        sx={{ mb: 4 }}
      />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox 
              name="enable2FA" 
              checked={formData.enable2FA || false}
              onChange={(e) => setFormData({ ...formData, enable2FA: e.target.checked })}
            />
          }
          label="Enable Two-Factor Authentication (2FA)"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </Typography>
        
        {formData.enable2FA && (
          <TextField
            fullWidth
            name="phoneFor2FA"
            label="Phone Number for 2FA"
            placeholder="Enter your phone number"
            value={formData.phoneFor2FA || ''}
            onChange={(e) => setFormData({ ...formData, phoneFor2FA: e.target.value })}
            error={formData.phoneFor2FA === undefined}
            helperText={formData.phoneFor2FA === undefined ? 'Phone number is required for 2FA' : ''}
            sx={{ maxWidth: 400 }}
          />
        )}
      </Box>

      <FormControlLabel
        control={
          <Checkbox 
            name="acceptTerms" 
            checked={formData.acceptTerms || false}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            required
          />
        }
        label={
          <Typography variant="body2">
            I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms of Service</Link> and{' '}
            <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>
          </Typography>
        }
        sx={{ mb: 3 }}
      />
      {formData.acceptTerms === undefined && (
        <FormHelperText error>You must accept the terms and conditions</FormHelperText>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!formik.isValid || !formik.values.acceptTerms}
        onClick={() => handleSubmit()}
      >
        {isLoading ? 'Registering...' : 'Complete Registration'}
      </Button>
    </Box>
  );

  const renderTermsStep = (formik: any) => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
        Terms and Conditions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please read and agree to our terms and conditions.
      </Typography>
      <FormControlLabel
        control={
          <Checkbox 
            name="acceptTerms" 
            checked={formData.acceptTerms || false}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            required
          />
        }
        label={
          <Typography variant="body2">
            I agree to the <Link href="/terms" target="_blank" rel="noopener">Terms of Service</Link> and{' '}
            <Link href="/privacy" target="_blank" rel="noopener">Privacy Policy</Link>
          </Typography>
        }
        sx={{ mb: 3 }}
      />
      {formData.acceptTerms === undefined && (
        <FormHelperText error>You must accept the terms and conditions</FormHelperText>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={!formik.isValid || !formik.values.acceptTerms}
        onClick={() => handleSubmit()}
      >
        {isLoading ? 'Registering...' : 'Complete Registration'}
      </Button>
    </Box>
  );

  // Memoize the current step component to prevent unnecessary re-renders
  const CurrentStepComponent = useMemo(() => {
    if (!formSteps[activeStep]) return null;
    
    switch (activeStep) {
      case 0:
        return renderUserTypeStep(formik);
      case 1:
        return renderPersonalInfoStep(formik);
      case 2:
        return renderPasswordStep(formik);
      case 3:
        return formData.userType === 'STORE_OWNER' ? renderStoreInfoStep(formik) : renderSecurityStep(formik);
      case 4:
        return formData.userType === 'STORE_OWNER' ? renderSecurityStep(formik) : renderTermsStep(formik);
      case 5:
        return renderTermsStep(formik);
      default:
        return null;
    }
  }, [activeStep, formData, formik, formSteps]);

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography component="h1" variant="h4" align="center">
            Create an Account
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 4 }}>
            {formSteps.map((step, index) => (
              <Step key={step.label} completed={index < activeStep}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ mt: 2 }}>
            {CurrentStepComponent}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              type="button"
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={formik.isSubmitting}
            >
              {activeStep === formSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default RegisterPage;