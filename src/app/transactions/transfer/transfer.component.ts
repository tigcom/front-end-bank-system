import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Location } from '@angular/common';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../../services/transaction.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/textarea';
import { ConfirmTransactionComponent } from '../confirm/confirm-transaction.component.ts';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    InputNumberModule,
    NgFor,
    DropdownModule,
    Textarea,
    CommonModule,
    ConfirmTransactionComponent,
    ToastModule,
    DialogModule,
  ],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
  providers: [MessageService],
})
export class TransferComponent implements OnInit {
  transferForm!: FormGroup;
  submitted = false;

  someTransferData: {
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
    this.transferForm = this.fb.group({
      fromAccountNumber: [null, Validators.required],
      toAccountNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      amount: [null, [Validators.required, Validators.min(1000)]],
      currency: [this.currencyOptions[0].currencyCode, Validators.required],
      description: [''],
    });
    this.selectedBalance = this.fromAccountOptions[0]?.balance || null;
  }

  fromAccountOptions: any[] = [];
  toCustomerName: string | null = null;
  fromCustomerName: string | null = null;
  listToAccountNumberTransactionLatest = [];
  listInforToAccountNumberTransactionLatest: {
    accountNumber: string;
    customerName: string;
  }[] = [];

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
          this.transferForm.patchValue({
            fromAccountNumber: this.fromAccountOptions[0].accountNumber,
          });
          this.selectedBalance = this.fromAccountOptions[0].balance;
          this.transactionService
            .getListToAccountNumberTransactioLatest(
              this.fromAccountOptions[0].accountNumber
            )
            .subscribe({
              next: (res) => {
                this.listToAccountNumberTransactionLatest = res.result || [];
                this.listInforToAccountNumberTransactionLatest =
                  this.listToAccountNumberTransactionLatest.map(
                    (item: any) => ({
                      accountNumber: item.accountNumber,
                      customerName: this.removeVietnameseTones(
                        item.customerName.toUpperCase()
                      ),
                    })
                  );
                console.log(
                  'Danh sách tài khoản gần đây:',
                  this.listToAccountNumberTransactionLatest
                );
              },
              error: (err) => {
                console.error('Lỗi khi lấy danh sách tài khoản gần đây:', err);
                this.listToAccountNumberTransactionLatest = [];
              },
            });
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
        this.transferForm.patchValue({
          description: this.fromCustomerName + ' CHUYEN KHOAN',
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy khách hàng hiện tại:', err);
      },
    });
    // Get Customer By Account Number
    this.transferForm
      .get('toAccountNumber')
      ?.valueChanges.pipe(
        debounceTime(300), // 1. Đợi 300ms sau lần nhập cuối cùng, tránh gọi API quá nhiều khi người dùng gõ liên tục
        distinctUntilChanged(), // 2. Chỉ tiếp tục nếu giá trị thay đổi so với lần trước, tránh gọi API lặp lại với giá trị cũ
        switchMap((toAccountNumber) => {
          if (!toAccountNumber) {
            this.toCustomerName = null;
            return of(null);
          }
          return this.transactionService
            .getCustomerByAccountNumber(toAccountNumber)
            .pipe(
              map((res) => res.result.fullName),
              catchError((err) => {
                this.toCustomerName = null;
                return of(null);
              })
            );
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.toCustomerName = this.removeVietnameseTones(res.toUpperCase());
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy khách hàng:', err);
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
  onFromAccountChange(event: any) {
    const selectedAccountNumber = event.value;
    const account = this.fromAccountOptions.find(
      (acc) => acc.accountNumber === selectedAccountNumber
    );
    this.selectedBalance = account ? account.balance : null;

    if (selectedAccountNumber) {
      // console.log("Selected Account Number", selectedAccountNumber);
      this.loadRecentToAccounts(selectedAccountNumber);
    } else {
      this.listToAccountNumberTransactionLatest = [];
    }
  }

  loadRecentToAccounts(fromAccountNumber: string) {
    this.transactionService
      .getListToAccountNumberTransactioLatest(fromAccountNumber)
      .subscribe({
        next: (res) => {
          this.listToAccountNumberTransactionLatest = res.result || [];
          this.listInforToAccountNumberTransactionLatest =
            this.listToAccountNumberTransactionLatest.map((item: any) => ({
              accountNumber: item.accountNumber,
              customerName: this.removeVietnameseTones(
                item.customerName.toUpperCase()
              ),
            }));
          // console.log("Danh sách tài khoản gần đây:", this.listToAccountNumberTransactionLatest);
        },
        error: (err) => {
          console.error('Lỗi khi lấy danh sách tài khoản gần đây:', err);
          this.listToAccountNumberTransactionLatest = [];
        },
      });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.transferForm.valid) {
      this.someTransferData = {
        fromAccountNumber: this.transferForm.get('fromAccountNumber')?.value,
        toAccountNumber: String(
          this.transferForm.get('toAccountNumber')?.value
        ),
        amount: this.transferForm.get('amount')?.value,
        description: this.transferForm.get('description')?.value,
        currency: this.transferForm.get('currency')?.value,
        referenceCode: '',
        toCustomerName: this.toCustomerName,
        fromCustomerName: this.fromCustomerName,
        type: 'TRANSFER',
      };
      this.transactionService.transfer(this.someTransferData).subscribe({
        next: (res) => {
          console.log('Phản hồi từ server:', res);
          this.showSuccess(
            'Giao dịch chuyển khoản đã khởi tạo thành công. Vui lòng xác nhận OTP.'
          );
          if (this.someTransferData) {
            this.someTransferData.referenceCode = res.result.referenceCode;
          }
          this.showConfirmForm = true;
        },
        error: (err) => {
          console.error('Lỗi khi gửi dữ liệu:', err.message);
          this.showError(
            'Chuyển khoản thất bại: ' + (err.error?.message || err.message)
          );
        },
      });
    }
  }

  showRecentAccounts = false;
  openToAccountNumberLatest() {
    console.log(this.listInforToAccountNumberTransactionLatest);
    this.showRecentAccounts = true;
  }
  // Hàm xử lý chọn tài khoản gần đây
  selectRecentAccount(account: {
    accountNumber: string;
    customerName: string;
  }) {
    this.transferForm.patchValue({
      toAccountNumber: account.accountNumber,
    });
    this.showRecentAccounts = false;
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
    this.someTransferData = null;
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

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Cho phép: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
      // Cho phép Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (charCode === 65 && event.ctrlKey === true) ||
      (charCode === 67 && event.ctrlKey === true) ||
      (charCode === 86 && event.ctrlKey === true) ||
      (charCode === 88 && event.ctrlKey === true)) {
      return true;
    }
    // Chỉ cho phép số (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  goBack(): void {
    this.location.back();
  }
}
