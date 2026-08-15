"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchVendors, createVendor, addVendorReview, deleteVendor,
  VendorItem, ReviewItem,
} from "@/lib/api";
import {
  Users, Plus, Star, Phone, MessageCircle, Search, X, Trash2,
  ChevronDown, ChevronUp, MapPin,
} from "lucide-react";

const VENDOR_CATEGORIES = ["All", "Electrician", "Plumber", "Doctor / Emergency", "Carpenter", "Painter", "Appliance Repair", "Vendor", "Other"];

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
        name: newName, category: newCategory, phone_number: newPhone,
        whatsapp_number: newWhatsapp || undefined, notes: newNotes || undefined,
      });
      setShowCreate(false);
      setNewName(""); setNewPhone(""); setNewWhatsapp(""); setNewNotes("");
      showFeedback("success", "Vendor added!");
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
      await addVendorReview(reviewVendor.id, { rating: reviewRating, comment: reviewComment || undefined });
      setReviewVendor(null); setReviewRating(5); setReviewComment("");
      showFeedback("success", "Review submitted!");
      await loadVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await deleteVendor(id);
      showFeedback("success", "Vendor removed");
      await loadVendors();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (n: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => interactive && onSelect && onSelect(n)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-4 h-4 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to view the directory</h2>
          <p className="text-sm text-slate-500">Trusted local service providers rated by residents</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Trusted local service providers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors..."
            className="form-input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No vendors found</h3>
          <p className="text-sm text-slate-500">
            {searchQuery || categoryFilter !== "All" ? "Try adjusting your filters." : "Add the first vendor to the directory!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((vendor) => {
            const isExpanded = expandedVendor === vendor.id;
            return (
              <div key={vendor.id} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-sm font-bold text-emerald-700">
                      {vendor.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{vendor.name}</h3>
                          <span className="inline-block mt-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {vendor.category}
                          </span>
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDeleteVendor(vendor.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mt-2">
                        {renderStars(Math.round(vendor.average_rating))}
                        <span className="text-xs font-semibold text-slate-600">{vendor.average_rating.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({vendor.total_reviews} review{vendor.total_reviews !== 1 ? "s" : ""})</span>
                      </div>

                      {vendor.notes && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{vendor.notes}</p>
                      )}

                      {/* Contact buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <a href={`tel:${vendor.phone_number}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-all">
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                        {vendor.whatsapp_number && (
                          <a
                            href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => { setReviewVendor(vendor); setReviewRating(5); setReviewComment(""); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-all"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Toggle reviews */}
                  {vendor.total_reviews > 0 && (
                    <button
                      onClick={() => setExpandedVendor(isExpanded ? null : vendor.id)}
                      className="mt-3 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide" : "Show"} {vendor.total_reviews} review{vendor.total_reviews !== 1 ? "s" : ""}
                    </button>
                  )}
                </div>

                {/* Reviews section */}
                {isExpanded && vendor.reviews && vendor.reviews.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-2.5">
                    {vendor.reviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{rev.user_name}</span>
                            <span className="text-xs text-slate-400">{rev.flat_number}</span>
                          </div>
                          {renderStars(rev.rating)}
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-slate-600 mt-1.5">{rev.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add New Vendor</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="form-label">Vendor / Worker Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ramesh Sharma" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="form-input">
                  {VENDOR_CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+919820123456" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">WhatsApp</label>
                  <input type="text" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} placeholder="+919820123456" className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Notes / Specialization</label>
                <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Expert with MCB trips, inverter wiring..." className="form-input min-h-[70px] resize-y" />
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

      {/* Add Review Modal */}
      {reviewVendor && (
        <div className="modal-backdrop" onClick={() => setReviewVendor(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Rate & Review</h2>
              <button onClick={() => setReviewVendor(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl mb-5">
              <p className="text-sm font-bold text-slate-800">{reviewVendor.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{reviewVendor.category} • Current rating: {reviewVendor.average_rating.toFixed(1)}★</p>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div>
                <label className="form-label">Your Rating</label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      className="p-1"
                    >
                      <Star className={`w-7 h-7 transition-all ${n <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-300 hover:text-amber-200"}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-slate-600">{reviewRating}/5</span>
                </div>
              </div>
              <div>
                <label className="form-label">Comment (optional)</label>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience..." className="form-input min-h-[80px] resize-y" />
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
    </AppShell>
  );
}
