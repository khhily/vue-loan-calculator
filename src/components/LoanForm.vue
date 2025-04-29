<script setup lang="ts">
import { ref, watch } from 'vue';
import { LoanType, LoanInfo, FinanceInfo } from '../types/loan';

const emit = defineEmits(['calculate']);

const loans = ref<LoanInfo[]>([
  {
    type: LoanType.HOUSING_FUND,
    amount: 0,
    rate: 3.1,
    years: 30,
  },
  {
    type: LoanType.COMMERCIAL,
    amount: 0,
    rate: 4.35,
    years: 30,
  },
]);

// 共同的贷款年限
const commonYears = ref(30);

// 监听并同步贷款年限
watch(commonYears, (newYears) => {
  loans.value.forEach((loan) => {
    loan.years = newYears;
  });
});

const financeInfo = ref<FinanceInfo>({
  monthlyIncome: 0,
  monthlyExpense: 0,
  initialSavings: 0,
  prepaymentThreshold: 200000,
});

const calculate = () => {
  emit('calculate', {
    loans: loans.value,
    financeInfo: financeInfo.value,
  });
};
</script>

<template>
  <el-card class="mb-6">
    <template #header>
      <div class="card-header">
        <span class="text-xl font-bold">贷款信息</span>
      </div>
    </template>

    <!-- 贷款年限（统一控制） -->
    <el-form label-width="120px" class="mb-6">
      <el-form-item label="贷款年限">
        <el-input-number v-model="commonYears" :min="1" :max="30" :step="1" :controls="true">
          <template #append>年</template>
        </el-input-number>
      </el-form-item>
    </el-form>

    <!-- 两种贷款的金额和利率设置 -->
    <div v-for="(loan, index) in loans" :key="index" class="mb-6">
      <el-divider>{{ loan.type }}</el-divider>

      <el-form :model="loan" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="贷款金额">
              <el-input-number v-model="loan.amount" :min="0" :step="10000" :precision="0" :controls="true">
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="年利率">
              <el-input-number v-model="loan.rate" :min="0" :step="0.01" :precision="2" :controls="true">
                <template #append>%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider>个人财务信息</el-divider>

    <el-form :model="financeInfo" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="月收入">
            <el-input-number v-model="financeInfo.monthlyIncome" :min="0" :step="1000" :controls="true">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="月支出">
            <el-input-number v-model="financeInfo.monthlyExpense" :min="0" :step="1000" :controls="true">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="初始存款">
            <el-input-number v-model="financeInfo.initialSavings" :min="0" :step="10000" :controls="true">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="提前还款阈值">
            <el-input-number v-model="financeInfo.prepaymentThreshold" :min="0" :step="10000" :controls="true">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="flex justify-center mt-6">
      <el-button type="primary" size="large" @click="calculate"> 计算还款计划 </el-button>
    </div>
  </el-card>
</template>
