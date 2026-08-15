// ─────────────────────────────────────────────────────────────
// ResidentHub V1 — Full API Client
// ─────────────────────────────────────────────────────────────

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Types ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  flat_number: string;
  phone_number?: string;
  residency_type?: "Owner" | "Renter";
  role: "admin" | "member";
  society_id?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  fee_per_person: number;
  fee_adult: number;
  fee_child: number;
  fee_senior: number;
  upi_qr_url?: string;
  society_id?: string;
  created_by?: string;
  created_at?: string;
  rsvps_count: number;
  total_attendees: number;
  total_adults: number;
  total_children: number;
  total_seniors: number;
  total_collected: number;
  total_expenses: number;
  net_balance: number;
  rsvps?: RSVPItem[];
  expenses?: EventExpenseItem[];
}

export interface EventExpenseItem {
  id: string;
  event_id: string;
  category: string;
  title: string;
  vendor_name?: string;
  amount: number;
  invoice_ref?: string;
  expense_date: string;
  logged_by?: string;
  created_at: string;
}

export interface RSVPItem {
  id: string;
  event_id: string;
  user_id: string;
  member_name: string;
  flat_number: string;
  adults_count: number;
  children_count: number;
  seniors_count: number;
  attendees_count: number;
  total_amount: number;
  utr_number?: string;
  payment_proof_url?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface LedgerSummaryData {
  total_income: number;
  total_expense: number;
  current_balance: number;
  monthly_breakdown: { month: string; income: number; expense: number; net: number }[];
  category_breakdown: { category: string; amount: number }[];
}

export interface LedgerItem {
  id: string;
  transaction_type: "income" | "expense";
  category: string;
  amount: number;
  transaction_date: string;
  description: string;
  receipt_url?: string;
  society_id?: string;
  logged_by?: string;
  created_at?: string;
}

export interface ParsedBankTransaction {
  temp_id: string;
  transaction_date: string;
  transaction_type: "income" | "expense";
  amount: number;
  raw_narration: string;
  utr_number?: string;
  category: string;
  description: string;
  matched_event_id?: string;
  matched_event_title?: string;
  matched_rsvp_id?: string;
  matched_entity_info?: string;
  match_confidence: "high" | "medium" | "low" | "none";
  match_type?: "rsvp" | "event_expense" | "vendor" | "maintenance" | "general";
  auto_approve_rsvp: boolean;
  selected: boolean;
}

export interface StatementParseResponse {
  total_detected: number;
  total_income: number;
  total_expense: number;
  total_rsvps_matched: number;
  transactions: ParsedBankTransaction[];
}

export interface StatementCommitResponse {
  ledger_entries_created: number;
  rsvps_approved: number;
  total_income_added: number;
  total_expense_added: number;
  detail: string;
}

export interface VendorItem {
  id: string;
  category: string;
  name: string;
  phone_number: string;
  whatsapp_number?: string;
  notes?: string;
  society_id?: string;
  created_at?: string;
  average_rating: number;
  total_reviews: number;
  reviews?: ReviewItem[];
}

export interface ReviewItem {
  id: string;
  provider_id: string;
  user_id: string;
  user_name: string;
  flat_number: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// ── Token Management ─────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("residenthub_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("residenthub_token", token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("residenthub_token");
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Auth API ─────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  full_name: string;
  flat_number: string;
  phone_number?: string;
  residency_type?: "Owner" | "Renter";
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Session expired");
  return res.json();
}

// ── Events API ───────────────────────────────────────────────

export async function fetchEvents(): Promise<EventItem[]> {
  const res = await fetch(`${API_BASE_URL}/events/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent(payload: {
  title: string;
  description?: string;
  event_date: string;
  venue?: string;
  fee_per_person?: number;
  fee_adult?: number;
  fee_child?: number;
  fee_senior?: number;
  upi_qr_url?: string;
}): Promise<EventItem> {
  const res = await fetch(`${API_BASE_URL}/events/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create event");
  }
  return res.json();
}

export async function updateEvent(
  eventId: string,
  payload: Partial<{
    title: string;
    description: string;
    event_date: string;
    venue: string;
    fee_per_person: number;
    fee_adult: number;
    fee_child: number;
    fee_senior: number;
    upi_qr_url: string;
  }>
): Promise<EventItem> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update event");
  }
  return res.json();
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

export async function submitRSVP(
  eventId: string,
  payload: {
    member_name: string;
    flat_number: string;
    adults_count: number;
    children_count: number;
    seniors_count: number;
    total_amount: number;
    utr_number?: string;
    payment_proof_url?: string;
  }
): Promise<RSVPItem> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to submit RSVP");
  }
  return res.json();
}

export async function updateRSVPStatus(rsvpId: string, status: string): Promise<RSVPItem> {
  const res = await fetch(`${API_BASE_URL}/events/rsvp/${rsvpId}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update RSVP");
  }
  return res.json();
}

export async function fetchEventExpenses(eventId: string): Promise<EventExpenseItem[]> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/expenses`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch event expenses");
  return res.json();
}

export async function createEventExpense(
  eventId: string,
  payload: {
    category: string;
    title: string;
    vendor_name?: string;
    amount: number;
    invoice_ref?: string;
    expense_date?: string;
  }
): Promise<EventExpenseItem> {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/expenses`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add event expense");
  }
  return res.json();
}

export async function deleteEventExpense(expenseId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/events/expenses/${expenseId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete event expense");
}

export function getCSVExportUrl(eventId: string): string {
  return `${API_BASE_URL}/events/${eventId}/export-csv`;
}

// ── Ledger API ───────────────────────────────────────────────

export async function fetchLedger(): Promise<LedgerItem[]> {
  const res = await fetch(`${API_BASE_URL}/ledger/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch ledger");
  return res.json();
}

export async function fetchLedgerSummary(): Promise<LedgerSummaryData> {
  const res = await fetch(`${API_BASE_URL}/ledger/summary`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch ledger summary");
  return res.json();
}

export async function createLedgerEntry(payload: {
  transaction_type: string;
  category: string;
  amount: number;
  transaction_date: string;
  description?: string;
  receipt_url?: string;
}): Promise<LedgerItem> {
  const res = await fetch(`${API_BASE_URL}/ledger/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create ledger entry");
  }
  return res.json();
}

export async function deleteLedgerEntry(entryId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/ledger/${entryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete ledger entry");
}

export async function parseStatementText(statementText: string): Promise<StatementParseResponse> {
  const res = await fetch(`${API_BASE_URL}/ledger/parse-statement`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ statement_text: statementText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to parse bank statement");
  }
  return res.json();
}

export async function parseStatementFile(file: File): Promise<StatementParseResponse> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/ledger/parse-statement-file`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload and parse statement file");
  }
  return res.json();
}

export async function commitStatementTransactions(transactions: {
  transaction_date: string;
  transaction_type: string;
  amount: number;
  category: string;
  description: string;
  utr_number?: string;
  matched_rsvp_id?: string;
  matched_event_id?: string;
  auto_approve_rsvp?: boolean;
}[]): Promise<StatementCommitResponse> {
  const res = await fetch(`${API_BASE_URL}/ledger/commit-statement`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ transactions }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to commit statement transactions");
  }
  return res.json();
}

// ── Vendors API ──────────────────────────────────────────────

export async function fetchVendors(category?: string, search?: string): Promise<VendorItem[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (search) params.set("search", search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/vendors/${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function createVendor(payload: {
  category: string;
  name: string;
  phone_number: string;
  whatsapp_number?: string;
  notes?: string;
}): Promise<VendorItem> {
  const res = await fetch(`${API_BASE_URL}/vendors/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add vendor");
  }
  return res.json();
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete vendor");
}

export async function addVendorReview(
  vendorId: string,
  payload: { rating: number; comment?: string }
): Promise<ReviewItem> {
  const res = await fetch(`${API_BASE_URL}/vendors/${vendorId}/reviews`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add review");
  }
  return res.json();
}

// ── Analytics Interfaces & API ────────────────────────────────

export interface AnalyticsOverviewData {
  financials: {
    total_income: number;
    total_expense: number;
    reserve_fund: number;
    savings_rate: number;
    monthly_cashflow: Array<{
      month: string;
      income: number;
      expense: number;
      net: number;
    }>;
    category_outflow: Array<{
      category: string;
      amount: number;
      percentage: number;
      color: string;
    }>;
  };
  events: {
    total_events: number;
    total_footfall: number;
    avg_attendance: number;
    total_collection: number;
    total_expense: number;
    net_pnl: number;
    demographics: {
      adults_count: number;
      adults_pct: number;
      children_count: number;
      children_pct: number;
      seniors_count: number;
      seniors_pct: number;
    };
    rsvp_funnel: {
      approved: number;
      pending: number;
      rejected: number;
      total: number;
    };
    performance: Array<{
      id: string;
      title: string;
      date: string;
      venue: string;
      attendees: number;
      adults: number;
      children: number;
      seniors: number;
      collection: number;
      expense: number;
      net_balance: number;
      roi_status: "Surplus" | "Deficit";
    }>;
  };
  community: {
    total_residents: number;
    owners: number;
    owners_pct: number;
    renters: number;
    renters_pct: number;
    participating_flats: number;
    participation_rate: number;
  };
  vendors: {
    total_vendors: number;
    avg_rating: number;
    categories: Array<{
      category: string;
      count: number;
    }>;
    top_vendors: Array<{
      id: string;
      name: string;
      category: string;
      rating: number;
      phone: string;
      reviews_count: number;
    }>;
  };
  insights: Array<{
    type: "positive" | "celebration" | "info" | "engagement";
    title: string;
    desc: string;
  }>;
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverviewData> {
  const res = await fetch(`${API_BASE_URL}/analytics/overview/`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch society analytics");
  }
  return res.json();
}

// ── Notice Board API ───────────────────────────────────────────

export interface NoticeItem {
  id: string;
  society_id?: string | null;
  title: string;
  content: string;
  category: "General" | "Maintenance" | "Security" | "Festival" | "Emergency" | "Financial" | string;
  priority: "normal" | "high" | "urgent" | string;
  author_name: string;
  created_by?: string | null;
  created_at: string;
}

export async function fetchNotices(): Promise<NoticeItem[]> {
  const res = await fetch(`${API_BASE_URL}/notices/`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch society notices");
  }
  return res.json();
}

export async function createNotice(payload: {
  title: string;
  content: string;
  category?: string;
  priority?: string;
  author_name?: string;
}): Promise<NoticeItem> {
  const res = await fetch(`${API_BASE_URL}/notices/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to post society notice");
  }
  return res.json();
}

export async function deleteNotice(noticeId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete notice");
  }
}

// ── Committee & Leadership API ─────────────────────────────────

export interface CommitteeMemberItem {
  id: string;
  society_id?: string | null;
  name: string;
  role: string;
  flat_number: string;
  photo_url?: string | null;
  badge: string;
  applaud_count: number;
  display_order: number;
  created_at: string;
}

export async function fetchCommitteeMembers(): Promise<CommitteeMemberItem[]> {
  const res = await fetch(`${API_BASE_URL}/committee/`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch committee members");
  }
  return res.json();
}

export async function createCommitteeMember(payload: {
  name: string;
  role: string;
  flat_number: string;
  photo_url?: string;
  badge?: string;
  display_order?: number;
}): Promise<CommitteeMemberItem> {
  const res = await fetch(`${API_BASE_URL}/committee/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create committee member record");
  }
  return res.json();
}

export async function updateCommitteeMember(
  memberId: string,
  payload: {
    name?: string;
    role?: string;
    flat_number?: string;
    photo_url?: string;
    badge?: string;
    display_order?: number;
  }
): Promise<CommitteeMemberItem> {
  const res = await fetch(`${API_BASE_URL}/committee/${memberId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update committee member record");
  }
  return res.json();
}

export async function deleteCommitteeMember(memberId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/committee/${memberId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete committee member record");
  }
}

export async function applaudCommitteeMember(memberId: string): Promise<{ id: string; applaud_count: number }> {
  const res = await fetch(`${API_BASE_URL}/committee/${memberId}/applaud`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to applaud member");
  }
  return res.json();
}
