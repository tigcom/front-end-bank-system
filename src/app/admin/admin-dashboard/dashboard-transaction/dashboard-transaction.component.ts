import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { TransactionService } from '../../../services/transaction.service';

export interface TransactionTypeSummary {
  transactionType: string;
  count: number;
  totalAmount: number;
}

export interface TopCustomer {
  cifCode: string;
  name: string;
  transactionCount: number;
  totalAmount: number;
}

export interface LatestTransaction {
  transactionId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export interface DashboardTransactionData {
  totalTransactions: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  transactionTypeSummary: TransactionTypeSummary[];
  topCustomers: TopCustomer[];
  latestTransactions: LatestTransaction[];
}

@Component({
  selector: 'app-dashboard-transaction',
  standalone: true,
  templateUrl: './dashboard-transaction.component.html',
  styleUrls: ['./dashboard-transaction.component.scss'],
  imports: [CommonModule, FormsModule,
     RouterModule,
     TableModule,BadgeModule,
     CardModule,
     FormsModule

  ]
})
export class DashboardTransactionComponent implements OnInit {
  data: DashboardTransactionData | null = null;

  // Biến filter động
  startDate: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  endDate: string = new Date(Date.now()).toISOString().split('T')[0];
  page: number = 1;
  size: number = 5;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.fetchStats();
  }

  fetchStats() {
    const start = this.startDate ? this.startDate + 'T00:00:00.000Z' : '';
    const end = this.endDate ? this.endDate + 'T23:59:59.999Z' : '';
    this.transactionService.getStats({
      startDate: start,
      endDate: end,
      page: this.page,
      size: this.size
    }).subscribe((res: any) => {
      this.data = res.result;
    });
  }

  onDateChange() {
    this.page = 1;
    this.fetchStats();
  }

  onPageChange(newPage: number) {
    this.page = newPage;
    this.fetchStats();
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'danger';
      case 'PENDING': return 'warn';
      default: return 'info';
    }
  }

  transactionTypeVi(type: string): string {
    switch (type) {
      case 'EXTERNAL_TRANSFER': return 'Chuyển tiền liên ngân hàng';
      case 'PAY_BILL': return 'Thanh toán hóa đơn';
      case 'TRANSFER': return 'Chuyển tiền';
      case 'WITHDRAW': return 'Rút tiền';
      case 'DEPOSIT': return 'Nạp tiền';
      default: return type;
    }
  }
}
