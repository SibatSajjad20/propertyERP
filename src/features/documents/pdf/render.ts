import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { listCurrentDocumentsForClient } from "../queries";
import { FormalFormPdf, type FormPdfProps } from "./form-document";
import { DownPaymentReceiptPdf, type DownPaymentReceiptProps } from "./receipt-document";
import { registerPdfFonts } from "./fonts";
import { embedStorageImage, type EmbeddedImage } from "./images";
import { timed } from "../timing";
import { pdfCachePath, readCachedPdf, receiptCachePath, writeCachedPdf } from "./cache";

function generatedOnLabel() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function embedDocs(clientId: string, includeAppendix: boolean) {
  return timed("pdfEmbedDocs", async () => {
    const docs = await listCurrentDocumentsForClient(clientId);
    const find = (
      ownerType: "CLIENT" | "KIN",
      docType: "PHOTO" | "CNIC_FRONT" | "CNIC_BACK" | "KIN_PHOTO",
    ) => {
      const row = docs.find((d) => d.ownerType === ownerType && d.docType === docType);
      if (!row) return Promise.resolve(null);
      return embedStorageImage(row.storagePath);
    };
    const portraits = [find("CLIENT", "PHOTO"), find("KIN", "KIN_PHOTO")] as const;
    if (!includeAppendix) {
      const [photo, kinPhoto] = await Promise.all(portraits);
      return {
        photo,
        kinPhoto,
        clientFront: null,
        clientBack: null,
        kinFront: null,
        kinBack: null,
      };
    }
    const [photo, kinPhoto, clientFront, clientBack, kinFront, kinBack] =
      await Promise.all([
        ...portraits,
        find("CLIENT", "CNIC_FRONT"),
        find("CLIENT", "CNIC_BACK"),
        find("KIN", "CNIC_FRONT"),
        find("KIN", "CNIC_BACK"),
      ]);
    return { photo, kinPhoto, clientFront, clientBack, kinFront, kinBack };
  });
}

export async function renderFormPdf(
  props: Omit<FormPdfProps, "generatedOn" | "photo" | "kinPhoto" | "appendix"> & {
    clientId: string;
    includeAppendix: boolean;
    cacheKey?: { kind: "booking" | "sale"; id: string; version: string };
  },
): Promise<Buffer> {
  return timed("renderFormPdf", async () => {
    if (props.cacheKey) {
      const path = pdfCachePath(
        props.cacheKey.kind,
        props.cacheKey.id,
        props.cacheKey.version,
        props.includeAppendix,
      );
      const cached = await readCachedPdf(path);
      if (cached) return cached;
      const pdf = await renderFresh(props);
      void writeCachedPdf(path, pdf);
      return pdf;
    }
    return renderFresh(props);
  });
}

async function renderFresh(
  props: Omit<FormPdfProps, "generatedOn" | "photo" | "kinPhoto" | "appendix"> & {
    clientId: string;
    includeAppendix: boolean;
  },
): Promise<Buffer> {
  registerPdfFonts();
  const images = await embedDocs(props.clientId, props.includeAppendix);
  const appendix = {
    include: props.includeAppendix,
    clientFront: images.clientFront as EmbeddedImage | null,
    clientBack: images.clientBack as EmbeddedImage | null,
    kinFront: images.kinFront as EmbeddedImage | null,
    kinBack: images.kinBack as EmbeddedImage | null,
  };
  const buffer = await timed("reactPdfRender", () =>
    renderToBuffer(
      FormalFormPdf({
        ...props,
        generatedOn: generatedOnLabel(),
        photo: images.photo,
        kinPhoto: images.kinPhoto,
        appendix,
      }),
    ),
  );
  return Buffer.from(buffer);
}

export async function renderReceiptPdf(
  props: DownPaymentReceiptProps,
  cacheKey?: {
    kind: "booking" | "sale";
    id: string;
    version: string;
    signatoryId: string;
  },
): Promise<Buffer> {
  return timed("renderReceiptPdf", async () => {
    if (cacheKey) {
      const path = receiptCachePath(
        cacheKey.kind,
        cacheKey.id,
        cacheKey.version,
        cacheKey.signatoryId,
      );
      const cached = await readCachedPdf(path);
      if (cached) return cached;
      const pdf = await renderReceiptFresh(props);
      void writeCachedPdf(path, pdf);
      return pdf;
    }
    return renderReceiptFresh(props);
  });
}

async function renderReceiptFresh(props: DownPaymentReceiptProps): Promise<Buffer> {
  registerPdfFonts();
  const buffer = await timed("reactPdfReceiptRender", () =>
    renderToBuffer(DownPaymentReceiptPdf(props)),
  );
  return Buffer.from(buffer);
}
