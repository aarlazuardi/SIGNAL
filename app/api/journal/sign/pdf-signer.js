/**
 * Utilitas PDF untuk penandatanganan dokumen
 * Implementasi flow penandatanganan sesuai diagram
 * Enhanced version to improve metadata embedding
 */
import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFDict,
  PDFArray,
  StandardFonts,
  rgb,
} from "pdf-lib";
import {
  createHash,
  createPdfHash,
  getCanonicalPdfHash,
} from "@/lib/crypto/document-hash";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  PDF_CATALOG_METADATA_KEY,
  METADATA_FIELDS,
  METADATA_VERSION,
} from "@/lib/signature-config";

/**
 * Tandatangani dokumen PDF dengan meningkatkan proses embedding metadata
 * @param {Uint8Array|string} pdfBytes - Bytes PDF atau konten text
 * @param {Object} signatureData - Data tanda tangan
 * @param {Object} [metadata] - Metadata tambahan (optional)
 * @returns {Promise<Uint8Array>} - Bytes PDF yang sudah ditandatangani
 */
export async function signPdf(pdfBytes, signatureData, metadata = {}) {
  try {
    // 1. Create or load PDF document
    console.log("[SIGN] Starting PDF signing process");
    const pdfDoc =
      typeof pdfBytes === "string"
        ? await PDFDocument.create()
        : await PDFDocument.load(pdfBytes, { 
            updateMetadata: false,  // Don't update metadata automatically
            ignoreEncryption: true  // Handle encrypted PDFs
          });

    // If input is a string, create a new PDF with that content
    if (typeof pdfBytes === "string") {
      // Add a new page
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const fontSize = 12;
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Split text into lines
      const textLines = wrapText(pdfBytes, font, fontSize, width - 100);

      // Draw text lines on the page
      let y = height - 50;
      for (const line of textLines) {
        page.drawText(line, {
          x: 50,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= fontSize + 10;
      }

      console.log("[SIGN] Created new PDF from text content");
    }

    // 2. Calculate the canonical hash of the raw document
    // This hash will remain consistent even if the document is modified after signing
    const originalHash = 
      typeof pdfBytes === "string"
        ? createHash(pdfBytes, "hex")
        : getCanonicalPdfHash(pdfBytes, "hex");
    
    console.log("[SIGN] Canonical/original PDF hash:", originalHash);

    // 3. Prepare metadata for embedding
    const now = new Date().toISOString();
    const metadataObj = {
      [METADATA_FIELDS.SIGNATURE]: signatureData.signature,
      [METADATA_FIELDS.PUBLIC_KEY]: signatureData.publicKey,
      [METADATA_FIELDS.DOCUMENT_HASH]: originalHash,
      [METADATA_FIELDS.SIGNING_DATE]: signatureData.signingDate || now,
      [METADATA_FIELDS.VERSION]: METADATA_VERSION,
    };

    // Add custom metadata if provided
    if (metadata.author) {
      metadataObj[METADATA_FIELDS.AUTHOR] = metadata.author;
    }

    if (metadata.perihal) {
      metadataObj[METADATA_FIELDS.PERIHAL] = metadata.perihal;
    }

    if (metadata.id) {
      metadataObj[METADATA_FIELDS.ID] = metadata.id;
    }

    console.log("[SIGN] Setting document metadata with signature info:", {
      signature: metadataObj[METADATA_FIELDS.SIGNATURE].substring(0, 10) + "...",
      publicKey: metadataObj[METADATA_FIELDS.PUBLIC_KEY].substring(0, 10) + "...",
      documentHash: metadataObj[METADATA_FIELDS.DOCUMENT_HASH].substring(0, 10) + "...",
    });

    // Convert metadata to JSON string
    const metadataString = JSON.stringify(metadataObj);
    console.log(
      "[SIGN] Preparing metadata for embedding:",
      metadataString.substring(0, 50) + "..."
    );

    // 4. Set document metadata using multiple approaches for compatibility
    
    // 4a. Set standard PDF metadata fields
    pdfDoc.setTitle(metadata.perihal || "SIGNAL Document");
    pdfDoc.setAuthor(metadata.author || "SIGNAL User");
    pdfDoc.setSubject("Digitally Signed Document");
    pdfDoc.setKeywords([metadataString]); // Use array format for compatibility
    pdfDoc.setProducer("SIGNAL Document Signing System");
    pdfDoc.setCreator("SIGNAL PDF Module");
    
    // 4b. Set metadata in the PDF Info Dictionary
    console.log("[SIGN] Preparing to set metadata in PDF Info Dictionary...");

    // Method 1: Get existing Info Dictionary
    let infoDict = null;
    try {
      if (pdfDoc.context && pdfDoc.context.trailerInfo && pdfDoc.context.trailerInfo.Info) {
        // Get existing Info Dictionary
        if (pdfDoc.context.trailerInfo.Info instanceof PDFRef) {
          infoDict = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Info);
          console.log("[SIGN] Found existing Info Dictionary in PDF");
        } else if (pdfDoc.context.trailerInfo.Info instanceof PDFDict) {
          infoDict = pdfDoc.context.trailerInfo.Info;
          console.log("[SIGN] Found Info Dictionary object in PDF");
        }
      }
    } catch (err) {
      console.log("[SIGN] Error accessing Info Dictionary:", err.message);
    }

    // Method 2: Create a new Info Dictionary if needed
    if (!infoDict) {
      try {
        console.log("[SIGN] Creating new Info Dictionary");
        // Create a new Info Dictionary
        const newInfoObj = {
          Title: pdfDoc.getTitle() || metadata.perihal || "SIGNAL Document",
          Author: pdfDoc.getAuthor() || metadata.author || "SIGNAL User",
          Subject: pdfDoc.getSubject() || "Digitally Signed Document",
          Creator: pdfDoc.getCreator() || "SIGNAL PDF Module",
          Producer: pdfDoc.getProducer() || "SIGNAL Document Signing System",
          ModDate: new Date().toISOString(),
          Keywords: metadataString, // Add metadata to Keywords for better compatibility
        };

        // Add metadata to our custom key
        newInfoObj[PDF_METADATA_KEY] = metadataString;

        // Create PDF-lib Info Dictionary object
        const pdfInfoDict = pdfDoc.context.obj(newInfoObj);

        // Ensure trailerInfo exists
        if (!pdfDoc.context.trailerInfo) {
          pdfDoc.context.trailerInfo = {};
        }

        // Set Info Dictionary in PDF
        pdfDoc.context.trailerInfo.Info = pdfInfoDict;

        // Verify
        if (pdfDoc.context.trailerInfo.Info) {
          infoDict = pdfDoc.context.lookup(pdfDoc.context.trailerInfo.Info);
          console.log("[SIGN] Successfully created new Info Dictionary");
        }
      } catch (createErr) {
        console.error(
          "[SIGN] Failed to create Info Dictionary:",
          createErr.message
        );
      }
    }

    // Method 3: Add metadata to Info Dictionary using multiple approaches
    if (infoDict) {
      // Track whether we've successfully added metadata
      let metadataAdded = false;

      // Try using different methods to ensure metadata is added
      
      // Method 3a: Using PDFName and PDFString (most robust)
      try {
        const key = PDFName.of(PDF_METADATA_KEY);
        const value = PDFString.of(metadataString);
        
        if (typeof infoDict.set === 'function') {
          infoDict.set(key, value);
          console.log("[SIGN] Added metadata using infoDict.set with PDFName/PDFString");
          metadataAdded = true;
        }
      } catch (err1) {
        console.log("[SIGN] Error using PDFName/PDFString method:", err1.message);
        
        // Method 3b: Try with string key
        try {
          if (typeof infoDict.set === 'function') {
            infoDict.set(PDF_METADATA_KEY, PDFString.of(metadataString));
            console.log("[SIGN] Added metadata using infoDict.set with string key");
            metadataAdded = true;
          }
        } catch (err2) {
          console.log("[SIGN] Error using string key method:", err2.message);
        }
      }
      
      // Method 3c: Direct property assignment
      if (!metadataAdded) {
        try {
          infoDict[PDF_METADATA_KEY] = metadataString;
          console.log("[SIGN] Added metadata using direct property assignment");
          metadataAdded = true;
        } catch (err3) {
          console.log("[SIGN] Error using direct property assignment:", err3.message);
        }
      }
      
      // Method 3d: Using dict property
      if (!metadataAdded && infoDict.dict) {
        try {
          infoDict.dict[PDF_METADATA_KEY] = pdfDoc.context.obj(metadataString);
          console.log("[SIGN] Added metadata using infoDict.dict");
          metadataAdded = true;
        } catch (err4) {
          console.log("[SIGN] Error using infoDict.dict:", err4.message);
        }
      }
      
      // Method 3e: Create a new dictionary with all properties if all else fails
      if (!metadataAdded) {
        try {
          // Copy all properties from current dictionary
          const currentProps = {};
          
          // Try to copy existing properties
          if (typeof infoDict.entries === 'function') {
            const entries = infoDict.entries();
            for (const [key, value] of entries) {
              try {
                const keyName = key.decodeText ? key.decodeText() : key.toString();
                currentProps[keyName] = value;
              } catch (entryErr) {
                console.log("[SIGN] Error copying property:", entryErr.message);
              }
            }
          } else if (infoDict.dict) {
            // Copy from dict property
            Object.assign(currentProps, infoDict.dict);
          }
          
          // Add our metadata
          currentProps[PDF_METADATA_KEY] = metadataString;
          
          // Create a new dictionary
          const newDict = pdfDoc.context.obj(currentProps);
          
          // Replace the old one
          pdfDoc.context.trailerInfo.Info = newDict;
          console.log("[SIGN] Replaced Info Dictionary with new one containing metadata");
        } catch (replaceErr) {
          console.log("[SIGN] Error replacing Info Dictionary:", replaceErr.message);
        }
      }
    } else {
      try {
        // If we still don't have an Info Dictionary, create a simple one
        console.log("[SIGN] Creating simple Info Dictionary");
        const basicObj = { [PDF_METADATA_KEY]: metadataString };
        pdfDoc.context.trailerInfo = {
          ...pdfDoc.context.trailerInfo,
          Info: pdfDoc.context.obj(basicObj),
        };
      } catch (basicErr) {
        console.log("[SIGN] Error creating basic Info Dictionary:", basicErr.message);
      }
    }
    
    // 5. Set metadata in Keywords (most compatible method)
    try {
      console.log("[SIGN] Setting metadata in PDF Keywords (most compatible method)");
      
      // Multiple methods to set Keywords for compatibility
      
      // Method 1: Standard Keywords API
      try {
        pdfDoc.setKeywords([metadataString]);
        console.log("[SIGN] Successfully set Keywords as array with metadata string");
        
        // Verify Keywords were set correctly
        const keywords = pdfDoc.getKeywords();
        const hasMetadata = Array.isArray(keywords) 
          ? keywords.some(k => k.includes('"signal_signature"')) 
          : typeof keywords === 'string' && keywords.includes('"signal_signature"');
          
        console.log("[SIGN] Keywords verification passed:", hasMetadata ? metadataString.substring(0, 50) + "..." : "No metadata found");
      } catch (keywordsErr) {
        console.log("[SIGN] Error setting Keywords:", keywordsErr.message);
        
        // Method 2: Try direct dictionary modification for Keywords
        if (infoDict) {
          try {
            const keywordsKey = PDFName.of("Keywords");
            const keywordsValue = PDFString.of(metadataString);
            
            if (typeof infoDict.set === 'function') {
              infoDict.set(keywordsKey, keywordsValue);
              console.log("[SIGN] Added metadata to Keywords using direct dictionary modification");
            }
          } catch (dictKeywordsErr) {
            console.log("[SIGN] Error setting Keywords in dictionary:", dictKeywordsErr.message);
          }
        }
      }
    } catch (keywordsSetErr) {
      console.log("[SIGN] Error with Keywords setting:", keywordsSetErr.message);
    }

    // 6. Set metadata in PDF Catalog for additional redundancy
    try {
      console.log("[SIGN] Setting metadata in PDF Catalog");
      
      if (pdfDoc.catalog) {
        const catalog = pdfDoc.catalog;
        
        // Create a SIGNAL properties dictionary if it doesn't exist
        let signalProps;
        const signalPropsKey = PDFName.of(PDF_CATALOG_KEY);
        
        // Try to get existing properties
        if (typeof catalog.get === 'function') {
          signalProps = catalog.get(signalPropsKey);
        }
        
        if (!signalProps) {
          // Create new properties dictionary
          signalProps = pdfDoc.context.obj({});
          
          // Add to catalog
          if (typeof catalog.set === 'function') {
            catalog.set(signalPropsKey, signalProps);
          }
        }
        
        // Set our metadata in the properties dictionary
        if (signalProps && typeof signalProps.set === 'function') {
          const metadataKey = PDFName.of(PDF_CATALOG_METADATA_KEY);
          const metadataValue = PDFString.of(metadataString);
          
          signalProps.set(metadataKey, metadataValue);
          console.log("[SIGN] Added metadata to catalog as SIGNAL_Properties");
        }
      }
    } catch (catalogErr) {
      console.log("[SIGN] Error setting metadata in catalog:", catalogErr.message);
    }

    // 7. Add XMP metadata if possible
    try {
      console.log("[SIGN] Adding XMP metadata if possible");
      // Note: Full XMP implementation would be more complex
    } catch (xmpErr) {
      console.log("[SIGN] Error adding XMP metadata:", xmpErr.message);
    }

    // 8. Save the PDF
    const signedPdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Makes metadata more accessible
    });

    // DEBUG: Verify keywords in signed PDF
    try {
      const verifyDoc = await PDFDocument.load(signedPdfBytes);
      const keywords = verifyDoc.getKeywords();
      console.log("[SIGN][DEBUG] Keywords in signed PDF:", 
        Array.isArray(keywords) 
          ? (keywords[0] ? keywords[0].substring(0, 100) + "..." : "Empty array") 
          : (typeof keywords === 'string' ? keywords.substring(0, 100) + "..." : "Not found")
      );
    } catch (verifyErr) {
      console.log("[SIGN][DEBUG] Error verifying keywords:", verifyErr.message);
    }

    // Generate hash of the signed PDF
    const signedPdfHash = createPdfHash(signedPdfBytes, "hex");
    console.log("[SIGN] Final signed PDF hash generated:", signedPdfHash);

    return signedPdfBytes;
  } catch (error) {
    console.error("[SIGN] Error signing PDF:", error);
    throw error;
  }
}

/**
 * Membagi teks menjadi baris-baris yang sesuai dengan lebar halaman
 * @param {string} text - Teks yang akan dibagi
 * @param {PDFFont} font - Font untuk teks
 * @param {number} fontSize - Ukuran font
 * @param {number} maxWidth - Lebar maksimum baris
 * @returns {string[]} - Array baris-baris teks
 */
function wrapText(text, font, fontSize, maxWidth) {
  const lines = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    const words = paragraph.split(" ");
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);

      if (width < maxWidth) {
        currentLine += ` ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}