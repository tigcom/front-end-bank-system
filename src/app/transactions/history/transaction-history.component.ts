import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { TransactionService } from '../../services/transaction.service';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SliderModule } from 'primeng/slider';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    CalendarModule,
    SelectButtonModule,
    TableModule,
    ToastModule,
    InputTextModule,
    InputNumberModule,
    SliderModule,
  ],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss'],
  providers: [MessageService],
})
export class TransactionHistoryComponent implements OnInit {
  // Account related
  selectedAccount: string | null = null;
  accountOptions: any[] = [];
  customerName: string | null = null;
  selectedBalance: number | null = null;

  // Date range
  dateRange: Date[] | null = null;
  today: Date = new Date();
  // Transaction types
  transactionTypes = [];
  currencyOptions = [];
  statusOptions = [];
  sortOptions = [
    { sortName: 'Tất cả', sortValue: '' },
    { sortName: 'Thời gian', sortValue: 'timestamp' },
    { sortName: 'Số tiền', sortValue: 'amount' },
    { sortName: 'Nội dung', sortValue: 'description' },
  ];
  sortDirectionOptions = [
    { sortDirectionName: 'Tất cả', sortDirectionValue: '' },
    { sortDirectionName: 'Tăng dần', sortDirectionValue: 'ASC' },
    { sortDirectionName: 'Giảm dần', sortDirectionValue: 'DESC' },
  ];
  selectedTransactionType: string[] = [];
  selectedCurrency: string | null = null;
  selectedStatus: string | null = null;
  selectedSort: string | null = null;
  selectedSortDirection: string | null = null;
  keyword: string | null = null;
  fromAmount: number | null = null;
  toAmount: number | null = null;
  // Transactions data
  totalRecords: number = 0;
  transactions: any[] = [];
  loading: boolean = false;
  accountNumber: string = '';

  constructor(
    private transactionService: TransactionService,
    private messageService: MessageService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  private formatLocalISOString(date?: Date): string | undefined {
    if (!date) return undefined;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  }
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.accountNumber = params['accountNumber'];
      if (this.accountNumber) {
        this.selectedAccount = this.accountNumber;
        this.onAccountChange(this.selectedAccount);
        this.filterTransactions(null);
      }
    });
    this.loadFilterMetadata();
    this.loadAccountOptions();
  }

  loadFilterMetadata() {
    this.transactionService.getFilterMetadata().subscribe({
      next: (res) => {
        console.log(res.result.currencies);
        this.transactionTypes = [
          { label: 'Tất cả', value: '' },
          ...res.result.transactionTypes,
        ] as any;
        this.currencyOptions = [
          { label: 'Tất cả', value: '' },
          ...res.result.currencies,
        ] as any;
        this.statusOptions = [
          { label: 'Tất cả', value: '' },
          ...res.result.statuses,
        ] as any;
      },
    });
  }

  loadAccountOptions() {
    this.transactionService.getAccountForCustomer().subscribe({
      next: (res) => {
        this.accountOptions = res.result.map((acc: any) => ({
          accountNumber: acc.accountNumber,
          accountDescription: `Tài khoản thanh toán - ${acc.accountNumber}`,
          balance: acc.balance,
        }));
        if (!this.selectedAccount && this.accountOptions.length > 0) {
          this.selectedAccount = this.accountOptions[0].accountNumber;
          this.onAccountChange({ value: this.selectedAccount });
          this.filterTransactions(null);
        }
        // Get customer name
        this.transactionService.getCurrentCustomer().subscribe({
          next: (res) => {
            this.customerName = this.removeVietnameseTones(
              res.result.fullName.toUpperCase()
            );
          },
          error: (err) => {
            console.error('Lỗi khi lấy thông tin khách hàng:', err);
            this.showError('Không thể lấy thông tin khách hàng');
          },
        });
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách tài khoản:', err);
        this.showError('Không thể lấy danh sách tài khoản');
      },
    });
  }

  onAccountChange(event: any) {
    const selectedAccountNumber = event.value;
    const account = this.accountOptions.find(
      (acc) => acc.accountNumber === selectedAccountNumber
    );
    this.selectedBalance = account ? account.balance : null;
  }

  filterTransactions(event: any) {
    if (!this.selectedAccount) {
      this.showError('Vui lòng chọn tài khoản');
      return;
    }

    this.loading = true;
    const page = event ? event.first / event.rows + 1 : 1;
    const size = event ? event.rows : 5;

    // Construct filter parameters
    const filterData = {
      accountNumber: this.selectedAccount,
      startDate: this.formatLocalISOString(this.dateRange?.[0]),
      endDate: this.formatLocalISOString(this.dateRange?.[1]),
      type: this.selectedTransactionType,
      currency: this.selectedCurrency,
      status: this.selectedStatus,
      keyword: this.keyword,
      fromAmount: this.fromAmount,
      toAmount: this.toAmount,
      sortBy: this.selectedSort,
      sortDirection: this.selectedSortDirection,
      page: event ? page : 1,
      size: event ? size : 5,
    };

    const params: any = {};
    Object.keys(filterData).forEach((key: string) => {
      const value = filterData[key as keyof typeof filterData];
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    });
    console.log(params);
    this.transactionService.getTransactionHistory(params).subscribe({
      next: (res) => {
        this.transactions = res.result.content;
        this.totalRecords = res.result.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy lịch sử giao dịch:', err);
        this.showError('Không thể lấy lịch sử giao dịch');
        this.loading = false;
      },
    });
  }

  viewTransaction(referenceCode: string) {
    this.router.navigate(['/transactions/detail', referenceCode], {
      queryParams: { accountNumber: this.selectedAccount },
    });
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }

  showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
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

  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
