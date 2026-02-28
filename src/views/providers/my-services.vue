<template>
  <div class="my-services-page">
    <n-spin :show="loadingList">
      <n-space vertical :size="16" class="my-services-space">
        <n-text class="page-title">خدمات و ادوات قابل ارائه توسط شما</n-text>
      </n-space>

      <!-- حالت خالی -->
      <div v-if="!loadingList && providerImplements.length === 0" class="empty-state">
        <n-icon size="72" color="#9ca3af" class="empty-icon">
          <i class="fa-solid fa-screwdriver-wrench"></i>
        </n-icon>
        <n-text depth="2" class="empty-text">شما هنوز هیچ خدمتی برای ارائه ثبت نکرده اید</n-text>
      </div>

      <!-- لیست کارت‌ها -->
      <n-space v-else-if="!loadingList && providerImplements.length > 0" vertical :size="12" class="list-space">
        <n-card
          v-for="item in providerImplements"
          :key="item.id"
          bordered
          round
          class="implement-card"
          content-style="padding: 1rem 1.25rem;"
        >
          <div class="implement-card-inner">
            <div class="implement-card-main">
              <n-avatar
                v-if="item.implement?.image"
                :src="item.implement.image"
                round
                size="56"
                class="implement-card-image"
              />
              <div v-else class="implement-card-icon-wrap">
                <i class="fa-solid fa-tractor implement-card-icon"></i>
              </div>
              <div class="implement-card-info">
                <n-text strong class="implement-name">{{ item.implement?.name }}</n-text>
                <div class="implement-price-row">
                  <n-text strong class="implement-price">{{ formatPriceDisplay(item.price) }}</n-text>
                  <n-text depth="2" class="implement-price-suffix">تومان</n-text>
                  <n-text depth="2" class="implement-price-type">{{ item.implement?.price_type }}</n-text>
                </div>
              </div>
            </div>
            <div class="implement-card-actions">
              <button type="button" class="action-btn action-btn--edit" aria-label="ویرایش" @click="onEditItem(item)">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button type="button" class="action-btn action-btn--delete" aria-label="حذف" @click="onDeleteItem(item)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-spin>

    <div class="add-button-wrapper">
      <n-button
        type="success"
        strong
        secondary
        round
        block
        size="large"
        class="add-button"
        @click="openAddModal"
      >
        <template #icon>
          <i class="fa-solid fa-plus add-button-icon"></i>
        </template>
        افزودن ادوات جدید
      </n-button>
    </div>

    <n-modal
      v-model:show="showAddModal"
      preset="card"
      :bordered="false"
      :mask-closable="false"
      size="medium"
      class="add-implement-modal"
      :content-style="addModalContentStyle"
      @after-enter="onAddModalEnter"
    >
      <template #header>
        <n-text strong class="add-modal-title">افزودن خدمات و ادوات قابل ارائه</n-text>
      </template>

      <n-spin :show="loadingCategories && !categoryOptions.length">
        <n-space vertical :size="20" class="add-modal-body">
          <n-space vertical :size="8">
            <n-text strong class="form-label">دسته‌بندی ادوات را انتخاب کنید</n-text>
            <n-select
              v-model:value="form.categoryId"
              :options="categoryOptions"
              placeholder="دسته‌بندی را انتخاب کنید"
              :loading="loadingCategories"
              filterable
              clearable
              placement="bottom"
              size="large"
              @update:value="onCategoryChange"
            />
          </n-space>

          <n-space vertical :size="8">
            <n-text strong class="form-label">انتخاب خدمت مورد نظر</n-text>
            <n-select
              v-model:value="form.implementId"
              :options="implementOptions"
              placeholder="ابتدا دسته‌بندی را انتخاب کنید"
              :loading="loadingImplements"
              :disabled="!form.categoryId"
              filterable
              clearable
              placement="bottom"
              size="large"
              :render-label="renderImplementLabel"
              :render-tag="renderImplementTag"
              @update:value="onImplementChange"
            />
          </n-space>

          <n-space vertical :size="8">
            <n-text strong class="form-label">
              مبلغ
              <span v-if="selectedImplement?.price_type" class="price-type-hint">({{ selectedImplement.price_type }})</span>
            </n-text>
            <n-input-number
              v-model:value="form.price"
              placeholder="مبلغ را وارد کنید"
              :min="0"
              :disabled="!form.implementId"
              size="large"
              clearable
              :format="formatPrice"
              :parse="parsePrice"
              class="price-input"
            />
          </n-space>
        </n-space>
      </n-spin>

      <template #footer>
        <n-space justify="end" :size="12">
          <n-button strong secondary round @click="showAddModal = false">
            بستن
          </n-button>
          <n-button
            strong
            secondary
            round
            type="success"
            :loading="submitLoading"
            :disabled="!canSubmit"
            @click="submitAddImplement"
          >
            افزودن خدمات
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { NSpace, NText, NButton, NModal, NSelect, NInputNumber, NSpin, NAvatar, NIcon, NCard, useMessage } from 'naive-ui'
import type { SelectOption, SelectRenderLabel, SelectRenderTag } from 'naive-ui'
import api from '../../utils/api'

interface Category {
  id: number
  name: string
  num: number
}

interface Implement {
  id: number
  name: string
  price_type: string
  implement_category_id: number
  image?: string | null
}

interface ProviderImplementItem {
  id: number
  user_id: number
  implement_id: number
  price: string
  created_at: string
  updated_at: string
  forms: unknown[]
  implement?: {
    id: number
    name: string
    price_type: string
    image?: string | null
  }
}

const message = useMessage()
const showAddModal = ref(false)
const loadingList = ref(true)
const providerImplements = ref<ProviderImplementItem[]>([])
const loadingCategories = ref(false)
const loadingImplements = ref(false)
const submitLoading = ref(false)

const categoryOptions = ref<SelectOption[]>([])
const categories = ref<Category[]>([])
const implementsList = ref<Implement[]>([])

const form = ref({
  categoryId: null as number | null,
  implementId: null as number | null,
  price: null as number | null,
})

const implementOptions = computed<SelectOption[]>(() => {
  return implementsList.value.map(imp => ({
    label: imp.name,
    value: imp.id,
  }))
})

const selectedImplement = computed(() => {
  if (!form.value.implementId) return null
  return implementsList.value.find(i => i.id === form.value.implementId) ?? null
})

const canSubmit = computed(() => {
  return (
    form.value.categoryId != null &&
    form.value.implementId != null &&
    form.value.price != null &&
    form.value.price > 0
  )
})

const addModalContentStyle = { paddingTop: '1.25rem' }

function findImplementById(id: number | null): Implement | undefined {
  if (!id) return undefined
  return implementsList.value.find(i => i.id === id)
}

const renderImplementLabel: SelectRenderLabel = (option) => {
  const implement = findImplementById(option.value as number)
  if (!implement) return option.label as string
  return h('div', { class: 'implement-option-label' }, [
    implement.image
      ? h(NAvatar, { src: implement.image, round: true, size: 28, class: 'implement-option-icon' })
      : h(NIcon, { size: 22, color: '#1e6b3f', class: 'implement-option-icon' }, { default: () => h('i', { class: 'fa-solid fa-tractor' }) }),
    h('span', { class: 'implement-option-name' }, implement.name),
  ])
}

const renderImplementTag: SelectRenderTag = ({ option }) => {
  const implement = findImplementById(option.value as number)
  if (!implement) return option.label as string
  return h('div', { class: 'implement-option-label implement-tag' }, [
    implement.image
      ? h(NAvatar, { src: implement.image, round: true, size: 24, class: 'implement-option-icon' })
      : h(NIcon, { size: 18, color: '#1e6b3f', class: 'implement-option-icon' }, { default: () => h('i', { class: 'fa-solid fa-tractor' }) }),
    h('span', { class: 'implement-option-name' }, implement.name),
  ])
}

function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatPriceDisplay(price: string): string {
  if (!price) return '۰'
  const num = parseInt(price, 10)
  return Number.isNaN(num) ? price : formatPrice(num)
}

async function fetchProviderImplements() {
  loadingList.value = true
  try {
    const { data } = await api.get<{ result: ProviderImplementItem[] }>('/users/provider/implement')
    providerImplements.value = data?.result ?? []
  } catch {
    message.error('خطا در دریافت لیست خدمات')
    providerImplements.value = []
  } finally {
    loadingList.value = false
  }
}

function onDeleteItem(_item: ProviderImplementItem) {
  // فعلاً بدون عملیات
}

function onEditItem(_item: ProviderImplementItem) {
  // فعلاً بدون عملیات
}

function parsePrice(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/,/g, '')
  const parsed = Number(cleaned)
  return isNaN(parsed) ? null : parsed
}

async function fetchCategories() {
  loadingCategories.value = true
  try {
    const { data } = await api.get<{ result: Category[] }>('/public/implements/categories')
    const list = data?.result ?? []
    list.sort((a, b) => a.num - b.num)
    categories.value = list
    categoryOptions.value = list.map(c => ({ label: c.name, value: c.id }))
  } catch {
    message.error('خطا در دریافت دسته‌بندی‌ها')
  } finally {
    loadingCategories.value = false
  }
}

async function fetchImplements(categoryId: number) {
  loadingImplements.value = true
  try {
    const { data } = await api.get<{ result: Implement[] }>(`/public/implements/implements?category=${categoryId}`)
    implementsList.value = data?.result ?? []
  } catch {
    message.error('خطا در دریافت خدمات')
    implementsList.value = []
  } finally {
    loadingImplements.value = false
  }
}

function onCategoryChange(categoryId: number | null) {
  form.value.implementId = null
  form.value.price = null
  implementsList.value = []
  if (categoryId) fetchImplements(categoryId)
}

function onImplementChange() {
  form.value.price = null
}

function openAddModal() {
  showAddModal.value = true
}

function onAddModalEnter() {
  fetchCategories()
  form.value = { categoryId: null, implementId: null, price: null }
}

onMounted(fetchProviderImplements)

async function submitAddImplement() {
  if (!canSubmit.value) return
  submitLoading.value = true
  try {
    await api.post('/users/provider/implement', {
      implement_id: String(form.value.implementId),
      price: String(form.value.price),
    })
    message.success('خدمت جدید با موفقیت اضافه شد')
    showAddModal.value = false
    form.value = { categoryId: null, implementId: null, price: null }
    await fetchProviderImplements()
  } catch {
    message.error('افزودن خدمت انجام نشد. دوباره تلاش کنید.')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.my-services-page {
  min-height: calc(100vh - 140px);
  padding-bottom: 5rem;
}

.my-services-space {
  padding: 0.65rem;
  padding-top: 1.25rem;
}

.page-title {
  font-size: 1rem;
  font-weight: 700;
  display: block;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  padding: 2rem 1.5rem;
  gap: 1rem;
}

.empty-icon {
  opacity: 0.7;
}

.empty-text {
  font-size: 1rem;
  text-align: center;
  max-width: 280px;
}

.list-space {
  padding: 0 0.65rem 1rem;
}

.implement-card {
  background-color: rgba(30, 107, 63, 0.05);
  border-color: rgba(30, 107, 63, 0.12);
}

.implement-card-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.implement-card-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.implement-card-image {
  flex-shrink: 0;
}

.implement-card-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background-color: rgba(30, 107, 63, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.implement-card-icon {
  font-size: 1.5rem;
  color: #1e6b3f;
}

.implement-card-info {
  flex: 1;
  min-width: 0;
}

.implement-name {
  font-size: 1rem;
  display: block;
  margin-bottom: 0.35rem;
}

.implement-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.implement-price {
  font-size: 1.0625rem;
}

.implement-price-suffix,
.implement-price-type {
  font-size: 0.75rem;
}

.implement-card-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 0.75rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.15s;
  font-size: 0.875rem;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn--edit {
  background-color: rgba(24, 160, 88, 0.1);
  color: #18a058;
}

.action-btn--edit:hover {
  background-color: rgba(24, 160, 88, 0.18);
}

.action-btn--delete {
  background-color: rgba(208, 48, 80, 0.08);
  color: #d03050;
}

.action-btn--delete:hover {
  background-color: rgba(208, 48, 80, 0.15);
}

.add-button-wrapper {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 428px;
  padding: 0 1rem 0.5rem;
  z-index: 100;
}

.add-button {
  width: 100%;
}

.add-button-icon {
  margin-left: 0.5rem;
}

.add-modal-title {
  color: #1e6b3f;
  font-size: 1.125rem;
}

.add-modal-body {
  padding: 0.25rem 0;
}

.implement-option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.implement-option-icon {
  flex-shrink: 0;
}

.implement-option-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.implement-tag.implement-option-label {
  gap: 0.375rem;
}

.form-label {
  font-size: 0.9375rem;
}

.price-type-hint {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.85;
}

.price-input {
  width: 100%;
}
</style>
