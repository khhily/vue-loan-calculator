import { LoanInfo, FinanceInfo, MonthlyRecord, PrepaymentStrategy } from '../types/loan';

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

  // 根据剩余本金和剩余期限计算新的月供
  static recalculateMonthlyPayment(remainingAmount: number, monthlyRate: number, remainingMonths: number): number {
    if (remainingAmount <= 0 || remainingMonths <= 0) return 0;

    const monthlyPayment =
      (remainingAmount * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
      (Math.pow(1 + monthlyRate, remainingMonths) - 1);
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
      // 初始月供
      monthlyPayment: this.calculateMonthlyPayment(loan),
      // 初始剩余月数
      remainingMonths: loan.years * 12,
    }));

    let totalLoanAmount = remainingLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    let currentSavings = financeInfo.initialSavings;

    // 计算初始总月供
    let totalMonthlyPayment = remainingLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

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
        prepaymentAmount: 0,
        monthlyPayment: totalMonthlyPayment,
      };

      // 计算每个贷款的当月利息和本金
      remainingLoans.forEach((loan) => {
        if (loan.remainingAmount <= 0) return;

        const monthlyRate = loan.rate / 12 / 100;
        const monthlyPayment = loan.monthlyPayment;

        const interest = loan.remainingAmount * monthlyRate;
        const principal = Math.min(monthlyPayment - interest, loan.remainingAmount);

        monthlyRecord.principal += principal;
        monthlyRecord.interest += interest;

        loan.remainingAmount -= principal;

        // 如果是减少月供策略，每次还款后减少剩余月数
        if (financeInfo.prepaymentStrategy === PrepaymentStrategy.REDUCE_PAYMENT) {
          loan.remainingMonths--;
        }
      });

      // 计算月收支（扣除月供后的结余）
      const monthlyBalance = financeInfo.monthlyIncome - financeInfo.monthlyExpense - totalMonthlyPayment;
      currentSavings += monthlyBalance;

      // 检查是否可以提前还款
      if (currentSavings >= financeInfo.prepaymentThreshold || currentSavings >= totalLoanAmount) {
        // 计算可提前还款金额
        const maxPrepayment = Math.min(currentSavings, totalLoanAmount);

        // 如果存款足够还清所有贷款，或者达到阈值且可以还款至少1万
        if (maxPrepayment >= totalLoanAmount || maxPrepayment >= 10000) {
          // 如果存款足够还清所有贷款，直接还清
          if (maxPrepayment >= totalLoanAmount) {
            monthlyRecord.prepaymentAmount = totalLoanAmount;
            monthlyRecord.principal += totalLoanAmount;

            // 清空所有贷款
            remainingLoans.forEach((loan) => {
              loan.remainingAmount = 0;
            });

            totalLoanAmount = 0;
            currentSavings -= monthlyRecord.prepaymentAmount;
            monthlyRecord.isPrepayment = true;
          } else {
            // 否则按照正常的提前还款逻辑处理
            // 向下取整到最近的10000的倍数
            const prepaymentAmount = Math.floor(maxPrepayment / 10000) * 10000;

            // 记录提前还款金额
            monthlyRecord.prepaymentAmount = prepaymentAmount;

            // 按比例分配提前还款金额到各个贷款
            const totalRemaining = remainingLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);

            remainingLoans.forEach((loan) => {
              if (loan.remainingAmount <= 0) return;

              const proportion = loan.remainingAmount / totalRemaining;
              const loanPrepayment = Math.round(prepaymentAmount * proportion);
              loan.remainingAmount -= loanPrepayment;
              monthlyRecord.principal += loanPrepayment;

              // 根据提前还款策略处理
              if (financeInfo.prepaymentStrategy === PrepaymentStrategy.REDUCE_PAYMENT) {
                // 减少月供策略：重新计算月供，保持还款期限不变
                const monthlyRate = loan.rate / 12 / 100;
                loan.monthlyPayment = this.recalculateMonthlyPayment(
                  loan.remainingAmount,
                  monthlyRate,
                  loan.remainingMonths
                );
              }
              // 缩短还款期限策略：月供保持不变，自然会缩短还款期限
            });

            currentSavings -= prepaymentAmount;
            monthlyRecord.isPrepayment = true;
          }

          // 更新总月供
          totalMonthlyPayment = remainingLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
          monthlyRecord.monthlyPayment = totalMonthlyPayment;
        }
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
