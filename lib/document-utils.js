import { PDFDocument, PDFName, PDFString, PDFDict, PDFArray, PDFRef } from "pdf-lib";
import {
  PDF_METADATA_KEY,
  PDF_CATALOG_KEY,
  PDF_CATALOG_METADATA_KEY,
  METADATA_FIELDS,
} from "@/lib/signature-config";

/**
 * Utilitas untuk ekstraksi metadata dokumen
 */

/**
 * Ekstrak metadata dari file PDF
 *
 * Catatan: Implementasi ini hanya placeholder
 * Untuk implementasi nyata, diperlukan library seperti pdf.js
 *
 * @param {File} file - File PDF
 * @returns {Promise<Object>} Metadata dokumen
 */
export async function extractPdfMetadata(file) {
  // Placeholder - dalam implementasi nyata ini akan menggunakan library PDF
  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    type: "PDF Document",
    mimeType: "application/pdf",
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
    pages: "Unknown", // Dalam implementasi nyata ini bisa diambil dari PDF
  };
}

/**
 * Ekstrak metadata dari file DOC/DOCX
 *
 * Catatan: Implementasi ini hanya placeholder
 * Untuk implementasi nyata, diperlukan library khusus
 *
 * @param {File} file - File DOC/DOCX
 * @returns {Promise<Object>} Metadata dokumen
 */
export async function extractDocMetadata(file) {
  const isDocx = file.name.toLowerCase().endsWith(".docx");

  // Placeholder - dalam implementasi nyata ini akan menggunakan library Office
  return {
    title: file.name.replace(/\.[^/.]+$/, ""),
    type: isDocx
      ? "Microsoft Word Document (DOCX)"
      : "Microsoft Word Document (DOC)",
    mimeType: isDocx
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword",
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
  };
}

/**
 * Fungsi generik untuk ekstraksi metadata dokumen
 *
 * @param {File} file - File
 * @returns {Promise<Object>} Metadata dokumen atau null jika tidak didukung
 */
export async function extractDocumentMetadata(file) {
  if (!file) return null;

  const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  if (fileExt === ".pdf") {
    return extractPdfMetadata(file);
  } else if ([".doc", ".docx"].includes(fileExt)) {
    return extractDocMetadata(file);
  }

  return null;
}

/**
 * Ekstrak text dari file
 * @param {File} file - File
 * @returns {Promise<string|null>} - Ekstraksi teks atau null jika tipe file tidak didukung
 */
export async function extractTextFromFile(file) {
  if (!file) return null;

  const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

  // Untuk file teks sederhana
  if ([".txt", ".md", ".markdown"].includes(fileExt)) {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      console.error("Error extracting text from file:", error);
      return null;
    }
  }

  // Untuk file PDF dan DOC, implementasi sebenarnya memerlukan library eksternal
  if (fileExt === ".pdf") {
    // Placeholder - gunakan library seperti pdf.js untuk implementasi nyata
    return `[PDF Content Placeholder]\nTitle: ${file.name}\nSize: ${file.size} bytes`;
  }

  if ([".doc", ".docx"].includes(fileExt)) {
    // Placeholder - gunakan library seperti mammoth.js untuk implementasi nyata
    return `[Word Document Content Placeholder]\nTitle: ${file.name}\nSize: ${file.size} bytes`;
  }

  return null;
}

/**
 * Format ukuran file untuk ditampilkan
 * @param {number} bytes - Ukuran file dalam bytes
 * @returns {string} - Ukuran file yang diformat (KB, MB, dll)
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Validasi file berdasarkan tipe dan ukuran
 * @param {File} file - File yang akan divalidasi
 * @param {Array<string>} allowedTypes - Array dari tipe MIME yang diizinkan
 * @param {number} maxSizeInBytes - Ukuran maksimum file dalam bytes
 * @returns {Object} - Hasil validasi {valid, error}
 */
export function validateFile(file, allowedTypes, maxSizeInBytes) {
  if (!file) {
    return { valid: false, error: "File tidak ditemukan" };
  }

  // Validasi tipe
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type;
    if (!allowedTypes.includes(fileType)) {
      return {
        valid: false,
        error: `Tipe file tidak diizinkan. Tipe yang diizinkan: ${allowedTypes.join(
          ", "
        )}`,
      };
    }
  }

  // Validasi ukuran
  if (maxSizeInBytes && file.size > maxSizeInBytes) {
    const formattedSize = formatFileSize(maxSizeInBytes);
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal: ${formattedSize}`,
    };
  }

  return { valid: true };
}

/**
 * Ekstrak metadata tanda tangan dari file PDF menggunakan pendekatan baru yang lebih robust
 * @param {Uint8Array|Buffer} pdfBytes - Bytes dari dokumen PDF
 * @returns {Promise<Object|null>} - Metadata tanda tangan atau null jika tidak ditemukan
 */
export async function extractSignatureMetadataFromPdf(pdfBytes) {
  console.log("[EXTRACT] Starting signature metadata extraction from PDF");
  try {
    // Load PDF document with more options for robustness
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      updateMetadata: false, // Don't update metadata automatically
      ignoreEncryption: true, // Try to load even encrypted documents
      throwOnInvalidObject: false, // Be more forgiving with invalid objects
    });

    // Metadata yang akan dikembalikan
    const metadata = {
      signature: null,
      publicKey: null,
      originalHash: null,
      signingDate: null,
      author: null,
      version: null,
    };

    // Log metadata standar PDF untuk debugging
    console.log("[EXTRACT] PDF standard metadata:");
    console.log("- Title:", pdfDoc.getTitle());
    console.log("- Author:", pdfDoc.getAuthor());
    console.log("- Subject:", pdfDoc.getSubject());
    console.log("- Creator:", pdfDoc.getCreator());
    console.log("- Producer:", pdfDoc.getProducer());
    console.log("- CreationDate:", pdfDoc.getCreationDate());
    console.log("- ModificationDate:", pdfDoc.getModificationDate());
    console.log("- Keywords:", pdfDoc.getKeywords());

    // Ambil author dari metadata standar jika ada
    if (pdfDoc.getAuthor()) {
      metadata.author = pdfDoc.getAuthor();
    }

    // Variable untuk menampung metadata SIGNAL
    let signalMetadata = null;

    // METHOD 1: Ekstraksi dari Info Dictionary (metode utama)
    try {
      console.log("[EXTRACT] Extracting metadata from PDF Info Dictionary");
      
      // 1. Get the Info Dictionary using multiple approaches
      let infoDict = null;
      
      // 1a. Try to get the Info Dictionary from the trailer
      if (pdfDoc.context && pdfDoc.context.trailerInfo) {
        try {
          // Get Info ref from trailer
          const infoRef = pdfDoc.context.trailerInfo.Info;
          if (infoRef instanceof PDFRef) {
            console.log("[EXTRACT] Found Info Dictionary reference in trailer");
            // Lookup the actual dictionary using the reference
            infoDict = pdfDoc.context.lookup(infoRef);
            console.log("[EXTRACT] Successfully looked up Info Dictionary from reference");
            
            // Inspect raw info dict
            console.log("[EXTRACT] Info dict keys:", Object.keys(infoDict));
            if (infoDict.dict) {
              console.log("[EXTRACT] Info dict.dict keys:", Object.keys(infoDict.dict));
            }
          } else if (infoRef instanceof PDFDict) {
            console.log("[EXTRACT] Info in trailer is direct PDFDict");
            infoDict = infoRef;
          }
        } catch (trailerError) {
          console.log("[EXTRACT] Error accessing Info from trailer:", trailerError.message);
        }
      }
      
      // 1b. Try to use built-in PDF-Lib method if available
      if (!infoDict) {
        try {
          const docCatalog = pdfDoc.catalog;
          if (docCatalog && typeof docCatalog.getInfoDict === 'function') {
            infoDict = docCatalog.getInfoDict();
            console.log("[EXTRACT] Retrieved Info Dictionary using catalog.getInfoDict()");
          }
        } catch (catalogError) {
          console.log("[EXTRACT] Error accessing Info from catalog:", catalogError.message);
        }
      }
      
      // If we found an Info Dictionary
      if (infoDict) {
        console.log("[EXTRACT] Info Dictionary found with type:", typeof infoDict);
        
        // Check if it's a PDFDict instance
        const isPDFDict = infoDict instanceof PDFDict;
        console.log("[EXTRACT] Is PDFDict instance?", isPDFDict);
        
        // Attempt different methods to access the metadata
        
        // Check for our metadata with different key variants
        const metadataKeyVariations = [
          PDF_METADATA_KEY,
          "/" + PDF_METADATA_KEY,
          PDF_METADATA_KEY.toLowerCase(),
          "/" + PDF_METADATA_KEY.toLowerCase()
        ];
        
        let foundMetadata = false;
        
        // Try with PDFName objects first
        for (const keyVariation of metadataKeyVariations) {
          try {
            console.log(`[EXTRACT] Trying with key: "${keyVariation}"`);
            
            // Create PDFName from the key
            const pdfNameKey = PDFName.of(keyVariation.startsWith('/') ? keyVariation.substring(1) : keyVariation);
            
            // Look up using PDFName
            if (isPDFDict && typeof infoDict.get === 'function') {
              const metadataValue = infoDict.get(pdfNameKey);
              
              if (metadataValue) {
                console.log(`[EXTRACT] Found metadata with key "${keyVariation}"`);
                
                // Convert to string based on type
                let metadataString = null;
                
                if (metadataValue instanceof PDFString) {
                  metadataString = metadataValue.decodeText();
                  console.log("[EXTRACT] Extracted metadata from PDFString");
                } else if (typeof metadataValue === 'string') {
                  metadataString = metadataValue;
                  console.log("[EXTRACT] Metadata value is already a string");
                } else if (typeof metadataValue.toString === 'function') {
                  metadataString = metadataValue.toString();
                  
                  // Remove quote marks if they were added by toString()
                  if (metadataString.startsWith('"') && metadataString.endsWith('"')) {
                    metadataString = metadataString.substring(1, metadataString.length - 1);
                  }
                  console.log("[EXTRACT] Converted metadata value to string");
                }
                
                if (metadataString) {
                  try {
                    // Sanitize and parse the string
                    const sanitizedString = metadataString
                      .replace(/\\"/g, '"')      // Replace escaped quotes
                      .replace(/\\n/g, '')       // Remove newlines
                      .replace(/\\r/g, '')       // Remove carriage returns
                      .replace(/\\t/g, '')       // Remove tabs
                      .replace(/\\\\/g, '\\')    // Fix double escaped backslashes
                      .trim();
                    
                    const parsed = JSON.parse(sanitizedString);
                    
                    // Verify that it contains our expected fields
                    if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                      console.log("[EXTRACT] Successfully parsed metadata JSON");
                      signalMetadata = parsed;
                      foundMetadata = true;
                      break;
                    }
                  } catch (parseError) {
                    console.log(`[EXTRACT] Error parsing metadata with key "${keyVariation}":`, parseError.message);
                    
                    // Try to extract JSON using regex as fallback
                    try {
                      const jsonRegex = /{.*}/s;  // s flag allows matching across lines
                      const matches = metadataString.match(jsonRegex);
                      
                      if (matches && matches[0]) {
                        const extractedJson = matches[0];
                        console.log("[EXTRACT] Extracted potential JSON:", extractedJson.substring(0, 30) + "...");
                        
                        const parsed = JSON.parse(extractedJson);
                        
                        if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                          console.log("[EXTRACT] Successfully parsed extracted JSON");
                          signalMetadata = parsed;
                          foundMetadata = true;
                          break;
                        }
                      }
                    } catch (regexError) {
                      console.log("[EXTRACT] Failed to extract JSON with regex:", regexError.message);
                    }
                  }
                }
              }
            }
          } catch (keyError) {
            console.log(`[EXTRACT] Error trying key "${keyVariation}":`, keyError.message);
          }
        }
        
        // If we didn't find the metadata with PDFName, try dict lookup
        if (!foundMetadata && infoDict.dict) {
          console.log("[EXTRACT] Trying direct dict property access");
          
          for (const keyVariation of metadataKeyVariations) {
            try {
              const keyWithoutSlash = keyVariation.startsWith('/') ? keyVariation.substring(1) : keyVariation;
              
              if (keyWithoutSlash in infoDict.dict) {
                const dictValue = infoDict.dict[keyWithoutSlash];
                console.log(`[EXTRACT] Found metadata in dict with key "${keyWithoutSlash}"`);
                
                // Process the value
                let valueString = null;
                
                if (dictValue instanceof PDFString) {
                  valueString = dictValue.decodeText();
                } else if (typeof dictValue === 'string') {
                  valueString = dictValue;
                } else if (typeof dictValue.toString === 'function') {
                  valueString = dictValue.toString();
                  
                  // Remove quotes
                  if (valueString.startsWith('"') && valueString.endsWith('"')) {
                    valueString = valueString.substring(1, valueString.length - 1);
                  }
                }
                
                if (valueString) {
                  try {
                    // Clean and parse the string
                    const sanitized = valueString
                      .replace(/\\"/g, '"')
                      .replace(/\\n/g, '')
                      .replace(/\\r/g, '')
                      .replace(/\\t/g, '')
                      .replace(/\\\\/g, '\\')
                      .trim();
                    
                    const parsed = JSON.parse(sanitized);
                    
                    if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                      console.log(`[EXTRACT] Successfully parsed metadata from dict key "${keyWithoutSlash}"`);
                      signalMetadata = parsed;
                      foundMetadata = true;
                      break;
                    }
                  } catch (parseError) {
                    console.log(`[EXTRACT] Error parsing dict value for "${keyWithoutSlash}":`, parseError.message);
                  }
                }
              }
            } catch (dictError) {
              console.log(`[EXTRACT] Error accessing dict with key "${keyVariation}":`, dictError.message);
            }
          }
        }
      } else {
        console.log("[EXTRACT] Could not find Info Dictionary in PDF");
      }
    } catch (infoError) {
      console.log("[EXTRACT] Error extracting from Info Dictionary:", infoError.message);
    }
    
    // METHOD 2: Look for metadata in Keywords field
    if (!signalMetadata) {
      try {
        console.log("[EXTRACT] Looking for metadata in PDF Keywords");
        
        // Get the keywords
        const keywords = pdfDoc.getKeywords();
        
        if (keywords) {
          console.log("[EXTRACT] Found keywords:", typeof keywords === 'string' 
                     ? (keywords.length > 50 ? keywords.substring(0, 50) + "..." : keywords)
                     : "Non-string keywords");
          
          // Process based on type
          if (typeof keywords === 'string') {
            try {
              // First check if it contains our signal markers
              if (keywords.includes('"signal_signature"') || 
                  keywords.includes('"signal_publicKey"') || 
                  keywords.includes('"signal_documentHash"')) {
                
                // Try direct parsing
                try {
                  const parsed = JSON.parse(keywords);
                  
                  if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                    console.log("[EXTRACT] Found metadata in Keywords string");
                    signalMetadata = parsed;
                  }
                } catch (parseError) {
                  console.log("[EXTRACT] Error parsing Keywords string:", parseError.message);
                  
                  // Try to extract JSON using regex
                  try {
                    const jsonRegex = /{.*}/s;
                    const matches = keywords.match(jsonRegex);
                    
                    if (matches && matches[0]) {
                      const extractedJson = matches[0];
                      console.log("[EXTRACT] Found JSON in Keywords using regex");
                      
                      const parsed = JSON.parse(extractedJson);
                      
                      if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                        console.log("[EXTRACT] Successfully parsed JSON from Keywords");
                        signalMetadata = parsed;
                      }
                    }
                  } catch (regexError) {
                    console.log("[EXTRACT] Failed to extract JSON from Keywords with regex");
                  }
                }
              }
            } catch (keywordsError) {
              console.log("[EXTRACT] Error processing Keywords string:", keywordsError.message);
            }
          } else if (Array.isArray(keywords)) {
            console.log("[EXTRACT] Keywords is an array with length:", keywords.length);
            
            // Check each array item
            for (const item of keywords) {
              if (typeof item === 'string' && 
                  (item.includes('"signal_signature"') || 
                   item.includes('"signal_publicKey"'))) {
                
                try {
                  const parsed = JSON.parse(item);
                  
                  if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                    console.log("[EXTRACT] Found metadata in Keywords array item");
                    signalMetadata = parsed;
                    break;
                  }
                } catch (parseError) {
                  // Try next item
                }
              } else if (item && typeof item === 'object') {
                // Direct object check
                if (item[METADATA_FIELDS.SIGNATURE] || item[METADATA_FIELDS.PUBLIC_KEY]) {
                  console.log("[EXTRACT] Found metadata object in Keywords array");
                  signalMetadata = item;
                  break;
                }
              }
            }
          }
        } else {
          console.log("[EXTRACT] No Keywords found in PDF");
        }
      } catch (keywordsError) {
        console.log("[EXTRACT] Error processing Keywords:", keywordsError.message);
      }
    }
    
    // METHOD 3: Deep scan the document for objects containing our metadata
    if (!signalMetadata && pdfDoc.context) {
      try {
        console.log("[EXTRACT] Performing deep scan for metadata");
        
        // Get all indirect objects from the context
        const objectEntries = Object.entries(pdfDoc.context.indirectObjects);
        let scannedObjects = 0;
        
        for (const [ref, obj] of objectEntries) {
          scannedObjects++;
          
          // Process strings that might contain our metadata
          if (obj instanceof PDFString) {
            const stringValue = obj.decodeText();
            
            if (stringValue.includes('"signal_signature"') || 
                stringValue.includes('"signal_publicKey"') || 
                stringValue.includes('"signal_documentHash"')) {
              
              try {
                // Try to parse as JSON
                const parsed = JSON.parse(stringValue);
                
                if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                  console.log("[EXTRACT] Found metadata in PDFString object");
                  signalMetadata = parsed;
                  break;
                }
              } catch (parseError) {
                // Try to extract JSON using regex
                try {
                  const jsonRegex = /{.*}/s;
                  const matches = stringValue.match(jsonRegex);
                  
                  if (matches && matches[0]) {
                    const extractedJson = matches[0];
                    const parsed = JSON.parse(extractedJson);
                    
                    if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                      console.log("[EXTRACT] Found metadata using regex in PDFString");
                      signalMetadata = parsed;
                      break;
                    }
                  }
                } catch (regexError) {
                  // Continue to next object
                }
              }
            }
          }
          // Process dictionaries that might contain our metadata
          else if (obj instanceof PDFDict) {
            try {
              // Check for our specific keys
              for (const key of obj.keys()) {
                const keyStr = key.toString();
                
                if (keyStr.includes('Signal') || keyStr.includes('Metadata') || keyStr === '/Keywords') {
                  const value = obj.get(key);
                  
                  if (value instanceof PDFString) {
                    const stringValue = value.decodeText();
                    
                    if (stringValue.includes('"signal_signature"') || 
                        stringValue.includes('"signal_publicKey"')) {
                      
                      try {
                        const parsed = JSON.parse(stringValue);
                        
                        if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                          console.log(`[EXTRACT] Found metadata in dictionary key: ${keyStr}`);
                          signalMetadata = parsed;
                          break;
                        }
                      } catch (parseError) {
                        // Try to extract JSON using regex
                        try {
                          const jsonRegex = /{.*}/s;
                          const matches = stringValue.match(jsonRegex);
                          
                          if (matches && matches[0]) {
                            const parsed = JSON.parse(matches[0]);
                            
                            if (parsed[METADATA_FIELDS.SIGNATURE] || parsed[METADATA_FIELDS.PUBLIC_KEY]) {
                              console.log(`[EXTRACT] Found metadata using regex in dict key: ${keyStr}`);
                              signalMetadata = parsed;
                              break;
                            }
                          }
                        } catch (regexError) {
                          // Continue to next key
                        }
                      }
                    }
                  }
                }
              }
              
              if (signalMetadata) break;
            } catch (dictError) {
              // Continue to next object
            }
          }
        }
        
        console.log(`[EXTRACT] Scanned ${scannedObjects} objects for metadata`);
      } catch (scanError) {
        console.log("[EXTRACT] Error during deep scan:", scanError.message);
      }
    }
    
    // METHOD 4: Check in catalog as final fallback
    if (!signalMetadata) {
      try {
        console.log("[EXTRACT] Checking PDF catalog for metadata");
        
        if (pdfDoc.catalog) {
          // Try to get our custom properties
          try {
            const catalogKey = PDFName.of(PDF_CATALOG_KEY);
            
            if (typeof pdfDoc.catalog.get === 'function') {
              const signalProps = pdfDoc.catalog.get(catalogKey);
              
              if (signalProps) {
                console.log("[EXTRACT] Found SIGNAL properties in catalog");
                
                // Try to get metadata from properties
                try {
                  const metadataKey = PDFName.of(PDF_CATALOG_METADATA_KEY);
                  
                  if (signalProps instanceof PDFDict && typeof signalProps.get === 'function') {
                    const metadataValue = signalProps.get(metadataKey);
                    
                    if (metadataValue) {
                      console.log("[EXTRACT] Found metadata value in catalog properties");
                      
                      // Convert to string based on type
                      let metadataStr = null;
                      
                      if (metadataValue instanceof PDFString) {
                        metadataStr = metadataValue.decodeText();
                      } else if (typeof metadataValue === 'string') {
                        metadataStr = metadataValue;
                      } else if (typeof metadataValue.toString === 'function') {
                        metadataStr = metadataValue.toString();
                        
                        // Remove quotes
                        if (metadataStr.startsWith('"') && metadataStr.endsWith('"')) {
                          metadataStr = metadataStr.substring(1, metadataStr.length - 1);
                        }
                      }
                      
                      // Parse the metadata
                      if (metadataStr) {
                        try {
                          const parsedData = JSON.parse(metadataStr);
                          
                          if (parsedData[METADATA_FIELDS.SIGNATURE] || parsedData[METADATA_FIELDS.PUBLIC_KEY]) {
                            console.log("[EXTRACT] Successfully parsed metadata from catalog");
                            signalMetadata = parsedData;
                          }
                        } catch (parseError) {
                          console.log("[EXTRACT] Error parsing catalog metadata:", parseError.message);
                          
                          // Try regex extraction
                          try {
                            const jsonRegex = /{.*}/s;
                            const matches = metadataStr.match(jsonRegex);
                            
                            if (matches && matches[0]) {
                              const parsedData = JSON.parse(matches[0]);
                              
                              if (parsedData[METADATA_FIELDS.SIGNATURE] || parsedData[METADATA_FIELDS.PUBLIC_KEY]) {
                                console.log("[EXTRACT] Successfully parsed metadata from catalog regex");
                                signalMetadata = parsedData;
                              }
                            }
                          } catch (regexError) {
                            console.log("[EXTRACT] Failed to extract JSON from catalog with regex");
                          }
                        }
                      }
                    }
                  }
                } catch (metadataError) {
                  console.log("[EXTRACT] Error accessing metadata in catalog:", metadataError.message);
                }
              }
            }
          } catch (catalogError) {
            console.log("[EXTRACT] Error accessing catalog:", catalogError.message);
          }
        }
      } catch (catalogError) {
        console.log("[EXTRACT] Error checking catalog:", catalogError.message);
      }
    }
    
    // If we didn't find any metadata
    if (!signalMetadata) {
      console.log("[EXTRACT] No signature metadata found in PDF");
      return null;
    }
    
    // Extract fields from the found metadata
    console.log("[EXTRACT] Extracting fields from metadata");
    
    if (signalMetadata[METADATA_FIELDS.SIGNATURE]) {
      metadata.signature = signalMetadata[METADATA_FIELDS.SIGNATURE];
    }
    
    if (signalMetadata[METADATA_FIELDS.PUBLIC_KEY]) {
      metadata.publicKey = signalMetadata[METADATA_FIELDS.PUBLIC_KEY];
    }
    
    if (signalMetadata[METADATA_FIELDS.DOCUMENT_HASH]) {
      metadata.originalHash = signalMetadata[METADATA_FIELDS.DOCUMENT_HASH];
    }
    
    if (signalMetadata[METADATA_FIELDS.SIGNING_DATE]) {
      metadata.signingDate = signalMetadata[METADATA_FIELDS.SIGNING_DATE];
    }
    
    if (signalMetadata[METADATA_FIELDS.AUTHOR]) {
      metadata.author = signalMetadata[METADATA_FIELDS.AUTHOR];
    }
    
    if (signalMetadata[METADATA_FIELDS.VERSION]) {
      metadata.version = signalMetadata[METADATA_FIELDS.VERSION];
    }
    
    console.log("[EXTRACT] Successfully extracted metadata:", {
      signature: metadata.signature ? metadata.signature.substring(0, 10) + "..." : null,
      publicKey: metadata.publicKey ? metadata.publicKey.substring(0, 10) + "..." : null,
      originalHash: metadata.originalHash ? metadata.originalHash.substring(0, 10) + "..." : null,
      signingDate: metadata.signingDate,
      author: metadata.author,
      version: metadata.version,
    });
    
    return metadata;
  } catch (error) {
    console.error("[EXTRACT] Error extracting metadata from PDF:", error);
    return null;
  }
}
