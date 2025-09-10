import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RepaymentService } from '../../services/repayment.service';
import { AccountService } from '../../services/account/account.service';
import { Repayment } from '../../models/repayment.model';
import { ApiResponseWrapper } from '../../models/api-response-wrapper.model';
import { Account } from '../../interfaces/account.interface';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastrService } from 'ngx-toastr';
import { LoanService } from '../../services/loan.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pay-repayment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule
  ],
  providers: [MessageService],
  templateUrl: './pay-repayment.component.html',
  styleUrls: ['./pay-repayment.component.scss']
})
export class PayRepaymentComponent implements OnInit {
  repayment: Repayment = {
    repaymentId: 0,
    dueDate: '',
    principal: 0,
    interest: 0,
    paidAmount: 0,
    status: ''
  };
  
  accounts: Account[] = [];
  loading = true;
  error: string | null = null;
  showOtpDialog = false;
  referenceCode: string | null = null;

  paymentForm: FormGroup;
  otpForm: FormGroup;

  get selectedAccount(): Account | null {
    const value = this.paymentForm?.get('accountNumber')?.value;
    return value && typeof value === 'object' && 'balance' in value ? (value as Account) : null;
  }



  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private repaymentService: RepaymentService,
    private accountService: AccountService,
    private toastr: ToastrService,
    private loanService: LoanService
  ) {
    this.paymentForm = this.fb.group({
      accountNumber: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0)]]
    });

    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    this.paymentForm.get('accountNumber')?.valueChanges.subscribe(() => {
      this.updateAmountValidators();
    });
  }

  ngOnInit(): void {
    const repaymentId = this.route.snapshot.paramMap.get('id');
    if (repaymentId) {
      this.loadRepayment(+repaymentId);

      this.loadAccounts();
    }
  }

  loadRepayment(repaymentId: number): void {
    this.error = null;
    this.loading = true;
    this.repaymentService.getRepaymentById(repaymentId).subscribe({
      next: (response: ApiResponseWrapper<Repayment>) => {
        if (response.status === 200) {
          this.repayment = response.data;
          console.log("591");
          
          console.log(response.data);
          this.updateAmountValidators();
        } else {
          this.error = response.message || 'Failed to load repayment details';
          this.toastr.error(this.error, 'Thất bại');
        }
      },
      error: (err) => {
        this.error = 'Error loading repayment details';
        this.toastr.error(this.error, 'Thất bại');
      }
    });
  }

  loadAccounts(): void {
    this.loading = true;
    this.loanService.getAccountsByCurrentUser().subscribe({
        next: (res: any) => {
            this.accounts = res.data;
            console.log("22572");
            console.log(this.accounts);
            
          },
      error: (err) => {
        this.toastr.error('Error loading accounts', 'Thất bại');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {

    this.loading = true;

    const repaymentId = this.route.snapshot.paramMap.get('id');
    if (!repaymentId || !this.repayment) return;
    
    this.repaymentService.makeRepayment(+repaymentId, this.paymentForm.value.amount, this.paymentForm.value.accountNumber.accountNumber).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.toastr.success('OTP has been sent to your email', 'Thành công');
          this.referenceCode = response.data;
          this.showOtpDialog = true;
        } else {
   
          this.toastr.error(response.message || 'Failed to process payment', 'Thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err.error.message);
        this.toastr.error(err.error.message, 'Thất bại');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  confirmPayment(): void {
    const repaymentId = this.route.snapshot.paramMap.get('id');
    if (!repaymentId || !this.repayment || !this.referenceCode) return;

    this.loading = true;
    this.repaymentService.confirmRepayment(
      +repaymentId,
      this.paymentForm.value.amount,
      this.otpForm.value.otpCode,
      this.referenceCode
    ).subscribe({
      next: (response: ApiResponseWrapper<Repayment>) => {
        if (response.status === 200) {
          this.toastr.success('Payment confirmed successfully', 'Thành công');
          this.router.navigate(['/loans/current']);
        } else {
          this.toastr.error(response.message || 'Failed to confirm payment', 'Thất bại');
        }
      },
      error: (err) => {
        console.log(err);
        
        this.toastr.error('Error confirming payment', 'Thất bại');
      },
      complete: () => {
        this.loading = false;
        this.showOtpDialog = false;
      }
    });
  }

  calculateTotalAmount(): number {
    if (!this.repayment) return 0;
    return this.repayment.principal + this.repayment.interest;
  }

  calculateRemainingAmount(): number {
    if (!this.repayment) return 0;
    return this.calculateTotalAmount() - this.repayment.paidAmount;
  }

  onPaymentSuccess() {
    this.toastr.success('Payment successful', 'Thành công');
    setTimeout(() => {
      this.router.navigate(['/loans/current']);
    }, 2000);
  }

  private updateAmountValidators(): void {
    this.paymentForm.get('amount')?.setValidators([
      Validators.required,
      Validators.min(0),
      this.amountValidator.bind(this)
    ]);
    this.paymentForm.get('amount')?.updateValueAndValidity({ emitEvent: false });
  }

  private amountValidator(control: any) {
    if (!control.value) return null;
    
    const amount = control.value;
    const remainingAmount = this.calculateRemainingAmount();
    const accountBalance = this.selectedAccount ? this.selectedAccount.balance : Number.POSITIVE_INFINITY;
    
    if (amount > remainingAmount) {
      return { exceedsRemaining: true };
    }
    
    if (amount > accountBalance) {
      return { exceedsBalance: true };
    }
    
    return null;
  }
} 