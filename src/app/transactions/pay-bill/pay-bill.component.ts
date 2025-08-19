import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TransactionService } from '../../services/transaction.service';
import { CommonModule, NgIf, NgClass, NgFor } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ConfirmTransactionComponent } from '../confirm/confirm-transaction.component.ts';
import { Location } from '@angular/common';

@Component({
  selector: 'app-pay-bill',
  standalone: true,
  imports: [
    CardModule,
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    NgClass,
    NgIf,
    InputNumberModule,
    DropdownModule,
    Textarea,
    CommonModule,
    ToastModule,
    DialogModule,
    ConfirmTransactionComponent,
  ],
  templateUrl: './pay-bill.component.html',
  styleUrls: ['./pay-bill.component.scss'],
  providers: [MessageService],
})
export class PayBillComponent implements OnInit {
  payBillForm: FormGroup;
  accounts: any[] = [];
  loading: boolean = false;
  billType: string = '';
  provider: string = '';
  customerCode: string = '';
  submitted: boolean = false;
  showConfirmForm: boolean = false;
  fromCustomerName: string = '';
  selectedBalance: number | null = null;
  somePayBillData: any = null;
  amount: number = 0;
  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.payBillForm = this.fb.group({
      fromAccountNumber: ['', Validators.required],
      amount: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0)],
      ],
      description: ['', Validators.required],
    });
    const state = this.location.getState() as { bill: any };

    if (state && state.bill) {
      const billDetails = state.bill;
      this.billType = billDetails?.type;
      this.provider = billDetails?.provider;
      this.customerCode = billDetails?.customerCode;
      this.amount = billDetails?.amount;
      this.payBillForm.patchValue({
        amount: this.amount,
      });
      console.log(this.amount);
      // Set default description
      this.payBillForm.patchValue({
        description: `Thanh toán hóa đơn ${this.billType} - ${this.provider} - ${this.customerCode}`,
      });
    }
  }

  ngOnInit() {
    this.transactionService.getAccountForCustomer().subscribe({
      next: (res) => {
        this.accounts = res.result.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          accountDescription: `Tài khoản thanh toán - ${acc.accountNumber}`,
          balance: acc.balance,
        }));
        if (this.accounts.length > 0) {
          this.payBillForm.patchValue({
            fromAccountNumber: this.accounts[0].accountNumber,
          });
          this.selectedBalance = this.accounts[0].balance;
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
        this.payBillForm.patchValue({
          description: this.fromCustomerName + ' THANH TOÁN HÓA ĐƠN',
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy khách hàng hiện tại:', err);
      },
    });
  }

  onFromAccountChange(event: any) {
    const selectedAccountNumber = event.value;
    const account = this.accounts.find(
      (acc) => acc.accountNumber === selectedAccountNumber
    );
    this.selectedBalance = account ? account.balance : null;
  }

  goBack() {
    this.router.navigate(['/transactions']);
  }

  onCancelConfirm() {
    this.showConfirmForm = false;
  }
  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
  onSubmit() {
    this.submitted = true;

    if (this.payBillForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin',
      });
      return;
    }

    const formData = {
      fromAccountNumber: this.payBillForm.get('fromAccountNumber')?.value,
      toAccountNumber: '',
      amount: this.amount,
      description: this.payBillForm.get('description')?.value,
      currency: 'VND',
      referenceCode: '',
      customerCode: this.customerCode,
      provider: this.provider,
      billType: this.billType.toUpperCase(),
      fromCustomerName: this.fromCustomerName,
      type: 'PAY_BILL',
    };
    console.log(formData);
    this.somePayBillData = formData;
    this.transactionService.payBill(this.somePayBillData).subscribe({
      next: (res) => {
        console.log('Phản hồi từ server:', res);
        this.showSuccess(
          'Giao dịch thanh toán hóa đơn đã khởi tạo thành công. Vui lòng xác nhận OTP.'
        );
        if (this.somePayBillData) {
          this.somePayBillData.referenceCode = res.result.referenceCode;
        }
        this.showConfirmForm = true;
      },
      error: (err) => {
        console.error('Lỗi khi gửi dữ liệu:', err);
        this.showError(
          'Thanh toán hóa đơn thất bại: ' + (err.error?.message || err.message)
        );
      },
    });
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
}
