import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { AccountService } from '../../services/account/account.service';

interface AccountStatistics {
  totalAccounts: number;
  accountsByType: Record<string, number>;
  accountsByStatus: Record<string, number>;
  activeAccounts: number;
  inactiveAccounts: number;
}

interface SavingsStatistics {
  totalSavingsAccounts: number;
  totalSavingsBalance: number;
  accountsByTerm: Record<string, number>;
  accountsByInterestPaymentType: Record<string, number>;
  accountsByRenewOption: Record<string, number>;
  accountsNearMaturity: number;
  averageBalance: number;
}

interface CreditRequestStatistics {
  totalCreditRequests: number;
  requestsByStatus: Record<string, number>;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  averageRequestedIncome: number;
  requestsByCardType: Record<string, number>;
}

interface TopProduct {
  productName: string;
  productType: string;
  accountCount: number;
  totalValue: number;
}

interface RecentActivity {
  activityType: string;
  description: string;
  timestamp: string;
  count: number;
}

interface DailyGrowthDetail {
  date: string;
  totalCreated: number;
  paymentAccountsCreated: number;
  savingAccountsCreated: number;
  creditAccountsCreated: number;
  growthRateFromPreviousDay: number | null;
}

interface AccountCreationStatistics {
  dailyAccountCreation: Record<string, number>;
  growthByAccountType: Record<string, Record<string, number>>;
  totalAccountsInPeriod: number;
  growthRate: number;
  fromDate: string;
  toDate: string;
  periodDays: number;
  dailyGrowthDetails: DailyGrowthDetail[];
}

interface DashboardData {
  accountStatistics: AccountStatistics;
  savingsStatistics: SavingsStatistics;
  creditRequestStatistics: CreditRequestStatistics;
  totalCustomers: number;
  totalAssets: number;
  newAccountsThisMonth: number;
  newAccountsLastMonth: number;
  monthlyGrowthRate: number;
  topProducts: TopProduct[];
  recentActivities: RecentActivity[];
}

/**
 * Account Creation Statistics Component
 * 
 * This component displays dashboard statistics for account creation.
 * The account creation data is loaded from a separate API endpoint
 * and maintained separately from the main dashboard data to allow
 * for independent loading and filtering capabilities.
 */
@Component({
  selector: 'app-account-statistic',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ChartModule, 
    ButtonModule, 
    TagModule, 
    ProgressBarModule,
    TableModule,
    CalendarModule,
    FormsModule
  ],
  templateUrl: './account-statistic.component.html',
  styleUrl: './account-statistic.component.scss'
})
export class AccountStatisticComponent implements OnInit {
  private accountService = inject(AccountService);
  dashboardData: DashboardData = {
    accountStatistics: {
      totalAccounts: 0,
      accountsByType: { 
        "CREDIT": 0,
        "PAYMENT": 0,
        "MASTER": 0,
        "SAVING": 0
      },
      accountsByStatus: {
        "REGISTRATION_ERROR": 0,
        "ACTIVE": 0,
        "CLOSED": 0
      },
      activeAccounts: 0,
      inactiveAccounts: 0
    },
    savingsStatistics: {
      totalSavingsAccounts: 0,
      totalSavingsBalance: 0,
      accountsByTerm: {
        "18": 0,
        "36": 0,
        "12": 0
      },
      accountsByInterestPaymentType: {
        "AT_MATURITY": 0,
        "MONTHLY": 0
      },
      accountsByRenewOption: {
        "AUTO_RENEW": 0
      },
      accountsNearMaturity: 0,
      averageBalance: 0
    },
    creditRequestStatistics: {
      totalCreditRequests: 0,
      requestsByStatus: {
        "ERROR": 0,
        "APPROVED": 0
      },
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      approvalRate: 0,
      averageRequestedIncome: 0,
      requestsByCardType: {
        "MASTER_PLATINUM": 0,
        "VISA_PLUS": 0
      }
    },
    totalCustomers: 0,
    totalAssets: 0,
    newAccountsThisMonth: 0 ,
    newAccountsLastMonth: 0,
    monthlyGrowthRate: 0,
    topProducts: [
      {
        productName: "SAVING",
        productType: "ACCOUNT",
        accountCount: 0,
        totalValue: 0
      },
      {
        productName: "PAYMENT",
        productType: "ACCOUNT",
        accountCount: 0,
        totalValue: 0
      },
      {
        productName: "CREDIT",
        productType: "ACCOUNT",
        accountCount: 0,
        totalValue: 0
      },
      {
        productName: "MASTER",
        productType: "ACCOUNT",
        accountCount: 0,
        totalValue: 0
      }
    ],
    recentActivities: [
      {
        activityType: "ACCOUNT_CREATION",
        description: "Tài khoản mới được tạo trong 24h qua",
        timestamp: "2025-07-02T20:43:12.670276500",
        count: 0
      },
      {
        activityType: "CREDIT_REQUEST",
        description: "Yêu cầu mở thẻ tín dụng mới trong 24h qua",
        timestamp: "2025-07-02T20:43:12.682937900",
        count: 0
      }
    ]
  };


  // Chart configurations
  pieChartData: any;
  pieChartOptions: any;
  barChartData: any;
  barChartOptions: any;
  lineChartData: any;
  lineChartOptions: any;
  doughnutChartData: any;
  doughnutChartOptions: any;
  // Add accounts trend chart for KPI section
  accountsTrendData: any;
  accountsTrendOptions: any;
  // Add daily account creation chart
  dailyAccountCreationData: any;
  dailyAccountCreationOptions: any;

  // Date filter variables
  startDate: Date = new Date('2025-06-03');
  endDate: Date = new Date('2025-07-02');
  filteredData: DailyGrowthDetail[] = [];

  // Loading state for account creation statistics
  isLoadingAccountStats: boolean = false;

  // Separate data for Account Creation Statistics (from another API)
  accountCreationStatistics: AccountCreationStatistics = {
    dailyAccountCreation: {
      "2025-06-30": 1,
      "2025-06-26": 2,
      "2025-06-24": 3,
      "2025-07-02": 2,
      "2025-06-17": 2,
      "2025-06-16": 2
    },
    growthByAccountType: {
      "PAYMENT": {
        "2025-06-30": 1,
        "2025-06-24": 2,
        "2025-06-16": 1
      },
      "CREDIT": {
        "2025-07-02": 2
      },
      "MASTER": {
        "2025-06-16": 1
      },
      "SAVING": {
        "2025-06-26": 2,
        "2025-06-24": 1,
        "2025-06-17": 2
      }
    },
    totalAccountsInPeriod: 12,
    growthRate: 0.0,
    fromDate: "2025-06-03",
    toDate: "2025-07-02",
    periodDays: 30,
    dailyGrowthDetails: [
      { date: "2025-06-03", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-04", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-05", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-06", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-07", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-08", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-09", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-10", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-11", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-12", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-13", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-14", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-15", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-16", totalCreated: 2, paymentAccountsCreated: 1, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-17", totalCreated: 2, paymentAccountsCreated: 0, savingAccountsCreated: 2, creditAccountsCreated: 0, growthRateFromPreviousDay: 0.0 },
      { date: "2025-06-18", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: -100.0 },
      { date: "2025-06-19", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-20", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-21", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-22", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-23", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-24", totalCreated: 3, paymentAccountsCreated: 2, savingAccountsCreated: 1, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-25", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: -100.0 },
      { date: "2025-06-26", totalCreated: 2, paymentAccountsCreated: 0, savingAccountsCreated: 2, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-27", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: -100.0 },
      { date: "2025-06-28", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-29", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-06-30", totalCreated: 1, paymentAccountsCreated: 1, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: null },
      { date: "2025-07-01", totalCreated: 0, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 0, growthRateFromPreviousDay: -100.0 },
      { date: "2025-07-02", totalCreated: 2, paymentAccountsCreated: 0, savingAccountsCreated: 0, creditAccountsCreated: 2, growthRateFromPreviousDay: null }
    ]
  };

  ngOnInit() {
    this.loadAccountStatistics();
    this.initializeCharts();
    this.loadAccountCreationStatistics();
  }

  private loadAccountStatistics() {
    this.accountService.getAccountStatistics().subscribe((data) => {
      console.log(data);
      this.dashboardData = data;
      this.initializeCharts();
    });
  }

  private initializeCharts() {
    this.initializePieChart();
    this.initializeBarChart();
    this.initializeLineChart();
    this.initializeDoughnutChart();
    this.initializeAccountsTrendChart();
    // Daily account creation chart will be initialized after data is loaded
  }

  private initializePieChart() {
    const accountTypes = this.dashboardData.accountStatistics.accountsByType;
    
    this.pieChartData = {
      labels: Object.keys(accountTypes),
      datasets: [{
        data: Object.values(accountTypes),
        backgroundColor: [
          '#FF6B9D',
          '#4ECDC4', 
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7'
        ],
        borderWidth: 0
      }]
    };

    this.pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#FFFFFF',
            font: {
              size: 12
            }
          }
        }
      }
    };
  }

  private initializeBarChart() {
    this.barChartData = {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{
        label: 'New Accounts',
        data: [30, 25, 40, 35, 45, 42, 50],
        backgroundColor: '#4ECDC4',
        borderRadius: 8,
        borderSkipped: false,
      }]
    };

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#FFFFFF'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#FFFFFF'
          }
        }
      }
    };
  }

  private initializeLineChart() {
    this.lineChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Income',
          data: [400, 450, 600, 500, 850, 800],
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: 'Expenses', 
          data: [300, 350, 400, 350, 500, 450],
          borderColor: '#FF6B9D',
          backgroundColor: 'rgba(255, 107, 157, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        }
      ]
    };

    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#FFFFFF',
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#FFFFFF'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#FFFFFF'
          }
        }
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 8
        }
      }
    };
  }

  private initializeDoughnutChart() {
    const savingsTerms = this.dashboardData.savingsStatistics.accountsByTerm;
    
    this.doughnutChartData = {
      labels: Object.keys(savingsTerms).map(term => `${term} months`),
      datasets: [{
        data: Object.values(savingsTerms),
        backgroundColor: [
          '#4ECDC4',
          '#FF6B9D', 
          '#96CEB4'
        ],
        borderWidth: 0,
        cutout: '70%'
      }]
    };

    this.doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#FFFFFF',
            font: {
              size: 11
            }
          }
        }
      }
    };
  }

  private initializeAccountsTrendChart() {
    this.accountsTrendData = {
      labels: ['Tháng trước', 'Tháng này'],
      datasets: [{
        data: [this.dashboardData.newAccountsLastMonth, this.dashboardData.newAccountsThisMonth],
        borderColor: this.dashboardData.monthlyGrowthRate >= 0 ? '#4ECDC4' : '#FF6B9D',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: this.dashboardData.monthlyGrowthRate >= 0 ? '#4ECDC4' : '#FF6B9D',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4
      }]
    };

    this.accountsTrendOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 5
        }
      }
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  getGrowthClass(): string {
    return this.dashboardData.monthlyGrowthRate >= 0 ? 'positive-growth' : 'negative-growth';
  }

  getGrowthIcon(): string {
    return this.dashboardData.monthlyGrowthRate >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  getStatisticsTableData(): any[] {
    return [
      {
        type: 'Tài Khoản Tổng',
        total: this.dashboardData.accountStatistics.totalAccounts,
        active: this.dashboardData.accountStatistics.activeAccounts,
        inactive: this.dashboardData.accountStatistics.inactiveAccounts,
        percentage: Math.round((this.dashboardData.accountStatistics.activeAccounts / this.dashboardData.accountStatistics.totalAccounts) * 100),
        status: 'Hoạt động',
        severity: 'success'
      },
      {
        type: 'Tài Khoản Tiết Kiệm',
        total: this.dashboardData.savingsStatistics.totalSavingsAccounts,
        active: this.dashboardData.savingsStatistics.totalSavingsAccounts - this.dashboardData.savingsStatistics.accountsNearMaturity,
        inactive: this.dashboardData.savingsStatistics.accountsNearMaturity,
        percentage: Math.round(((this.dashboardData.savingsStatistics.totalSavingsAccounts - this.dashboardData.savingsStatistics.accountsNearMaturity) / this.dashboardData.savingsStatistics.totalSavingsAccounts) * 100),
        status: 'Ổn định',
        severity: 'info'
      },
      {
        type: 'Yêu Cầu Tín Dụng',
        total: this.dashboardData.creditRequestStatistics.totalCreditRequests,
        active: this.dashboardData.creditRequestStatistics.approvedRequests,
        inactive: this.dashboardData.creditRequestStatistics.rejectedRequests + this.dashboardData.creditRequestStatistics.pendingRequests,
        percentage: Math.round(this.dashboardData.creditRequestStatistics.approvalRate),
        status: 'Tốt',
        severity: 'success'
      }
    ];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  getPeakDay(): string {
    if (this.filteredData.length === 0) return 'N/A';
    
    const maxValue = Math.max(...this.filteredData.map(item => item.totalCreated));
    const peakItem = this.filteredData.find(item => item.totalCreated === maxValue);
    return peakItem ? this.formatDate(peakItem.date) : 'N/A';
  }

  private updateFilteredData() {
    this.filteredData = this.accountCreationStatistics.dailyGrowthDetails.filter((item: DailyGrowthDetail) => {
      const date = new Date(item.date);
      return date >= this.startDate && date <= this.endDate;
    });
  }

  onDateFilterChange() {
    this.updateFilteredData();
    this.initializeDailyAccountCreationChart();
  }

  getTotalAccountsInPeriod(): number {
    return this.filteredData.reduce((total, item) => total + item.totalCreated, 0);
  }

  getTotalPaymentAccounts(): number {
    return this.filteredData.reduce((total, item) => total + item.paymentAccountsCreated, 0);
  }

  getTotalSavingAccounts(): number {
    return this.filteredData.reduce((total, item) => total + item.savingAccountsCreated, 0);
  }

  getTotalCreditAccounts(): number {
    return this.filteredData.reduce((total, item) => total + item.creditAccountsCreated, 0);
  }

  // Method to load Account Creation Statistics from separate API
  private loadAccountCreationStatistics() {
    console.log('Starting to load account creation statistics...');
    this.isLoadingAccountStats = true;
    this.accountService.getAccountCreationStatistics().subscribe((data: any) => {
      this.accountCreationStatistics = data;
      console.log(this.accountCreationStatistics);
      this.updateFilteredData();
      this.initializeDailyAccountCreationChart();
      this.isLoadingAccountStats = false;
    });
    // Simulate API call delay
  //   setTimeout(() => {
  //     console.log('Loading account creation statistics from API...');
  //     // This simulates loading data from another API endpoint
  //     // In real implementation, this would be an HTTP request
  //     const apiResponse = {
  //       "dailyAccountCreation": {
  //         "2025-06-30": 1,
  //         "2025-06-26": 2,
  //         "2025-06-24": 3,
  //         "2025-07-02": 2,
  //         "2025-06-17": 2,
  //         "2025-06-16": 2
  //       },
  //       "growthByAccountType": {
  //         "PAYMENT": {
  //           "2025-06-30": 1,
  //           "2025-06-24": 2,
  //           "2025-06-16": 1
  //         },
  //         "CREDIT": {
  //           "2025-07-02": 2
  //         },
  //         "MASTER": {
  //           "2025-06-16": 1
  //         },
  //         "SAVING": {
  //           "2025-06-26": 2,
  //           "2025-06-24": 1,
  //           "2025-06-17": 2
  //         }
  //       },
  //       "totalAccountsInPeriod": 12,
  //       "growthRate": 0.0,
  //       "fromDate": "2025-06-03",
  //       "toDate": "2025-07-02",
  //       "periodDays": 30,
  //       "dailyGrowthDetails": [
  //         { "date": "2025-06-03", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-04", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-05", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-06", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-07", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-08", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-09", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-10", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-11", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-12", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-13", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-14", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-15", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-16", "totalCreated": 2, "paymentAccountsCreated": 1, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-17", "totalCreated": 2, "paymentAccountsCreated": 0, "savingAccountsCreated": 2, "creditAccountsCreated": 0, "growthRateFromPreviousDay": 0.0 },
  //         { "date": "2025-06-18", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": -100.0 },
  //         { "date": "2025-06-19", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-20", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-21", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-22", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-23", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-24", "totalCreated": 3, "paymentAccountsCreated": 2, "savingAccountsCreated": 1, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-25", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": -100.0 },
  //         { "date": "2025-06-26", "totalCreated": 2, "paymentAccountsCreated": 0, "savingAccountsCreated": 2, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-27", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": -100.0 },
  //         { "date": "2025-06-28", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-29", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-06-30", "totalCreated": 1, "paymentAccountsCreated": 1, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": null },
  //         { "date": "2025-07-01", "totalCreated": 0, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 0, "growthRateFromPreviousDay": -100.0 },
  //         { "date": "2025-07-02", "totalCreated": 2, "paymentAccountsCreated": 0, "savingAccountsCreated": 0, "creditAccountsCreated": 2, "growthRateFromPreviousDay": null }
  //       ]
  //     };

  //     // Update the account creation statistics with new data
  //     this.accountCreationStatistics = apiResponse;
      
  //     // Update filtered data and refresh charts
  //     this.updateFilteredData();
  //     this.initializeDailyAccountCreationChart();
      
  //     this.isLoadingAccountStats = false;
  //   }, 500); // Simulate 500ms API call delay
  }

  private initializeDailyAccountCreationChart() {
    // Use filtered data to create chart
    console.log('Initializing daily account creation chart with filtered data:', this.filteredData);
    
    const dates = this.filteredData.map(item => this.formatDate(item.date));
    const paymentData = this.filteredData.map(item => item.paymentAccountsCreated);
    const savingData = this.filteredData.map(item => item.savingAccountsCreated);
    const creditData = this.filteredData.map(item => item.creditAccountsCreated);

    console.log('Chart data - Dates:', dates);
    console.log('Chart data - Payment:', paymentData);
    console.log('Chart data - Saving:', savingData);
    console.log('Chart data - Credit:', creditData);

    this.dailyAccountCreationData = {
      labels: dates,
      datasets: [
        {
          label: 'Thanh toán (PAYMENT)',
          data: paymentData,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#4ECDC4',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        {
          label: 'Tiết kiệm (SAVING)',
          data: savingData,
          borderColor: '#FF6B9D',
          backgroundColor: 'rgba(255, 107, 157, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#FF6B9D',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 5
        },
        {
          label: 'Tín dụng (CREDIT)',
          data: creditData,
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#FFD700',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 5
        }
      ]
    };

    this.dailyAccountCreationOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#FFFFFF',
            font: {
              size: 12
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#FFFFFF',
            maxTicksLimit: 10
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#FFFFFF',
            beginAtZero: true
          }
        }
      },
      elements: {
        point: {
          hoverRadius: 8
        }
      }
    };
  }
}
