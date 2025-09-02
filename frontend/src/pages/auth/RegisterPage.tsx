import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { FormikErrors, FormikValues } from 'formik';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Fade,
  CircularProgress,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types';


// Security questions for the form
const securityQuestions = [
  'What was your first pet\'s name?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was your first car?',
  'What is the name of your first school?'
];

// Form values type
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
  securityQuestion2: string;
  securityAnswer1: string;
  securityAnswer2: string;
  enable2FA: boolean;
  phoneFor2FA: string;
  acceptTerms: boolean;
};

// Form step type
interface FormStep<T extends FormikValues> {
  label: string;
  fields: (keyof T)[];
  skip?: (values: T) => boolean;
  validate?: (values: T) => boolean;
}

// Register data type for API
type RegisterData = {
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  password: string;
  storeName?: string;
  address?: string;
  securityQuestions: Array<{ question: string; answer: string }>;
  enable2FA: boolean;
  phoneFor2FA?: string;
} & (
  | { userType: 'STORE_OWNER'; storeName: string; address: string }
  | { userType: 'CUSTOMER' | 'ADMIN' }
)

const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form steps configuration
  const formSteps = useMemo<Array<FormStep<FormValues>>>(
    () => [
      {
        label: 'Account Type',
        fields: ['userType'],
        skip: () => false,
      },
      {
        label: 'Personal Info',
        fields: ['name', 'email', 'phone', 'password', 'confirmPassword'],
        skip: () => false,
      },
      {
        label: 'Store Info',
        fields: ['storeName', 'address'],
      },
      {
        label: 'Security',
        fields: ['securityQuestion1', 'securityAnswer1', 'securityQuestion2', 'securityAnswer2'],
        skip: () => false,
      },
      {
        label: 'Preferences',
        fields: ['enable2FA', 'phoneFor2FA', 'acceptTerms'],
        skip: () => false,
      },
    ],
    []
  ) as Array<FormStep<FormValues>>;

  // Form validation schema
  const validationSchema = useMemo(() => {
    return Yup.object().shape({
      userType: Yup.string().required('Please select an account type'),
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      phone: Yup.string().required('Phone number is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
      storeName: Yup.string().when('userType', {
        is: (val: UserType) => val === 'STORE_OWNER',
        then: (schema) => schema.required('Store name is required'),
        otherwise: (schema) => schema.notRequired()
      }),
      address: Yup.string().when('userType', {
        is: 'STORE_OWNER',
        then: (schema) => schema.required('Address is required'),
        otherwise: (schema) => schema.notRequired()
      }),
      securityQuestion1: Yup.string().required('Security question 1 is required'),
      securityQuestion2: Yup.string()
        .required('Security question 2 is required')
        .notOneOf(
          [Yup.ref('securityQuestion1')],
          'Must be different from first question'
        ),
      securityAnswer1: Yup.string().required('Answer is required'),
      securityAnswer2: Yup.string().required('Answer is required'),
      enable2FA: Yup.boolean(),
      phoneFor2FA: Yup.string().when('enable2FA', {
        is: true,
        then: (schema) => schema.required('Phone number is required for 2FA'),
        otherwise: (schema) => schema.notRequired()
      }),
      acceptTerms: Yup.boolean()
        .oneOf([true], 'You must accept the terms and conditions')
        .required('Required'),
    });
  }, []);

  // Formik configuration
  const formik = useFormik<FormValues>({
    initialValues: {
      userType: ((searchParams.get('type')?.toUpperCase() as UserType) || 'CUSTOMER') as UserType,
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      address: '',
      securityQuestion1: '',
      securityQuestion2: '',
      securityAnswer1: '',
      securityAnswer2: '',
      enable2FA: false,
      phoneFor2FA: '',
      acceptTerms: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { confirmPassword, securityQuestion1, securityQuestion2, securityAnswer1, securityAnswer2, ...rest } = values;
        
        // Create base register data
        const baseData = {
          ...rest,
          securityQuestions: [
            { question: securityQuestion1, answer: securityAnswer1 },
            { question: securityQuestion2, answer: securityAnswer2 },
          ],
        };

        // Handle store owner specific fields
        const registerData: RegisterData = baseData.userType === 'STORE_OWNER'
          ? {
              ...baseData,
              storeName: values.storeName || '',
              address: values.address || '',
            }
          : baseData;

        await register(registerData);
        setShowSuccess(true);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed';
        setError(errorMessage);
        console.error('Registration failed:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Track all steps and their visibility
  const { visibleSteps, stepMap } = useMemo(() => {
    const visible: Array<FormStep<FormValues>> = [];
    const stepMap: Record<number, number> = {}; // Maps original step index to visible step index
    
    formSteps.forEach((step, index) => {
      // Always show security questions step
      const isVisible = step.label === 'Security' || !step.skip || !step.skip(formik.values);
      if (isVisible) {
        stepMap[index] = visible.length;
        visible.push(step);
      } else {
        stepMap[index] = -1; // Mark as hidden
      }
    });
    
    return { visibleSteps: visible, stepMap };
  }, [formSteps, formik.values]);
  
  // Get current step info
  const { currentStep, isLastStep } = useMemo(() => {
    const visibleIndex = stepMap[activeStep] ?? 0;
    const safeIndex = Math.min(visibleIndex, Math.max(0, visibleSteps.length - 1));
    
    return {
      currentStep: visibleSteps[safeIndex],
      isLastStep: safeIndex === visibleSteps.length - 1
    };
  }, [activeStep, stepMap, visibleSteps]);

  // Ensure activeStep is within bounds when visible steps change
  useEffect(() => {
    // Find the next visible step if current step is hidden
    const findNextVisibleStep = (current: number, direction: number): number => {
      let nextStep = current + direction;
      
      // If we've gone past the end, go to the last step
      if (nextStep >= formSteps.length) {
        return formSteps.length - 1;
      }
      
      // If we've gone before the start, go to the first step
      if (nextStep < 0) {
        return 0;
      }
      
      // If the step is visible, return it
      if (stepMap[nextStep] !== -1) {
        return nextStep;
      }
      
      // Otherwise, keep looking in the same direction
      return findNextVisibleStep(nextStep, direction);
    };
    
    // If current step is hidden, find the next visible one
    if (stepMap[activeStep] === -1) {
      const nextStep = findNextVisibleStep(activeStep, 1);
      setActiveStep(nextStep);
    }
  }, [activeStep, formSteps.length, stepMap]);

  const handleNext = useCallback(async () => {
    if (!currentStep) {
      return;
    }

    try {
      // Mark all fields as touched to show validation errors
      const touched = currentStep.fields.reduce((acc, field) => {
        acc[field as string] = true;
        return acc;
      }, {} as Record<string, boolean>);
      formik.setTouched(touched, false);

      // Create a validation schema for the current step's fields
      const stepFields = currentStep.fields.reduce<Record<string, any>>((schema, field) => {
        const fieldName = field as string;
        if (fieldName in validationSchema.fields) {
          schema[fieldName] = (validationSchema.fields as Record<string, any>)[fieldName];
        }
        return schema;
      }, {});

      const stepValidationSchema = Yup.object().shape(stepFields);
      
      // Validate only the current step's fields
      await stepValidationSchema.validate(formik.values, { abortEarly: false });
      
      setError(null);
      
      if (isLastStep) {
        try {
          await formik.submitForm();
        } catch (error) {
          console.error('Form submission error:', error);
          throw error;
        }
      } else {
        // Move to next step
        const nextStep = activeStep + 1;
        setActiveStep(nextStep);
        
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const formErrors: FormikErrors<FormValues> = {};
        
        error.inner.forEach(validationError => {
          if (validationError.path) {
            (formErrors as any)[validationError.path] = validationError.message;
          }
        });
        
        formik.setErrors(formErrors);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  }, [currentStep, formik, isLastStep, validationSchema, activeStep]);

  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(0, prev - 1));
  }, []);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    navigate('/login');
  }, [navigate]);

  const renderStepContent = useCallback((step: number) => {
    if (!currentStep) return <div>Loading...</div>;
    
    // Map of step indices to their corresponding content
    const stepContent: Record<number, () => JSX.Element | null> = {
      0: () => (
        <FormControl fullWidth margin="normal">
          <InputLabel id="user-type-label">Account Type</InputLabel>
          <Select
            labelId="user-type-label"
            id="userType"
            name="userType"
            value={formik.values.userType}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.userType && Boolean(formik.errors.userType)}
            label="Account Type"
          >
            <MenuItem value="CUSTOMER">Customer</MenuItem>
            <MenuItem value="STORE_OWNER">Store Owner</MenuItem>
          </Select>
        </FormControl>
      ),
      1: () => (
        <>
          <TextField
            fullWidth
            margin="normal"
            id="name"
            name="name"
            label="Name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
          <TextField
            fullWidth
            margin="normal"
            id="email"
            name="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            fullWidth
            margin="normal"
            id="phone"
            name="phone"
            label="Phone Number"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
          <TextField
            fullWidth
            margin="normal"
            id="password"
            name="password"
            label="Password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <TextField
            fullWidth
            margin="normal"
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
          />
        </>
      ),
      2: () => {
        if (formik.values.userType !== 'STORE_OWNER') return null;
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              id="storeName"
              name="storeName"
              label="Store Name"
              value={formik.values.storeName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.storeName && Boolean(formik.errors.storeName)}
              helperText={formik.touched.storeName && formik.errors.storeName}
            />
            <TextField
              fullWidth
              margin="normal"
              id="address"
              name="address"
              label="Store Address"
              multiline
              rows={3}
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
            />
          </>
        );
      },
      3: () => (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel id="security-question-1">Security Question 1</InputLabel>
            <Select
              labelId="security-question-1"
              id="securityQuestion1"
              name="securityQuestion1"
              value={formik.values.securityQuestion1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.securityQuestion1 && Boolean(formik.errors.securityQuestion1)}
              label="Security Question 1"
            >
              {securityQuestions.map((question) => (
                <MenuItem key={question} value={question}>
                  {question}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText error>
              {formik.touched.securityQuestion1 && formik.errors.securityQuestion1}
            </FormHelperText>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            id="securityAnswer1"
            name="securityAnswer1"
            label="Answer 1"
            value={formik.values.securityAnswer1}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.securityAnswer1 && Boolean(formik.errors.securityAnswer1)}
            helperText={formik.touched.securityAnswer1 && formik.errors.securityAnswer1}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="security-question-2">Security Question 2</InputLabel>
            <Select
              labelId="security-question-2"
              id="securityQuestion2"
              name="securityQuestion2"
              value={formik.values.securityQuestion2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.securityQuestion2 && Boolean(formik.errors.securityQuestion2)}
              label="Security Question 2"
            >
              {securityQuestions
                .filter(q => q !== formik.values.securityQuestion1)
                .map((question) => (
                  <MenuItem key={question} value={question}>
                    {question}
                  </MenuItem>
                ))}
            </Select>
            <FormHelperText error>
              {formik.touched.securityQuestion2 && formik.errors.securityQuestion2}
            </FormHelperText>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            id="securityAnswer2"
            name="securityAnswer2"
            label="Answer 2"
            value={formik.values.securityAnswer2}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.securityAnswer2 && Boolean(formik.errors.securityAnswer2)}
            helperText={formik.touched.securityAnswer2 && formik.errors.securityAnswer2}
          />
        </>
      ),
      4: () => (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={formik.values.enable2FA}
                onChange={formik.handleChange}
                name="enable2FA"
                color="primary"
              />
            }
            label="Enable Two-Factor Authentication (2FA)"
          />

          {formik.values.enable2FA && (
            <TextField
              fullWidth
              margin="normal"
              id="phoneFor2FA"
              name="phoneFor2FA"
              label="Phone Number for 2FA"
              value={formik.values.phoneFor2FA}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phoneFor2FA && Boolean(formik.errors.phoneFor2FA)}
              helperText={formik.touched.phoneFor2FA && formik.errors.phoneFor2FA}
            />
          )}

          <FormControl
            required
            error={formik.touched.acceptTerms && Boolean(formik.errors.acceptTerms)}
            component="fieldset"
            sx={{ mt: 2 }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.acceptTerms}
                  onChange={formik.handleChange}
                  name="acceptTerms"
                  color="primary"
                />
              }
              label={
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                </span>
              }
            />
            <FormHelperText>
              {formik.touched.acceptTerms && formik.errors.acceptTerms}
            </FormHelperText>
          </FormControl>
        </>
      )
    };

    // Get the current step content based on the step index
    const stepContentFn = stepContent[step];
    return stepContentFn ? stepContentFn() : <div>Unknown step</div>;
  }, [currentStep, formik]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: 800,
          mx: 'auto',
          width: '100%'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '1.8rem', sm: '2.125rem' },
                mb: 1
              }}
            >
              Create an Account
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Join our platform to get started
            </Typography>
          </Box>

        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': {
              fontSize: '0.75rem',
              '&.Mui-active, &.Mui-completed': {
                fontWeight: 600
              }
            }
          }}
        >
          {visibleSteps.map((step, index) => (
            <Step 
              key={step.label} 
              completed={activeStep > index}
            >
              <StepLabel 
                StepIconProps={{
                  sx: {
                    '&.Mui-completed': {
                      color: 'success.main',
                    },
                    '&.Mui-active': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box 
        component="form" 
        noValidate
        sx={{ width: '100%' }}
      >
        <Box 
          mb={4}
          sx={{
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <Fade in={true} timeout={300}>
            <Box>
              {renderStepContent(activeStep)}
            </Box>
          </Fade>
        </Box>

        <Box 
          display="flex" 
          justifyContent="space-between" 
          mt={4}
          pt={2}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            '& > *:not(:first-of-type)': {
              ml: 2
            }
          }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || formik.isSubmitting}
            variant="outlined"
            color="inherit"
            sx={{
              minWidth: '100px',
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '8px',
              py: 1,
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            Back
          </Button>
          <Box sx={{ position: 'relative' }}>
            <Button
              type="button"
              variant="contained"
              color="primary"
              disabled={formik.isSubmitting}
              onClick={handleNext}
              sx={{
                minWidth: '120px',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                py: 1,
                px: 4,
                boxShadow: '0 2px 10px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                  boxShadow: 'none'
                }
              }}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : isLastStep ? (
                'Create Account'
              ) : (
                'Continue'
              )}
            </Button>
            {formik.isSubmitting && (
              <CircularProgress
                size={24}
                sx={{
                  color: 'primary.main',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Box>
        </Box>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link 
              href="/login" 
              color="primary" 
              sx={{ 
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>

      </Box>
    </Paper>
  </Box>

  {/* Success Dialog */}
  <Dialog open={showSuccess} onClose={handleCloseSuccess}>
    <DialogTitle>Registration Successful!</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Your account has been created successfully. You will be redirected to the login page.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCloseSuccess} color="primary" autoFocus>
        OK
      </Button>
    </DialogActions>
  </Dialog>
</Box>
);
};

// Export as default with the correct type
export default RegisterPage;
