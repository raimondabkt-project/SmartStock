import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register modul ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsCharts({ totalIn = 0, totalOut = 0, products = [] }) {
  // 1. Data untuk Bar Chart (Mutasi Stok IN vs OUT)
  const mutationData = {
    labels: ['Stok Masuk (IN)', 'Stok Keluar (OUT)'],
    datasets: [
      {
        label: 'Jumlah Unit',
        data: [totalIn, totalOut],
        backgroundColor: ['rgba(34, 197, 94, 0.85)', 'rgba(239, 68, 68, 0.85)'], // Hijau & Merah
        borderColor: ['#16a34a', '#dc2626'],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const mutationOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Total Mutasi Stok (Unit)', font: { size: 14 } },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  // 2. Data untuk Doughnut Chart (Proporsi Stok per Produk)
  const productLabels = products.map((p) => p.name || p.nama_produk);
  const productStocks = products.map((p) => p.stock || p.stok);

  const stockDistributionData = {
    labels: productLabels.length > 0 ? productLabels : ['Belum Ada Produk'],
    datasets: [
      {
        data: productStocks.length > 0 ? productStocks : [1],
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
          '#ec4899', '#14b8a6', '#f97316'
        ],
        borderWidth: 2,
      },
    ],
  };

  const distributionOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Sebaran Stok Produk', font: { size: 14 } },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      {/* Chart 1: Bar Chart Mutasi */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
        <Bar data={mutationData} options={mutationOptions} />
      </div>

      {/* Chart 2: Doughnut Chart Sebaran Stok */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-col items-center justify-center">
        <div className="w-full max-w-[280px]">
          <Doughnut data={stockDistributionData} options={distributionOptions} />
        </div>
      </div>
    </div>
  );
}