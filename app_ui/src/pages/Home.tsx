
import { useEffect, useState } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";

interface Expense {
  id: number;
  category: string;
  amount: number;
  created_at: string;
  user_id: number;
}

function Home() {
  const { userId } = useAppContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const fetchExpenses = async (pageNum = 1) => {
    setError("");
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/all-expenses/${userId}?limit=${pageSize}&offset=${(pageNum-1)*pageSize}`);
      setExpenses(response.data.expenses);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setGrandTotal(response.data.grand_total ?? 0);
    } catch (error) {
      setError("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesByCategory = async (category: string, pageNum = 1) => {
    setError("");
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/expenses-by-category/${userId}?category=${category}&limit=${pageSize}&offset=${(pageNum-1)*pageSize}`);
      setExpenses(response.data.expenses);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      setGrandTotal(response.data.grand_total ?? 0);
    } catch (error) {
      setError("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryFilter) {
      fetchExpensesByCategory(categoryFilter, page);
    } else {
      fetchExpenses(page);
    }
  }, [page, categoryFilter]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg("Uploading...");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await axios.post("http://localhost:8000/receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploading(false);
      setUploadMsg("Processing receipt...");
      await axios.post(`http://localhost:8000/process-receipt/${userId}`);
      setUploadMsg("Expense added!");
      await fetchExpenses();
      setTimeout(() => {
        setShowUpload(false);
        setUploadMsg(null);
      }, 1200);
    } catch (err: any) {
      setUploadMsg(err.response?.data?.detail || "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-8">
  <div className="w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8 text-white text-center">Your Expenses</h1>

  <div className="relative flex items-center w-full" style={{ maxWidth: '1200px', margin: '32px auto 32px auto', minHeight: '64px' }}>
          <span className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-blue-400 bg-gray-800 rounded-xl px-8 py-3 shadow flex items-center" style={{ minWidth: '180px', height: '56px', display: 'flex', justifyContent: 'center' }}>
            Grand Total: ${grandTotal.toFixed(2)}
            {totalPages > 1 && (
              <span className="ml-4 text-base font-normal text-gray-300">(Page Total: ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)})</span>
            )}
          </span>
          <div className="flex-1 flex justify-end">
            <button
              className="px-8 py-3 text-lg bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition"
              style={{ height: '56px' }}
              onClick={() => {
                setShowUpload(true);
                setSelectedFile(null);
                setPreviewUrl(null);
                setUploadMsg(null);
              }}
              disabled={uploading}
            >
              Add Expense
            </button>
          </div>
        </div>
        {showUpload && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 animate-fade-in">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
                <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Upload Receipt</h2>
                <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center cursor-pointer mb-4">
                  <div className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-6 py-3 transition shadow-lg">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    <span className="text-white font-semibold text-lg">Choose File</span>
                    <span className="text-gray-400 text-sm">{selectedFile ? selectedFile.name : "No file chosen"}</span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setPreviewUrl(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null);
                    }}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="mb-4 rounded-xl border-2 border-gray-800 shadow-lg max-h-48 mx-auto" />
                )}
                <button
                  className="w-full py-3 font-bold text-white bg-blue-600 rounded-xl shadow hover:bg-blue-700 transition mb-3 text-lg"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || uploadMsg === "Processing receipt..."}
                >
                  {uploading
                    ? "Uploading..."
                    : uploadMsg === "Processing receipt..."
                    ? "Uploaded!"
                    : "Upload"}
                </button>
                {uploadMsg === "Processing receipt..." && (
                  <div className="text-center text-blue-400 mb-2 text-base font-semibold">Processing receipt...</div>
                )}
                {uploadMsg && uploadMsg !== "Processing receipt..." && uploadMsg !== "Expense added!" && (
                  <div className="text-center text-blue-400 mb-2 text-base font-semibold">{uploadMsg}</div>
                )}
                <button
                  className="w-full py-3 font-bold text-white bg-gray-800 rounded-xl shadow hover:bg-gray-900 transition text-lg"
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
        )}

        <div className="w-full flex justify-center mb-8">
          <div className="flex flex-row gap-4 px-2 py-4 rounded-2xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 shadow-lg" style={{ maxWidth: '1200px' }}>
            <button
              className="px-7 py-2 text-base font-semibold rounded-full shadow-md bg-gray-900 text-blue-300 border-2 border-transparent hover:bg-blue-700 hover:text-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
              onClick={() => {
                setCategoryFilter(null);
                setPage(1);
              }}
            >
              All
            </button>
            {['Groceries','Dining','Gas','Pharmacy','Shopping','Entertainment','Utilities','Other'].map(cat => (
              <button
                key={cat}
                className="px-7 py-2 text-base font-semibold rounded-full shadow-md bg-gray-900 text-blue-300 border-2 border-transparent hover:bg-blue-700 hover:text-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-300 text-center">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-center font-medium bg-gray-800 rounded-lg py-2 px-4 mb-2 animate-fade-in border border-red-500/40 shadow-lg">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
            </svg>
            <span className="text-red-300 text-sm font-semibold tracking-wide">{error}</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-gray-400 text-center">No expenses found.</div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-full" style={{ maxWidth: '1200px' }}>
              <table className="w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-lg">
                <thead>
                  <tr>
                    <th className="px-8 py-4 border-b text-left text-gray-400 text-lg">Category</th>
                    <th className="px-8 py-4 border-b text-left text-gray-400 text-lg">Amount</th>
                    <th className="px-8 py-4 border-b text-left text-gray-400 text-lg">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-gray-800 transition">
                      <td className="px-8 py-4 border-b text-white text-base">{exp.category}</td>
                      <td className="px-8 py-4 border-b text-blue-400 font-semibold text-base">${exp.amount.toFixed(2)}</td>
                      <td className="px-8 py-4 border-b text-gray-300 text-base">{new Date(exp.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  {page > 1 && (
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-800 text-blue-300 font-semibold shadow hover:bg-blue-700 hover:text-white transition"
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                  )}
                  <span className="text-lg text-white font-semibold">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <button
                      className="px-4 py-2 rounded-lg bg-gray-800 text-blue-300 font-semibold shadow hover:bg-blue-700 hover:text-white transition"
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;