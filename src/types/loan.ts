// 贷款类型
export enum LoanType {
  HOUSING_FUND = '公积金贷款',
  COMMERCIAL = '商业贷款',
}

// 提前还款策略
export enum PrepaymentStrategy {
  SHORTEN_TERM = 'shorten_term', // 缩短还款期限
  REDUCE_PAYMENT = 'reduce_payment', // 减少月供
}

// 贷款信息
export interface LoanInfo {
  type: LoanType;
  amount: number; // 贷款金额
  rate: number; // 年利率
  years: number; // 贷款年限
}

// 个人财务信息
export interface FinanceInfo {
  monthlyIncome: number; // 月收入
  monthlyExpense: number; // 月支出
  initialSavings: number; // 初始存款
  prepaymentThreshold: number; // 提前还款阈值
  prepaymentStrategy: PrepaymentStrategy; // 提前还款策略
}

// 月度还款记录
export interface MonthlyRecord {
  month: number; // 第几个月
  principal: number; // 还款本金
  interest: number; // 还款利息
  totalPayment: number; // 还款总额
  remainingLoan: number; // 剩余贷款
  monthlyBalance: number; // 月结余
  totalSavings: number; // 总存款
  isPrepayment: boolean; // 是否提前还款
  prepaymentAmount: number; // 提前还款金额
  monthlyPayment?: number; // 月供（可能会变化）
}
