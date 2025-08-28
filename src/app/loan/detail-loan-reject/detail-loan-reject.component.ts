import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { LoanService } from '../../services/loan.service';
import { Loan } from '../../models/loan.model';
import { LoanStatus } from '../../models/loanStatus .model';
import { ToastrService } from 'ngx-toastr';
import { InfoIncome } from '../../models/infoIncome.model';

@Component({
  selector: 'app-detail-loan-reject',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputNumberModule,
    DropdownModule,
    ToastModule,
    TagModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './detail-loan-reject.component.html',
  styleUrls: ['./detail-loan-reject.component.scss']
})
export class DetailLoanRejectComponent implements OnInit {
  loanDetail: Loan | null = null;
  loading = true;
  error: string | null = null;
  processingAction = false;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  incomeProofUrl: string | null = null;
  loanTypeOptions = [
    { label: 'Vay tiêu dùng', value: 'PERSONAL' },
    { label: 'Vay thế chấp', value: 'MORTGAGE' },
    { label: 'Vay mua xe', value: 'AUTO' },
  ];
  // Form for editing loan details
  loanForm = new FormGroup({
    amount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1000000)
    ]),
    interestRate: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ]),
    termMonths: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1)
    ]),
    declaredIncome: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(5000000)
    ]),
    loanType: new FormControl<string | null>(null, [
      Validators.required
    ])
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private messageService: MessageService,
    private toastr: ToastrService
  ) { }

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
        this.loanForm.patchValue({
          amount: data.amount,
          interestRate: data.interestRate,
          termMonths: data.termMonths,
          declaredIncome: data.declaredIncome,
          loanType: data.loanType,
        });
        this.loanService.getDisplayFileUrl((data as any).pathFile).subscribe(url => {
          this.incomeProofUrl = url;
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load loan details';
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.error
        });
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string | null): string {
    return dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A';
  }

  getStatusSeverity(status: LoanStatus | string | null | undefined): string {
    const s = (status ?? '').toString().toUpperCase();
    switch (s) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
    }
  }

  updateAndResubmitLoan() {
    if (!this.loanDetail?.loanId || !this.loanForm.valid) return;

    this.processingAction = true;

    const updatedLoan: Loan = {
      loanId: this.loanDetail.loanId,
      customerId: this.loanDetail.customerId,
      repaymentAccountNumber: this.loanDetail.repaymentAccountNumber,
      disbursementAccountNumber: this.loanDetail.disbursementAccountNumber,
      createdAt: this.loanDetail.createdAt,
      approvedAt: this.loanDetail.approvedAt,
      rejectionReasons: this.loanDetail.rejectionReasons,
      amount: this.loanForm.value.amount ?? 0,
      interestRate: this.loanForm.value.interestRate ?? 0,
      termMonths: this.loanForm.value.termMonths ?? 0,
      status: LoanStatus.PENDING,
      repayments: this.loanDetail.repayments ?? [],
      declaredIncome: this.loanForm.value.declaredIncome ?? 0,
      loanType: this.loanForm.value.loanType ?? 'PERSONAL',
      pathFile: this.loanDetail.pathFile,
    };
    if (this.selectedFile) {
      const key = `loans/${updatedLoan.loanId}/${Date.now()}_${encodeURIComponent(this.selectedFileName ?? '')}`;
      this.loanService.generatePresignedUrl(key, this.selectedFile.type).subscribe({
        next: (url) => {
          fetch(url, { method: 'PUT', body: this.selectedFile, headers: { 'Content-Type': this.selectedFile?.type ?? 'application/octet-stream' } })
            .then(res => {
              if (res.ok) {
                this.loanService.updateFilePath(updatedLoan.loanId!, key, updatedLoan.declaredIncome ?? 0).subscribe({
                next: (res) => {
                  this.loanDetail!.pathFile = key;
                  this.processingAction = false;
                  this.toastr.success('Cập nhật và gửi lại khoản vay thành công!', 'Thành công');
                  this.router.navigate(['/loans/overview']);
                }
              });
              } else {
                  this.toastr.error('Lỗi khi tải lên tệp', 'Lỗi');
                  this.processingAction = false;
              }
            })

        },
        error: (err) => {
          console.error('[Presigned URL error]', err);
          this.toastr.error('Lỗi khi lấy URL tải lên', 'Lỗi');
          this.processingAction = false;
        }
      });

    }
    this.loanService.updateLoan(updatedLoan).subscribe({
      next: (res) => {
        console.log('[Response success]', res);   // log response khi thành công
        this.processingAction = false;
        this.toastr.success('Cập nhật và gửi lại khoản vay thành công!', 'Thành công');
        this.router.navigate(['/loans/overview']);
      },
      error: (err) => {
        console.error('[Response error]', err);
        console.log(err.error);
        this.processingAction = false;
        for (const key in err.error) {
          if (err.error.hasOwnProperty(key)) {
            this.toastr.error(err.error[key], 'Lỗi');
          }
        }
      }
    });
  }
}
