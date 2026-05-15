import { analyzeProject } from "@/lib/gemini";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

const MAX_TEXT_PREVIEW = 10000;

function normalizeFileName(name: string | null | undefined): string {
  return name?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? "uploaded-file";
}

function trimText(text: string, limit = MAX_TEXT_PREVIEW): string {
  if (!text) return "";
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}

async function extractTextFromFile(file: Blob, fileName: string): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const arrayBuffer = await file.arrayBuffer();
  const textDecoder = new TextDecoder("utf-8");

  if (extension === "txt" || file.type === "text/plain") {
    return textDecoder.decode(arrayBuffer);
  }

  if (extension === "pdf" || file.type === "application/pdf") {
    const data = await pdfParse(arrayBuffer as any);
    return data.text || "";
  }

  if (
    extension === "docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: arrayBuffer as any });
    return result.value || "";
  }

  if (extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "bmp" || extension === "tif" || extension === "tiff") {
    const worker = createWorker({ logger: () => null });
    try {
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const { data } = await worker.recognize(arrayBuffer as any);
      return data.text || "";
    } finally {
      await worker.terminate();
    }
  }

  if (extension === "rtf") {
    return textDecoder.decode(arrayBuffer);
  }

  return "";
}

export async function handleAiAnalyze(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString() ?? "";
  const typesRaw = formData.get("types")?.toString() ?? "[]";
  const description = formData.get("description")?.toString() ?? "";
  const deadline = formData.get("deadline")?.toString() ?? "";
  const file = formData.get("file");
  const types = typeof typesRaw === "string" ? JSON.parse(typesRaw) : typesRaw;

  let extractedText = "";
  let uploadedFileName = null;

  if (file && typeof (file as Blob).arrayBuffer === "function") {
    uploadedFileName = normalizeFileName((file as any).name ?? formData.get("fileName")?.toString());
    try {
      extractedText = await extractTextFromFile(file as Blob, uploadedFileName);
      console.log("📄 Extracted file content:", trimText(extractedText, 8000));
    } catch (error) {
      console.error("❌ File extraction failed:", error);
      extractedText = "";
    }
  }

  const parsedTypes = Array.isArray(types) ? types : [];
  const truncatedExtractedText = extractedText.slice(0, 1500);
  const payload = {
    title,
    types: parsedTypes,
    description,
    deadline,
    fileName: uploadedFileName,
    extractedText: truncatedExtractedText,
  };

  console.log("📤 Gemini request payload:", {
    title,
    types: parsedTypes,
    description: trimText(description, 500),
    deadline,
    fileName: uploadedFileName,
    extractedTextPreview: trimText(truncatedExtractedText, 8000),
  });

  try {
    const analysis = await analyzeProject(title, parsedTypes, description, uploadedFileName, truncatedExtractedText, deadline);
    console.log("📥 Gemini parsed AI results:", analysis);

    return new Response(JSON.stringify({
      ...analysis,
      extractedText,
      fileName: uploadedFileName,
    }), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Gemini analysis failed:", error);
    return new Response(JSON.stringify({ error: "AI analysis failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
