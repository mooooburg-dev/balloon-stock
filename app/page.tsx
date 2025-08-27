'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('https://www.joyparty.co.kr/goods/goods_list.php?cateCd=048');
  const [pages, setPages] = useState(43);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    setProducts([]);
    setProgress('첫 페이지 미리보기 중...');

    try {
      const response = await fetch('/api/scrape?pages=1&preview=true');
      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products);
        setProgress('');
      } else {
        setError(data.error || 'Failed to fetch products');
        setProgress('');
      }
    } catch (err) {
      setError('Network error occurred');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    setProgress(`${pages}개 페이지 크롤링 중... (약 ${pages}분 소요)`);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, pages }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `balloon_products_${Date.now()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        setProgress('다운로드 완료!');
        setTimeout(() => setProgress(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to download Excel file');
        setProgress('');
      }
    } catch (err) {
      setError('Network error occurred');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">풍선 상품 크롤러</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Joy Party 웹사이트에서 풍선 상품 정보를 수집하여 엑셀 파일로 다운로드합니다.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            크롤링 URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            placeholder="https://www.joyparty.co.kr/goods/goods_list.php?cateCd=048"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="pages" className="block text-sm font-medium mb-2">
            크롤링할 페이지 수 (최대 43페이지)
          </label>
          <input
            id="pages"
            type="number"
            min="1"
            max="43"
            value={pages}
            onChange={(e) => setPages(Math.min(43, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
            disabled={loading}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && progress.includes('미리보기') ? '로딩중...' : '1페이지 미리보기'}
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && !progress.includes('미리보기') ? '크롤링 중...' : `전체 ${pages}페이지 엑셀 다운로드`}
          </button>
        </div>

        {progress && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
            {progress}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            <strong>안내:</strong> 전체 페이지 크롤링은 서버 부하를 방지하기 위해 페이지당 1초의 딜레이가 있습니다.
            43페이지 전체 크롤링 시 약 1분 정도 소요됩니다.
          </p>
        </div>
      </div>

      {products.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">상품 목록 미리보기 ({products.length}개)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">번호</th>
                  <th className="text-left py-2 px-4">상품명</th>
                  <th className="text-left py-2 px-4">판매가</th>
                  <th className="text-left py-2 px-4">원가</th>
                  <th className="text-left py-2 px-4">이미지</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">
                      <a 
                        href={product.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {product.name}
                      </a>
                    </td>
                    <td className="py-2 px-4">{product.price}</td>
                    <td className="py-2 px-4 line-through text-gray-500">{product.originalPrice}</td>
                    <td className="py-2 px-4">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}