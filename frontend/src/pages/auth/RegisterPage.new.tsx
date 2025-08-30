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

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form steps configuration
  const formSteps = useMemo<FormStep[]>(() => [
    {
      label: 'Account Type',
      fields: ['userType'],
      validate: (values: FormValues) => {
        return !!values.userType;
      }
    },
    // Add other steps as needed
  ], []);

  // Formik configuration
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
      securityQuestions: [],
      securityQuestion1: '',
      securityQuestion2: '',
      securityAnswer1: '',
      securityAnswer2: '',
      enable2FA: false,
      phoneFor2FA: '',
      acceptTerms: false,
    },
    validationSchema: Yup.object({
      // Add validation schema here
    }),
    onSubmit: async (values) => {
      try {
        // Handle form submission
        setShowSuccess(true);
      } catch (error) {
        console.error('Registration failed:', error);
      }
    },
  });

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/login');
  };

  return (
    <Box>
      <form onSubmit={formik.handleSubmit}>
        {/* Add your form fields here */}
        <Button type="submit" variant="contained" color="primary">
          Register
        </Button>
      </form>

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

export default RegisterPage;
