<script setup lang="ts">
import { computed } from 'vue';
import { MonthlyRecord, LoanInfo } from '../types/loan';

const props = defineProps<{
  records: MonthlyRecord[];
  loans: LoanInfo[];
}>();

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// 计算每月常规还款金额（不包括提前还款）
const getRegularPayment = (record: MonthlyRecord) => {
  return record.totalPayment - (record.isPrepayment ? record.prepaymentAmount : 0);
};

// 计算每月常规本金（不包括提前还款）
const getRegularPrincipal = (record: MonthlyRecord) => {
  return record.principal - (record.isPrepayment ? record.prepaymentAmount : 0);
};

// 计算总贷款本金
const totalLoanPrincipal = computed(() => {
  return props.loans.reduce((sum, loan) => sum + loan.amount, 0);
});

// 获取月供金额
const monthlyPayment = computed(() => {
  if (!props.records.length) return 0;
  return getRegularPayment(props.records[0]);
});

// 计算还款总月份
const totalRepaymentMonths = computed(() => {
  return props.records.length;
});

// 格式化为"几年零几个月"
const formattedRepaymentPeriod = computed(() => {
  const months = totalRepaymentMonths.value;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths}个月`;
  } else if (remainingMonths === 0) {
    return `${years}年`;
  } else {
    return `${years}年零${remainingMonths}个月`;
  }
});
</script>

<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span class="text-xl font-bold">还款计划</span>
      </div>
    </template>

    <el-table :data="records" style="width: 100%" :stripe="true">
      <el-table-column prop="month" label="月份" width="80" />

      <el-table-column label="还款明细" min-width="250">
        <template #default="{ row }">
          <div class="flex flex-col gap-1">
            <!-- 常规还款 -->
            <div>本金：{{ formatMoney(getRegularPrincipal(row)) }}</div>
            <div>利息：{{ formatMoney(row.interest) }}</div>
            <div class="font-bold">月供：{{ formatMoney(getRegularPayment(row)) }}</div>

            <!-- 提前还款信息 -->
            <div v-if="row.isPrepayment" class="mt-1 text-green-600">
              提前还款：{{ formatMoney(row.prepaymentAmount) }}
              <el-tag type="success" size="small" class="ml-2">提前还款</el-tag>
            </div>

            <!-- 当月还款总额 -->
            <div v-if="row.isPrepayment" class="mt-1 font-bold">当月总还款：{{ formatMoney(row.totalPayment) }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="剩余贷款" min-width="150">
        <template #default="{ row }">
          {{ formatMoney(row.remainingLoan) }}
        </template>
      </el-table-column>

      <el-table-column label="月结余" min-width="150">
        <template #default="{ row }">
          {{ formatMoney(row.monthlyBalance) }}
        </template>
      </el-table-column>

      <el-table-column label="总存款" min-width="150">
        <template #default="{ row }">
          {{ formatMoney(row.totalSavings) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 贷款汇总信息 -->
    <div class="mt-6 p-4 bg-gray-50 rounded">
      <div class="grid grid-cols-3 gap-4">
        <div>
          <div class="text-gray-600">总贷款本金</div>
          <div class="text-xl font-bold">
            {{ formatMoney(totalLoanPrincipal) }}
          </div>
        </div>
        <div>
          <div class="text-gray-600">月供</div>
          <div class="text-xl font-bold">
            {{ formatMoney(monthlyPayment) }}
          </div>
        </div>
        <div>
          <div class="text-gray-600">还款时间</div>
          <div class="text-xl font-bold">
            {{ formattedRepaymentPeriod }}
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>
