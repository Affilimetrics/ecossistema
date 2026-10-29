import { useState, ChangeEvent, DragEvent } from "react";
import {
  Megaphone,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  ScanText,
  Eye,
  Save,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

/* ============================================================
   TIPOS E CONFIGURAÇÕES DE MODERAÇÃO
   ============================================================ */

export type ModerationStatus =
  | "idle"
  | "pending"
  | "analyzing"
  | "approved"
  | "rejected"
  | "needs_review"
  | "not_verified"
  | "error";

export type ModerationCategory =
  | "profanity"
  | "offensive_language"
  | "spam"
  | "sexual_content";

export interface ModerationLayerResult {
  status: ModerationStatus;
  categories: ModerationCategory[];
  explanation: string;
  analyzedAt: string | null;
}

export interface ConsolidatedModeration {
  status: ModerationStatus;
  isApproved: boolean;
  textLayer: ModerationLayerResult;
  ocrLayer: ModerationLayerResult;
  visualLayer: ModerationLayerResult;
}

const MOCK_PRODUCTS = [
  { id: "p-001", name: "iPhone 15 Pro 256GB Titanium", marketplaceName: "Amazon", affiliateUrl: "https://example.com/aff/iphone15" },
  { id: "p-002", name: "MacBook Air M2 13\" 256GB SSD", marketplaceName: "Magazine Luiza", affiliateUrl: "https://example.com/aff/macbook" },
  { id: "p-003", name: "AirPods Pro 2ª Geração USB-C", marketplaceName: "Amazon", affiliateUrl: "https://example.com/aff/airpods" },
];

const STATUS_CONFIG: Record<
  ModerationStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  idle: { label: "Pendente", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: HelpCircle },
  pending: { label: "Aguardando", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: HelpCircle },
  analyzing: { label: "Analisando...", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: Loader2 },
  approved: { label: "Aprovado", bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: XCircle },
  needs_review: { label: "Revisão Necessária", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  not_verified: { label: "Não Verificado", bg: "bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", icon: HelpCircle },
  error: { label: "Erro Técnico", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: AlertTriangle },
};

/* ============================================================
   LÓGICA DE MODERAÇÃO
   ============================================================ */

const createEmptyModeration = (): ConsolidatedModeration => ({
  status: "idle",
  isApproved: false,
  textLayer: { status: "idle", categories: [], explanation: "Aguardando análise de texto.", analyzedAt: null },
  ocrLayer: { status: "idle", categories: [], explanation: "Aguardando leitura da imagem (OCR).", analyzedAt: null },
  visualLayer: { status: "idle", categories: [], explanation: "Aguardando inspeção visual.", analyzedAt: null },
});

async function runLocalModeration(
  title: string,
  caption: string,
  imageFile: File | null
): Promise<ConsolidatedModeration> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const fullText = `${title} ${caption}`.toLowerCase();
  const hasProfanity = /(palavrao|merda|foda|puta|porra|arrombado)/i.test(fullText);
  const hasSpam = /(pix em dobro|ganhe dinheiro facil|urubu do pix|retorno garantido)/i.test(fullText);

  let textLayer: ModerationLayerResult = {
    status: "approved",
    categories: [],
    explanation: "Texto verificado e livre de infrações das políticas do Scallora.",
    analyzedAt: new Date().toISOString(),
  };

  if (hasProfanity || hasSpam) {
    textLayer = {
      status: "rejected",
      categories: hasProfanity ? ["profanity"] : ["spam"],
      explanation: "Linguagem imprópria ou termos associados a fraudes/spam identificados.",
      analyzedAt: new Date().toISOString(),
    };
  }

  const ocrLayer: ModerationLayerResult = imageFile
    ? {
        status: "approved",
        categories: [],
        explanation: "Leitura de texto na imagem concluída sem violações.",
        analyzedAt: new Date().toISOString(),
      }
    : {
        status: "not_verified",
        categories: [],
        explanation: "Nenhuma imagem enviada para execução do OCR.",
        analyzedAt: null,
      };

  const visualLayer: ModerationLayerResult = imageFile
    ? {
        status: "approved",
        categories: [],
        explanation: "Análise visual concluída sem conteúdos explícitos.",
        analyzedAt: new Date().toISOString(),
      }
    : {
        status: "not_verified",
        categories: [],
        explanation: "Nenhuma imagem enviada para análise visual.",
        analyzedAt: null,
      };

  const isRejected = textLayer.status === "rejected" || ocrLayer.status === "rejected" || visualLayer.status === "rejected";
  const consolidatedStatus: ModerationStatus = isRejected ? "rejected" : "approved";

  return {
    status: consolidatedStatus,
    isApproved: consolidatedStatus === "approved",
    textLayer,
    ocrLayer,
    visualLayer,
  };
}

/* ============================================================
   COMPONENTE PRINCIPAL: Central de Divulgação
   ============================================================ */

interface DisclosurePageProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function CentralDivulgacao({ isDark, setIsDark }: DisclosurePageProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [moderation, setModeration] = useState<ConsolidatedModeration>(createEmptyModeration());
  const [toast, setToast] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const invalidateModeration = () => {
    if (moderation.status !== "idle") {
      setModeration(createEmptyModeration());
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      setTitle(product.name);
      setAffiliateUrl(product.affiliateUrl || "");
      invalidateModeration();
    }
  };

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      invalidateModeration();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 5MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    invalidateModeration();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!title.trim() && !caption.trim() && !imageFile && !imagePreview) {
      showToast("Insira o título, legenda ou imagem antes de analisar.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await runLocalModeration(title, caption, imageFile);
      setModeration(result);

      if (result.isApproved) {
        showToast("Conteúdo aprovado em todas as camadas!");
      } else {
        showToast("O conteúdo possui inconformidades e precisa de ajustes.");
      }
    } catch {
      showToast("Falha ao processar análise de moderação.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    showToast("Rascunho salvo com sucesso.");
  };

  const handleCopyMaterial = () => {
    const textToCopy = `${title}\n\n${caption}\n\nLink: ${affiliateUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    showToast("Conteúdo copiado para a área de transferência.");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto">
      {/* CABEÇALHO PADRONIZADO */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Central de Divulgação
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Crie materiais promocionais, execute verificações de conformidade e prepare publicações.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500" />
              Conteúdo da Divulgação
            </h2>

            {/* Produto Vinculado */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Produto do Catálogo (Opcional)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">Selecione um produto cadastrado...</option>
                {MOCK_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.marketplaceName})
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Título da Divulgação *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  invalidateModeration();
                }}
                placeholder="Ex.: Oferta Imperdível! Desconto Exclusivo + Frete Grátis"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Legenda */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Legenda / Texto Promocional *
              </label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  invalidateModeration();
                }}
                placeholder="Escreva os detalhes da promoção, ofertas e chamadas de ação..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            {/* Link de Afiliado */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Link do Produto ou Afiliado
              </label>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Upload de Imagem */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Imagem da Campanha
              </label>
              {imagePreview ? (
                <div className="relative rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950 h-48 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview da imagem" className="h-full object-contain" />
                  <button
                    onClick={() => handleImageChange(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="file-upload"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageChange(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG ou WebP até 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Analisar Moderação
              </button>

              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Salvar Rascunho
              </button>
            </div>
          </div>
        </div>

        {/* PAINEL DE MODERAÇÃO E PRÉ-VISUALIZAÇÃO */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Resultado da Moderação
              </h3>
              <ConsolidatedBadge status={moderation.status} />
            </div>

            <div className="space-y-3">
              <LayerCard title="1. Texto Digitado" icon={FileText} result={moderation.textLayer} />
              <LayerCard title="2. OCR (Texto na Imagem)" icon={ScanText} result={moderation.ocrLayer} />
              <LayerCard title="3. Conteúdo Visual" icon={Eye} result={moderation.visualLayer} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Pré-visualização
              </h3>
              {moderation.isApproved && (
                <button
                  onClick={handleCopyMaterial}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  {isCopied ? "Copiado!" : "Copiar Material"}
                </button>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 space-y-3">
              {imagePreview && (
                <div className="rounded-md overflow-hidden max-h-48 flex items-center justify-center bg-slate-200 dark:bg-slate-900">
                  <img src={imagePreview} alt="Preview do post" className="max-h-48 object-contain" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {title || "Título da publicação"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap mt-1">
                  {caption || "Sua legenda aparecerá aqui..."}
                </p>
                {affiliateUrl && (
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 break-all"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {affiliateUrl}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConsolidatedBadge({ status }: { status: ModerationStatus }) {
  const conf = STATUS_CONFIG[status];
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${conf.bg} ${conf.text}`}>
      <Icon className="h-3.5 w-3.5" />
      {conf.label}
    </span>
  );
}

function LayerCard({
  title,
  icon: Icon,
  result,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  result: { status: ModerationStatus; explanation: string };
}) {
  const conf = STATUS_CONFIG[result.status];
  const StatusIcon = conf.icon;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/30">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
          <Icon className="h-3.5 w-3.5 text-slate-400" />
          {title}
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${conf.bg} ${conf.text}`}>
          <StatusIcon className="h-3 w-3" />
          {conf.label}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5">
        {result.explanation}
      </p>
    </div>
  );
}

export default CentralDivulgacao;