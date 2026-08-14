/**
 * Catatan Temuan (QA Findings) - BOT PPOB NONA.
 *
 * File ini adalah sumber data temuan yang di-render otomatis ke section
 * "Catatan Temuan" pada laporan PDF. Setiap temuan baru TAMBAHKAN di sini
 * supaya tercatat konsisten di setiap laporan.
 */

export type FindingCategory = 'BUG' | 'CHANGE' | 'DATA' | 'INFRA' | 'NOTE';
export type FindingStatus = 'OPEN' | 'MONITORED' | 'RESOLVED' | 'INFO';

export type Finding = {
  id: string;
  category: FindingCategory;
  status: FindingStatus;
  title: string;
  detail: string;
};

export const FINDINGS: Finding[] = [
  {
    id: 'NONA-001',
    category: 'CHANGE',
    status: 'RESOLVED',
    title: 'Format rupiah tampil tanpa desimal (,00)',
    detail:
      'Webview transaksi menampilkan nominal tanpa desimal (mis. "Rp 5.000" / "Rp 2.605.289", bukan "Rp 5.000,00"). Assertion test diperbarui menjadi regex toleran format desimal.',
  },
  {
    id: 'NONA-002',
    category: 'CHANGE',
    status: 'RESOLVED',
    title: 'Prefix Nomor Virtual Account berubah (9993 -> 9995)',
    detail:
      'Prefix VA untuk metode Bank Mandiri sebelumnya 9993, saat run menjadi 9995. Assertion dilonggarkan menjadi /^999/ karena digit ke-4 dinamis per metode/PSP.',
  },
  {
    id: 'NONA-003',
    category: 'DATA',
    status: 'RESOLVED',
    title: 'Nomor Meter tampil berbeda dari idpel yang diinput',
    detail:
      'Informasi Pelanggan menampilkan Nomor Meter asli dari hasil lookup idpel (contoh: idpel 516761241018 -> meter 11006343043, tarif I1/450VA), bukan idpel input. Assertion diubah menjadi validasi format (meter 9-13 digit, tarif X/nnnVA) agar tidak bergantung nilai spesifik.',
  },
  {
    id: 'NONA-004',
    category: 'DATA',
    status: 'RESOLVED',
    title: 'Idpel prepaid lama diganti (322561241175 -> 516761241018)',
    detail:
      'Idpel prepaid 322561241175 tidak lagi me-return data konsisten (data unik, tidak boleh di-random). Digantikan idpel 516761241018 yang valid. Catatan: idpel bersifat unik dan perlu dilaporkan ke tim QA bila sudah terpakai habis agar diganti yang baru.',
  },
  {
    id: 'NONA-005',
    category: 'INFRA',
    status: 'MONITORED',
    title: 'ERR_CONNECTION_REFUSED transien di master-data Cutoff',
    detail:
      'Saat full run, test tambah Cutoff gagal karena koneksi ditolak ke host portal (iconnet-portal-backoffice-playground). Bukan bug test; lulus saat di-retry. Terindikasi flaky infrastruktur sesaat.',
  },
  {
    id: 'NONA-006',
    category: 'NOTE',
    status: 'INFO',
    title: 'Rute halaman lanjutan tidak bisa di-goto langsung (404)',
    detail:
      'Halaman Transactions, Rekonsiliasi, dan Settlement hanya bisa dibuka lewat klik link sidebar; direct page.goto mengembalikan "Halaman Tidak Ditemukan". Page object memakai navigasi via sidebar.',
  },
  {
    id: 'NONA-007',
    category: 'BUG',
    status: 'OPEN',
    title: 'Transaction Suspect menampilkan halaman 404',
    detail:
      'Menu Transaction Suspect (Data & Refund) belum di-route di aplikasi (dev belum selesai). Test disiapkan sebagai placeholder yang di-skip sampai fitur rilis.',
  },
  {
    id: 'NONA-008',
    category: 'NOTE',
    status: 'INFO',
    title: 'Tambah Settlement mengarah ke halaman create baru (bukan dialog)',
    detail:
      'Tombol "Tambah" di Settlement PSP/Biller berpindah ke halaman baru `.../create` dengan form 2 langkah (Pilih Recon Header -> Data Settlement). Test membuka halaman lalu Batal tanpa mengisi data.',
  },
];