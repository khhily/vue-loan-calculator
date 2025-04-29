<script setup lang="ts">
import { ref } from 'vue';
import LoanForm from './components/LoanForm.vue';
import LoanResult from './components/LoanResult.vue';
import { LoanCalculator } from './utils/loanCalculator';
import type { MonthlyRecord } from './types/loan';

const records = ref<MonthlyRecord[]>([]);

const handleCalculate = (data: any) => {
  records.value = LoanCalculator.calculateMonthlyDetails(data.loans, data.financeInfo);
};
</script>

<template>
  <el-container>
    <el-header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4">
        <h1 class="text-3xl font-bold text-gray-900">房贷计算器</h1>
      </div>
    </el-header>

    <el-main>
      <div class="max-w-7xl mx-auto py-6">
        <LoanForm @calculate="handleCalculate" />
        <LoanResult v-if="records.length > 0" :records="records" />
      </div>
    </el-main>
  </el-container>
</template>
