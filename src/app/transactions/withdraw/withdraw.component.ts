import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { TransactionService } from '../../services/transaction.service';
import { MessageService } from 'primeng/api';
import { Location } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmTransactionComponent } from '../confirm/confirm-transaction.component.ts';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    Textarea,
    InputNumberModule,
    ButtonModule,
    DropdownModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    ConfirmTransactionComponent,
  ],
  providers: [MessageService],
})
export class WithdrawComponent implements OnInit {
  withdrawForm!: FormGroup;
  submitted = false;

  someWithdrawData: {
    fromAccountNumber: string;
    toAccountNumber: string;
    amount: number;
    description?: string;
    currency: string;
    referenceCode: string;
    toCustomerName: string | null;
    fromCustomerName: string | null;
    type: string;
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private messageService: MessageService,
    private location: Location
  ) {
    this.withdrawForm = this.fb.group({
      fromAccountNumber: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      currency: [this.currencyOptions[0].currencyCode, Validators.required],
      description: [''],
    });
    this.selectedBalance = this.fromAccountOptions[0]?.balance || null;
  }

  fromAccountOptions: any[] = [];
  toCustomerName: string | null = null;
  fromCustomerName: string | null = null;

  ngOnInit(): void {
    this.transactionService.getAccountForCustomer().subscribe({
      next: (res) => {
        console.log(res);
        this.fromAccountOptions = res.result.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          accountDescription: `Tài khoản thanh toán - ${acc.accountNumber}`,
          balance: acc.balance,
        }));
        if (this.fromAccountOptions.length > 0) {
          this.withdrawForm.patchValue({
            fromAccountNumber: this.fromAccountOptions[0].accountNumber,
          });
          this.selectedBalance = this.fromAccountOptions[0].balance;
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách tài khoản:', err);
      },
    });
    // Get Current Customer
    this.transactionService.getCurrentCustomer().subscribe({
      next: (res) => {
        this.fromCustomerName = this.removeVietnameseTones(
          res.result.fullName.toUpperCase()
        );
        this.withdrawForm.patchValue({
          description: this.fromCustomerName + ' RUT TIEN',
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy khách hàng hiện tại:', err);
      },
    });
  }

  currencyOptions = [
    { currencyName: 'Việt Nam Đồng (VND)', currencyCode: 'VND' },
    { currencyName: 'US Dollar (USD)', currencyCode: 'USD' },
    { currencyName: 'Euro (EUR)', currencyCode: 'EUR' },
  ];

  selectedBalance: number | null = null;

  showConfirmForm = false;
  onAccountChange(event: any) {
    const selectedAccountNumber = event.value;
    const account = this.fromAccountOptions.find(
      (acc) => acc.accountNumber === selectedAccountNumber
    );
    this.selectedBalance = account ? account.balance : null;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.withdrawForm.valid) {
      this.someWithdrawData = {
        fromAccountNumber: String(
          this.withdrawForm.get('fromAccountNumber')?.value
        ),
        toAccountNumber: '',
        amount: this.withdrawForm.get('amount')?.value,
        description: this.withdrawForm.get('description')?.value,
        currency: this.withdrawForm.get('currency')?.value,
        referenceCode: '',
        toCustomerName: this.toCustomerName,
        fromCustomerName: this.fromCustomerName,
        type: 'WITHDRAW',
      };
      this.transactionService.withdraw(this.someWithdrawData).subscribe({
        next: (res) => {
          console.log('Phản hồi từ server:', res);
          this.showSuccess(
            'Giao dịch rút tiền đã khởi tạo thành công. Vui lòng xác nhận OTP.'
          );
          if (this.someWithdrawData) {
            this.someWithdrawData.referenceCode = res.result.referenceCode;
          }
          this.showConfirmForm = true;
        },
        error: (err) => {
          console.error('Lỗi khi gửi dữ liệu:', err);
          this.showError(
            'Rút tiền thất bại: ' + (err.error?.message || err.message)
          );
        },
      });
    }
  }

  showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Khởi tạo giao dịch thành công. Vui lòng xác nhận OTP',
      detail: message,
    });
  }

  showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: message,
    });
  }
  onCancelConfirm() {
    this.someWithdrawData = null;
    this.showConfirmForm = false;
    this.submitted = false;
  }
  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
  goBack(): void {
    this.location.back();
  }
}
