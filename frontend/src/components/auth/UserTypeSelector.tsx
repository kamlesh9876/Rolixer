import React from 'react';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

type UserType = 'CUSTOMER' | 'STORE_OWNER' | 'ADMIN';

interface UserTypeSelectorProps {
  onSelect: (userType: UserType) => void;
  selectedType?: UserType | null;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ onSelect, selectedType }) => {
  const userTypes = [
    {
      type: 'CUSTOMER',
      title: 'App User',
      description: 'Browse and rate stores, leave reviews, and save favorites.',
      icon: <PersonIcon fontSize="large" />
    },
    {
      type: 'STORE_OWNER',
      title: 'Store Owner',
      description: 'Manage your store, respond to reviews, and track ratings.',
      icon: <StoreIcon fontSize="large" />
    },
    {
      type: 'ADMIN',
      title: 'System Admin',
      description: 'Manage users, stores, and platform settings.',
      icon: <AdminPanelSettingsIcon fontSize="large" />
    }
  ] as const;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Welcome to Store Rating System
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
        Please select your role to continue
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {userTypes.map(({ type, title, description, icon }) => (
          <Grid item xs={12} md={4} key={type}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 3
                },
                ...(selectedType === type && {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                  backgroundColor: 'action.hover'
                })
              }}
              onClick={() => onSelect(type as UserType)}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </CardContent>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 'auto', borderRadius: '0 0 4px 4px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(type as UserType);
                }}
              >
                Select {title}
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserTypeSelector;
export type { UserType };
