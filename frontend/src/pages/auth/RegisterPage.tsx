import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types';


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
  securityQuestions: Array<{ question: string; answer: string }>;
  securityQuestion1: string;
  securityQuestion2: string;
  securityAnswer1: string;
  securityAnswer2: string;
  enable2FA: boolean;
  phoneFor2FA: string;
  acceptTerms: boolean;
};

// Form step type
interface FormStep {
  label: string;
  fields: string[];
  skip?: (values: FormValues) => boolean;
  validate?: (values: FormValues) => boolean;
}

// Register data type for API
interface RegisterData {
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
}

// Move security questions outside the component
const securityQuestions = [
  'What was your first pet\'s name?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was your first car?',
  'What is the name of your first school?'
];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Combined validation schema
  const validationSchema = useMemo(() => Yup.object().shape({
    userType: Yup.string().oneOf(['CUSTOMER', 'STORE_OWNER'] as const).required('Required'),
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
      is: 'STORE_OWNER',
      then: (schema) => schema.required('Store name is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    address: Yup.string().when('userType', {
      is: 'STORE_OWNER',
      then: (schema) => schema.required('Address is required'),
      otherwise: (schema) => schema.notRequired()
    }),
    securityQuestion1: Yup.string().required('Security question 1 is required'),
    securityAnswer1: Yup.string().required('Answer is required'),
    securityQuestion2: Yup.string()
      .required('Security question 2 is required')
      .test(
        'different-questions',
        'Must be different from first question',
        function(value) {
          return value !== this.parent.securityQuestion1;
        }
      ),
    securityAnswer2: Yup.string().required('Answer is required'),
    acceptTerms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
      .required('Required')
  }), []);

  const formSteps = useMemo<FormStep[]>(() => [
    {
      label: 'Account Type',
      fields: ['userType'],
      validate: (values: FormValues) => {
        const schema = Yup.object().shape({
          userType: Yup.string().oneOf(['CUSTOMER', 'STORE_OWNER'] as const).required('Required')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    },
    {
      label: 'Personal Information',
      fields: ['name', 'email', 'phone'],
      validate: (values: FormValues) => {
        const schema = Yup.object().shape({
          name: Yup.string().required('Name is required'),
          email: Yup.string().email('Invalid email').required('Email is required'),
          phone: Yup.string().required('Phone number is required')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    },
    {
      label: 'Password',
      fields: ['password', 'confirmPassword'],
      validate: (values: FormValues) => {
        const schema = Yup.object().shape({
          password: Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
          confirmPassword: Yup.string()
            .oneOf([Yup.ref('password')], 'Passwords must match')
            .required('Please confirm your password')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    },
    {
      label: 'Store Information',
      fields: ['storeName', 'address'],
      skip: (values: FormValues) => values.userType !== 'STORE_OWNER',
      validate: (values: FormValues) => {
        if (values.userType !== 'STORE_OWNER') return true;
        const schema = Yup.object().shape({
          storeName: Yup.string().required('Store name is required'),
          address: Yup.string().required('Address is required')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    },
    {
      label: 'Security Questions',
      fields: ['securityQuestion1', 'securityAnswer1', 'securityQuestion2', 'securityAnswer2'],
      validate: (values: FormValues) => {
        const schema = Yup.object().shape({
          securityQuestion1: Yup.string().required('Security question 1 is required'),
          securityAnswer1: Yup.string().required('Answer is required'),
          securityQuestion2: Yup.string()
            .required('Security question 2 is required')
            .test(
              'different-questions',
              'Must be different from first question',
              function(value) {
                return value !== this.parent.securityQuestion1;
              }
            ),
          securityAnswer2: Yup.string().required('Answer is required')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    },
    {
      label: 'Terms',
      fields: ['acceptTerms'],
      validate: (values: FormValues) => {
        const schema = Yup.object().shape({
          acceptTerms: Yup.boolean()
            .oneOf([true], 'You must accept the terms and conditions')
            .required('Required')
        });
        return schema.isValidSync(values, { abortEarly: false });
      }
    }
  ], []);

  const formik = useFormik<FormValues>({
    validateOnMount: true,
    validateOnChange: true,
    validateOnBlur: true,
    validationSchema: Yup.object().shape({
      ...(formSteps[activeStep]?.fields.includes('userType') && {
        userType: Yup.string().oneOf(['CUSTOMER', 'STORE_OWNER'] as const).required('Required')
      }),
      ...(formSteps[activeStep]?.fields.includes('name') && {
        name: Yup.string().required('Name is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('email') && {
        email: Yup.string().email('Invalid email').required('Email is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('phone') && {
        phone: Yup.string().required('Phone number is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('password') && {
        password: Yup.string()
          .min(8, 'Password must be at least 8 characters')
          .required('Password is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('confirmPassword') && {
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .required('Please confirm your password')
      }),
      ...(formSteps[activeStep]?.fields.includes('storeName') && {
        storeName: Yup.string().when('userType', {
          is: 'STORE_OWNER',
          then: (schema) => schema.required('Store name is required'),
          otherwise: (schema) => schema.notRequired()
        })
      }),
      ...(formSteps[activeStep]?.fields.includes('address') && {
        address: Yup.string().when('userType', {
          is: 'STORE_OWNER',
          then: (schema) => schema.required('Address is required'),
          otherwise: (schema) => schema.notRequired()
        })
      }),
      ...(formSteps[activeStep]?.fields.includes('securityQuestion1') && {
        securityQuestion1: Yup.string().required('Security question 1 is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('securityAnswer1') && {
        securityAnswer1: Yup.string().required('Answer is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('securityQuestion2') && {
        securityQuestion2: Yup.string()
          .required('Security question 2 is required')
          .test(
            'different-questions',
            'Must be different from first question',
            function(value) {
              return value !== this.parent.securityQuestion1;
            }
          )
      }),
      ...(formSteps[activeStep]?.fields.includes('securityAnswer2') && {
        securityAnswer2: Yup.string().required('Answer is required')
      }),
      ...(formSteps[activeStep]?.fields.includes('acceptTerms') && {
        acceptTerms: Yup.boolean()
          .oneOf([true], 'You must accept the terms and conditions')
          .required('Required')
      })
    }),
    initialValues: {
      userType: 'CUSTOMER',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      storeName: '',
      address: '',
      securityQuestions: [],
      securityQuestion1: '',
      securityQuestion2: '',
      securityAnswer1: '',
      securityAnswer2: '',
      enable2FA: false,
      phoneFor2FA: '',
      acceptTerms: false,
    },
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (activeStep === formSteps.length - 1) {
          // Prepare the registration data
          const registerData: RegisterData = {
            userType: values.userType,
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            ...(values.userType === 'STORE_OWNER' && {
              storeName: values.storeName,
              address: values.address,
            }),
            securityQuestions: [
              { question: values.securityQuestion1, answer: values.securityAnswer1 },
              { question: values.securityQuestion2, answer: values.securityAnswer2 },
            ],
            enable2FA: values.enable2FA,
            ...(values.enable2FA && { phoneFor2FA: values.phoneFor2FA }),
          };
          await register(registerData);
          setShowSuccess(true);
        } else {
          setActiveStep(prev => prev + 1);
        }
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (activeStep === formSteps.length - 1) {
      try {
        await register(values);
        setShowSuccess(true);
      } catch (error) {
        console.error('Registration failed:', error);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/login');
  };

  // Handle going back to previous step
  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Render form steps
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Account Type
        return (
          <FormControl fullWidth margin="normal" error={formik.touched.userType && Boolean(formik.errors.userType)}>
            <InputLabel id="user-type-label">I am a</InputLabel>
            <Select
              labelId="user-type-label"
              name="userType"
              value={formik.values.userType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="I am a"
            >
              <MenuItem value="CUSTOMER">Customer</MenuItem>
              <MenuItem value="STORE_OWNER">Store Owner</MenuItem>
            </Select>
            {formik.touched.userType && formik.errors.userType && (
              <FormHelperText>{formik.errors.userType}</FormHelperText>
            )}
          </FormControl>
        );
      
      case 1: // Personal Information
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
              name="name"
              label="Full Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              margin="normal"
              name="email"
              label="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              fullWidth
              margin="normal"
              name="phone"
              label="Phone Number"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />
          </>
        );

      case 2: // Password
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
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
        );

      case 3: // Store Information (only for store owners)
        if (formik.values.userType !== 'STORE_OWNER') {
          return null;
        }
        return (
          <>
            <TextField
              fullWidth
              margin="normal"
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

      case 4: // Security Questions
        return (
          <>
            <FormControl fullWidth margin="normal" error={formik.touched.securityQuestion1 && Boolean(formik.errors.securityQuestion1)}>
              <InputLabel>Security Question 1</InputLabel>
              <Select
                name="securityQuestion1"
                value={formik.values.securityQuestion1}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Security Question 1"
              >
                {securityQuestions.map((question, index) => (
                  <MenuItem key={`q1-${index}`} value={question}>
                    {question}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.securityQuestion1 && formik.errors.securityQuestion1 && (
                <FormHelperText>{formik.errors.securityQuestion1}</FormHelperText>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              name="securityAnswer1"
              label="Answer"
              value={formik.values.securityAnswer1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.securityAnswer1 && Boolean(formik.errors.securityAnswer1)}
              helperText={formik.touched.securityAnswer1 && formik.errors.securityAnswer1}
            />

            <FormControl fullWidth margin="normal" error={formik.touched.securityQuestion2 && Boolean(formik.errors.securityQuestion2)}>
              <InputLabel>Security Question 2</InputLabel>
              <Select
                name="securityQuestion2"
                value={formik.values.securityQuestion2}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                <FormHelperText>{formik.errors.securityQuestion2}</FormHelperText>
              )}
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              name="securityAnswer2"
              label="Answer"
              value={formik.values.securityAnswer2}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.securityAnswer2 && Boolean(formik.errors.securityAnswer2)}
              helperText={formik.touched.securityAnswer2 && formik.errors.securityAnswer2}
            />

            <FormControlLabel
              control={
                <Switch
                  name="enable2FA"
                  checked={formik.values.enable2FA}
                  onChange={formik.handleChange}
                  color="primary"
                />
              }
              label="Enable Two-Factor Authentication"
            />

            {formik.values.enable2FA && (
              <TextField
                fullWidth
                margin="normal"
                name="phoneFor2FA"
                label="Phone Number for 2FA"
                value={formik.values.phoneFor2FA}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phoneFor2FA && Boolean(formik.errors.phoneFor2FA)}
                helperText={formik.touched.phoneFor2FA && formik.errors.phoneFor2FA}
              />
            )}
          </>
        );

      case 5: // Terms and Conditions
        return (
          <>
            <Typography variant="body1" paragraph>
              Please read and accept our Terms and Conditions and Privacy Policy.
            </Typography>
            <FormControl 
              error={formik.touched.acceptTerms && Boolean(formik.errors.acceptTerms)}
              component="fieldset"
              variant="standard"
              fullWidth
              margin="normal"
            >
              <FormControlLabel
                control={
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formik.values.acceptTerms}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                }
                label="I agree to the Terms and Conditions and Privacy Policy"
              />
              {formik.touched.acceptTerms && formik.errors.acceptTerms && (
                <FormHelperText>{formik.errors.acceptTerms}</FormHelperText>
              )}
            </FormControl>
          </>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3, mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Create an Account
      </Typography>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="subtitle1" color="textSecondary">
          Step {activeStep + 1} of {formSteps.length}: {formSteps[activeStep]?.label}
        </Typography>
      </Box>
      
      <Box 
        component="form" 
        onSubmit={formik.handleSubmit}
        sx={{
          backgroundColor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        {renderStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || formik.isSubmitting}
            onClick={handleBack}
            sx={{ minWidth: 100 }}
          >
            Back
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={formik.isSubmitting || (activeStep === formSteps.length - 1 && !formik.values.acceptTerms)}
            sx={{ minWidth: 150 }}
          >
            {formik.isSubmitting ? 'Processing...' : 
             activeStep === formSteps.length - 1 ? 'Complete Registration' : 'Next'}
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Already have an account?{' '}
          <Button 
            color="primary" 
            size="small" 
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Sign In
          </Button>
        </Typography>
      </Box>

      {/* Success Dialog */}
      <Dialog
        open={showSuccess}
        onClose={handleCloseSuccess}
        aria-labelledby="registration-success-dialog"
      >
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

// Export the component as default
export default RegisterPage;