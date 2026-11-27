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

function templateSlides(kind: CreativeKind): Slide[] {
  if (kind === "DIGITAL_MENU") {
    const slide = newSlide("#fff8e8");
    slide.elements = [
      textElement("MENU DU JOUR", 140, 90, 96, "#17324d", 1640, "center", true),
      textElement("Plat principal", 200, 350, 62, "#17324d", 1050, "left", true),
      textElement("Description du plat", 200, 440, 38, "#526170", 1100),
      textElement("5 000 F", 1370, 350, 58, "#d97706", 380, "right", true),
      textElement("Entrée • Plat • Dessert", 200, 760, 34, "#526170", 1450, "center"),
    ];
    return [slide];
  }

  if (kind === "SLIDESHOW") {
    const first = newSlide("#10243a");
    first.elements = [
      textElement("VOTRE HISTOIRE", 150, 160, 90, "#ffffff", 1600, "center", true),
      textElement("Ajoutez un message pour votre audience", 220, 390, 48, "#dbeafe", 1480, "center"),
    ];
    const second = newSlide("#eff6ff");
    second.elements = [
      textElement("Une nouvelle diapositive", 150, 180, 82, "#17324d", 1600, "center", true),
      textElement("Modifiez ce texte depuis le panneau de droite", 220, 410, 42, "#526170", 1480, "center"),
    ];
    return [first, second];
  }

  const slide = newSlide("#10243a");
  slide.elements = [
    textElement("VOTRE MARQUE", 130, 110, 40, "#bfdbfe", 700, "left", true),
    textElement("Votre offre\ncommence ici", 130, 300, 105, "#ffffff", 1150, "left", true),
    textElement("Un message simple et mémorable", 140, 640, 42, "#dbeafe", 1200),
    textElement("DÈS 5 000 F", 140, 830, 48, "#fbbf24", 850, "left", true),
  ];
  return [slide];
}

function isTextElement(element: StudioElement): element is TextElement {
  return element.type === "text";
}

export default function StudioEditor() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<CreativeKind>("ADVERTISEMENT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const activeSlide = slides[activeSlideIndex] ?? null;
  const hasProject = project !== null;
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
    const initialSlides = templateSlides(newKind);
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

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = Math.max(0, Math.min(1840, drag.elementX + ((event.clientX - drag.pointerX) * 1920) / drag.stageWidth));
    const nextY = Math.max(0, Math.min(1000, drag.elementY + ((event.clientY - drag.pointerY) * 1080) / drag.stageHeight));
    updateElement(drag.id, { x: nextX, y: nextY });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function exportPng() {
    if (!stageRef.current || !project) return;
    setExporting(true);
    setError("");
    try {
      await document.fonts.ready;
      const rect = stageRef.current.getBoundingClientRect();
      const canvas = await html2canvas(stageRef.current, {
        backgroundColor: activeSlide?.background ?? "#ffffff",
        useCORS: true,
        scale: 1920 / rect.width,
        width: rect.width,
        height: rect.height,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-")}-slide-${activeSlideIndex + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setNotice("PNG téléchargé. L’envoi direct vers la médiathèque sera ajouté à l’étape suivante.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’exporter l’image.");
    } finally {
      setExporting(false);
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
                <button onClick={exportPng} disabled={exporting} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60">
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PNG
                </button>
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
                <select value={newKind} onChange={(event) => setNewKind(event.target.value as CreativeKind)} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
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
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Image
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} />
                <label className="ml-auto flex items-center gap-2 text-sm">Fond
                  <input type="color" value={activeSlide?.background ?? "#ffffff"} onChange={(event) => updateSlide({ background: event.target.value })} disabled={preview} className="h-9 w-10 rounded border p-1" />
                </label>
              </div>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-slate-500">Fais glisser un élément pour le déplacer. Le format final est paysage 16:9.</p>
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
                        <label className="block text-sm">Taille du texte
                          <input type="number" min={16} max={220} value={selectedElement.fontSize} onChange={(event) => updateElement(selectedElement.id, { fontSize: Math.max(16, Math.min(220, Number(event.target.value) || 16)) })} className="mt-1 w-full rounded-lg border px-3 py-2" />
                        </label>
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
                      <p className="break-all text-xs text-slate-500">{selectedElement.alt}</p>
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
