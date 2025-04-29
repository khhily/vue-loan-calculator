import { LoanInfo, FinanceInfo, MonthlyRecord } from '../types/loan';

export class LoanCalculator {
  // 计算月供（等额本息）
  static calculateMonthlyPayment(loan: LoanInfo): number {
    const monthlyRate = loan.rate / 12 / 100;
    const totalMonths = loan.years * 12;
    const monthlyPayment =
      (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return monthlyPayment;
  }

  // 计算每月还款明细
  static calculateMonthlyDetails(loans: LoanInfo[], financeInfo: FinanceInfo): MonthlyRecord[] {
    const records: MonthlyRecord[] = [];
    let month = 1;

    // 复制贷款数组，用于追踪每个贷款的剩余本金
    let remainingLoans = loans.map((loan) => ({
      ...loan,
      remainingAmount: loan.amount,
    }));

    let totalLoanAmount = remainingLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    let currentSavings = financeInfo.initialSavings;

    // 计算每个贷款的月供
    const monthlyPayments = loans.map((loan) => this.calculateMonthlyPayment(loan));
    const totalMonthlyPayment = monthlyPayments.reduce((sum, payment) => sum + payment, 0);

    while (totalLoanAmount > 0) {
      let monthlyRecord: MonthlyRecord = {
        month: month,
        principal: 0,
        interest: 0,
        totalPayment: 0,
        remainingLoan: totalLoanAmount,
        monthlyBalance: 0,
        totalSavings: currentSavings,
        isPrepayment: false,
        prepaymentAmount: 0, // 新增字段
      };

      // 计算每个贷款的当月利息和本金
      remainingLoans.forEach((loan, index) => {
        if (loan.remainingAmount <= 0) return;

        const monthlyRate = loan.rate / 12 / 100;
        const monthlyPayment = monthlyPayments[index];

        // 当月利息 = 剩余本金 × 月利率
        const interest = loan.remainingAmount * monthlyRate;
        // 当月本金 = 月供 - 当月利息
        const principal = Math.min(monthlyPayment - interest, loan.remainingAmount);

        monthlyRecord.principal += principal;
        monthlyRecord.interest += interest;

        // 更新剩余本金
        loan.remainingAmount -= principal;
      });

      // 计算月收支（扣除月供后的结余）
      const monthlyBalance = financeInfo.monthlyIncome - financeInfo.monthlyExpense - totalMonthlyPayment;
      currentSavings += monthlyBalance;

      // 检查是否可以提前还款
      if (currentSavings >= financeInfo.prepaymentThreshold) {
        const prepaymentAmount = Math.min(currentSavings, totalLoanAmount);

        // 记录提前还款金额
        monthlyRecord.prepaymentAmount = prepaymentAmount;

        // 按比例分配提前还款金额到各个贷款
        const totalRemaining = remainingLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
        remainingLoans.forEach((loan) => {
          if (loan.remainingAmount <= 0) return;

          const proportion = loan.remainingAmount / totalRemaining;
          const loanPrepayment = prepaymentAmount * proportion;
          loan.remainingAmount -= loanPrepayment;
          monthlyRecord.principal += loanPrepayment;
        });

        currentSavings -= prepaymentAmount;
        monthlyRecord.isPrepayment = true;
      }

      // 更新总贷款余额
      totalLoanAmount = remainingLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

      monthlyRecord.totalPayment = monthlyRecord.principal + monthlyRecord.interest;
      monthlyRecord.remainingLoan = totalLoanAmount;
      monthlyRecord.monthlyBalance = monthlyBalance;
      monthlyRecord.totalSavings = currentSavings;

      records.push(monthlyRecord);
      month++;

      // 安全检查，避免无限循环
      if (month > 1000) break;
    }

    return records;
  }
}
