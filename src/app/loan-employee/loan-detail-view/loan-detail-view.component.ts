// loan-detail-view.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../services/account/account.service';
import { Account } from '../../interfaces/account.interface';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { Textarea } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastrService } from 'ngx-toastr';
import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';
import { LoanStatus } from '../../models/loanStatus .model';
import { DividerModule } from 'primeng/divider';
import Swal from 'sweetalert2';
import { UserService } from '../../core/services/user.service';
import { CustomerResponse } from '../../interfaces/customerResponse';

type Severity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

interface TransactionDto {
  id: string;
  amount: number;
  timestamp: string;
  description: string;
  type: string;
}

@Component({
  selector: 'app-loan-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    Textarea,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    ToastModule,
    InputTextModule,
    InputNumberModule,
    DividerModule
  ],
  providers: [
    MessageService
  ],
  templateUrl: './loan-detail-view.component.html',
  styleUrls: ['./loan-detail-view.component.scss']
})
export class LoanDetailViewComponent implements OnInit {
  loanDetail: Loan | null = null;
  customerInfo: any = null;
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;
  userId: string = '';
  showRejectDialog = false;
  showEditDialog = false;
  processingAction = false;
  rejectionReasonControl = new FormControl('');
  customerDetail: CustomerResponse | null = null;
  transactionHistory: TransactionDto[] = [];
  loadingTransactions = false;
  incomeProofUrl: string | null = null;

  loanForm = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(1000000)]),
    interestRate: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    termMonths: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private messageService: MessageService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const loanId = this.route.snapshot.paramMap.get('id');
    if (loanId) {
      this.loadLoanDetail(+loanId);

    }
  }

  loadLoanDetail(loanId: number) {
    this.loading = true;
    this.loanService.getLoanById(loanId).subscribe({
      next: ({ data }) => {
        this.loanDetail = data;
        console.log('Loan detail loaded:', this.loanDetail);
        
        // Load income proof image if file path exists
        if (data && (data as any).pathFile) {
          this.loanService.getDisplayFileUrl((data as any).pathFile).subscribe(url => {
            this.incomeProofUrl = url;   
          });
          console.log('Income proof URL:', this.incomeProofUrl);
        } else {
          this.incomeProofUrl = null;
        }
        
        this.loadCustomerDetail();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load loan details';
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: this.error! });
      }
    });
  }

  loadCustomerDetail() {
    const customerId = this.loanDetail?.customerId?.toString() ?? '';
    this.loanService.getCustomerDetail(customerId).subscribe({
      next: (customerDetail) => {
        this.customerDetail = customerDetail.data;
        this.userId = this.customerDetail?.userId ?? '';
        console.log("customer detail: ", this.customerDetail);
        this.loadAccounts();
      },
      error: (err) => {
        console.error('Không tải được danh sách tài khoản:', err);
        this.toastr.error('Lỗi khi tải danh sách tài khoản.', 'Lỗi');
        this.loading = false;
      }
    });
  }

  loadAccounts(): void {
    this.loanService.getAccountsByUserId(this.userId).subscribe({
      next: (res: any) => {
        this.accounts = res.data;
        console.log(this.accounts);
        this.loading = false;
      },
      error: (err) => {
        console.error('Không tải được danh sách tài khoản:', err);
        this.toastr.error('Lỗi khi tải danh sách tài khoản.', 'Lỗi');
        this.loading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  formatDate(dateString: string | null): string {
    return dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  }
getLoanPurpose(loanType: string | null): string {
    if (loanType === 'PERSONAL') return 'Vay tiêu dùng';
    else if (loanType === 'HOME') return 'Vay mua nhà';
    else if (loanType === 'AUTO') return 'Vay mua xe';
    else return 'Khác';
}
  getStatusSeverity(status: LoanStatus | string | null | undefined): Severity {
    const s = (status ?? '').toString().toUpperCase();
    switch (s) {
      case 'APPROVED': return 'success';
      case 'PENDING':  return 'warn';
      case 'REJECTED': return 'danger';
      default:         return 'info';
    }
  }

  approveLoan() {
    this.loading = true;
    this.processingAction = true;
    this.loanService.approveLoan(this.loanDetail?.loanId ?? 0).subscribe({
      next: () => {
        this.processingAction = false;
        this.toastr.success('Kích hoạt khoản vay thành công!', 'Thành công');
        this.router.navigate(['/employee/loans/pending']);
      },
      error: (err) => {
        this.processingAction = false;
        console.log(err);
        this.toastr.error(err.error.message, 'Thất bại');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  openRejectDialog() {
    this.showRejectDialog = true;
    this.rejectionReasonControl.reset();
  }

  closeRejectDialog() {
    this.showRejectDialog = false;
    this.rejectionReasonControl.reset();
  }

  rejectLoan() {
    this.loading = true;
    if (!this.loanDetail?.loanId) return;

    const reason = this.rejectionReasonControl.value?.trim();
    if (!reason) return;

    this.processingAction = true;
    this.loanService.rejectLoan(this.loanDetail.loanId, {
      loan_id: this.loanDetail.loanId,
      reason
    }).subscribe({
      next: () => {
        this.processingAction = false;
        this.toastr.success('Từ chối khoản vay thành công!', 'Thành công');
        this.closeRejectDialog();
        this.router.navigate(['/employee/loans']);
      },
      error: (err) => {
        this.processingAction = false;
        this.toastr.error(err.error.message, 'Thất bại');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  openEditDialog() {
    this.showEditDialog = true;
  }

  closeEditDialog() {
    this.showEditDialog = false;
    this.loanForm.reset();
    if (this.loanDetail) {
      this.loanForm.patchValue({
        amount: this.loanDetail.amount,
        interestRate: this.loanDetail.interestRate,
        termMonths: this.loanDetail.termMonths,
      });
    }
  }

  // Transaction history removed in new flow
}
