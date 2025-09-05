import { Routes } from '@angular/router';
import { TransferComponent } from './transactions/transfer/transfer.component';
import { TransactionHomeComponent } from './transactions/transaction-home/transaction-home.component';
import { WithdrawComponent } from './transactions/withdraw/withdraw.component';
import { TransactionResultComponent } from './transactions/results/transaction-result.component';
import { TransactionHistoryComponent } from './transactions/history/transaction-history.component';
import { TransactionDetailComponent } from './transactions/detail/transaction-detail.component';
import { PaymentSelectionComponent } from './transactions/payment-selection/payment-selection.component';
import { BillLookupComponent } from './transactions/bill-lockup/bill-lookup.component';
import { PayBillComponent } from './transactions/pay-bill/pay-bill.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { KycGuard } from './core/guards/kyc.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { CustomerDetailComponent } from './customer/customer-detail/customer-detail.component';
import { DashboardLoanComponent } from './loan/dashboard-loan/dashboard-loan.component';
import { ApplyNewLoanComponent } from './loan/apply-new-loan/apply-newloan.component';
import { HomeComponent } from './pages/home/home.component';
import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';
import { CustomerAccountsComponent } from './customer/customer-accounts/customer-accounts.component';
import { SavingsComponent } from './pages/savings/savings.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { VerifyOtpComponent } from './auth/verify-otp/verify-otp.component';
import { CustomerListComponent } from './admin/customer-list/customer-list.component';
import { CustomerDetailAdminComponent } from './admin/customer-detail/customer-detail-admin.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';

import { ForbiddenComponent } from './pages/forbidden/forbidden.component';
import { ExternalTransferComponent } from './transactions/external-transfer/external-transfer.component';
import { OrverviewLoanComponent } from './loan/my-loans-overview/orverview-loan.component';
import { LoanHistoryComponent } from './loan/loan-history/loan-history.component';
import { CurrentRepaymentScheduleComponent } from './loan/current-repayment-schedule/current-repayment-schedule.component';
import { PayRepaymentComponent } from './loan/pay-repayment/pay-repayment.component';
import { DetailLoanComponent } from './loan/detail-loan/detail-loan.component';
import { DetailLoanRejectComponent } from './loan/detail-loan-reject/detail-loan-reject.component';
import { PendingLoanListComponent } from './loan-employee/pending-loans-list/pending-loans-list.component';
import { LoanDetailViewComponent } from './loan-employee/loan-detail-view/loan-detail-view.component';
import { WarningApplyLoanComponent } from './loan/warning-apply-loan/warning-apply-loan.component';
import { AboutComponent } from './pages/about/about.component';
import { KycOtpComponent } from './auth/kyc-otp/kyc-otp.component';
import { CreditComponent } from './pages/account/credit/credit.component';
import { AccountComponent } from './pages/account/account.component';
import { DetailComponent } from './pages/account/payment/detail/detail.component';
import { PaymentComponent } from './pages/account/payment/payment.component';
import { RegisterCreditComponent } from './pages/account/credit/register-credit/register-credit.component';
import { ApplyCreditComponent } from './pages/account/credit/apply-credit/apply-credit.component';
import { CreditDetailComponent } from './pages/account/credit/detail/credit-detail.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { KycComponent } from './customer/kyc/kyc.component';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { AdminGuard } from './core/guards/admin.guard';
import { DashboardCustomerComponent } from './admin/admin-dashboard/dashboard-customer.component';
import { KycManagerComponent } from './admin/kyc-manager/kyc-manager.component';
import { DashboardLoanAdminComponent } from './loan/dashboard-loan-admin/dashboard-loan-admin.component';
import { AccountStatisticComponent } from './admin/account-statistic/account-statistic.component';
import { CreditRequestComponent } from './admin/credit-request/credit-request.component';
import { AdminTransactionDetailComponent } from './admin/transaction/transaction-detail/transaction-detail.component';
import { DashboardTransactionComponent } from './admin/admin-dashboard/dashboard-transaction/dashboard-transaction.component';
import { TransactionDepositComponent } from './admin/transaction/transaction-deposit/transaction-deposit.component';
import { TransactionListComponent } from './admin/transaction/transaction-list/transaction-list.component';
  export const routes: Routes = [
  // Authentication routes (no sidebar)
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'kyc-otp', component: KycOtpComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'confirm-otp', component: VerifyOtpComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  // Admin routes (with sidebar)
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'dashboard/transaction', component: DashboardTransactionComponent },
      { path: 'dashboard/customer', component: DashboardCustomerComponent },
      { path: 'admin/loan-dashboard', component: DashboardLoanAdminComponent },

      { path: 'dashboard/account', component: AccountStatisticComponent },
      { path: 'customers', component: CustomerListComponent },
      { path: 'customers/detail/:cifCode', component: CustomerDetailAdminComponent },
      { path: 'accounts', component: CustomerListComponent }, // Placeholder, thay bằng component thực tế
      { path: 'kyc-management', component: KycManagerComponent }, // Placeholder, thay bằng component thực tế
      { path: 'credit-requests', component: CreditRequestComponent },
      { path: 'settings', component: CustomerListComponent }, // Placeholder, thay bằng component thực tế
      { path: 'admin/transactions', component: TransactionListComponent },
      { path: 'employee/loans', component: PendingLoanListComponent },
      { path: 'employee/loans/pending', component: PendingLoanListComponent },
      { path: 'employee/loans/:id', component: LoanDetailViewComponent },
      { path: 'admin/transactions', component: TransactionListComponent, canActivate: [KycGuard] },
      { path: 'admin/transactions/detail/:referenceCode', component: AdminTransactionDetailComponent, canActivate: [KycGuard] },
      { path: 'admin/transactions/deposit', component: TransactionDepositComponent, canActivate: [KycGuard] },
    ]
  },
  // Customer routes (with MainLayoutComponent)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'customer-dashboard', component: CustomerDashboardComponent, canActivate: [KycGuard] },
      { path: 'detail', component: CustomerDetailComponent, canActivate: [KycGuard] },
      { path: 'customers/accounts', component: CustomerAccountsComponent, canActivate: [KycGuard] },
      { path: 'home', component: HomeComponent, canActivate: [KycGuard] },
      { path: 'about', component: AboutComponent, canActivate: [KycGuard] },
      { path: 'savings', component: SavingsComponent, canActivate: [KycGuard] },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [KycGuard] },


      { path: 'admin/transactions', component: TransactionListComponent, canActivate: [KycGuard] },
      { path: 'change-password', component: ChangePasswordComponent, canActivate: [KycGuard] },
      { 
        path: 'account', 
        component: AccountComponent,
        canActivate: [KycGuard],
        children: [
          { path: '', redirectTo: 'payment', pathMatch: 'full' },
          { path: 'payment', component: PaymentComponent },
          { path: 'saving', component: SavingsComponent },
          { path: 'loan', loadComponent: () => import('./pages/account/loan/loan.component').then(m => m.LoanComponent) },
          { path: 'payment/detail/:accountNumber', component: DetailComponent },
          { path: 'credit', component: CreditComponent },
          { path: 'credit/detail/:cardAccountNumber', component: CreditDetailComponent },
          { path: 'credit/register', component: RegisterCreditComponent },
          { path: 'credit/register/apply-credit/:cardID', component: ApplyCreditComponent }
        ]
      },
      { path: 'transactions', component: TransactionHomeComponent, canActivate: [KycGuard] },
      { path: 'transactions/transfer', component: TransferComponent, canActivate: [KycGuard] },
      { path: 'transactions/external-transfer', component: ExternalTransferComponent, canActivate: [KycGuard] },

      { path: 'transactions/withdraw', component: WithdrawComponent, canActivate: [KycGuard] },
      { path: 'transactions/transaction-result', component: TransactionResultComponent, canActivate: [KycGuard] },
      { path: 'transactions/history', component: TransactionHistoryComponent, canActivate: [KycGuard] },
      { path: 'transactions/detail/:referenceCode', component: TransactionDetailComponent, canActivate: [KycGuard] },
      { path: 'transactions/payment', component: PaymentSelectionComponent, canActivate: [KycGuard] },
      { path: 'transactions/payment/:type', component: BillLookupComponent, canActivate: [KycGuard] },
      { path: 'transactions/pay-bill', component: PayBillComponent, canActivate: [KycGuard] },
      { path: 'loans', component: DashboardLoanComponent, canActivate: [KycGuard] },
      { path: 'loans/create', component: ApplyNewLoanComponent, canActivate: [KycGuard] },
      { path: 'loans/overview', component: OrverviewLoanComponent, canActivate: [KycGuard] },
      { path: 'loans/history', component: LoanHistoryComponent, canActivate: [KycGuard] },
      { path: 'loans/current', component: CurrentRepaymentScheduleComponent, canActivate: [KycGuard] },
      { path: 'loans/pay/:id', component: PayRepaymentComponent, canActivate: [KycGuard] },
      { path: 'loans/detail/:id', component: DetailLoanComponent, canActivate: [KycGuard] },
      { path: 'loans/reject/:id', component: DetailLoanRejectComponent, canActivate: [KycGuard] },
      { path: 'loan/warning-apply-loan', component: WarningApplyLoanComponent, canActivate: [KycGuard] },
      { path: '', redirectTo: 'customer-dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'kyc', component: KycComponent, canActivate: [AuthGuard] },
  // Error pages
  { path: 'forbidden', component: ForbiddenComponent },
  

  // Not Found  
  { path: '**', component: NotFoundComponent }
];