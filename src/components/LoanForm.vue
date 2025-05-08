<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { LoanType, LoanInfo, FinanceInfo, PrepaymentStrategy } from '../types/loan';

const emit = defineEmits(['calculate']);

// 总房款额(万元)和首付比例
const totalHousePrice = ref<number>(0);
const downPaymentRatio = ref<number>(20); // 默认20%

// 计算首付金额(万元)
const downPaymentAmount = computed(() => {
  return totalHousePrice.value * (downPaymentRatio.value / 100);
});

// 计算贷款总额(万元)
const totalLoanAmount = computed(() => {
  return totalHousePrice.value * (1 - downPaymentRatio.value / 100);
});

// 添加公积金缴费基数
const housingFundBase = ref<number>(0);

// 计算公积金贷款上限(万元)
const maxHousingFundLoan = computed(() => {
  // 月供不能超过缴费基数的50%
  if (housingFundBase.value <= 0) return 143; // 如果未设置缴费基数，使用默认上限(万元)

  const monthlyRate = loans.value[0].rate / 12 / 100;
  const totalMonths = loans.value[0].years * 12;
  const maxMonthlyPayment = housingFundBase.value * 0.5;

  // 根据最大月供反推最大贷款额
  // 公式: 贷款额 = 月供 * ((1+r)^n - 1) / (r * (1+r)^n)
  const denominator = monthlyRate * Math.pow(1 + monthlyRate, totalMonths);
  const numerator = Math.pow(1 + monthlyRate, totalMonths) - 1;
  const maxLoan = maxMonthlyPayment * (numerator / denominator);

  // 转换为万元并取整
  return Math.floor(maxLoan / 10000);
});

// 修改自动分配贷款金额函数
const distributeLoanAmount = () => {
  const total = totalLoanAmount.value; // 已经是万元单位

  // 使用计算的公积金贷款上限(万元)
  const maxHousingFund = maxHousingFundLoan.value;

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

// 监听公积金缴费基数变化，重新计算贷款分配
watch([totalHousePrice, downPaymentRatio, housingFundBase], () => {
  distributeLoanAmount();
});

const loans = ref<LoanInfo[]>([
  {
    type: LoanType.HOUSING_FUND,
    amount: 0,
    rate: 2.6, // 修改为2.6
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

// 监听公积金贷款金额变化，自动调整商业贷款金额
watch(
  () => loans.value[0].amount,
  (newAmount) => {
    // 首先确保不超过上限
    const maxHousingFund = maxHousingFundLoan.value;
    if (newAmount > maxHousingFund) {
      // 如果超过上限，将超出部分转移到商业贷款
      const excess = newAmount - maxHousingFund;
      loans.value[0].amount = maxHousingFund;
      loans.value[1].amount += excess;
    } else {
      // 正常情况下，商业贷款金额 = 贷款总额 - 公积金贷款金额
      loans.value[1].amount = Math.max(0, totalLoanAmount.value - newAmount);
    }
  }
);

const financeInfo = ref<FinanceInfo>({
  monthlyIncome: 0,
  monthlyExpense: 0,
  initialSavings: 0,
  prepaymentThreshold: 100000, // 修改默认值为10万
  prepaymentStrategy: PrepaymentStrategy.SHORTEN_TERM, // 默认缩短还款期限
});

const calculate = () => {
  // 将贷款金额从万元转换为元
  const loansInYuan = loans.value.map((loan) => ({
    ...loan,
    amount: loan.amount * 10000, // 万元转换为元
  }));

  emit('calculate', {
    loans: loansInYuan,
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
              :step="1"
              :precision="2"
              controls-position="right"
              class="w-full"
            >
              <template #append>万元</template>
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

      <!-- 公积金缴费基数 -->
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="公积金缴费基数">
            <el-input-number
              v-model="housingFundBase"
              :min="0"
              :step="1000"
              :precision="0"
              controls-position="right"
              class="w-full"
            >
              <template #append>元</template>
            </el-input-number>
            <div class="text-xs text-gray-500 mt-1">(用于计算公积金贷款上限)</div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 显示计算出的首付金额和贷款总额 -->
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="首付金额">
            <div class="text-base sm:text-lg font-bold">{{ downPaymentAmount.toFixed(2) }} 万元</div>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="贷款总额">
            <div class="text-base sm:text-lg font-bold">{{ totalLoanAmount.toFixed(2) }} 万元</div>
            <div class="text-xs sm:text-sm text-gray-500 mt-1">
              (公积金贷款月供不能超过缴费基数的50%，超出部分将使用商业贷款)
            </div>
          </el-form-item>
        </el-col>
      </el-row>
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
                :step="1"
                :precision="2"
                controls-position="right"
                :max="index === 0 ? maxHousingFundLoan : Infinity"
                class="w-full"
              >
                <template #append>万元</template>
              </el-input-number>
              <div v-if="index === 0" class="text-xs text-gray-500 mt-1">
                (公积金贷款上限为{{ maxHousingFundLoan.toFixed(2) }}万元)
              </div>
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

      <!-- 提前还款策略选择 -->
      <el-form-item label="提前还款策略">
        <el-radio-group v-model="financeInfo.prepaymentStrategy" class="w-full">
          <el-radio :label="PrepaymentStrategy.SHORTEN_TERM" border class="mb-2 sm:mb-0 w-full sm:w-auto">
            缩短还款期限（月供不变）
          </el-radio>
          <el-radio :label="PrepaymentStrategy.REDUCE_PAYMENT" border class="w-full sm:w-auto">
            减少月供（还款期限不变）
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <div class="flex justify-center mt-6">
      <el-button type="primary" size="large" @click="calculate"> 计算还款计划 </el-button>
    </div>
  </el-card>
</template>
