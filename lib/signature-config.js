/**
 * Konfigurasi konstanta untuk metadata dan signature
 */

// Key untuk metadata di Info Dictionary PDF
export const PDF_METADATA_KEY = "X-Signal-Metadata-JSON";

// Key untuk metadata di catalog PDF
export const PDF_CATALOG_KEY = "SIGNAL_Properties";
export const PDF_CATALOG_METADATA_KEY = "SIGNAL_Metadata";

// Field metadata yang digunakan
export const METADATA_FIELDS = {
  SIGNATURE: "signal_signature",
  PUBLIC_KEY: "signal_publicKey",
  DOCUMENT_HASH: "signal_documentHash",
  SIGNING_DATE: "signal_signingDate",
  AUTHOR: "signal_author",
  PERIHAL: "signal_perihal",
  ID: "signal_id",
  VERSION: "signal_version",
};

// Versi format metadata
export const METADATA_VERSION = "1.2";
