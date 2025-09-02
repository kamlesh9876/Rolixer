export class AdminDashboardStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
  recentUsers: any[]; // You might want to create a specific DTO for this
  recentStores: any[]; // You might want to create a specific DTO for this
  ratingsDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export class UserListResponse {
  data: any[]; // Replace with proper User DTO
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class StoreListResponse {
  data: any[]; // Replace with proper Store DTO
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
