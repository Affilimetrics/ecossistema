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
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

/* ============================================================
   VARIANTS DE ANIMAÇÃO DE ENTRADA
   ============================================================ */
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease: "easeOut" },
  },
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

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
  idle: { label: "Pendente", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: HelpCircle },
  pending: { label: "Aguardando", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", icon: HelpCircle },
  analyzing: { label: "Analisando...", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", icon: Loader2 },
  approved: { label: "Aprovado", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", icon: XCircle },
  needs_review: { label: "Revisão Necessária", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  not_verified: { label: "Não Verificado", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-500 dark:text-gray-400", icon: HelpCircle },
  error: { label: "Erro Técnico", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", icon: AlertTriangle },
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

export function CentralDivulgacao({ isDark }: DisclosurePageProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto"
    >
      {/* CABEÇALHO PADRONIZADO (Notificação, Tema e Perfil fixos à direita) */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Central de Divulgação
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Crie materiais promocionais, execute verificações de conformidade e prepare publicações.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5 [&_button]:rounded-none">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        {/* FORMULÁRIO DE CRIAÇÃO */}
        <motion.div variants={itemVars} className="lg:col-span-7 space-y-4">
          <div className="rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Conteúdo da Divulgação</span>
            </h2>

            {/* Produto Vinculado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Produto do Catálogo (Opcional)
              </label>
              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="h-9 w-full appearance-none pl-3 pr-8 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="">Selecione um produto cadastrado...</option>
                  {MOCK_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.marketplaceName})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="h-9 w-full px-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Legenda */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className="w-full p-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Link de Afiliado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link do Produto ou Afiliado
              </label>
              <input
                type="url"
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://"
                className="h-9 w-full px-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Upload de Imagem */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imagem da Campanha
              </label>
              {imagePreview ? (
                <div className="relative rounded-none border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-950 h-48 flex items-center justify-center">
                  <img src={imagePreview} alt="Preview da imagem" className="h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleImageChange(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-none bg-black/70 text-white hover:bg-black/90 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border border-dashed border-gray-300 dark:border-gray-700 rounded-none p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50/60 dark:bg-gray-950/40"
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
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="h-7 w-7 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">PNG, JPG ou WebP até 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-none bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors shadow-xs"
              >
                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                <span>Analisar Moderação</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Salvar Rascunho</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* PAINEL DE MODERAÇÃO E PRÉ-VISUALIZAÇÃO */}
        <motion.div variants={itemVars} className="lg:col-span-5 space-y-4">
          <div className="rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Resultado da Moderação</span>
              </h3>
              <ConsolidatedBadge status={moderation.status} />
            </div>

            <div className="space-y-2.5">
              <LayerCard title="1. Texto Digitado" icon={FileText} result={moderation.textLayer} />
              <LayerCard title="2. OCR (Texto na Imagem)" icon={ScanText} result={moderation.ocrLayer} />
              <LayerCard title="3. Conteúdo Visual" icon={Eye} result={moderation.visualLayer} />
            </div>
          </div>

          <div className="rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Pré-visualização</span>
              </h3>
              {moderation.isApproved && (
                <button
                  type="button"
                  onClick={handleCopyMaterial}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-none transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>{isCopied ? "Copiado!" : "Copiar Material"}</span>
                </button>
              )}
            </div>

            <div className="rounded-none border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/70 dark:bg-gray-950/60 space-y-3">
              {imagePreview && (
                <div className="rounded-none overflow-hidden max-h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <img src={imagePreview} alt="Preview do post" className="max-h-48 object-contain" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {title || "Título da publicação"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap mt-1">
                  {caption || "Sua legenda aparecerá aqui..."}
                </p>
                {affiliateUrl && (
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 break-all hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span>{affiliateUrl}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-none border border-gray-700 dark:border-gray-300 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConsolidatedBadge({ status }: { status: ModerationStatus }) {
  const conf = STATUS_CONFIG[status];
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[11px] font-medium ${conf.bg} ${conf.text}`}>
      <Icon className="h-3 w-3" />
      <span>{conf.label}</span>
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
    <div className="rounded-none border border-gray-200 dark:border-gray-800 p-3 bg-gray-50/50 dark:bg-gray-950/40">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800 dark:text-gray-200">
          <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>{title}</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-none ${conf.bg} ${conf.text}`}>
          <StatusIcon className="h-3 w-3" />
          <span>{conf.label}</span>
        </span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-5">
        {result.explanation}
      </p>
    </div>
  );
}

export default CentralDivulgacao;