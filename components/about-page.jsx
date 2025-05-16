export default function AboutPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tentang SIGNAL</h1>
        <p className="text-muted-foreground">Platform penandatanganan jurnal digital dengan algoritma ECDSA P-256</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-bold">Misi Kami</h2>
          <p className="text-muted-foreground">
            SIGNAL (Secure Integrated Global Network for Academic Literature) didirikan dengan misi untuk memastikan
            integritas dan keaslian jurnal ilmiah di era digital. Kami percaya bahwa kemajuan ilmu pengetahuan
            bergantung pada kepercayaan terhadap validitas penelitian yang dipublikasikan.
          </p>
          <p className="mt-4 text-muted-foreground">
            Dengan menggunakan teknologi tanda tangan digital yang canggih, SIGNAL memberikan cara yang aman dan
            terverifikasi bagi peneliti, akademisi, dan lembaga untuk memastikan bahwa jurnal mereka tidak diubah dan
            dapat diverifikasi keasliannya.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Teknologi Digital Signature</h2>
          <p className="text-muted-foreground">
            Tanda tangan digital adalah mekanisme kriptografi yang memungkinkan seseorang untuk membuktikan keaslian
            dokumen digital. Tidak seperti tanda tangan fisik yang dapat dipalsukan, tanda tangan digital menggunakan
            algoritma matematika kompleks untuk menciptakan "sidik jari" unik dari dokumen yang hanya dapat dibuat oleh
            pemilik kunci privat.
          </p>
          <p className="mt-4 text-muted-foreground">Tanda tangan digital menyediakan tiga aspek keamanan penting:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              <strong>Autentikasi</strong> - memverifikasi identitas penandatangan
            </li>
            <li>
              <strong>Integritas Data</strong> - memastikan dokumen tidak diubah setelah ditandatangani
            </li>
            <li>
              <strong>Non-repudiation</strong> - penandatangan tidak dapat menyangkal telah menandatangani dokumen
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Algoritma ECDSA P-256</h2>
          <p className="text-muted-foreground">
            SIGNAL menggunakan algoritma ECDSA (Elliptic Curve Digital Signature Algorithm) dengan kurva P-256 untuk
            proses penandatanganan digital. ECDSA adalah varian dari algoritma DSA (Digital Signature Algorithm) yang
            menggunakan kriptografi kurva eliptik.
          </p>
          <p className="mt-4 text-muted-foreground">Keunggulan ECDSA P-256 dibandingkan algoritma lain:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>
              <strong>Keamanan yang Kuat</strong> - menyediakan tingkat keamanan yang setara dengan RSA 3072-bit, tetapi
              dengan ukuran kunci yang jauh lebih kecil
            </li>
            <li>
              <strong>Efisiensi</strong> - membutuhkan komputasi yang lebih sedikit dan menghasilkan tanda tangan yang
              lebih kecil
            </li>
            <li>
              <strong>Standar Industri</strong> - direkomendasikan oleh NIST dan digunakan secara luas dalam aplikasi
              keamanan
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Keamanan & Privasi</h2>
          <p className="text-muted-foreground">
            Di SIGNAL, keamanan dan privasi data Anda adalah prioritas utama kami. Kami menerapkan praktik keamanan
            terbaik untuk melindungi informasi Anda:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Enkripsi end-to-end untuk semua data yang ditransmisikan</li>
            <li>Kunci privat tidak pernah meninggalkan perangkat pengguna</li>
            <li>Verifikasi tanda tangan dilakukan secara lokal tanpa mengirim konten dokumen ke server</li>
            <li>Audit keamanan berkala oleh pihak ketiga</li>
            <li>Kepatuhan terhadap standar keamanan dan privasi internasional</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Hubungi Kami</h2>
          <p className="text-muted-foreground">
            Jika Anda memiliki pertanyaan atau ingin mengetahui lebih lanjut tentang SIGNAL, jangan ragu untuk
            menghubungi kami di{" "}
            <a href="mailto:info@signal-platform.com" className="text-emerald-600 hover:underline">
              info@signal-platform.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
