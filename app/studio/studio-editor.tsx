"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Type,
} from "lucide-react";

type CreativeKind = "SLIDESHOW" | "DIGITAL_MENU" | "ADVERTISEMENT";
type TextElement = {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
};
type ImageElement = {
  id: string;
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  alt: string;
};
type StudioElement = TextElement | ImageElement;
type Slide = {
  id: string;
  durationSeconds: number;
  background: string;
  elements: StudioElement[];
};
type StudioData = { slides: Slide[] };
type ProjectSummary = {
  id: string;
  name: string;
  kind: CreativeKind;
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
  updatedAt: string;
};
type StudioProject = ProjectSummary & { data: StudioData };
type DragState = {
  id: string;
  pointerX: number;
  pointerY: number;
  elementX: number;
  elementY: number;
  stageWidth: number;
  stageHeight: number;
};
type ResizeState = {
  id: string;
  pointerX: number;
  pointerY: number;
  elementWidth: number;
  elementHeight: number;
  stageWidth: number;
  stageHeight: number;
};

const KIND_LABELS: Record<CreativeKind, string> = {
  SLIDESHOW: "Diaporama",
  DIGITAL_MENU: "Menu numérique",
  ADVERTISEMENT: "Visuel publicitaire",
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function newSlide(background = "#ffffff"): Slide {
  return { id: makeId(), durationSeconds: 10, background, elements: [] };
}

function textElement(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  width = 1500,
  align: TextElement["align"] = "left",
  bold = false,
): TextElement {
  return {
    id: makeId(),
    type: "text",
    x,
    y,
    width,
    height: Math.max(110, fontSize * 1.6),
    text,
    fontSize,
    color,
    bold,
    align,
  };
}

type TemplateOption = {
  id: string;
  kind: CreativeKind;
  name: string;
  description: string;
  background: string;
  image?: string;
};

type StockImage = { name: string; category: string; url: string };

const STOCK_IMAGES: StockImage[] = [
  { name: "Plat frais", category: "Cuisine", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85" },
  { name: "Table de restaurant", category: "Restaurant", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85" },
  { name: "Café", category: "Boissons", url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85" },
  { name: "Style", category: "Mode", url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85" },
  { name: "Soin beauté", category: "Beauté", url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=85" },
  { name: "Smartphone", category: "Technologie", url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85" },
];

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: "ad-premium", kind: "ADVERTISEMENT", name: "Offre premium", description: "Contraste fort et appel à l’action", background: "#171343" },
  { id: "ad-beauty", kind: "ADVERTISEMENT", name: "Produit beauté", description: "Photo produit et mise en page élégante", background: "#fff7f1", image: STOCK_IMAGES[4].url },
  { id: "ad-tech", kind: "ADVERTISEMENT", name: "Lancement tech", description: "Style moderne pour une nouveauté", background: "#eaf3ff", image: STOCK_IMAGES[5].url },
  { id: "menu-bistro", kind: "DIGITAL_MENU", name: "Bistro gourmand", description: "Menu chaleureux avec photo", background: "#fff6e9", image: STOCK_IMAGES[1].url },
  { id: "menu-cafe", kind: "DIGITAL_MENU", name: "Carte café", description: "Ambiance café, tons espresso", background: "#281914", image: STOCK_IMAGES[2].url },
  { id: "menu-fresh", kind: "DIGITAL_MENU", name: "Menu fraîcheur", description: "Palette claire et cuisine saine", background: "#f1f7ec", image: STOCK_IMAGES[0].url },
  { id: "slide-story", kind: "SLIDESHOW", name: "Histoire de marque", description: "Trois diapositives prêtes à personnaliser", background: "#10243a" },
  { id: "slide-product", kind: "SLIDESHOW", name: "Présentation produit", description: "Visuels et bénéfices du produit", background: "#eaf3ff", image: STOCK_IMAGES[5].url },
  { id: "slide-food", kind: "SLIDESHOW", name: "Saveurs en images", description: "Diaporama gourmand prêt à adapter", background: "#fff6e9", image: STOCK_IMAGES[0].url },
];

function photoElement(url: string, alt: string, x: number, y: number, width: number, height: number): ImageElement {
  return { id: makeId(), type: "image", x, y, width, height, url, alt };
}

function templateSlides(kind: CreativeKind, templateId: string): Slide[] {
  if (templateId === "ad-beauty") {
    const slide = newSlide("#fff7f1");
    slide.elements = [
      textElement("NOUVEAUTÉ", 130, 130, 38, "#b45b45", 820, "left", true),
      textElement("Révélez\nvotre éclat", 130, 275, 106, "#34231f", 900, "left", true),
      textElement("Une routine pensée pour vous.", 140, 590, 42, "#6b5149", 850),
      textElement("DÉCOUVRIR", 140, 790, 38, "#ffffff", 440, "center", true),
      photoElement(STOCK_IMAGES[4].url, "Soin beauté", 1090, 110, 700, 860),
    ];
    return [slide];
  }
  if (templateId === "ad-tech") {
    const slide = newSlide("#eaf3ff");
    slide.elements = [
      textElement("NOUVEAU", 130, 135, 38, "#2563eb", 750, "left", true),
      textElement("La technologie\nà votre rythme", 130, 280, 92, "#122340", 920, "left", true),
      textElement("Simple. Rapide. Pensée pour vous.", 140, 590, 40, "#526170", 840),
      textElement("DISPONIBLE MAINTENANT", 140, 790, 34, "#ffffff", 630, "center", true),
      photoElement(STOCK_IMAGES[5].url, "Smartphone", 1080, 160, 720, 760),
    ];
    return [slide];
  }
  if (templateId === "menu-bistro") {
    const slide = newSlide("#fff6e9");
    slide.elements = [
      textElement("LE BISTRO", 130, 80, 42, "#9a4b2b", 920, "left", true),
      textElement("Menu du jour", 130, 185, 78, "#30231c", 920, "left", true),
      textElement("Poulet rôti aux herbes", 150, 390, 48, "#30231c", 850, "left", true),
      textElement("Légumes de saison · sauce maison", 150, 460, 30, "#67564b", 850),
      textElement("7 500 F", 150, 525, 42, "#b4532a", 560, "left", true),
      textElement("Entrée · Plat · Dessert", 150, 760, 34, "#67564b", 850),
      photoElement(STOCK_IMAGES[1].url, "Table de restaurant", 1070, 145, 720, 780),
    ];
    return [slide];
  }
  if (templateId === "menu-cafe") {
    const slide = newSlide("#281914");
    slide.elements = [
      textElement("CAFÉ DU COIN", 130, 85, 42, "#e8b87e", 850, "left", true),
      textElement("Pause\ncafé", 130, 200, 104, "#fff8ee", 780, "left", true),
      textElement("Espresso ............ 1 000 F", 140, 560, 34, "#fff8ee", 900),
      textElement("Cappuccino ......... 1 800 F", 140, 635, 34, "#fff8ee", 900),
      textElement("Café glacé .......... 2 000 F", 140, 710, 34, "#fff8ee", 900),
      photoElement(STOCK_IMAGES[2].url, "Café", 1070, 150, 700, 760),
    ];
    return [slide];
  }
  if (templateId === "menu-fresh") {
    const slide = newSlide("#f1f7ec");
    slide.elements = [
      textElement("FRAIS & LOCAL", 120, 70, 38, "#39734a", 1680, "center", true),
      textElement("Notre menu", 120, 160, 80, "#203d2b", 1680, "center", true),
      photoElement(STOCK_IMAGES[0].url, "Plat frais", 180, 320, 640, 560),
      textElement("Bowl du marché", 900, 370, 48, "#203d2b", 760, "left", true),
      textElement("Légumes croquants, céréales complètes et sauce maison.", 900, 455, 34, "#4f6654", 760),
      textElement("À PARTIR DE 4 500 F", 900, 670, 34, "#39734a", 760, "left", true),
    ];
    return [slide];
  }
  if (templateId === "slide-story") {
    const first = newSlide("#10243a");
    first.elements = [textElement("VOTRE HISTOIRE", 150, 190, 90, "#ffffff", 1600, "center", true), textElement("Une idée qui mérite d’être vue.", 220, 400, 48, "#dbeafe", 1480, "center")];
    const second = newSlide("#eaf3ff");
    second.elements = [textElement("Notre mission", 120, 120, 80, "#17324d", 900, "left", true), textElement("Présentez ce qui rend votre marque unique.", 130, 270, 44, "#526170", 920), photoElement(STOCK_IMAGES[5].url, "Smartphone", 1090, 170, 670, 740)];
    const third = newSlide("#fff7ed");
    third.elements = [textElement("À VOUS DE JOUER", 150, 230, 46, "#c2410c", 1620, "center", true), textElement("Ajoutez votre message et vos coordonnées.", 180, 380, 60, "#292524", 1560, "center"), textElement("MERCI", 150, 690, 42, "#78716c", 1620, "center", true)];
    return [first, second, third];
  }
  if (templateId === "slide-product") {
    const first = newSlide("#eaf3ff");
    first.elements = [textElement("À LA UNE", 130, 100, 38, "#2563eb", 820, "left", true), textElement("Le produit\nqui change tout", 130, 240, 88, "#122340", 870, "left", true), photoElement(STOCK_IMAGES[5].url, "Smartphone", 1060, 150, 730, 780)];
    const second = newSlide("#10243a");
    second.elements = [textElement("Pensé pour vous", 150, 170, 82, "#ffffff", 1620, "center", true), textElement("Pratique · Fiable · Accessible", 180, 360, 46, "#dbeafe", 1560, "center"), textElement("DÉCOUVRIR", 590, 650, 38, "#10243a", 740, "center", true)];
    return [first, second];
  }
  if (templateId === "slide-food") {
    const first = newSlide("#fff6e9");
    first.elements = [photoElement(STOCK_IMAGES[0].url, "Plat frais", 0, 0, 1920, 1080), textElement("LE GOÛT DU FRAIS", 100, 150, 76, "#ffffff", 1720, "center", true), textElement("Des recettes qui donnent envie.", 120, 300, 48, "#ffffff", 1680, "center")];
    const second = newSlide("#f1f7ec");
    second.elements = [textElement("À découvrir", 120, 160, 82, "#203d2b", 1680, "center", true), photoElement(STOCK_IMAGES[1].url, "Restaurant", 300, 350, 1320, 600), textElement("Réservez votre table", 150, 920, 36, "#39734a", 1620, "center", true)];
    return [first, second];
  }
  if (templateId === "ad-premium") {
    const slide = newSlide("#171343");
    slide.elements = [
      textElement("OFFRE SPÉCIALE", 130, 125, 40, "#fbbf24", 1660, "center", true),
      textElement("Faites briller\nvotre marque", 180, 280, 104, "#ffffff", 1560, "center", true),
      textElement("Une offre à ne pas manquer", 220, 570, 44, "#dbeafe", 1480, "center"),
      textElement("DÈS 5 000 F", 610, 770, 48, "#171343", 700, "center", true),
    ];
    return [slide];
  }
  if (kind === "DIGITAL_MENU") {
    const slide = newSlide("#fff8e8");
    slide.elements = [textElement("MENU DU JOUR", 140, 90, 96, "#17324d", 1640, "center", true), textElement("Plat principal", 200, 350, 62, "#17324d", 1050, "left", true), textElement("Description du plat", 200, 440, 38, "#526170", 1100), textElement("5 000 F", 1370, 350, 58, "#d97706", 380, "right", true), textElement("Entrée • Plat • Dessert", 200, 760, 34, "#526170", 1450, "center")];
    return [slide];
  }
  if (kind === "SLIDESHOW") {
    const first = newSlide("#10243a");
    first.elements = [textElement("VOTRE HISTOIRE", 150, 160, 90, "#ffffff", 1600, "center", true), textElement("Ajoutez un message pour votre audience", 220, 390, 48, "#dbeafe", 1480, "center")];
    const second = newSlide("#eff6ff");
    second.elements = [textElement("Une nouvelle diapositive", 150, 180, 82, "#17324d", 1600, "center", true), textElement("Modifiez ce texte depuis le panneau de droite", 220, 410, 42, "#526170", 1480, "center")];
    return [first, second];
  }
  const slide = newSlide("#10243a");
  slide.elements = [textElement("VOTRE MARQUE", 130, 110, 40, "#bfdbfe", 700, "left", true), textElement("Votre offre\ncommence ici", 130, 300, 105, "#ffffff", 1150, "left", true), textElement("Un message simple et mémorable", 140, 640, 42, "#dbeafe", 1200), textElement("DÈS 5 000 F", 140, 830, 48, "#fbbf24", 850, "left", true)];
  return [slide];
}

function isTextElement(element: StudioElement): element is TextElement {
  return element.type === "text";
}

type SizeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function SizeControl({ label, value, min, max, step, onChange }: SizeControlProps) {
  function setValue(rawValue: number) {
    if (!Number.isFinite(rawValue)) return;
    onChange(Math.max(min, Math.min(max, Math.round(rawValue))));
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuer ${label.toLowerCase()}`}
          onClick={() => setValue(value - step)}
          disabled={value <= min}
          className="h-11 w-12 shrink-0 rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-700 shadow-sm disabled:opacity-40"
        >−</button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-center font-semibold tabular-nums"
        />
        <button
          type="button"
          aria-label={`Augmenter ${label.toLowerCase()}`}
          onClick={() => setValue(value + step)}
          disabled={value >= max}
          className="h-11 w-12 shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 text-xl font-semibold text-indigo-700 shadow-sm disabled:opacity-40"
        >+</button>
      </span>
    </label>
  );
}

type StudioEditorProps = { role: "ADMIN" | "OPERATOR" | "ADVERTISER" | "PARTNER" };

export default function StudioEditor({ role }: StudioEditorProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CreativeKind>("ADVERTISEMENT");
  const [selectedTemplateId, setSelectedTemplateId] = useState("ad-premium");
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const activeSlide = slides[activeSlideIndex] ?? null;
  const hasProject = project !== null;
  const availableTemplates = TEMPLATE_OPTIONS.filter((option) => option.kind === newKind);
  const selectedElement = useMemo(
    () => activeSlide?.elements.find((element) => element.id === selectedElementId) ?? null,
    [activeSlide, selectedElementId],
  );

  async function refreshProjects() {
    const response = await fetch("/api/creative-projects", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error || "Impossible de charger les projets.");
    setProjects(Array.isArray(result) ? result : []);
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/creative-projects", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error || "Impossible de charger les projets.");
        if (mounted) setProjects(Array.isArray(result) ? result : []);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : "Erreur de chargement.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setStageWidth(stage.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [hasProject, activeSlideIndex]);

  function updateSlide(patch: Partial<Slide>) {
    setSlides((current) => current.map((slide, index) =>
      index === activeSlideIndex ? { ...slide, ...patch } : slide,
    ));
  }

  function updateElement(id: string, patch: Partial<StudioElement>) {
    setSlides((current) => current.map((slide, index) => {
      if (index !== activeSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map((element) =>
          element.id === id ? { ...element, ...patch } as StudioElement : element,
        ),
      };
    }));
  }

  async function createProject() {
    setError("");
    setNotice("");
    const name = newName.trim() || KIND_LABELS[newKind];
    const initialSlides = templateSlides(newKind, selectedTemplateId);
    setSaving(true);
    try {
      const response = await fetch("/api/creative-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: newKind,
          canvasWidth: 1920,
          canvasHeight: 1080,
          data: { slides: initialSlides },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Impossible de créer le projet.");
      setProject(result as StudioProject);
      setSlides(initialSlides);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setNewName("");
      await refreshProjects();
      setNotice("Projet créé. Pense à l’enregistrer après tes modifications.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le projet.");
    } finally {
      setSaving(false);
    }
  }

  async function openProject(id: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/creative-projects?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Impossible d’ouvrir le projet.");
      const loaded = result as StudioProject;
      const loadedSlides = Array.isArray(loaded.data?.slides) && loaded.data.slides.length
        ? loaded.data.slides
        : [newSlide()];
      setProject(loaded);
      setSlides(loadedSlides);
      setActiveSlideIndex(0);
      setSelectedElementId(null);
      setPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’ouvrir le projet.");
    }
  }

  async function saveProject() {
    if (!project) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/creative-projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          kind: project.kind,
          canvasWidth: project.canvasWidth,
          canvasHeight: project.canvasHeight,
          data: { slides },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Impossible d’enregistrer le projet.");
      setProject(result as StudioProject);
      await refreshProjects();
      setNotice("Projet enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’enregistrer le projet.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!project || !window.confirm(`Supprimer « ${project.name} » ?`)) return;
    try {
      const response = await fetch("/api/creative-projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Impossible de supprimer le projet.");
      setProject(null);
      setSlides([]);
      setSelectedElementId(null);
      await refreshProjects();
      setNotice("Projet supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer le projet.");
    }
  }

  function addText() {
    if (!activeSlide) return;
    const element = textElement("Votre texte", 180, 180, 64, "#17324d", 1100, "left", true);
    updateSlide({ elements: [...activeSlide.elements, element] });
    setSelectedElementId(element.id);
  }

  function addStockImage(stock: StockImage) {
    if (!activeSlide) return;
    const image = photoElement(stock.url, stock.name, 420, 210, 900, 680);
    updateSlide({ elements: [...activeSlide.elements, image] });
    setSelectedElementId(image.id);
    setShowImageLibrary(false);
    setNotice(`Image « ${stock.name} » ajoutée. Enregistre le projet pour conserver la modification.`);
  }

  async function uploadImage(file: File) {
    if (!activeSlide) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result?.success || typeof result?.url !== "string") {
        throw new Error(result?.error || "Impossible d’importer cette image.");
      }
      const image: ImageElement = {
        id: makeId(),
        type: "image",
        x: 250,
        y: 250,
        width: 650,
        height: 450,
        url: result.url,
        alt: file.name,
      };
      updateSlide({ elements: [...activeSlide.elements, image] });
      setSelectedElementId(image.id);
      setNotice("Image importée. Enregistre le projet pour conserver le lien.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’importer cette image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeSelectedElement() {
    if (!activeSlide || !selectedElementId) return;
    updateSlide({ elements: activeSlide.elements.filter((element) => element.id !== selectedElementId) });
    setSelectedElementId(null);
  }

  function addSlide() {
    const next = [...slides, newSlide(activeSlide?.background ?? "#ffffff")];
    setSlides(next);
    setActiveSlideIndex(next.length - 1);
    setSelectedElementId(null);
  }

  function moveSlide(direction: -1 | 1) {
    const destination = activeSlideIndex + direction;
    if (destination < 0 || destination >= slides.length) return;
    const next = [...slides];
    [next[activeSlideIndex], next[destination]] = [next[destination], next[activeSlideIndex]];
    setSlides(next);
    setActiveSlideIndex(destination);
  }

  function removeSlide() {
    if (slides.length <= 1) {
      setError("Un projet doit contenir au moins une diapositive.");
      return;
    }
    const next = slides.filter((_, index) => index !== activeSlideIndex);
    setSlides(next);
    setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
    setSelectedElementId(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>, element: StudioElement) {
    if (preview || !stageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedElementId(element.id);
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = {
      id: element.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      elementX: element.x,
      elementY: element.y,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerDown(event: React.PointerEvent<HTMLButtonElement>, element: StudioElement) {
    if (preview || !stageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedElementId(element.id);
    const rect = stageRef.current.getBoundingClientRect();
    resizeRef.current = {
      id: element.id,
      pointerX: event.clientX,
      pointerY: event.clientY,
      elementWidth: element.width,
      elementHeight: element.height,
      stageWidth: rect.width,
      stageHeight: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (resize) {
      const element = activeSlide?.elements.find((item) => item.id === resize.id);
      const maxWidth = Math.max(80, 1920 - (element?.x ?? 0));
      const maxHeight = Math.max(40, 1080 - (element?.y ?? 0));
      const width = Math.max(80, Math.min(maxWidth, resize.elementWidth + ((event.clientX - resize.pointerX) * 1920) / resize.stageWidth));
      const height = Math.max(40, Math.min(maxHeight, resize.elementHeight + ((event.clientY - resize.pointerY) * 1080) / resize.stageHeight));
      updateElement(resize.id, { width, height });
      return;
    }
    const drag = dragRef.current;
    if (!drag) return;
    const element = activeSlide?.elements.find((item) => item.id === drag.id);
    const maxX = Math.max(0, 1920 - (element?.width ?? 80));
    const maxY = Math.max(0, 1080 - (element?.height ?? 40));
    const nextX = Math.max(0, Math.min(maxX, drag.elementX + ((event.clientX - drag.pointerX) * 1920) / drag.stageWidth));
    const nextY = Math.max(0, Math.min(maxY, drag.elementY + ((event.clientY - drag.pointerY) * 1080) / drag.stageHeight));
    updateElement(drag.id, { x: nextX, y: nextY });
  }

  function handlePointerUp() {
    dragRef.current = null;
    resizeRef.current = null;
  }

  async function renderCurrentSlide() {
    if (!stageRef.current) throw new Error("Le canevas n’est pas prêt.");
    await document.fonts.ready;
    const rect = stageRef.current.getBoundingClientRect();
    return html2canvas(stageRef.current, {
      backgroundColor: activeSlide?.background ?? "#ffffff",
      useCORS: true,
      scale: 1920 / rect.width,
      width: rect.width,
      height: rect.height,
      logging: false,
    });
  }

  async function exportPng() {
    if (!stageRef.current || !project) return;
    setExporting(true);
    setError("");
    setNotice("");
    try {
      const canvas = await renderCurrentSlide();
      const link = document.createElement("a");
      link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-")}-slide-${activeSlideIndex + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setNotice("PNG téléchargé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’exporter l’image.");
    } finally {
      setExporting(false);
    }
  }

  async function publishCurrentSlide() {
    if (!project || !activeSlide) return;
    if (role !== "ADVERTISER" && role !== "PARTNER") {
      setError("L’envoi direct est réservé aux comptes annonceur et partenaire : ils sont enregistrés dans leur propre médiathèque.");
      return;
    }

    setPublishing(true);
    setError("");
    setNotice("");
    try {
      const canvas = await renderCurrentSlide();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Impossible de préparer le fichier PNG.");

      const baseName = project.name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 70) || "visuel-seetuads";
      const fileName = `${baseName}-slide-${activeSlideIndex + 1}.png`;
      const formData = new FormData();
      formData.append("file", blob, fileName);

      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok || typeof uploaded?.url !== "string") {
        throw new Error(uploaded?.error || "Le PNG n’a pas pu être envoyé au stockage.");
      }

      const mediaResponse = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${project.name} — Diapositive ${activeSlideIndex + 1}`,
          fileUrl: uploaded.url,
          fileType: "image",
          mimeType: "image/png",
          durationSeconds: activeSlide.durationSeconds,
          widthPx: 1920,
          heightPx: 1080,
          fileSizeBytes: blob.size,
        }),
      });
      const result = await mediaResponse.json();
      if (!mediaResponse.ok) {
        throw new Error(result?.error || "Le fichier est téléversé, mais son ajout à la médiathèque a échoué.");
      }
      setNotice("Diapositive ajoutée à votre médiathèque. Elle suivra le circuit de validation habituel avant diffusion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’ajouter le visuel à la médiathèque.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Studio de création</h1>
            <p className="text-sm text-slate-600">Crée des visuels et des diapositives en 1920 × 1080.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {project && (
              <>
                <button onClick={() => setPreview((value) => !value)} className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
                  {preview ? "Modifier" : "Aperçu"}
                </button>
                <button onClick={saveProject} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </button>
                <button onClick={exportPng} disabled={exporting || publishing} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60">
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PNG
                </button>
                {(role === "ADVERTISER" || role === "PARTNER") && (
                  <button onClick={publishCurrentSlide} disabled={publishing || exporting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Ajouter à ma médiathèque
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

        {!project ? (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Nouveau projet</h2>
              <label className="mt-4 block text-sm font-medium">Nom du projet
                <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={100} placeholder="Ex. Promo du week-end" className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="mt-3 block text-sm font-medium">Type de création
                <select value={newKind} onChange={(event) => {
                  const kind = event.target.value as CreativeKind;
                  setNewKind(kind);
                  setSelectedTemplateId(TEMPLATE_OPTIONS.find((option) => option.kind === kind)?.id ?? "ad-premium");
                }} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                  <option value="ADVERTISEMENT">Visuel publicitaire</option>
                  <option value="SLIDESHOW">Diaporama</option>
                  <option value="DIGITAL_MENU">Menu numérique</option>
                </select>
              </label>
              <button onClick={createProject} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Créer avec un modèle
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">Les projets sont privés au compte connecté. Tu pourras ensuite modifier les textes, ajouter des images et réordonner les diapositives.</p>
            </section>
            <div className="space-y-4">
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">Choisis un modèle</h2>
                    <p className="text-sm text-slate-500">Des designs modernes à personnaliser.</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{availableTemplates.length} modèles</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {availableTemplates.map((option) => (
                    <button key={option.id} type="button" onClick={() => setSelectedTemplateId(option.id)} className={`overflow-hidden rounded-2xl border-2 text-left transition ${selectedTemplateId === option.id ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}>
                      <div className="relative aspect-video overflow-hidden" style={{ background: option.background }}>
                        {option.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.image} alt="" crossOrigin="anonymous" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                        <span className="absolute bottom-2 left-3 right-3 truncate text-sm font-bold text-white">{option.name}</span>
                        {selectedTemplateId === option.id && <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-indigo-700">CHOISI</span>}
                      </div>
                      <p className="p-3 text-xs leading-5 text-slate-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">Mes projets</h2>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              {!loading && projects.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Aucun projet enregistré pour le moment.</p>
              ) : (
                <ul className="mt-3 divide-y">
                  {projects.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{KIND_LABELS[item.kind]} · modifié le {new Date(item.updatedAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <button onClick={() => openProject(item.id)} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Ouvrir</button>
                    </li>
                  ))}
                </ul>
              )}
              </section>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)_270px]">
            <aside className="space-y-4">
              <section className="rounded-2xl border bg-white p-4 shadow-sm">
                <button onClick={() => { setProject(null); setSlides([]); setSelectedElementId(null); }} className="mb-3 inline-flex items-center gap-1 text-sm text-blue-700"><ArrowLeft className="h-4 w-4" /> Tous les projets</button>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Nom
                  <input value={project.name} onChange={(event) => setProject({ ...project, name: event.target.value })} maxLength={100} className="mt-1 w-full rounded-lg border px-2 py-2 text-sm" />
                </label>
                <p className="mt-2 text-xs text-slate-500">{KIND_LABELS[project.kind]} · 1920 × 1080</p>
              </section>
              <section className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Diapositives</h2>
                  <button onClick={addSlide} title="Ajouter une diapositive" className="rounded-lg border p-2 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
                </div>
                <div className="mt-3 space-y-2">
                  {slides.map((slide, index) => (
                    <button key={slide.id} onClick={() => { setActiveSlideIndex(index); setSelectedElementId(null); }} className={`w-full rounded-lg border p-3 text-left ${index === activeSlideIndex ? "border-blue-600 bg-blue-50" : "hover:bg-slate-50"}`}>
                      <span className="block text-sm font-medium">Diapositive {index + 1}</span>
                      <span className="text-xs text-slate-500">{slide.durationSeconds} secondes</span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => moveSlide(-1)} disabled={activeSlideIndex === 0} className="rounded-lg border p-2 disabled:opacity-40" title="Déplacer vers le haut"><ArrowUp className="h-4 w-4" /></button>
                  <button onClick={() => moveSlide(1)} disabled={activeSlideIndex === slides.length - 1} className="rounded-lg border p-2 disabled:opacity-40" title="Déplacer vers le bas"><ArrowDown className="h-4 w-4" /></button>
                  <button onClick={removeSlide} disabled={slides.length <= 1} className="ml-auto rounded-lg border border-red-200 p-2 text-red-700 disabled:opacity-40" title="Supprimer la diapositive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </section>
            </aside>

            <section className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3 shadow-sm">
                <button onClick={addText} disabled={preview} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"><Type className="h-4 w-4" /> Texte</button>
                <button onClick={() => fileRef.current?.click()} disabled={preview || uploading} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Importer une image
                </button>
                <button onClick={() => setShowImageLibrary((visible) => !visible)} disabled={preview} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${showImageLibrary ? "border-indigo-300 bg-indigo-50 text-indigo-800" : ""}`}>
                  <ImagePlus className="h-4 w-4" /> Banque d’images
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />
                <label className="ml-auto flex items-center gap-2 text-sm">Fond
                  <input type="color" value={activeSlide?.background ?? "#ffffff"} onChange={(event) => updateSlide({ background: event.target.value })} disabled={preview} className="h-9 w-10 rounded border p-1" />
                </label>
              </div>
              {showImageLibrary && (
                <section className="rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">Banque d’images</h2>
                      <p className="text-xs text-slate-500">Choisis une image pour l’ajouter à ta diapositive.</p>
                    </div>
                    <button type="button" onClick={() => setShowImageLibrary(false)} className="rounded-lg border px-3 py-2 text-sm">Fermer</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {STOCK_IMAGES.map((stock) => (
                      <button key={stock.url} type="button" onClick={() => addStockImage(stock)} className="overflow-hidden rounded-xl border text-left transition hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100">
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={stock.url} alt={stock.name} crossOrigin="anonymous" loading="lazy" className="h-full w-full object-cover" />
                        </div>
                        <span className="block truncate px-2 pt-2 text-xs font-semibold">{stock.name}</span>
                        <span className="block px-2 pb-2 text-[11px] text-slate-500">{stock.category}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <div className="rounded-2xl border bg-slate-200 p-2 shadow-sm sm:p-4">
                {activeSlide && (
                  <div
                    ref={stageRef}
                    className="relative mx-auto aspect-video w-full max-w-[1100px] overflow-hidden shadow-lg"
                    style={{ backgroundColor: activeSlide.background, touchAction: "none" }}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerDown={() => { if (!preview) setSelectedElementId(null); }}
                  >
                    {activeSlide.elements.map((element) => (
                      <div
                        key={element.id}
                        onPointerDown={(event) => handlePointerDown(event, element)}
                        className={`absolute ${preview ? "cursor-default" : "cursor-move"} ${selectedElementId === element.id && !preview ? "outline outline-2 outline-blue-600" : ""}`}
                        style={{
                          left: `${(element.x / 1920) * 100}%`,
                          top: `${(element.y / 1080) * 100}%`,
                          width: `${(element.width / 1920) * 100}%`,
                          height: `${(element.height / 1080) * 100}%`,
                          touchAction: "none",
                        }}
                      >
                        {element.type === "text" ? (
                          <div style={{
                            width: "100%",
                            height: "100%",
                            color: element.color,
                            fontSize: `${element.fontSize * ((stageWidth || 960) / 1920)}px`,
                            fontWeight: element.bold ? 700 : 400,
                            textAlign: element.align,
                            lineHeight: 1.08,
                            whiteSpace: "pre-wrap",
                            overflow: "hidden",
                            fontFamily: "Arial, sans-serif",
                          }}>{element.text}</div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={element.url} alt={element.alt} crossOrigin="anonymous" className="h-full w-full object-contain" />
                        )}
                        {selectedElementId === element.id && !preview && (
                          <button
                            type="button"
                            aria-label={`Redimensionner ${element.type === "text" ? "le texte" : "l’image"}`}
                            onPointerDown={(event) => handleResizePointerDown(event, element)}
                            onClick={(event) => event.stopPropagation()}
                            className="absolute -bottom-2 -right-2 z-20 h-6 w-6 touch-none rounded-full border-2 border-white bg-indigo-600 shadow-md"
                            style={{ touchAction: "none" }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-slate-500">Déplace un élément en le faisant glisser. Sélectionne-le puis tire la poignée violette pour le redimensionner, ou utilise les boutons − / + dans Propriétés. Format paysage 16:9.</p>
            </section>

            <aside className="space-y-4">
              <section className="rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="font-semibold">Propriétés</h2>
                {activeSlide && (
                  <label className="mt-3 block text-sm">Durée de la diapositive (secondes)
                    <input type="number" min={1} max={120} value={activeSlide.durationSeconds} onChange={(event) => updateSlide({ durationSeconds: Math.max(1, Math.min(120, Number(event.target.value) || 1)) })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                  </label>
                )}
                {selectedElement ? (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedElement.type === "text" ? "Texte sélectionné" : "Image sélectionnée"}</p>
                    {isTextElement(selectedElement) ? (
                      <>
                        <label className="block text-sm">Contenu
                          <textarea value={selectedElement.text} onChange={(event) => updateElement(selectedElement.id, { text: event.target.value })} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2" />
                        </label>
                        <SizeControl label="Taille du texte" value={selectedElement.fontSize} min={16} max={220} step={4} onChange={(fontSize) => updateElement(selectedElement.id, { fontSize })} />
                        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                          <SizeControl label="Largeur du cadre" value={selectedElement.width} min={80} max={Math.max(80, 1920 - selectedElement.x)} step={40} onChange={(width) => updateElement(selectedElement.id, { width })} />
                          <SizeControl label="Hauteur du cadre" value={selectedElement.height} min={40} max={Math.max(40, 1080 - selectedElement.y)} step={20} onChange={(height) => updateElement(selectedElement.id, { height })} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm">Couleur <input type="color" value={selectedElement.color} onChange={(event) => updateElement(selectedElement.id, { color: event.target.value })} className="ml-2 h-9 w-10 rounded border p-1" /></label>
                          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedElement.bold} onChange={(event) => updateElement(selectedElement.id, { bold: event.target.checked })} /> Gras</label>
                        </div>
                        <label className="block text-sm">Alignement
                          <select value={selectedElement.align} onChange={(event) => updateElement(selectedElement.id, { align: event.target.value as TextElement["align"] })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                            <option value="left">Gauche</option><option value="center">Centré</option><option value="right">Droite</option>
                          </select>
                        </label>
                      </>
                    ) : (
                      <>
                        <p className="break-all text-xs text-slate-500">{selectedElement.alt}</p>
                        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                          <SizeControl label="Largeur de l’image" value={selectedElement.width} min={80} max={Math.max(80, 1920 - selectedElement.x)} step={40} onChange={(width) => updateElement(selectedElement.id, { width })} />
                          <SizeControl label="Hauteur de l’image" value={selectedElement.height} min={40} max={Math.max(40, 1080 - selectedElement.y)} step={20} onChange={(height) => updateElement(selectedElement.id, { height })} />
                        </div>
                      </>
                    )}
                    <button onClick={removeSelectedElement} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer l’élément</button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Sélectionne un texte ou une image sur le visuel pour modifier ses propriétés.</p>
                )}
              </section>
              <button onClick={deleteProject} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer le projet</button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
