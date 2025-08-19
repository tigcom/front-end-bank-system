import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AccountService } from '../../services/account/account.service';
import { LoanService } from '../../services/loan.service';
import { ApiResponseWrapper } from '../../models/api-response-wrapper.model';
import { Loan } from '../../models/loan.model';
import { Account } from '../../interfaces/account.interface';
import { InfoIncome } from '../../models/infoIncome.model';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { LoanStatus } from "../../models/loanStatus .model";
import { ToastrService } from 'ngx-toastr';


function termMaxByAmountValidator(amountControl: AbstractControl): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const amount = amountControl.value;
    const term = control.value;
    if (amount != null && term != null) {
      let maxTerm = 0;
      if (amount <= 50_000_000) {
        maxTerm = 60;
      } else if (amount <= 200_000_000) {
        maxTerm = 120;
      } else {
        maxTerm = 240;
      }
      return term > maxTerm
        ? { termTooLong: { actual: term, maxTerm } }
        : null;
    }
    return null;
  };
}

function computeInterestRate(amount: number, term: number): number {
  let baseRate = 0;
  if (term <= 12) {
    baseRate = 5;
  } else if (term <= 60) {
    baseRate = 10;
  } else {
    baseRate = 15;
  }

  let extra = 0;
  if (amount > 200_000_000) {
    extra = 1;    
  } else if (amount > 50_000_000) {
    extra = 0.5;   
  }
  return +(baseRate + extra); 
}

@Component({
  selector: 'app-apply-new-loan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule
  ],
  templateUrl: './apply-newloan.component.html',
  styleUrls: ['./apply-newloan.component.scss']
})
export class ApplyNewLoanComponent implements OnInit {
  loanForm: FormGroup;
  accounts: Account[] = [];
  loading = true; 
  computedRate: number | null = null;
  bankOptions = [
    { bankName: 'Vietcombank', bankCode: '970436' },
    { bankName: 'Techcombank', bankCode: '970437' },
    { bankName: 'BIDV', bankCode: '970438' },
    { bankName: 'VietinBank', bankCode: '970439' },
    { bankName: 'ACB', bankCode: '970440' },
  ];

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private loanService: LoanService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loanForm = this.fb.group(
      {
        accountNumber: ['', Validators.required],
        incomeProofFile: [null, Validators.required],
        bankName: [null],
        declaredIncome: [
          null,
          [Validators.required, Validators.min( 5_000_000)]
        ],
        amount: [
          null,
          [Validators.required, Validators.min(1_000_000)]
        ],
        termMonths: [
          null,
          [Validators.required, Validators.min(1), Validators.max(240)]
        ],
        interestRate: [{ value: null, disabled: true }]
      }
    );
  }
  get declaredIncomeControl() {
    return this.loanForm.get('declaredIncome')!;
  }
  get amountControl() {
    return this.loanForm.get('amount')!;
  }
  get termControl() {
    return this.loanForm.get('termMonths')!;
  }
  get rateControl() {
    return this.loanForm.get('interestRate')!;
  }

  ngOnInit(): void {
    // this.loanService.getLoansByCustomerId().then(obs => {
    //   obs.subscribe({
    //     next: (res) => {
    //       const loans = res.data || [];
    //       console.log(loans);
    //       const hasActiveLoan = loans.some((loan: Loan) => loan.status === 'APPROVED' || loan.status === 'PENDING');
    //       console.log(hasActiveLoan);
    //       if (hasActiveLoan) {
    //         this.router.navigate(['/loan/warning-apply-loan']);
    //       } else {
    //         this.loadAccounts();
    //       }
    //     },
    //     error: (err) => {
    //       this.loadAccounts();
    //     }
    //   });
    // });
    this.loadAccounts();
    this.declaredIncomeControl.valueChanges.subscribe(() => {
      this.amountControl.setValidators([
        Validators.required,
        Validators.min(1_000_000)
      ]);
      this.amountControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    this.amountControl.valueChanges.subscribe((amt) => {
      this.termControl.setValidators([
        Validators.required,
        Validators.min(1),
        termMaxByAmountValidator(this.amountControl)
      ]);
      this.termControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      const term = this.termControl.value;
      if (amt != null && term != null && !isNaN(term)) {
        this.computedRate = computeInterestRate(amt, term);
        this.rateControl.setValue(this.computedRate, { emitEvent: false });
          console.log(this.loanForm.value.interestRate.value);
      }
    });

    this.termControl.valueChanges.subscribe((term) => {
      const amt = this.amountControl.value;
      if (amt != null && term != null && !isNaN(amt)) {
        this.computedRate = computeInterestRate(amt, term);
        this.rateControl.setValue(this.computedRate, { emitEvent: false });
          console.log(this.loanForm.value);
      }
    });

  
  }

  loadAccounts(): void {
    this.loanService.getAccountsByCurrentUser().subscribe({
      next: (res: any) => {
        this.accounts = res.data;
        console.log(this.accounts);
        
      },
      error: (err) => {
        console.error('Không tải được danh sách tài khoản:', err);
        this.toastr.error('Lỗi khi tải danh sách tài khoản.', 'Lỗi');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.loading =true;
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }
    const loan: Loan = {
      accountNumber: this.loanForm.value.accountNumber,
      amount: this.loanForm.value.amount,
      interestRate: this.loanForm.value.interestRate, 
      termMonths: this.loanForm.value.termMonths,
      customerId: null,
      loanId: null,
      approvedAt: null,
      createdAt: null,
      repayments: null,
      status:LoanStatus.PENDING,
      rejectionReasons: null,
      infoIncomes: null
    };
    this.loanForm.get('interestRate')?.setValue(  this.rateControl.value);
    loan.interestRate = this.rateControl.value;
<<<<<<< HEAD
    this.loanService.createLoan(loan).subscribe({
      next: (response: ApiResponseWrapper<Loan>) => {
        const createdLoan = response.data;
        const file: File | null = this.loanForm.value.incomeProofFile;
        const declaredIncome = this.loanForm.value.declaredIncome;
        if (!file) {
          this.loading = false;
          this.toastr.success('Đăng ký khoản vay thành công!', 'Thành công');
          this.onLoanCreated();
          return;
        }
        const key = `loans/${createdLoan.loanId}/${Date.now()}_${encodeURIComponent(file.name)}`;
        this.loanService.generatePresignedUrl(key, file.type).subscribe({
          next: (url: string) => {
            fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
              .then(res => {
                if (!res.ok) throw new Error('Upload failed');
                this.loanService.updateFilePath(createdLoan.loanId!, key, declaredIncome).subscribe({
                  next: () => {
                    this.loading = false;
                    this.toastr.success('Đăng ký khoản vay thành công!', 'Thành công');
                    this.onLoanCreated();
                  },
                  error: () => {
                    this.loading = false;
                    this.toastr.error('Cập nhật file path thất bại', 'Lỗi');
                  }
                });
              })
              .catch(() => {
                this.loading = false;
                this.toastr.error('Tải file lên S3 thất bại', 'Lỗi');
              });
          },
          error: () => {
            this.loading = false;
            this.toastr.error('Không tạo được URL upload', 'Lỗi');
          }
        });
      },
      error: (httpError: HttpErrorResponse) => {
        this.loading = false;
        this.toastr.error( `Lỗi: ${httpError.error.message}`,'Lỗi');
      }
    });
=======
    console.log(loan);
    // this.loanService.createLoan(loan).subscribe({
    //   next: (response: ApiResponseWrapper<Loan>) => {
    //     const createdLoan = response.data;
    //     // Sau khi tạo loan thành công, tạo InfoIncome
    //     const infoIncome = {
    //       infoId: null,
    //       loanId:createdLoan.loanId ,
    //       accountNumber: this.loanForm.value.incomeAccountNumber,
    //       bankName: this.loanForm.value.bankName,
    //       declaredIncome: this.loanForm.value.declaredIncome
    //     };
    //     this.loanService.createInfoIncome(infoIncome).subscribe({
    //       next: () => {
    //         this.loading = false;
    //         this.toastr.success('Đăng ký khoản vay thành công!', 'Thành công');
    //         this.onLoanCreated();
    //       },
    //       error: (err) => {
    //         this.loading = false;
    //         this.toastr.error('Tạo InfoIncome thất bại', 'Lỗi');
    //       }
    //     });
    //   },
    //   error: (httpError: HttpErrorResponse) => {
    //     this.loading = false;
    //     this.toastr.error( `Lỗi: ${httpError.error.message}`,'Lỗi');
    //   }
    // });
>>>>>>> d2ef44f0455495bc24e2589fdc8c049cac5f8426
  }

  onLoanCreated() {
    
    setTimeout(() => {
      this.router.navigate(['/loans/overview']);
    }, 2000);
  }
}
