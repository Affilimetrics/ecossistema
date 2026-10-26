// src/components/products/ProductFormModal.tsx

import React, { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, ShoppingBag } from "lucide-react";
import {
  Product,
  PlatformType,
  CreateProductInput,
} from "../../../services/productApi";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  initialData?: Product | null;
}

const PLATFORM_OPTIONS: { value: PlatformType; label: string }[] = [
  { value: "shopee", label: "Shopee" },
  { value: "mercadolivre", label: "Mercado Livre" },
  { value: "amazon", label: "Amazon" },
  { value: "magalu", label: "Magalu" },
  { value: "outros", label: "Outros / Própria" },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateProductInput>({
    name: "",
    platform: "shopee",
    affiliate_link: "",
    original_url: "",
    price: undefined,
    category: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        platform: initialData.platform,
        affiliate_link: initialData.affiliate_link || "",
        original_url: initialData.original_url || "",
        price: initialData.price,
        category: initialData.category || "",
        image_url: initialData.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        platform: "shopee",
        affiliate_link: "",
        original_url: "",
        price: undefined,
        category: "",
        image_url: "",
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("O nome do produto é obrigatório.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Não foi possível salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {initialData ? "Editar Produto" : "Cadastrar Produto Manualmente"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Produto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fone de Ouvido Bluetooth JBL"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plataforma
              </label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value as PlatformType })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preço Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price !== undefined ? formData.price : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Link de Afiliado
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.affiliate_link}
              onChange={(e) =>
                setFormData({ ...formData, affiliate_link: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <input
              type="text"
              placeholder="Ex: Eletrônicos"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL da Imagem
            </label>
            <input
              type="url"
              placeholder="https://imagem.com/produto.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {initialData ? "Salvar Alterações" : "Cadastrar Produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};