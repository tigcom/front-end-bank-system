import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, Location, NgFor, NgIf, NgClass } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../../services/transaction.service';
import { CardModule } from 'primeng/card';
import { ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ConfirmTransactionComponent } from '../confirm/confirm-transaction.component.ts';
import { ToastModule } from 'primeng/toast';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  catchError,
  of,
} from 'rxjs';

@Component({
  selector: 'app-external-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    Textarea,
    CardModule,
    DialogModule,
    MessageModule,
    NgClass,
    NgFor,
    NgIf,
    ConfirmTransactionComponent,
    ToastModule,
  ],
  templateUrl: './external-transfer.component.html',
  styleUrls: ['./external-transfer.component.scss'],
  providers: [MessageService],
})
export class ExternalTransferComponent implements OnInit {
  externalTransferForm!: FormGroup;
  submitted = false;

  someTransferData: any = null;
  showConfirmForm = false;

  fromAccountOptions: any[] = [];
  bankOptions: any[] = [];
  currencyOptions = [
    { currencyName: 'Việt Nam Đồng (VND)', currencyCode: 'VND' },
    { currencyName: 'US Dollar (USD)', currencyCode: 'USD' },
    { currencyName: 'Euro (EUR)', currencyCode: 'EUR' },
  ];
  selectedBalance: number | null = null;
  fromCustomerName: string | null = null;
  toCustomerName: string | null = null;
  listInforToAccountNumberTransactionLatest: {
    accountNumber: string;
    customerName: string;
  }[] = [];
  showRecentAccounts = false;
  destinationCustomer: any = {
    accountNumber: '',
    bankCode: '',
  };
  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private messageService: MessageService,
    private location: Location
  ) {
    this.externalTransferForm = this.fb.group({
      fromAccountNumber: [null, Validators.required],
      toBankCode: [null, Validators.required],
      toAccountNumber: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      currency: [this.currencyOptions[0].currencyCode, Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.transactionService.getAccountForCustomer().subscribe({
      next: (res) => {
        this.fromAccountOptions = res.result.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          accountDescription: `Tài khoản thanh toán - ${acc.accountNumber}`,
          balance: acc.balance,
        }));
        if (this.fromAccountOptions.length > 0) {
          this.externalTransferForm.patchValue({
            fromAccountNumber: this.fromAccountOptions[0].accountNumber,
          });
          this.selectedBalance = this.fromAccountOptions[0].balance;
        }
      },
    });
    // Giả lập danh sách ngân hàng, thực tế nên lấy từ API
    this.bankOptions = [
      { bankName: 'Vietcombank', bankCode: '970436' },
      { bankName: 'Techcombank', bankCode: '970437' },
      { bankName: 'BIDV', bankCode: '970438' },
      { bankName: 'VietinBank', bankCode: '970439' },
      { bankName: 'ACB', bankCode: '970440' },
    ];
    // Lấy tên khách hàng nguồn
    this.transactionService.getCurrentCustomer().subscribe({
      next: (res) => {
        this.fromCustomerName = this.removeVietnameseTones(
          res.result.fullName.toUpperCase()
        );
        this.externalTransferForm.patchValue({
          description: this.fromCustomerName + ' CHUYEN KHOAN LIEN NGAN HANG',
        });
      },
    });

    // Lấy tên khách hàng đích khi nhập số tài khoản
    this.externalTransferForm
      .get('toAccountNumber')
      ?.valueChanges.pipe(
        debounceTime(300), // 1. Đợi 300ms sau lần nhập cuối cùng, tránh gọi API quá nhiều khi người dùng gõ liên tục
        distinctUntilChanged(), // 2. Chỉ tiếp tục nếu giá trị thay đổi so với lần trước, tránh gọi API lặp lại với giá trị cũ
        switchMap((toAccountNumber) => {
          if (!toAccountNumber) {
            this.toCustomerName = null;
            return of(null);
          }
          this.destinationCustomer.accountNumber = toAccountNumber;
          this.destinationCustomer.bankCode =
            this.externalTransferForm.get('toBankCode')?.value;
          console.log(this.destinationCustomer);

          return this.transactionService
            .getCustomerByAccountNumberExternalTransfer(
              this.destinationCustomer
            )
            .pipe(
              map((res) => res.result.customerName),
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

  onFromAccountChange(event: any) {
    const selectedAccountNumber = event.value;
    const account = this.fromAccountOptions.find(
      (acc) => acc.accountNumber === selectedAccountNumber
    );
    this.selectedBalance = account ? account.balance : null;
  }

  openToAccountNumberLatest() {
    this.showRecentAccounts = true;
  }

  selectRecentAccount(account: {
    accountNumber: string;
    customerName: string;
  }) {
    this.externalTransferForm.patchValue({
      toAccountNumber: account.accountNumber,
    });
    this.toCustomerName = account.customerName;
    this.showRecentAccounts = false;
  }

  onSubmit() {
    this.submitted = true;
    if (this.externalTransferForm.invalid) {
      this.showError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    this.someTransferData = {
      fromAccountNumber:
        this.externalTransferForm.get('fromAccountNumber')?.value,
      toAccountNumber: String(
        this.externalTransferForm.get('toAccountNumber')?.value
      ),
      amount: this.externalTransferForm.get('amount')?.value,
      description: this.externalTransferForm.get('description')?.value,
      currency: this.externalTransferForm.get('currency')?.value,
      referenceCode: '',
      toCustomerName: this.toCustomerName,
      fromCustomerName: this.fromCustomerName,
      destinationBankCode: this.externalTransferForm.get('toBankCode')?.value,
      destinationBankName: this.bankOptions.find(
        (bank) =>
          bank.bankCode === this.externalTransferForm.get('toBankCode')?.value
      )?.bankName,
      type: 'EXTERNAL_TRANSFER',
    };
    console.log(this.someTransferData);
    this.transactionService.externalTransfer(this.someTransferData).subscribe({
      next: (res) => {
        console.log(res);
        this.showSuccess(
          'Giao dịch chuyển khoản đã khởi tạo thành công. Vui lòng xác nhận OTP.'
        );
        if (this.someTransferData) {
          this.someTransferData.referenceCode = res.result.referenceCode;
        }
        this.showConfirmForm = true;
      },
      error: (err) => {
        this.showError(
          'Chuyển khoản thất bại: ' + (err.error?.message || err.message)
        );
        console.log(err);
      },
    });
  }

  onCancelConfirm() {
    this.showConfirmForm = false;
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
  goBack() {
    this.location.back();
  }

  removeVietnameseTones(str: string): string {
    // Hàm loại bỏ dấu tiếng Việt cho tên
    return str
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
