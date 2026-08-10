export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  fee_per_person: number;
  upi_qr_url?: string;
  rsvps_count: number;
  total_attendees: number;
  total_collected: number;
  rsvps?: RSVPItem[];
}

export interface RSVPItem {
  id: string;
  event_id: string;
  member_name: string;
  flat_number: string;
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
}

export interface VendorItem {
  id: string;
  category: string;
  name: string;
  phone_number: string;
  whatsapp_number?: string;
  notes?: string;
  average_rating: number;
  total_reviews: number;
  reviews?: { id: string; user_name: string; flat_number: string; rating: number; comment?: string; created_at: string }[];
}

export interface MeetingItem {
  id: string;
  title: string;
  meeting_date: string;
  meeting_type: string;
  raw_transcript: string;
  structured_summary?: {
    meeting_title: string;
    meeting_date: string;
    meeting_type: string;
    executive_summary: string;
    resolutions: { id: string; title: string; description: string; status: string; vote_summary: string }[];
    budget_approvals: { id: string; expense_category: string; vendor_or_contractor: string; approved_amount: number; notes?: string }[];
    action_items: { id: string; task: string; assigned_to: string; target_date: string; priority: string }[];
    general_notes: string[];
  };
  is_published: "draft" | "published";
}
