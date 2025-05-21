"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Info, FileText, Key, Loader2, AlertTriangle } from "lucide-react";

export default function PrivateKeyModal({
  isOpen,
  onClose,
  onSign,
  title,
  journalId,
}) {
  const [subject, setSubject] = useState("");
  const [passHash, setPassHash] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    subject: "",
    passHash: "",
  });
  const [isSigning, setIsSigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [journal, setJournal] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasPassHash, setHasPassHash] = useState(false);

  // Fetch journal content and user profile when modal opens
  useEffect(() => {
    if (isOpen && journalId) {
      fetchJournalAndProfile();
    }
  }, [isOpen, journalId]);

  const fetchJournalAndProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("signal_auth_token");
      if (!token) {
        setError("Sesi login Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      // Fetch journal data
      const journalResponse = await fetch(`/api/journal/${journalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!journalResponse.ok) {
        throw new Error("Gagal mengambil data jurnal");
      }

      const journalData = await journalResponse.json();
      setJournal(journalData); // Fetch user profile to check if they have a PassHash (signature field)
      const profileResponse = await fetch("/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || "Gagal mengambil data profil");
      }

      const profileData = await profileResponse.json();
      setUserProfile(profileData);

      // Check if user has PassHash stored in their profile
      setHasPassHash(!!profileData.signature);

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Terjadi kesalahan saat memuat data");
      setIsLoading(false);
    }
  };
  const validateForm = () => {
    const newErrors = {
      subject: "",
      passHash: "",
    };

    let isValid = true;

    if (!subject.trim()) {
      newErrors.subject = "Perihal wajib diisi";
      isValid = false;
    }

    if (!passHash.trim()) {
      newErrors.passHash = "PassHash wajib diisi";
      isValid = false;
    } else if (passHash.length < 6) {
      newErrors.passHash = "PassHash minimal 6 karakter";
      isValid = false;
    }

    // Check if user has PassHash set in their profile
    if (!hasPassHash) {
      newErrors.passHash = "Anda belum menyiapkan PassHash di profil";
      isValid = false;
    }
    
    // Check if passHash matches the one in profile (if available)
    if (userProfile?.signature && passHash && userProfile.signature !== passHash) {
      newErrors.passHash = "PassHash tidak cocok dengan yang tersimpan di profil";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  const handleSign = async () => {
    if (!validateForm()) {
      return;
    }

    setError("");
    setIsSigning(true);

    try {      // Generate ECDSA key pair automatically
      const { generateKeyPair } = await import("@/lib/crypto/client-ecdsa");
      const { privateKey, publicKey } = await generateKeyPair(); 
        // Call the onSign callback with the auto-generated keys and form data
      console.log("Signing with data from modal:", {
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey,
        hasPassHash: !!passHash,
        subject: subject,
        passHashLength: passHash ? passHash.length : 0,
        userPassHash: userProfile?.signature ? userProfile.signature.substring(0, 3) + '...' : 'none',
        userPassHashLength: userProfile?.signature ? userProfile.signature.length : 0
      });

      onSign({
        privateKey,
        publicKey,
        passHash,
        perihal: subject, // Pass the subject as perihal parameter
        subject: subject, // Also pass as subject for compatibility
      });

      // Reset state and close modal
      setSubject("");
      setPassHash("");
      onClose();
    } catch (error) {
      console.error("Error generating keys:", error);
      setError("Gagal membuat kunci tanda tangan digital. Silakan coba lagi.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            {title || "Tanda Tangani Dokumen"}
          </DialogTitle>
          <DialogDescription>
            Lengkapi informasi berikut untuk menandatangani dokumen Anda
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p>Memuat data dokumen dan profil...</p>
          </div>
        ) : (
          <>
            {/* Document Preview */}
            {journal && (
              <div className="my-2 border rounded-md p-3 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-medium text-sm mb-1 text-gray-700 dark:text-gray-300">
                  Pratinjau Dokumen:
                </h3>
                <div className="text-xs space-y-1 overflow-y-auto max-h-[150px] p-2 bg-white dark:bg-gray-800 rounded border">
                  <p>
                    <strong>Judul:</strong> {journal.title}
                  </p>
                  <p>
                    <strong>Tanggal:</strong>{" "}
                    {new Date(journal.createdAt).toLocaleDateString("id-ID")}
                  </p>
                  <p>
                    <strong>Konten:</strong>
                  </p>
                  <p className="font-mono whitespace-pre-wrap break-words text-xs">
                    {journal.content.slice(0, 200)}...
                  </p>
                </div>
              </div>
            )}

            {!hasPassHash && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Anda belum menyiapkan PassHash di profil. Silakan perbarui
                  profil Anda terlebih dahulu di halaman profil.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-2">
              {/* Perihal Field */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Perihal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Masukkan perihal penandatanganan"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, subject: "" }));
                    }
                  }}
                  className={errors.subject ? "border-red-500" : ""}
                />
                {errors.subject && (
                  <p className="text-xs text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* PassHash Field */}
              <div className="space-y-2">
                <Label htmlFor="passHash" className="text-sm font-medium">
                  PassHash <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="passHash"
                  type="password"
                  placeholder="Masukkan passHash untuk verifikasi"
                  value={passHash}
                  onChange={(e) => {
                    setPassHash(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, passHash: "" }));
                    }
                  }}
                  className={errors.passHash ? "border-red-500" : ""}
                />                {errors.passHash && (
                  <p className="text-xs text-red-500">{errors.passHash}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  PassHash harus sama dengan yang tersimpan di profil Anda untuk
                  verifikasi identitas.
                  {userProfile?.signature && (
                    <button
                      type="button"
                      className="text-emerald-500 hover:text-emerald-600 ml-1 underline"
                      onClick={() => {
                        // Set passHash ke nilai yang tersimpan di profil
                        setPassHash(userProfile.signature);
                        // Reset error jika ada
                        setErrors(prev => ({...prev, passHash: ""}));
                      }}
                    >
                      Gunakan PassHash tersimpan
                    </button>
                  )}
                </p>
              </div>
            </div>

            <Alert
              variant="outline"
              className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <Info className="h-4 w-4" />
              <AlertDescription>
                Kunci ECDSA P-256 akan dibuat otomatis oleh sistem. Proses
                penandatanganan dilakukan sepenuhnya di perangkat Anda.
              </AlertDescription>
            </Alert>

            {error && <div className="text-sm text-red-500 mt-4">{error}</div>}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSigning}>
            Batal
          </Button>{" "}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            onClick={handleSign}
            disabled={isSigning || !hasPassHash}
          >
            <Key className="h-4 w-4" />
            {isSigning ? "Menandatangani..." : "Tanda Tangani"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
