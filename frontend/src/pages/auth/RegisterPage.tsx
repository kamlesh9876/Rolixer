import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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

// Define the form values type
type FormValues = {
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
};

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { type: urlType } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<UserType>(() => {
    // First check URL params, then query params
    const type = urlType || searchParams.get('type') || '';
    return type.toUpperCase() === 'STORE_OWNER' ? 'STORE_OWNER' : 'CUSTOMER';
  });

  useEffect(() => {
    const typeFromQuery = searchParams.get('type');
    if (typeFromQuery && !urlType) {
      // Replace URL to use path parameter instead of query parameter
      navigate(`/register/${typeFromQuery}`, { replace: true });
    }
  }, [searchParams, urlType, navigate]);
  
  const { register } = useAuth();

  const formik = useFormik<FormValues>({
    initialValues: {
      userType: userType,
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
    },
    validationSchema: Yup.lazy((values) => {
      if (activeStep === 0) return Yup.object({}); // User type selection - no validation needed
      if (activeStep === 1) return personalInfoSchema;
      if (activeStep === 2) return passwordSchema;
      if (activeStep === 3 && values.userType === 'STORE_OWNER') return storeInfoSchema;
      if (activeStep === (values.userType === 'STORE_OWNER' ? 4 : 3)) return securitySchema;
      return Yup.object({});
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError('');
        
        // Check if we're on the final step
        const totalSteps = values.userType === 'STORE_OWNER' ? 5 : 4;
        const isLastStep = activeStep === totalSteps - 1;
        
        if (!isLastStep) {
          await handleNext();
          return;
        }
        
        // On final step, submit the form
        await register({
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          userType: values.userType as UserType,
          securityQuestions: [
            { question: values.securityQuestion1, answer: values.securityAnswer1 },
            { question: values.securityQuestion2, answer: values.securityAnswer2 }
          ],
          enable2FA: values.enable2FA,
          phoneFor2FA: values.phoneFor2FA,
          ...(values.userType === 'STORE_OWNER' && {
            storeName: values.storeName,
            address: values.address,
          }),
        });
        
        navigate('/dashboard');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create an account. Please try again.';
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleUserTypeSelect = (selectedType: UserType) => {
    setUserType(selectedType);
    formik.setFieldValue('userType', selectedType);
    // Move to next step after selecting user type
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  const handleNext = async (): Promise<void> => {
    try {
      // Skip validation for user type step
      if (activeStep === 0) {
        setActiveStep(1);
        return;
      }

      // Mark all current step fields as touched
      const fieldsToTouch: Record<string, boolean> = {};
      const currentSchema = getCurrentStepSchema(formik.values);
      
      if (currentSchema && 'fields' in currentSchema && currentSchema.fields) {
        Object.keys(currentSchema.fields).forEach((field: string) => {
          fieldsToTouch[field] = true;
        });
      }
      
      await formik.setTouched(fieldsToTouch);
      
      // Validate current step
      const errors = await formik.validateForm();
      const currentStepErrors: Record<string, string> = {};
      
      // Filter errors for current step fields only
      if (currentSchema && currentSchema.fields && typeof currentSchema.fields === 'object') {
        const schemaFields = currentSchema.fields as Record<string, unknown>;
        Object.keys(errors).forEach(key => {
          if (key in schemaFields && errors[key as keyof FormValues]) {
            currentStepErrors[key] = errors[key as keyof FormValues] as string;
          }
        });
      }
    
      if (Object.keys(currentStepErrors).length === 0) {
        // No errors, proceed to next step
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        // Scroll to top of form
        window.scrollTo(0, 0);
      } else {
        // Show errors for current step only
        formik.setErrors(currentStepErrors);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      setError('An error occurred while processing your request. Please try again.');
    }
  };
  
  const getCurrentStepSchema = (values: FormValues): Yup.AnySchema | null => {
    switch (activeStep) {
      case 0:
        return null; // User type selection
      case 1:
        return personalInfoSchema;
      case 2:
        return passwordSchema;
      case 3:
        return values.userType === 'STORE_OWNER' ? storeInfoSchema : securitySchema;
      case 4:
        return securitySchema;
      default:
        return null;
    }
  };

  const getActiveSteps = () => {
    const baseSteps = [
      {
        id: 'user-type',
        label: 'User Type',
      },
      {
        id: 'personal-info',
        label: 'Personal Info',
      },
      {
        id: 'password',
        label: 'Password',
      },
    ];

    if (userType === 'STORE_OWNER') {
      baseSteps.push({
        id: 'store-info',
        label: 'Store Info',
      });
    }

    baseSteps.push({
      id: 'security',
      label: 'Security',
    });

    return baseSteps;
  };

  const activeSteps = getActiveSteps();

  const renderUserTypeStep = () => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
        Choose Account Type
      </Typography>
      <UserTypeSelector 
        onSelect={handleUserTypeSelect} 
        selectedType={userType}
      />
    </Box>
  );

  const renderPersonalInfoStep = () => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
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
        value={formik.values.name}
        onChange={formik.handleChange}
        error={formik.touched.name && Boolean(formik.errors.name)}
        helperText={formik.touched.name && formik.errors.name}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="phone"
        label="Phone Number"
        name="phone"
        autoComplete="tel"
        value={formik.values.phone}
        onChange={formik.handleChange}
        error={formik.touched.phone && Boolean(formik.errors.phone)}
        helperText={formik.touched.phone && formik.errors.phone}
      />
    </Box>
  );

  const renderPasswordStep = () => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
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
        value={formik.values.password}
        onChange={formik.handleChange}
        error={formik.touched.password && Boolean(formik.errors.password)}
        helperText={
          formik.touched.password && formik.errors.password
            ? formik.errors.password
            : 'At least 8 characters with 1 uppercase and 1 special character'
        }
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        error={
          formik.touched.confirmPassword && 
          Boolean(formik.errors.confirmPassword)
        }
        helperText={
          formik.touched.confirmPassword && formik.errors.confirmPassword
        }
      />
    </Box>
  );

  const renderStoreInfoStep = () => (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
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
        value={formik.values.storeName}
        onChange={formik.handleChange}
        error={formik.touched.storeName && Boolean(formik.errors.storeName)}
        helperText={formik.touched.storeName && formik.errors.storeName}
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
        value={formik.values.address}
        onChange={formik.handleChange}
        error={formik.touched.address && Boolean(formik.errors.address)}
        helperText={formik.touched.address && formik.errors.address}
      />
    </Box>
  );

  const renderSecurityStep = () => (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
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
          value={formik.values.securityQuestion1}
          onChange={formik.handleChange}
          error={formik.touched.securityQuestion1 && Boolean(formik.errors.securityQuestion1)}
          label="Security Question 1"
        >
          {securityQuestions.map((question, index) => (
            <MenuItem key={`q1-${index}`} value={question}>
              {question}
            </MenuItem>
          ))}
        </Select>
        {formik.touched.securityQuestion1 && formik.errors.securityQuestion1 && (
          <FormHelperText error>{formik.errors.securityQuestion1}</FormHelperText>
        )}
      </FormControl>

      <TextField
        fullWidth
        name="securityAnswer1"
        label="Your Answer"
        value={formik.values.securityAnswer1}
        onChange={formik.handleChange}
        error={formik.touched.securityAnswer1 && Boolean(formik.errors.securityAnswer1)}
        helperText={formik.touched.securityAnswer1 && formik.errors.securityAnswer1}
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Security Question 2</InputLabel>
        <Select
          name="securityQuestion2"
          value={formik.values.securityQuestion2}
          onChange={formik.handleChange}
          error={formik.touched.securityQuestion2 && Boolean(formik.errors.securityQuestion2)}
          label="Security Question 2"
        >
          {securityQuestions
            .filter(q => q !== formik.values.securityQuestion1)
            .map((question, index) => (
              <MenuItem key={`q2-${index}`} value={question}>
                {question}
              </MenuItem>
            ))}
        </Select>
        {formik.touched.securityQuestion2 && formik.errors.securityQuestion2 && (
          <FormHelperText error>{formik.errors.securityQuestion2}</FormHelperText>
        )}
      </FormControl>

      <TextField
        fullWidth
        name="securityAnswer2"
        label="Your Answer"
        value={formik.values.securityAnswer2}
        onChange={formik.handleChange}
        error={formik.touched.securityAnswer2 && Boolean(formik.errors.securityAnswer2)}
        helperText={formik.touched.securityAnswer2 && formik.errors.securityAnswer2}
        sx={{ mb: 4 }}
      />

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox 
              name="enable2FA" 
              checked={formik.values.enable2FA}
              onChange={formik.handleChange}
            />
          }
          label="Enable Two-Factor Authentication (2FA)"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </Typography>
        
        {formik.values.enable2FA && (
          <TextField
            fullWidth
            name="phoneFor2FA"
            label="Phone Number for 2FA"
            placeholder="Enter your phone number"
            value={formik.values.phoneFor2FA}
            onChange={formik.handleChange}
            error={formik.touched.phoneFor2FA && Boolean(formik.errors.phoneFor2FA)}
            helperText={
              formik.touched.phoneFor2FA && formik.errors.phoneFor2FA 
                ? formik.errors.phoneFor2FA 
                : 'We\'ll send a verification code to this number'
            }
            sx={{ maxWidth: 400 }}
          />
        )}
      </Box>

      <FormControlLabel
        control={
          <Checkbox 
            name="acceptTerms" 
            checked={formik.values.acceptTerms}
            onChange={formik.handleChange}
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
      {formik.touched.acceptTerms && formik.errors.acceptTerms && (
        <FormHelperText error sx={{ mt: -2, mb: 2 }}>
          {formik.errors.acceptTerms}
        </FormHelperText>
      )}
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderUserTypeStep();
      case 1:
        return renderPersonalInfoStep();
      case 2:
        return renderPasswordStep();
      case 3:
        return userType === 'STORE_OWNER' ? renderStoreInfoStep() : renderSecurityStep();
      case 4:
        return renderSecurityStep();
      default:
        return null;
    }
  };

  const totalSteps = userType === 'STORE_OWNER' ? 5 : 4;
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, width: '100%' }}>
          {activeSteps.map((step) => (
            <Step key={step.id}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ width: '100%', p: 3 }}>
          <form onSubmit={formik.handleSubmit} noValidate>
            {renderStepContent(activeStep)}
            
            {activeStep > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={formik.isSubmitting}
                >
                  {isLastStep ? 'Complete Registration' : 'Continue'}
                </Button>
              </Box>
            )}
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;