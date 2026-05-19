export type UserRole = 'superadmin' | 'company_admin' | 'branch_manager' | 'staff' | 'driver';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  plan: string;
  sub_status: string;
  is_active: boolean;
  is_suspended: boolean;
  max_users: number;
  max_branches: number;
}

export interface Branch {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface Outlet {
  id: string;
  tenant_id: string;
  company_id: string;
  branch_id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  is_active: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  company_id: string;
  category_id: string;
  name: string;
  description: string;
  price_type: 'weight' | 'piece';
  unit: string;
  base_price: number;
  min_quantity: number;
  estimated_hours: number;
  is_active: boolean;
}

export interface Customer {
  id: string;
  tenant_id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  is_member: boolean;
  total_orders: number;
  total_spent: number;
}

export interface OrderItem {
  id?: string;
  service_id: string;
  service_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  notes: string;
}

export type OrderStatus = 'pending' | 'washing' | 'drying' | 'ironing' | 'packing' | 'finished' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refund';

export interface Order {
  id: string;
  tenant_id: string;
  company_id: string;
  branch_id: string;
  outlet_id: string;
  customer_id: string;
  user_id: string;
  invoice_number: string;
  status: OrderStatus;
  order_type: string;
  service_type: string;
  total_weight: number;
  total_items: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_status: PaymentStatus;
  payment_method: string;
  notes: string;
  estimated_done_at: string;
  completed_at: string;
  created_at: string;
  items?: OrderItem[];
  customer?: Customer;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_branches: number;
  features: string;
  is_active: boolean;
}

export interface DashboardStats {
  total_companies: number;
  active_subscriptions: number;
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_employees: number;
  active_devices: number;
  revenue_today: number;
  orders_today: number;
  orders_by_status: Record<string, number>;
}
