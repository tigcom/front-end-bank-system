import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { LoanService } from '../../services/loan.service';
import { ApiResponseWrapper } from '../../models/api-response-wrapper.model';

@Component({
  selector: 'app-dashboard-loan-admin',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, PanelModule, ProgressSpinnerModule, ChartModule],
  templateUrl: './dashboard-loan-admin.component.html',
  styleUrls: ['./dashboard-loan-admin.component.scss']
})
export class DashboardLoanAdminComponent implements OnInit {
  loading = true;
  // Thống kê tổng quan
  totalBorrowed = 0;
  totalOutstanding = 0;
  totalInterest = 0;
  totalRecovered = 0;
  totalLoans = 0;
  totalPaidRepayments = 0;
  totalUnpaidRepayments = 0;
  totalLateRepayments = 0;

  // Chart data
  barChartData: any;
  barChartOptions: any;
  pieChartData: any;
  pieChartOptions: any;

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loading = true;
    Promise.all([
      this.loanService.getTotalDisbursedSystem().toPromise(),
      this.loanService.getTotalRecoveredSystem().toPromise(),
      this.loanService.getTotalProfitSystem().toPromise(),
      this.loanService.getAllLoans().toPromise(),
      this.loanService.getRepaymentStats().toPromise()
    ]).then(([disbursed, recovered, profit, allLoans, repaymentStats]) => {
      this.totalBorrowed = disbursed?.data || 0;
      this.totalRecovered = recovered?.data || 0;
      this.totalOutstanding = (disbursed?.data || 0) - this.totalRecovered;
      this.totalInterest = profit?.data || 0;
      const loans = allLoans?.data || [];
      this.totalLoans = loans.length;
      const stats = repaymentStats?.data || {};
      this.totalPaidRepayments = (stats as any)['paid'] || 0;
      this.totalUnpaidRepayments = (stats as any)['unpaid'] || 0;
      this.totalLateRepayments = (stats as any)['late'] || 0;
      this.barChartData = {
        labels: ['Đã trả', 'Chưa trả', 'Trễ hạn'],
        datasets: [
          {
            label: 'Số tiền (VNĐ)',
            backgroundColor: ['#00C9A7', '#FF6B6B', '#FFD93D'],
            borderColor: ['#00A693', '#E63946', '#F4D35E'],
            data: [this.totalPaidRepayments, this.totalUnpaidRepayments, this.totalLateRepayments]
          }
        ]
      };
      this.barChartOptions = {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Thống kê khoản vay' }
        }
      };
      this.pieChartData = {
        labels: ['Đã giải ngân', 'Đã thu hồi', 'Tiền lãi'],
        datasets: [
          {
            data: [this.totalBorrowed, this.totalRecovered, this.totalInterest],
            backgroundColor: ['#5E60CE', '#48BFE3', '#FF9F1C'],
            hoverBackgroundColor: ['#6930C3', '#56CFE1', '#FFBF69']
          }
        ]
      };
      this.pieChartOptions = {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Tỷ lệ khoản vay' }
        }
      };
      this.loading = false;
    });
  }
} 