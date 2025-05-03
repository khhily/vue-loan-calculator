<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { LoanType, LoanInfo, FinanceInfo } from '../types/loan';

const emit = defineEmits(['calculate']);

// 总房款额和首付比例
const totalHousePrice = ref<number>(0);
const downPaymentRatio = ref<number>(30); // 默认30%

// 计算贷款总额
const totalLoanAmount = computed(() => {
  return totalHousePrice.value * (1 - downPaymentRatio.value / 100);
});

// 自动分配贷款金额
const distributeLoanAmount = () => {
  const total = totalLoanAmount.value;
  const maxHousingFund = 1430000; // 公积金贷款上限143万

  // 优先使用公积金贷款
  if (total <= maxHousingFund) {
    // 如果总贷款额小于等于公积金上限，全部使用公积金贷款
    loans.value[0].amount = total;
    loans.value[1].amount = 0;
  } else {
    // 如果总贷款额超过公积金上限，公积金贷款用到上限，剩余部分使用商业贷款
    loans.value[0].amount = maxHousingFund;
    loans.value[1].amount = total - maxHousingFund;
  }
};

// 监听总房款额和首付比例变化，自动计算贷款金额
watch([totalHousePrice, downPaymentRatio], () => {
  distributeLoanAmount();
});

const loans = ref<LoanInfo[]>([
  {
    type: LoanType.HOUSING_FUND,
    amount: 0,
    rate: 2.85, // 修改为2.85
    years: 30,
  },
  {
    type: LoanType.COMMERCIAL,
    amount: 0,
    rate: 3.1, // 修改为3.1
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

// 监听公积金贷款金额变化，确保不超过上限
watch(
  () => loans.value[0].amount,
  (newAmount) => {
    const maxHousingFund = 1430000;
    if (newAmount > maxHousingFund) {
      // 如果超过上限，将超出部分转移到商业贷款
      const excess = newAmount - maxHousingFund;
      loans.value[0].amount = maxHousingFund;
      loans.value[1].amount += excess;
    }
  }
);

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
        <span class="text-lg sm:text-xl font-bold">贷款信息</span>
      </div>
    </template>

    <!-- 房价和首付比例 -->
    <el-form label-position="top" label-width="auto" class="mb-4">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="房屋总价">
            <el-input-number
              v-model="totalHousePrice"
              :min="0"
              :step="100000"
              :precision="0"
              controls-position="right"
              class="w-full"
            >
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="首付比例">
            <el-input-number
              v-model="downPaymentRatio"
              :min="0"
              :max="100"
              :step="1"
              :precision="0"
              controls-position="right"
              class="w-full"
            >
              <template #append>%</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 显示计算出的贷款总额 -->
      <el-form-item label="贷款总额">
        <div class="text-base sm:text-lg font-bold">{{ totalLoanAmount.toLocaleString('zh-CN') }} 元</div>
        <div class="text-xs sm:text-sm text-gray-500 mt-1">(公积金贷款上限为143万，超出部分将使用商业贷款)</div>
      </el-form-item>
    </el-form>

    <!-- 贷款年限（统一控制） -->
    <el-form label-position="top" label-width="auto" class="mb-4">
      <el-form-item label="贷款年限">
        <el-input-number
          v-model="commonYears"
          :min="1"
          :max="30"
          :step="1"
          controls-position="right"
          class="w-full sm:w-1/2"
        >
          <template #append>年</template>
        </el-input-number>
      </el-form-item>
    </el-form>

    <!-- 两种贷款的金额和利率设置 -->
    <div v-for="(loan, index) in loans" :key="index" class="mb-4">
      <el-divider>{{ loan.type }}</el-divider>

      <el-form :model="loan" label-position="top" label-width="auto">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item label="贷款金额">
              <el-input-number
                v-model="loan.amount"
                :min="0"
                :step="10000"
                :precision="0"
                controls-position="right"
                :max="index === 0 ? 1430000 : Infinity"
                class="w-full"
              >
                <template #append>元</template>
              </el-input-number>
              <div v-if="index === 0" class="text-xs text-gray-500 mt-1">(公积金贷款上限为143万)</div>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="年利率">
              <el-input-number
                v-model="loan.rate"
                :min="0"
                :step="0.01"
                :precision="2"
                controls-position="right"
                class="w-full"
              >
                <template #append>%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider>个人财务信息</el-divider>

    <!-- 个人财务信息部分 -->
    <el-form :model="financeInfo" label-position="top" label-width="auto">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="月收入">
            <el-input-number v-model="financeInfo.monthlyIncome" :min="0" :step="1000" :controls="true" class="w-full">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="月支出">
            <el-input-number v-model="financeInfo.monthlyExpense" :min="0" :step="1000" :controls="true" class="w-full">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="初始存款">
            <el-input-number
              v-model="financeInfo.initialSavings"
              :min="0"
              :step="10000"
              :controls="true"
              class="w-full"
            >
              <template #append>元</template>
            </el-input-number>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="12">
          <el-form-item label="提前还款阈值">
            <el-input-number
              v-model="financeInfo.prepaymentThreshold"
              :min="0"
              :step="10000"
              :controls="true"
              class="w-full"
            >
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
