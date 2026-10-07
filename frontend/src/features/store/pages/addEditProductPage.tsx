import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  X,
  ChevronDown,
  Save,
  Loader2,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useProductStore } from "../state/productState";
import { getApiErrorMessage as getErrorMessage } from "../../../api/apiError";
import type { ProductFormValues } from "../productsApi";

const UNITS = ["unit", "kg", "g", "litre", "ml", "pack", "dozen"];

const initialState: ProductFormValues = {
  productName: "",
  description: "",
  categoryId: "",
  price: "",
  stockQuantity: "",
  unit: "unit",
  availabilityStatus: "AVAILABLE",
};

type Errors = Partial<Record<keyof ProductFormValues, string>>;

type ImageSlot = { kind: "existing"; url: string } | { kind: "new"; file: File; previewUrl: string };

/* -------------------------------------------------------------------------- */
/*  Image dropzone — supports multiple images, mixed existing + new           */
/* -------------------------------------------------------------------------- */

function ImageUploader({
  slots,
  onAdd,
  onRemove,
}: {
  slots: ImageSlot[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const onDrop = useCallback((accepted: File[]) => onAdd(accepted), [onAdd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [] },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragActive
            ? "border-[#1F4D3D] bg-[#E7EFEA]"
            : "border-[#E3E7E1] hover:border-[#1F4D3D] hover:bg-[#F5F7F3]"
        }`}
      >
        <input {...getInputProps()} />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7EFEA] text-[#1F4D3D]">
          <UploadCloud size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[#16241D]">Upload product images</p>
          <p className="mt-1 text-xs text-[#6E7C74]">Drag and drop or click to browse files</p>
        </div>
        <span className="rounded-full bg-[#F5F7F3] px-3 py-1 text-[11px] font-medium text-[#6E7C74]">
          PNG, JPG up to 10MB · multiple allowed
        </span>
      </div>

      {slots.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {slots.map((slot, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-[#E3E7E1]">
              <img
                src={slot.kind === "existing" ? slot.url : slot.previewUrl}
                className="h-full w-full object-cover"
                alt=""
              />
              <button
                onClick={() => onRemove(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
              >
                <X size={11} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-[#1F4D3D] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LivePreview({
  form,
  categoryName,
  imagePreview,
}: {
  form: ProductFormValues;
  categoryName: string;
  imagePreview?: string;
}) {
  const inStock = form.availabilityStatus === "AVAILABLE" && Number(form.stockQuantity || 0) > 0;

  return (
    <div className="rounded-2xl bg-[#E7EFEA]/60 p-4 border border-[#E3E7E1]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">Live preview</span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${inStock ? "text-emerald-700" : "text-rose-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-600" : "bg-rose-600"}`} />
          {inStock ? "In Stock" : "Unavailable"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-[#E3E7E1]">
        <div className="relative aspect-square w-full bg-[#F5F7F3]">
          {imagePreview ? (
            <img src={imagePreview} className="h-full w-full object-cover" alt="" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#9BAAA1]">
              <ImageIcon size={28} />
              <span className="text-xs">No image yet</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1F4D3D]">{categoryName || "Category"}</p>
          <div className="mt-1 flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-[#16241D]">{form.productName || "Product name"}</h3>
            <span className="shrink-0 text-lg font-bold text-[#16241D]">
              {form.price ? `₹${Number(form.price).toFixed(2)}` : "₹0.00"}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-[#6E7C74]">
            {form.description || "Product description will appear here…"}
          </p>
          <button disabled className="mt-4 w-full rounded-full bg-[#1F4D3D] py-3 text-sm font-semibold text-white opacity-70">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AddEditProductPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const categories = useProductStore((s) => s.categories);
  const fetchCategories = useProductStore((s) => s.fetchCategories);
  const fetchProductById = useProductStore((s) => s.fetchProductById);
  const createProduct = useProductStore((s) => s.createProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);

  const [form, setForm] = useState<ProductFormValues>(initialState);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;

    let cancelled = false;

    const loadProduct = async () => {
      setLoadingProduct(true);
      setLoadError(null);

      try {
        const product = await fetchProductById(id);
        if (cancelled) return;

        setForm({
          productName: product.productName,
          description: product.description || "",
          categoryId: typeof product.categoryId === "string" ? product.categoryId : product.categoryId._id,
          price: String(product.price),
          stockQuantity: String(product.stockQuantity),
          unit: product.unit,
          availabilityStatus: product.availabilityStatus,
        });
        setImageSlots(product.images.map((url) => ({ kind: "existing", url })));
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Couldn't load this product."));
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, fetchProductById]);

  useEffect(() => {
    return () => {
      imageSlots.forEach((s) => {
        if (s.kind === "new") URL.revokeObjectURL(s.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleAddImages = (files: File[]) => {
    const newSlots: ImageSlot[] = files.map((file) => ({
      kind: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImageSlots((prev) => [...prev, ...newSlots]);
  };

  const handleRemoveImage = (index: number) => {
    setImageSlots((prev) => {
      const target = prev[index];
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.productName.trim()) next.productName = "Product name is required.";
    if (!form.categoryId) next.categoryId = "Choose a category.";
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price.";
    if (form.stockQuantity === "" || Number(form.stockQuantity) < 0)
      next.stockQuantity = "Enter a valid stock count.";
    if (!form.unit) next.unit = "Select a unit.";
    if (!isEditMode && imageSlots.length === 0) next.productName = next.productName || undefined;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    if (!isEditMode && imageSlots.length === 0) {
      setLoadError("Add at least one product image.");
      return;
    }

    setSaving(true);
    setLoadError(null);
    try {
      const newFiles = imageSlots.filter((s) => s.kind === "new").map((s) => s.file);

      if (isEditMode && id) {
        const keptUrls = imageSlots.filter((s) => s.kind === "existing").map((s) => s.url);
        await updateProduct(id, form, newFiles, keptUrls);
      } else {
        await createProduct(form, newFiles);
      }

      setSaved(true);
      setTimeout(() => navigate("/store/products"), 900);
    } catch (err: unknown) {
      setLoadError(getErrorMessage(err, "Couldn't save this product. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const categoryName = categories.find((c) => c._id === form.categoryId)?.categoryName ?? "";
  const firstPreview = imageSlots[0] ? (imageSlots[0].kind === "existing" ? imageSlots[0].url : imageSlots[0].previewUrl) : undefined;

  if (loadingProduct) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-[#1F4D3D]" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-[#F7F8F5]">
      <button
        onClick={() => navigate("/store/products")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#6E7C74] hover:text-[#16241D] cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to products
      </button>

      <h1 className="mb-6 text-lg font-semibold text-[#16241D]">
        {isEditMode ? "Edit product" : "Add new product"}
      </h1>

      {loadError && (
        <div className="mb-5 rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-600/15">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Form card */}
        <div className="rounded-2xl border border-[#E3E7E1] bg-white p-4 sm:p-7 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-[#16241D]">Product details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Field label="Product name" error={errors.productName} className="sm:col-span-2">
              <input
                value={form.productName}
                onChange={(e) => update("productName", e.target.value)}
                placeholder="e.g. Fresh Avocado"
                className={inputClass(!!errors.productName)}
              />
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ripe Hass avocado, perfect for toast or guacamole…"
                rows={3}
                className={`${inputClass(false)} resize-none`}
              />
            </Field>

            <Field label="Category" error={errors.categoryId}>
              <div className="relative">
                <select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  className={`${inputClass(!!errors.categoryId)} appearance-none pr-9`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C74]" />
              </div>
            </Field>

            <Field label="Price (₹)" error={errors.price}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E7C74]">₹</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass(!!errors.price)} pl-7`}
                />
              </div>
            </Field>

            <Field label="Stock count" error={errors.stockQuantity}>
              <input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => update("stockQuantity", e.target.value)}
                placeholder="50"
                className={inputClass(!!errors.stockQuantity)}
              />
            </Field>

            <Field label="Unit" error={errors.unit}>
              <div className="relative">
                <select
                  value={form.unit}
                  onChange={(e) => update("unit", e.target.value)}
                  className={`${inputClass(!!errors.unit)} appearance-none pr-9`}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C74]" />
              </div>
            </Field>

            <Field label="Visibility" className="sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#E3E7E1] px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      update("availabilityStatus", form.availabilityStatus === "AVAILABLE" ? "HIDDEN" : "AVAILABLE")
                    }
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                      form.availabilityStatus === "AVAILABLE" ? "bg-[#1F4D3D]" : "bg-[#F5F7F3] border border-[#E3E7E1]"
                    }`}
                  >
                    <motion.span
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                      animate={{ left: form.availabilityStatus === "AVAILABLE" ? 18 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    />
                  </button>
                  <span className="text-sm font-semibold text-[#16241D]">Available for sale</span>
                </div>
                <span className="text-xs text-[#6E7C74] sm:ml-auto">
                  Turn off to hide this product from customers without deleting it
                </span>
              </div>
            </Field>
          </div>

          <div className="mt-7 border-t border-[#E3E7E1] pt-6">
            <h2 className="mb-4 text-sm font-semibold text-[#16241D]">Product images</h2>
            <ImageUploader slots={imageSlots} onAdd={handleAddImages} onRemove={handleRemoveImage} />
          </div>

          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 border-t border-[#E3E7E1] pt-6">
            <button
              onClick={() => navigate("/store/products")}
              className="w-full sm:w-auto rounded-full border border-[#E3E7E1] px-5 py-2.5 text-sm font-semibold text-[#1F4D3D] hover:bg-[#F5F7F3] transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#A9CC3B] hover:bg-[#98B933] active:bg-[#87A62C] px-6 py-2.5 text-sm font-bold text-[#16241D] shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving…" : isEditMode ? "Save changes" : "Save product"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <LivePreview form={form} categoryName={categoryName} imagePreview={firstPreview} />
        </div>
      </div>

      {/* Save toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-8 rounded-xl bg-[#16241D] px-5 py-3.5 text-sm font-medium text-white shadow-lg"
          >
            {isEditMode ? "Product updated successfully." : "Product saved successfully."}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small form helpers                                                       */
/* -------------------------------------------------------------------------- */

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#16241D] placeholder:text-[#9BAAA1] focus:outline-none focus:ring-2 ${
    hasError ? "border-rose-300 focus:ring-rose-200" : "border-[#E3E7E1] focus:border-[#1F4D3D] focus:ring-[#1F4D3D]/20"
  }`;
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6E7C74]">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}