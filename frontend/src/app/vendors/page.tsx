"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchVendors, createVendor, addVendorReview, deleteVendor,
  VendorItem, ReviewItem,
} from "@/lib/api";
import {
  Users, Plus, Star, Phone, MessageSquare, Search, X, Trash2,
  ChevronDown, ChevronUp, ShieldCheck, Check, AlertCircle, Wrench,
  Zap, HeartPulse, Hammer, Paintbrush, Sparkles, MessageCircle,
} from "lucide-react";

const VENDOR_CATEGORIES = [
  "All",
  "Electrician",
  "Plumber",
  "Doctor / Emergency",
  "Carpenter",
  "Painter",
  "Appliance Repair",
  "Vendor",
  "Other",
];

const CATEGORY_ICONS: Record<string, any> = {
  Electrician: Zap,
  Plumber: Wrench,
  "Doctor / Emergency": HeartPulse,
  Carpenter: Hammer,
  Painter: Paintbrush,
  "Appliance Repair": Wrench,
  Vendor: Users,
  Other: Wrench,
};

export default function VendorsPage() {
  const { user, isAdmin } = useAuth();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  // Create vendor modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Electrician");
  const [newPhone, setNewPhone] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Review modal
  const [reviewVendor, setReviewVendor] = useState<VendorItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadVendors = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchVendors(
        categoryFilter !== "All" ? categoryFilter : undefined,
        searchQuery || undefined
      );
      setVendors(data);
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, searchQuery]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createVendor({
        name: newName,
        category: newCategory,
        phone_number: newPhone,
        whatsapp_number: newWhatsapp || undefined,
        notes: newNotes || undefined,
      });
      setShowCreate(false);
      setNewName(""); setNewPhone(""); setNewWhatsapp(""); setNewNotes("");
      showFeedback("success", "Vendor added to directory!");
      await loadVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewVendor) return;
    setSubmittingReview(true);
    try {
      await addVendorReview(reviewVendor.id, {
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setReviewVendor(null);
      setReviewRating(5);
      setReviewComment("");
      showFeedback("success", "Review submitted! Thank you for helping neighbors.");
      await loadVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to remove this vendor?")) return;
    try {
      await deleteVendor(id);
      showFeedback("success", "Vendor removed!");
      await loadVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to view vendor directory</h2>
          <p className="text-sm text-slate-500">Access verified society electricians, plumbers, and emergency contacts</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verified Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Community-rated electricians, plumbers, emergency contacts, and trusted contractors
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm transition-all ${
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          {feedback.text}
        </div>
      )}

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`tab-pill whitespace-nowrap ${
                categoryFilter === cat ? "tab-pill-active" : "tab-pill-inactive"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, skill..."
            className="form-input pl-9 text-xs py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No vendors found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? "Try searching for a different keyword or category" : "Add the first trusted vendor for society residents!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => {
            const isExpanded = expandedVendor === vendor.id;
            const CategoryIcon = CATEGORY_ICONS[vendor.category] || Wrench;

            return (
              <div key={vendor.id} className="card p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <CategoryIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{vendor.name}</h3>
                        <span className="badge bg-slate-100 text-slate-700 text-[10px] mt-0.5">
                          {vendor.category}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Remove vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {vendor.notes && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                      {vendor.notes}
                    </p>
                  )}

                  {/* Rating Stars & Count */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {vendor.average_rating > 0 ? vendor.average_rating.toFixed(1) : "New"}
                      </span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      {vendor.total_reviews} review{vendor.total_reviews !== 1 ? "s" : ""}
                    </button>
                  </div>

                  {/* Expanded Reviews Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 max-h-[160px] overflow-y-auto">
                      {vendor.reviews && vendor.reviews.length > 0 ? (
                        vendor.reviews.map((rev) => (
                          <div key={rev.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{rev.user_name || "Resident"}</span>
                              <div className="flex items-center text-amber-500">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span className="font-mono ml-0.5 text-[11px]">{rev.rating}</span>
                              </div>
                            </div>
                            {rev.comment && <p className="text-slate-500 mt-1 text-[11px]">{rev.comment}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 text-center py-2">No written reviews yet.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons: Call, WhatsApp, Add Review */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                  {vendor.phone_number ? (
                    <a
                      href={`tel:${vendor.phone_number}`}
                      className="btn-secondary text-xs py-2 px-2 flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      Call
                    </a>
                  ) : (
                    <div />
                  )}

                  {vendor.whatsapp_number ? (
                    <a
                      href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs py-2 px-2 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp
                    </a>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={() => {
                      setReviewVendor(vendor);
                      setReviewRating(5);
                      setReviewComment("");
                    }}
                    className="btn-ghost text-xs py-2 px-2 flex items-center justify-center gap-1 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    Rate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Review Modal */}
      {reviewVendor && (
        <div className="modal-backdrop" onClick={() => setReviewVendor(null)}>
          <div className="modal-content p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Rate & Review</h2>
                <p className="text-xs text-slate-500 mt-0.5">Share your experience with {reviewVendor.name}</p>
              </div>
              <button onClick={() => setReviewVendor(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="form-label">Rating *</label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Comments / Feedback</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Prompt service, fixed the leak within 30 minutes. Recommended!"
                  className="form-input min-h-[90px] resize-y text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReviewVendor(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submittingReview} className="btn-primary flex-1">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vendor Modal (Admin) */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Society Vendor</h2>
                <p className="text-xs text-slate-500 mt-0.5">Register a trusted service partner for residents</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="form-label">Vendor / Person Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rajesh Electricals"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Service Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input"
                >
                  {VENDOR_CATEGORIES.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9876543210"
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    placeholder="9876543210"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Notes / Services Provided</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Available 24x7 for emergency fuse and wiring repair..."
                  className="form-input min-h-[80px] resize-y"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? "Adding..." : "Add Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
