<script setup lang="ts">
import { MonthlyRecord } from '../types/loan';

defineProps<{
  records: MonthlyRecord[];
}>();

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
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
          <div>
            {{ formatMoney(row.principal - (row.isPrepayment ? row.prepaymentAmount : 0)) }} +
            {{ formatMoney(row.interest) }} =
            {{ formatMoney(row.totalPayment - (row.isPrepayment ? row.prepaymentAmount : 0)) }}
          </div>
          <div v-if="row.isPrepayment" class="mt-1 text-green-600">
            提前还款：{{ formatMoney(row.prepaymentAmount) }}
            <el-tag type="success" size="small" class="ml-2">提前还款</el-tag>
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
  </el-card>
</template>
